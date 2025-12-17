"""
Nexus Calculation Engine V2 - Phase 1A

Implements chronological processing, multi-year tracking, and calendar year lookback.

Key improvements over V1:
- Processes transactions chronologically to find exact nexus dates
- Tracks nexus across multiple years with sticky nexus logic
- Supports state-specific lookback periods (Phase 1A: calendar year types)
- Calculates obligation start dates correctly
"""

import logging
from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from collections import defaultdict
from .penalty_interest_calculator import PenaltyInterestCalculator

logger = logging.getLogger(__name__)


class NexusCalculatorV2:
    """
    Phase 1A Nexus Calculator with chronological processing.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.interest_calculator = PenaltyInterestCalculator(supabase_client)
        self._interest_penalty_cache: Dict[str, Dict] = {}  # Cache for interest/penalty configs

    # ========================================================================
    # Main Entry Point
    # ========================================================================

    def calculate_nexus_for_analysis(self, analysis_id: str) -> Dict:
        """
        Main calculation method - determines nexus for all states across all years.

        Returns summary with total states analyzed, states with nexus, etc.
        """
        try:
            logger.info(f"Starting nexus calculation (V2) for analysis {analysis_id}")

            # Get all transactions (not aggregated - need chronological order)
            transactions = self._get_all_transactions(analysis_id)

            if not transactions:
                raise ValueError("No transactions found for analysis")

            logger.info(f"Processing {len(transactions)} transactions")

            # Get reference data
            thresholds = self._get_economic_nexus_thresholds()
            tax_rates = self._get_tax_rates()
            mf_rules = self._get_marketplace_facilitator_rules()
            all_state_codes = self._get_all_state_codes()

            # Bulk load interest/penalty configs (single query instead of 200+)
            self._load_all_interest_penalty_configs()

            # Get physical nexus data for this analysis
            physical_nexus_states = self._get_physical_nexus(analysis_id)

            # Group transactions by state
            transactions_by_state = defaultdict(list)
            for txn in transactions:
                transactions_by_state[txn['customer_state']].append(txn)

            # Process each state
            all_results = []
            total_liability = Decimal('0.00')
            states_with_nexus = 0

            for state_code in all_state_codes:
                state_transactions = transactions_by_state.get(state_code, [])

                # Get state config
                threshold_config = thresholds.get(state_code)
                tax_rate_config = tax_rates.get(state_code)
                mf_rule = mf_rules.get(state_code)

                if not threshold_config:
                    logger.warning(f"No threshold config for {state_code}, skipping")
                    continue

                # Calculate nexus for this state (multi-year)
                physical_nexus_date = physical_nexus_states.get(state_code)
                state_results = self._calculate_state_nexus_multi_year(
                    state_code=state_code,
                    transactions=state_transactions,
                    threshold_config=threshold_config,
                    tax_rate_config=tax_rate_config,
                    mf_rule=mf_rule,
                    physical_nexus_date=physical_nexus_date
                )

                # Add to results
                all_results.extend(state_results)

                # Count states with nexus (any year) - physical OR economic
                if any(r['nexus_type'] in ['physical', 'economic', 'both'] for r in state_results):
                    states_with_nexus += 1

                # Sum liability across all years
                for result in state_results:
                    total_liability += Decimal(str(result.get('estimated_liability', 0)))

            # Save results to database
            self._save_results_to_database(analysis_id, all_results)

            # Update analysis summary
            self._update_analysis_summary(
                analysis_id=analysis_id,
                total_liability=float(total_liability),
                states_with_nexus=states_with_nexus
            )

            # Auto-populate state worklist from results
            self._auto_populate_state_assessments(analysis_id)

            logger.info(
                f"Calculation complete: {len(all_results)} state-year results, "
                f"{states_with_nexus} states with nexus"
            )

            return {
                "total_states_analyzed": len(all_state_codes),
                "states_with_nexus": states_with_nexus,
                "total_estimated_liability": float(total_liability),
                "status": "complete"
            }

        except Exception as e:
            logger.error(f"Error calculating nexus for analysis {analysis_id}: {str(e)}")
            raise

    # ========================================================================
    # State-Level Nexus Calculation (Multi-Year)
    # ========================================================================

    def _calculate_state_nexus_multi_year(
        self,
        state_code: str,
        transactions: List[Dict],
        threshold_config: Dict,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        physical_nexus_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Calculate nexus for a state across multiple years.

        Args:
            physical_nexus_date: If state has physical nexus, the date it was established

        Returns list of results, one per year.
        """
        if not transactions:
            # No transactions for this state
            return self._create_zero_sales_results(state_code, threshold_config)

        # Get lookback period type
        lookback_period = threshold_config.get('lookback_period', 'Current or Previous Calendar Year')

        # Route to appropriate lookback handler
        if lookback_period in ['Previous Calendar Year', 'Current or Previous Calendar Year']:
            return self._calculate_calendar_year_lookback(
                state_code=state_code,
                transactions=transactions,
                threshold_config=threshold_config,
                tax_rate_config=tax_rate_config,
                mf_rule=mf_rule,
                lookback_type=lookback_period,
                physical_nexus_date=physical_nexus_date
            )
        elif lookback_period == 'Rolling 12 Months':
            # Phase 1B: Rolling 12-month lookback
            return self._calculate_rolling_12_month_lookback(
                state_code=state_code,
                transactions=transactions,
                threshold_config=threshold_config,
                tax_rate_config=tax_rate_config,
                mf_rule=mf_rule,
                physical_nexus_date=physical_nexus_date
            )
        elif lookback_period == 'Preceding 4 Sales Tax Quarters':
            # NY, VT: Quarterly lookback
            return self._calculate_quarterly_lookback(
                state_code=state_code,
                transactions=transactions,
                threshold_config=threshold_config,
                tax_rate_config=tax_rate_config,
                mf_rule=mf_rule,
                physical_nexus_date=physical_nexus_date
            )
        elif lookback_period == '12-month period ending on September 30':
            # CT: Fixed period ending Sept 30
            return self._calculate_connecticut_september_lookback(
                state_code=state_code,
                transactions=transactions,
                threshold_config=threshold_config,
                tax_rate_config=tax_rate_config,
                mf_rule=mf_rule,
                physical_nexus_date=physical_nexus_date
            )
        else:
            # Unsupported lookback period
            logger.warning(
                f"State {state_code} uses unsupported lookback period: {lookback_period}. "
                f"Falling back to 'Current or Previous Calendar Year'"
            )
            return self._calculate_calendar_year_lookback(
                state_code=state_code,
                transactions=transactions,
                threshold_config=threshold_config,
                tax_rate_config=tax_rate_config,
                mf_rule=mf_rule,
                lookback_type='Current or Previous Calendar Year',
                physical_nexus_date=physical_nexus_date
            )

    # ========================================================================
    # Calendar Year Lookback Implementation (Phase 1A)
    # ========================================================================

    def _calculate_calendar_year_lookback(
        self,
        state_code: str,
        transactions: List[Dict],
        threshold_config: Dict,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        lookback_type: str,
        physical_nexus_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Calculate nexus using calendar year lookback.

        Supports:
        - "Previous Calendar Year" - only look at prior year
        - "Current or Previous Calendar Year" - check current OR prior year

        Args:
            physical_nexus_date: If state has physical nexus, the date it was established
        """
        # Group transactions by year
        transactions_by_year = defaultdict(list)
        for txn in transactions:
            # Parse as timezone-naive
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            year = txn_date.year
            transactions_by_year[year].append(txn)

        # Track first nexus establishment
        first_nexus_year = None
        first_nexus_date = None

        # Results for each year
        results = []

        for year in sorted(transactions_by_year.keys()):
            year_transactions = transactions_by_year[year]
            prior_year_transactions = transactions_by_year.get(year - 1, [])

            # Check if state has physical nexus
            has_physical_nexus = False
            physical_nexus_year = None
            if physical_nexus_date:
                # Parse physical nexus date
                physical_date = datetime.fromisoformat(physical_nexus_date.replace('Z', '').replace('+00:00', ''))
                physical_nexus_year = physical_date.year
                # Physical nexus applies if established on or before this year
                if physical_nexus_year <= year:
                    has_physical_nexus = True

            # Determine nexus status for this year
            has_nexus_this_year = has_physical_nexus  # Start with physical nexus if exists
            nexus_date = None
            obligation_start_date = None
            nexus_from_prior_year_lookback = False

            if first_nexus_year and first_nexus_year < year:
                # Sticky nexus - already had nexus from a prior year
                logger.info(f"{state_code} {year}: STICKY NEXUS detected (first nexus: {first_nexus_year}), obligation starts Jan 1")
                has_nexus_this_year = True
                nexus_date = first_nexus_date
                obligation_start_date = datetime(year, 1, 1)  # Full year obligation
            else:
                # Check if we establish nexus this year based on lookback rules
                nexus_info = None

                if lookback_type == 'Previous Calendar Year':
                    # Check prior year first
                    if prior_year_transactions:
                        prior_nexus = self._find_threshold_crossing(
                            prior_year_transactions, threshold_config
                        )
                        if prior_nexus.get('has_nexus'):
                            # Prior year crossed threshold, so current year has nexus from Jan 1
                            nexus_info = prior_nexus
                            nexus_from_prior_year_lookback = True

                    # If no prior year nexus, check current year
                    if not nexus_info:
                        current_nexus = self._find_threshold_crossing(
                            year_transactions, threshold_config
                        )
                        if current_nexus.get('has_nexus'):
                            nexus_info = current_nexus

                elif lookback_type == 'Current or Previous Calendar Year':
                    # Check current year first
                    current_nexus = self._find_threshold_crossing(
                        year_transactions, threshold_config
                    )

                    if current_nexus.get('has_nexus'):
                        nexus_info = current_nexus
                    else:
                        # Check prior year
                        if prior_year_transactions:
                            prior_nexus = self._find_threshold_crossing(
                                prior_year_transactions, threshold_config
                            )
                            if prior_nexus.get('has_nexus'):
                                nexus_info = prior_nexus
                                nexus_from_prior_year_lookback = True

                # Process nexus_info if we found nexus
                if nexus_info and nexus_info.get('has_nexus'):
                    has_nexus_this_year = True

                    if nexus_from_prior_year_lookback:
                        # Found nexus via prior year lookback - obligation starts Jan 1 of current year
                        logger.info(f"{state_code} {year}: PRIOR YEAR LOOKBACK nexus, obligation starts Jan 1")
                        nexus_date = nexus_info['nexus_date']  # Keep original date for reference
                        obligation_start_date = datetime(year, 1, 1)
                    else:
                        # Nexus established in current year - obligation starts month after crossing
                        nexus_date = nexus_info['nexus_date']
                        obligation_start_date = self._calculate_obligation_start_date(nexus_date)
                        logger.info(f"{state_code} {year}: NEW NEXUS on {nexus_date.date()}, obligation starts {obligation_start_date.date()}")

                    # Record first nexus
                    if first_nexus_year is None:
                        first_nexus_year = year
                        first_nexus_date = nexus_date

            # Calculate liability for this year
            if has_nexus_this_year:
                # Determine nexus type
                has_economic_nexus = has_nexus_this_year and not has_physical_nexus
                if has_physical_nexus and nexus_date:
                    # Both physical and economic
                    nexus_type = 'both'
                elif has_physical_nexus:
                    # Only physical nexus
                    nexus_type = 'physical'
                    # Use physical nexus date if no economic nexus date
                    if not nexus_date and physical_nexus_date:
                        nexus_date = physical_date
                        obligation_start_date = datetime(physical_nexus_year, 1, 1) if physical_nexus_year <= year else physical_date
                else:
                    # Only economic nexus
                    nexus_type = 'economic'

                # Get interest/penalty config for Phase 2
                interest_penalty_config = self._get_interest_penalty_config(state_code)

                liability_result = self._calculate_liability_for_year(
                    transactions=year_transactions,
                    obligation_start_date=obligation_start_date,
                    tax_rate_config=tax_rate_config,
                    mf_rule=mf_rule,
                    state_code=state_code,
                    year=year,
                    interest_penalty_config=interest_penalty_config
                )

                # Build result for this year
                result = {
                    'state': state_code,
                    'year': year,
                    'nexus_type': nexus_type,
                    'nexus_date': nexus_date.date().isoformat() if nexus_date else None,
                    'obligation_start_date': obligation_start_date.date().isoformat() if obligation_start_date else None,
                    'first_nexus_year': first_nexus_year,
                    **liability_result,
                    'threshold': threshold_config.get('revenue_threshold', 100000)
                }
            else:
                # No nexus this year
                result = self._create_no_nexus_result(
                    state_code=state_code,
                    year=year,
                    transactions=year_transactions,
                    threshold_config=threshold_config
                )

            results.append(result)

        return results if results else self._create_zero_sales_results(state_code, threshold_config)

    # ========================================================================
    # Rolling 12-Month Lookback Implementation (Phase 1B)
    # ========================================================================

    def _calculate_rolling_12_month_lookback(
        self,
        state_code: str,
        transactions: List[Dict],
        threshold_config: Dict,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        physical_nexus_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Calculate nexus using rolling 12-month lookback window.

        For each month, sums sales from that month and the previous 11 months.
        Nexus is established when the rolling 12-month total first exceeds the threshold.

        Args:
            physical_nexus_date: If state has physical nexus, the date it was established

        Example (Illinois $100K threshold):
            Jan 2023: $20K → Rolling 12-month: $20K → No nexus
            Feb 2023: $25K → Rolling 12-month: $45K → No nexus
            Mar 2023: $30K → Rolling 12-month: $75K → No nexus
            Apr 2023: $35K → Rolling 12-month: $110K → NEXUS! (April 2023)
            May 2023: $10K → Rolling 12-month: $120K → Has nexus (sticky)
        """
        if not transactions:
            return self._create_zero_sales_results(state_code, threshold_config)

        # Group transactions by year-month
        from collections import defaultdict
        transactions_by_month = defaultdict(list)

        for txn in transactions:
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            year_month = (txn_date.year, txn_date.month)
            transactions_by_month[year_month].append(txn)

        # Get sorted list of all months
        all_months = sorted(transactions_by_month.keys())

        if not all_months:
            return self._create_zero_sales_results(state_code, threshold_config)

        # Get threshold info
        revenue_threshold = threshold_config.get('revenue_threshold')
        transaction_threshold = threshold_config.get('transaction_threshold')
        operator = threshold_config.get('threshold_operator', 'or')

        # Track nexus establishment
        first_nexus_month = None
        first_nexus_date = None
        first_nexus_year = None

        # Calculate rolling 12-month totals for each month
        for i, current_month in enumerate(all_months):
            # Get the 12-month window ending with current month
            window_start_date = datetime(current_month[0], current_month[1], 1) - relativedelta(months=11)
            window_start = (window_start_date.year, window_start_date.month)

            # Sum sales in rolling window (use taxable_amount for nexus determination)
            rolling_total = 0
            rolling_count = 0

            for check_month in all_months:
                # Convert to datetime for comparison
                check_date = datetime(check_month[0], check_month[1], 1)
                window_end = datetime(current_month[0], current_month[1], 1)

                if window_start_date <= check_date <= window_end:
                    month_txns = transactions_by_month[check_month]
                    # Use sales_amount (gross sales) for threshold calculation - most states use gross revenue
                    rolling_total += sum(float(t['sales_amount']) for t in month_txns)
                    rolling_count += len(month_txns)

            # Check if threshold is met
            threshold_met = False
            if operator == 'or':
                if revenue_threshold and rolling_total >= revenue_threshold:
                    threshold_met = True
                if transaction_threshold and rolling_count >= transaction_threshold:
                    threshold_met = True
            else:  # 'and'
                revenue_met = revenue_threshold and rolling_total >= revenue_threshold
                transaction_met = transaction_threshold and rolling_count >= transaction_threshold
                threshold_met = revenue_met and transaction_met

            if threshold_met and not first_nexus_month:
                # Nexus first established this month
                first_nexus_month = current_month
                first_nexus_year = current_month[0]

                # Find the exact date within the month (use first transaction of the month)
                month_txns = sorted(
                    transactions_by_month[current_month],
                    key=lambda t: datetime.fromisoformat(t['transaction_date'].replace('Z', '').replace('+00:00', ''))
                )
                first_txn_date_str = month_txns[0]['transaction_date'].replace('Z', '').replace('+00:00', '')
                first_nexus_date = datetime.fromisoformat(first_txn_date_str)

                logger.info(
                    f"{state_code}: Nexus established {current_month[0]}-{current_month[1]:02d} "
                    f"with rolling 12-month total ${rolling_total:,.2f} (threshold: ${revenue_threshold:,.2f})"
                )
                break

        # Now generate year-by-year results
        transactions_by_year = defaultdict(list)
        for txn in transactions:
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            year = txn_date.year
            transactions_by_year[year].append(txn)

        results = []

        for year in sorted(transactions_by_year.keys()):
            year_transactions = transactions_by_year[year]

            # Determine nexus status for this year
            has_nexus_this_year = False
            nexus_date = None
            obligation_start_date = None

            if first_nexus_year and year >= first_nexus_year:
                # Has nexus (either established this year or sticky from prior)
                has_nexus_this_year = True
                nexus_date = first_nexus_date

                if year == first_nexus_year:
                    # Nexus established this year - obligation starts next month
                    obligation_start_date = self._calculate_obligation_start_date(first_nexus_date)
                    logger.info(
                        f"{state_code} {year}: Nexus established {first_nexus_date.date()}, "
                        f"obligation starts {obligation_start_date.date()}"
                    )
                else:
                    # Sticky nexus from prior year - full year obligation
                    obligation_start_date = datetime(year, 1, 1)
                    logger.info(
                        f"{state_code} {year}: STICKY NEXUS detected (first nexus: {first_nexus_year}), "
                        f"obligation starts Jan 1"
                    )

                # Calculate liability
                # Get interest/penalty config for Phase 2
                interest_penalty_config = self._get_interest_penalty_config(state_code)

                liability_result = self._calculate_liability_for_year(
                    transactions=year_transactions,
                    obligation_start_date=obligation_start_date,
                    tax_rate_config=tax_rate_config,
                    mf_rule=mf_rule,
                    state_code=state_code,
                    year=year,
                    interest_penalty_config=interest_penalty_config
                )

                result = {
                    'state': state_code,
                    'year': year,
                    'nexus_type': 'economic',
                    'nexus_date': nexus_date.date().isoformat() if nexus_date else None,
                    'obligation_start_date': obligation_start_date.date().isoformat() if obligation_start_date else None,
                    'first_nexus_year': first_nexus_year,
                    **liability_result,
                    'threshold': threshold_config.get('revenue_threshold', 100000)
                }
            else:
                # No nexus this year
                result = self._create_no_nexus_result(
                    state_code=state_code,
                    year=year,
                    transactions=year_transactions,
                    threshold_config=threshold_config
                )

            results.append(result)

        return results if results else self._create_zero_sales_results(state_code, threshold_config)

    # ========================================================================
    # Quarterly Lookback Implementation (NY, VT)
    # ========================================================================

    def _calculate_quarterly_lookback(
        self,
        state_code: str,
        transactions: List[Dict],
        threshold_config: Dict,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        physical_nexus_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Calculate nexus using quarterly lookback (preceding 4 quarters).

        Used by:
        - New York: "Preceding 4 Sales Tax Quarters"
        - Vermont: "Preceding 4 Calendar Quarters"

        Quarters align with calendar:
        Q1: Jan 1 - Mar 31
        Q2: Apr 1 - Jun 30
        Q3: Jul 1 - Sep 30
        Q4: Oct 1 - Dec 31

        For each quarter, check if sales in the preceding 4 complete quarters
        exceed the threshold.

        Example (checking Q2 2024):
        - Current quarter: Q2 2024 (Apr-Jun)
        - Preceding 4 quarters: Q2 2023, Q3 2023, Q4 2023, Q1 2024
        - Sum sales from those 4 quarters and check threshold
        """
        if not transactions:
            return self._create_zero_sales_results(state_code, threshold_config)

        # Group transactions by year
        transactions_by_year = defaultdict(list)
        for txn in transactions:
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            year = txn_date.year
            transactions_by_year[year].append(txn)

        # Track first nexus establishment
        first_nexus_year = None
        first_nexus_date = None

        # Results for each year
        results = []

        for year in sorted(transactions_by_year.keys()):
            year_transactions = transactions_by_year[year]

            # Check if state has physical nexus
            has_physical_nexus = False
            physical_nexus_year = None
            if physical_nexus_date:
                physical_date = datetime.fromisoformat(physical_nexus_date.replace('Z', '').replace('+00:00', ''))
                physical_nexus_year = physical_date.year
                if physical_nexus_year <= year:
                    has_physical_nexus = True

            # Determine nexus status for this year
            has_nexus_this_year = has_physical_nexus
            nexus_date = None
            obligation_start_date = None

            if first_nexus_year and first_nexus_year < year:
                # Sticky nexus - already had nexus from a prior year
                logger.info(f"{state_code} {year}: STICKY NEXUS detected (first nexus: {first_nexus_year}), obligation starts Jan 1")
                has_nexus_this_year = True
                nexus_date = first_nexus_date
                obligation_start_date = datetime(year, 1, 1)
            else:
                # Check each quarter of this year to see if preceding 4 quarters establish nexus
                for quarter in range(1, 5):  # Q1, Q2, Q3, Q4
                    # Get all transactions from the preceding 4 quarters
                    quarter_start, quarter_end = self._get_quarter_dates(year, quarter)

                    # Calculate start of preceding 4 quarters (go back 12 months from end of current quarter)
                    lookback_start = quarter_end - relativedelta(months=12) + timedelta(days=1)

                    # Get transactions in this 12-month period (preceding 4 quarters)
                    # Filter to only relevant date range for better performance
                    period_transactions = []
                    for txn in transactions:
                        txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
                        txn_date = datetime.fromisoformat(txn_date_str)
                        # Only include transactions within the 12-month lookback window
                        if lookback_start <= txn_date <= quarter_end:
                            period_transactions.append(txn)

                    if not period_transactions:
                        continue

                    # Check if threshold crossed in this period
                    nexus_info = self._find_threshold_crossing(
                        period_transactions, threshold_config
                    )

                    if nexus_info.get('has_nexus'):
                        # Found nexus in this quarter's lookback period
                        has_nexus_this_year = True
                        nexus_date = nexus_info['nexus_date']
                        obligation_start_date = self._calculate_obligation_start_date(nexus_date)
                        logger.info(
                            f"{state_code} {year} Q{quarter}: QUARTERLY LOOKBACK nexus on {nexus_date.date()}, "
                            f"obligation starts {obligation_start_date.date()}"
                        )

                        # Record first nexus
                        if first_nexus_year is None:
                            first_nexus_year = year
                            first_nexus_date = nexus_date
                        break  # Stop checking quarters once nexus is found

            # Calculate liability for this year
            if has_nexus_this_year:
                # Determine nexus type
                if has_physical_nexus and nexus_date:
                    nexus_type = 'both'
                elif has_physical_nexus:
                    nexus_type = 'physical'
                    if not nexus_date and physical_nexus_date:
                        physical_date = datetime.fromisoformat(physical_nexus_date.replace('Z', '').replace('+00:00', ''))
                        nexus_date = physical_date
                        obligation_start_date = datetime(physical_nexus_year, 1, 1) if physical_nexus_year <= year else physical_date
                else:
                    nexus_type = 'economic'

                # Get interest/penalty config
                interest_penalty_config = self._get_interest_penalty_config(state_code)

                liability_result = self._calculate_liability_for_year(
                    transactions=year_transactions,
                    obligation_start_date=obligation_start_date,
                    tax_rate_config=tax_rate_config,
                    mf_rule=mf_rule,
                    state_code=state_code,
                    year=year,
                    interest_penalty_config=interest_penalty_config
                )

                result = {
                    'state': state_code,
                    'year': year,
                    'nexus_type': nexus_type,
                    'nexus_date': nexus_date.date().isoformat() if nexus_date else None,
                    'obligation_start_date': obligation_start_date.date().isoformat() if obligation_start_date else None,
                    'first_nexus_year': first_nexus_year,
                    **liability_result,
                    'threshold': threshold_config.get('revenue_threshold', 100000)
                }
            else:
                # No nexus this year
                result = self._create_no_nexus_result(
                    state_code=state_code,
                    year=year,
                    transactions=year_transactions,
                    threshold_config=threshold_config
                )

            results.append(result)

        return results if results else self._create_zero_sales_results(state_code, threshold_config)

    # ========================================================================
    # Connecticut September 30 Lookback Implementation
    # ========================================================================

    def _calculate_connecticut_september_lookback(
        self,
        state_code: str,
        transactions: List[Dict],
        threshold_config: Dict,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        physical_nexus_date: Optional[str] = None
    ) -> List[Dict]:
        """
        Calculate nexus for Connecticut's special lookback period.

        Connecticut uses: "12-month period ending on September 30"

        For each year, measure sales from Oct 1 (prior year) to Sep 30 (current year).

        Example (checking 2024):
        - Measurement period: Oct 1, 2023 - Sep 30, 2024
        - If threshold exceeded in this period, nexus for 2024
        """
        if not transactions:
            return self._create_zero_sales_results(state_code, threshold_config)

        # Group transactions by year
        transactions_by_year = defaultdict(list)
        for txn in transactions:
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            year = txn_date.year
            transactions_by_year[year].append(txn)

        # Track first nexus establishment
        first_nexus_year = None
        first_nexus_date = None

        # Results for each year
        results = []

        for year in sorted(transactions_by_year.keys()):
            year_transactions = transactions_by_year[year]

            # Check if state has physical nexus
            has_physical_nexus = False
            physical_nexus_year = None
            if physical_nexus_date:
                physical_date = datetime.fromisoformat(physical_nexus_date.replace('Z', '').replace('+00:00', ''))
                physical_nexus_year = physical_date.year
                if physical_nexus_year <= year:
                    has_physical_nexus = True

            # Determine nexus status for this year
            has_nexus_this_year = has_physical_nexus
            nexus_date = None
            obligation_start_date = None

            if first_nexus_year and first_nexus_year < year:
                # Sticky nexus
                logger.info(f"{state_code} {year}: STICKY NEXUS detected (first nexus: {first_nexus_year}), obligation starts Jan 1")
                has_nexus_this_year = True
                nexus_date = first_nexus_date
                obligation_start_date = datetime(year, 1, 1)
            else:
                # Connecticut's measurement period for this year: Oct 1 (prior year) to Sep 30 (current year)
                period_start = datetime(year - 1, 10, 1)
                period_end = datetime(year, 9, 30)

                # Get all transactions in this period
                period_transactions = []
                for txn in transactions:
                    txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
                    txn_date = datetime.fromisoformat(txn_date_str)
                    if period_start <= txn_date <= period_end:
                        period_transactions.append(txn)

                if period_transactions:
                    # Check if threshold crossed
                    nexus_info = self._find_threshold_crossing(
                        period_transactions, threshold_config
                    )

                    if nexus_info.get('has_nexus'):
                        # Found nexus in CT's measurement period
                        has_nexus_this_year = True
                        nexus_date = nexus_info['nexus_date']
                        obligation_start_date = self._calculate_obligation_start_date(nexus_date)
                        logger.info(
                            f"{state_code} {year}: CT SEPTEMBER LOOKBACK nexus on {nexus_date.date()}, "
                            f"obligation starts {obligation_start_date.date()}"
                        )

                        # Record first nexus
                        if first_nexus_year is None:
                            first_nexus_year = year
                            first_nexus_date = nexus_date

            # Calculate liability for this year
            if has_nexus_this_year:
                # Determine nexus type
                if has_physical_nexus and nexus_date:
                    nexus_type = 'both'
                elif has_physical_nexus:
                    nexus_type = 'physical'
                    if not nexus_date and physical_nexus_date:
                        physical_date = datetime.fromisoformat(physical_nexus_date.replace('Z', '').replace('+00:00', ''))
                        nexus_date = physical_date
                        obligation_start_date = datetime(physical_nexus_year, 1, 1) if physical_nexus_year <= year else physical_date
                else:
                    nexus_type = 'economic'

                # Get interest/penalty config
                interest_penalty_config = self._get_interest_penalty_config(state_code)

                liability_result = self._calculate_liability_for_year(
                    transactions=year_transactions,
                    obligation_start_date=obligation_start_date,
                    tax_rate_config=tax_rate_config,
                    mf_rule=mf_rule,
                    state_code=state_code,
                    year=year,
                    interest_penalty_config=interest_penalty_config
                )

                result = {
                    'state': state_code,
                    'year': year,
                    'nexus_type': nexus_type,
                    'nexus_date': nexus_date.date().isoformat() if nexus_date else None,
                    'obligation_start_date': obligation_start_date.date().isoformat() if obligation_start_date else None,
                    'first_nexus_year': first_nexus_year,
                    **liability_result,
                    'threshold': threshold_config.get('revenue_threshold', 100000)
                }
            else:
                # No nexus this year
                result = self._create_no_nexus_result(
                    state_code=state_code,
                    year=year,
                    transactions=year_transactions,
                    threshold_config=threshold_config
                )

            results.append(result)

        return results if results else self._create_zero_sales_results(state_code, threshold_config)

    # ========================================================================
    # Helper Functions
    # ========================================================================

    def _get_quarter_dates(self, year: int, quarter: int) -> tuple:
        """Get start and end dates for a calendar quarter."""
        if quarter == 1:
            return datetime(year, 1, 1), datetime(year, 3, 31)
        elif quarter == 2:
            return datetime(year, 4, 1), datetime(year, 6, 30)
        elif quarter == 3:
            return datetime(year, 7, 1), datetime(year, 9, 30)
        else:  # Q4
            return datetime(year, 10, 1), datetime(year, 12, 31)

    def _find_threshold_crossing(
        self,
        transactions: List[Dict],
        threshold_config: Dict
    ) -> Dict:
        """
        Find exact transaction that crossed the threshold.

        Uses sales_amount (gross sales) to determine threshold crossing,
        as most states use total gross revenue for economic nexus thresholds.

        Returns:
            - has_nexus: bool
            - nexus_date: datetime when crossed
            - threshold_transaction_id: ID of transaction that crossed
            - running_total: total gross sales when crossed
        """
        # Sort transactions chronologically
        sorted_txns = sorted(
            transactions,
            key=lambda t: datetime.fromisoformat(t['transaction_date'].replace('Z', '').replace('+00:00', ''))
        )

        running_total = 0
        running_count = 0

        revenue_threshold = threshold_config.get('revenue_threshold')
        transaction_threshold = threshold_config.get('transaction_threshold')
        operator = threshold_config.get('threshold_operator', 'or')

        for txn in sorted_txns:
            # Use sales_amount (gross sales) for threshold calculation - most states use gross revenue
            running_total += float(txn['sales_amount'])
            running_count += 1

            # Check thresholds
            revenue_met = False
            if revenue_threshold:
                revenue_met = running_total >= revenue_threshold

            transaction_met = False
            if transaction_threshold:
                transaction_met = running_count >= transaction_threshold

            # Apply operator
            threshold_met = False
            if operator == 'or':
                threshold_met = revenue_met or transaction_met
            else:  # 'and'
                threshold_met = revenue_met and transaction_met

            if threshold_met:
                # Parse as timezone-naive
                txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
                txn_date = datetime.fromisoformat(txn_date_str)
                return {
                    'has_nexus': True,
                    'nexus_date': txn_date,
                    'threshold_transaction_id': txn['id'],
                    'running_total': running_total,
                    'running_count': running_count
                }

        return {'has_nexus': False}

    def _calculate_obligation_start_date(self, nexus_date: datetime) -> datetime:
        """
        Calculate when collection obligation begins.

        Default rule: First day of month following nexus establishment.

        Example: Nexus on June 10 → Obligation starts July 1
        """
        # Remove timezone info to match transaction date parsing
        nexus_naive = nexus_date.replace(tzinfo=None) if nexus_date.tzinfo else nexus_date

        if nexus_naive.month == 12:
            return datetime(nexus_naive.year + 1, 1, 1)
        else:
            return datetime(nexus_naive.year, nexus_naive.month + 1, 1)

    def _calculate_liability_for_year(
        self,
        transactions: List[Dict],
        obligation_start_date: datetime,
        tax_rate_config: Optional[Dict],
        mf_rule: Optional[Dict],
        state_code: str = None,
        year: int = None,
        interest_penalty_config: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate tax liability for transactions in a specific year.

        Only includes transactions on or after obligation_start_date.
        Excludes marketplace sales if state has MF law.

        Phase 2: Now calculates interest and penalties based on state rules.
        """
        if not tax_rate_config:
            logger.warning("No tax rate config, returning zero liability")
            return {
                'total_sales': 0,
                'direct_sales': 0,
                'marketplace_sales': 0,
                'taxable_sales': 0,
                'transaction_count': 0,
                'estimated_liability': 0,
                'base_tax': 0,
                'interest': 0,
                'penalties': 0,
                'approaching_threshold': False
            }

        # Calculate sales by channel
        total_sales = 0
        direct_sales = 0
        marketplace_sales = 0
        exempt_sales = 0  # Exempt sales (not taxable)
        taxable_sales = 0  # All taxable sales for the year (used for nexus threshold tracking)
        exposure_sales = 0  # Taxable sales during obligation period (used for liability calculation)
        transaction_count = 0

        logger.info(f"[MARKETPLACE DEBUG] State {state_code}, Year {year}, MF Rule: {mf_rule}")

        for txn in transactions:
            # Parse as timezone-naive for consistent comparison
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            amount = float(txn['sales_amount'])
            channel = txn.get('sales_channel', 'direct')

            # Hybrid logic for exempt sales
            exempt_amount = float(txn.get('exempt_amount', 0))
            is_taxable = txn.get('is_taxable', True)

            if exempt_amount != 0:
                # Priority 1: Use explicit exempt_amount (handles both positive and negative values)
                # Positive: regular exempt sales; Negative: returns of exempt goods
                taxable_amount = amount - exempt_amount
            elif not is_taxable:
                # Priority 2: is_taxable=False means full amount is exempt
                taxable_amount = 0
                exempt_amount = amount
            else:
                # Priority 3: Default - full amount is taxable
                taxable_amount = amount
                exempt_amount = 0

            # Count all transactions and total sales (gross revenue)
            total_sales += amount
            transaction_count += 1

            # Track exempt sales
            exempt_sales += exempt_amount

            # Track all taxable sales for the year (for threshold calculations)
            taxable_sales += taxable_amount

            # Split by channel
            if channel == 'direct':
                direct_sales += amount
            else:
                marketplace_sales += amount

            # Calculate exposure sales (taxable sales during obligation period)
            if txn_date >= obligation_start_date:
                if channel == 'direct':
                    # Direct sales: always include taxable amount in exposure
                    exposure_sales += taxable_amount
                elif channel == 'marketplace':
                    # Marketplace sales: exclude from liability by default (MF collects tax)
                    # Only include if explicitly configured to NOT exclude
                    if mf_rule and mf_rule.get('exclude_from_liability', True) is False:
                        # Explicitly set to False - include marketplace sales in exposure
                        exposure_sales += taxable_amount
                    # else: exclude marketplace sales (default behavior)

        # Calculate tax based on EXPOSURE sales (not all taxable sales)
        combined_rate = tax_rate_config.get('combined_rate', 0)
        base_tax = exposure_sales * combined_rate

        logger.info(f"[MARKETPLACE DEBUG] Final: total_sales=${total_sales}, direct=${direct_sales}, marketplace=${marketplace_sales}, taxable_sales=${taxable_sales}, exposure_sales=${exposure_sales}, base_tax=${base_tax}")

        # Phase 2: Calculate interest and penalties
        interest = 0
        penalties = 0
        penalty_breakdown = {}
        interest_rate = 0
        calculation_method = 'simple'
        days_outstanding = 0
        penalty_rate = 0

        if base_tax > 0 and state_code and year:
            # Calculate interest to today (when analysis is being run)
            calculation_date = datetime.now()

            # Find the first exposure transaction date after obligation started
            # Interest should accrue from when the first taxable sale occurred (that creates liability)
            # You can't owe interest on sales that haven't happened yet
            first_exposure_transaction_date = None
            for txn in transactions:
                txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
                txn_date = datetime.fromisoformat(txn_date_str)
                if txn_date >= obligation_start_date:
                    taxable_amount = float(txn.get('taxable_amount', txn['sales_amount']))
                    channel = txn.get('sales_channel', 'direct')

                    # Only count transactions that contribute to exposure sales
                    include_in_exposure = False
                    if channel == 'direct' and taxable_amount > 0:
                        include_in_exposure = True
                    elif channel == 'marketplace' and taxable_amount > 0:
                        # Include marketplace sales only if explicitly configured to NOT exclude
                        if mf_rule and mf_rule.get('exclude_from_liability', True) is False:
                            include_in_exposure = True

                    if include_in_exposure:
                        if first_exposure_transaction_date is None or txn_date < first_exposure_transaction_date:
                            first_exposure_transaction_date = txn_date

            # Use first transaction date if found, otherwise fall back to obligation_start_date
            interest_start_date = first_exposure_transaction_date if first_exposure_transaction_date else obligation_start_date

            try:
                # Convert datetime to date for the new calculator
                start_date = interest_start_date.date() if hasattr(interest_start_date, 'date') else interest_start_date
                calc_date = calculation_date.date() if hasattr(calculation_date, 'date') else calculation_date

                interest_result = self.interest_calculator.calculate(
                    base_tax=float(base_tax),
                    obligation_start_date=start_date,
                    calculation_date=calc_date,
                    state_code=state_code,
                    config=interest_penalty_config
                )
                interest = interest_result.get('interest', 0)
                penalties = interest_result.get('total_penalties', 0)
                penalty_breakdown = interest_result.get('penalties', {})

                # Capture calculation metadata for transparency
                interest_rate = interest_result.get('interest_rate', 0)
                calculation_method = interest_result.get('interest_method', 'simple')
                days_outstanding = interest_result.get('days_outstanding', 0)
                # penalty_rate is now derived from breakdown, not a single rate
                penalty_rate = (penalties / float(base_tax)) if base_tax > 0 else 0

                logger.debug(
                    f"{state_code} {year}: Base tax ${base_tax:,.2f}, "
                    f"Interest ${interest:,.2f}, Penalties ${penalties:,.2f}"
                )
            except Exception as e:
                logger.error(
                    f"CRITICAL: Interest calculation failed for {state_code} {year}: {str(e)}. "
                    f"Base tax: ${base_tax:,.2f}, Obligation date: {interest_start_date.date()}, "
                    f"Calculation date: {calculation_date.date()}. "
                    f"Interest and penalties will show as $0 - THIS IS INCORRECT!"
                )
                # Continue with zero interest/penalties but log prominently
                # Note: Estimated liability will be understated by the missing interest/penalties

        estimated_liability = base_tax + interest + penalties

        return {
            'gross_sales': total_sales,  # Explicit gross sales
            'total_sales': total_sales,  # Backward compatibility
            'exempt_sales': exempt_sales,  # Exempt sales informational
            'direct_sales': direct_sales,
            'marketplace_sales': marketplace_sales,
            'taxable_sales': taxable_sales,  # All taxable sales for the year (for threshold tracking)
            'exposure_sales': exposure_sales,  # Taxable sales during obligation period (for liability)
            'transaction_count': transaction_count,
            'estimated_liability': round(estimated_liability, 2),
            'base_tax': round(base_tax, 2),
            'interest': round(interest, 2),
            'penalties': round(penalties, 2),
            'penalty_breakdown': penalty_breakdown,  # Detailed penalty breakdown
            'approaching_threshold': False,  # Set by threshold checking logic in parent method
            # Calculation metadata for transparency
            'interest_rate': round(interest_rate, 4) if interest_rate else None,
            'interest_method': calculation_method if interest > 0 else None,
            'days_outstanding': days_outstanding if interest > 0 else None,
            'penalty_rate': round(penalty_rate, 4) if penalty_rate else None
        }

    def _create_no_nexus_result(
        self,
        state_code: str,
        year: int,
        transactions: List[Dict],
        threshold_config: Dict
    ) -> Dict:
        """
        Create result for a year with no nexus.

        Note: taxable_sales still reflects actual taxable amount (for threshold tracking).
        Only exposure_sales is 0 (no nexus = no tax liability).
        """
        total_sales = sum(float(t['sales_amount']) for t in transactions)
        transaction_count = len(transactions)

        direct_sales = sum(
            float(t['sales_amount']) for t in transactions
            if t.get('sales_channel', 'direct') == 'direct'
        )
        marketplace_sales = total_sales - direct_sales

        # Calculate exempt and taxable sales using hybrid logic
        exempt_sales = 0
        taxable_sales = 0
        for txn in transactions:
            amount = float(txn['sales_amount'])
            exempt_amount = float(txn.get('exempt_amount', 0))
            is_taxable = txn.get('is_taxable', True)

            if exempt_amount != 0:
                # Priority 1: Use explicit exempt_amount (handles both positive and negative)
                exempt_sales += exempt_amount
                taxable_sales += (amount - exempt_amount)
            elif not is_taxable:
                # Priority 2: is_taxable=False means full amount is exempt
                exempt_sales += amount
                # taxable_sales += 0 (fully exempt)
            else:
                # Priority 3: Default - full amount is taxable
                taxable_sales += amount

        return {
            'state': state_code,
            'year': year,
            'nexus_type': 'none',
            'nexus_date': None,
            'obligation_start_date': None,
            'first_nexus_year': None,
            'gross_sales': total_sales,  # Explicit gross sales
            'total_sales': total_sales,  # Backward compatibility
            'exempt_sales': exempt_sales,  # Exempt sales informational
            'direct_sales': direct_sales,
            'marketplace_sales': marketplace_sales,
            'taxable_sales': taxable_sales,  # Actual taxable sales (for threshold tracking)
            'exposure_sales': 0,  # No nexus = no exposure/liability
            'transaction_count': transaction_count,
            'estimated_liability': 0,
            'base_tax': 0,
            'interest': 0,
            'penalties': 0,
            'penalty_breakdown': {},  # Empty breakdown for no nexus
            'approaching_threshold': False,
            'threshold': threshold_config.get('revenue_threshold', 100000)
        }

    def _create_zero_sales_results(
        self,
        state_code: str,
        threshold_config: Dict
    ) -> List[Dict]:
        """
        Create result for states with no transactions.

        Returns single-year result for current year.
        """
        current_year = datetime.now().year

        return [{
            'state': state_code,
            'year': current_year,
            'nexus_type': 'none',
            'nexus_date': None,
            'obligation_start_date': None,
            'first_nexus_year': None,
            'gross_sales': 0,  # Explicit gross sales
            'total_sales': 0,  # Backward compatibility
            'exempt_sales': 0,  # Exempt sales informational
            'direct_sales': 0,
            'marketplace_sales': 0,
            'taxable_sales': 0,
            'exposure_sales': 0,
            'transaction_count': 0,
            'estimated_liability': 0,
            'base_tax': 0,
            'interest': 0,
            'penalties': 0,
            'penalty_breakdown': {},  # Empty breakdown for no sales
            'approaching_threshold': False,
            'threshold': threshold_config.get('revenue_threshold', 100000)
        }]

    # ========================================================================
    # Data Retrieval Methods
    # ========================================================================

    def _get_all_transactions(self, analysis_id: str) -> List[Dict]:
        """
        Get ALL transactions for this analysis (not aggregated).

        Returns raw transaction list for chronological processing.
        """
        try:
            result = self.supabase.table('sales_transactions') \
                .select('*') \
                .eq('analysis_id', analysis_id) \
                .execute()

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error fetching transactions: {str(e)}")
            raise

    def _get_economic_nexus_thresholds(self) -> Dict:
        """
        Get current economic nexus thresholds with lookback periods.
        """
        try:
            result = self.supabase.table('economic_nexus_thresholds') \
                .select('*') \
                .is_('effective_to', 'null') \
                .execute()

            thresholds = {}
            for row in result.data:
                thresholds[row['state']] = {
                    'threshold_type': row['threshold_type'],
                    'revenue_threshold': float(row['revenue_threshold']) if row['revenue_threshold'] else None,
                    'transaction_threshold': row['transaction_threshold'],
                    'threshold_operator': row['threshold_operator'],
                    'lookback_period': row.get('lookback_period', 'Current or Previous Calendar Year')
                }

            return thresholds

        except Exception as e:
            logger.error(f"Error fetching nexus thresholds: {str(e)}")
            raise

    def _get_tax_rates(self) -> Dict:
        """
        Get tax rates for all states.
        """
        try:
            result = self.supabase.table('tax_rates') \
                .select('*') \
                .execute()

            rates = {}
            for row in result.data:
                combined_rate = float(row['state_rate']) + float(row['avg_local_rate'] or 0)
                rates[row['state']] = {
                    'state_rate': float(row['state_rate']),
                    'avg_local_rate': float(row['avg_local_rate'] or 0),
                    'combined_rate': combined_rate
                }

            return rates

        except Exception as e:
            logger.error(f"Error fetching tax rates: {str(e)}")
            raise

    def _get_marketplace_facilitator_rules(self) -> Dict:
        """
        Get current marketplace facilitator rules.
        """
        try:
            result = self.supabase.table('marketplace_facilitator_rules') \
                .select('*') \
                .is_('effective_to', 'null') \
                .execute()

            rules = {}
            for row in result.data:
                rules[row['state']] = {
                    'has_mf_law': row['has_mf_law'],
                    'count_toward_threshold': row['count_toward_threshold'],
                    'exclude_from_liability': row['exclude_from_liability']
                }

            return rules

        except Exception as e:
            logger.error(f"Error fetching marketplace facilitator rules: {str(e)}")
            raise

    def _load_all_interest_penalty_configs(self) -> None:
        """
        Bulk load all interest/penalty configurations in a single query.

        This replaces 200+ individual queries with a single query.
        Results are cached in self._interest_penalty_cache.
        """
        try:
            result = self.supabase.table('interest_penalty_rates') \
                .select('*') \
                .is_('effective_to', 'null') \
                .execute()

            # Build cache keyed by state code
            self._interest_penalty_cache = {}
            for row in result.data:
                state_code = row.get('state')
                if state_code:
                    self._interest_penalty_cache[state_code] = row

            logger.info(f"Loaded interest/penalty configs for {len(self._interest_penalty_cache)} states")

        except Exception as e:
            logger.error(f"Error bulk loading interest/penalty configs: {str(e)}")
            self._interest_penalty_cache = {}

    def _get_interest_penalty_config(self, state_code: str) -> Optional[Dict]:
        """
        Get current interest/penalty configuration for a state.

        Uses cached data from _load_all_interest_penalty_configs().
        Falls back to individual query if cache is empty.
        """
        # Use cache if available
        if self._interest_penalty_cache:
            config = self._interest_penalty_cache.get(state_code)
            if not config:
                logger.warning(f"No interest/penalty config for {state_code}, using defaults")
            return config

        # Fallback to individual query if cache wasn't loaded
        try:
            result = self.supabase.table('interest_penalty_rates') \
                .select('*') \
                .eq('state', state_code) \
                .is_('effective_to', 'null') \
                .limit(1) \
                .execute()

            if result.data:
                return result.data[0]

            logger.warning(f"No interest/penalty config for {state_code}, using defaults")
            return None

        except Exception as e:
            logger.error(f"Error fetching interest/penalty config for {state_code}: {str(e)}")
            return None

    def _get_all_state_codes(self) -> List[str]:
        """
        Fetch all state codes.
        """
        try:
            response = self.supabase.table('states').select('code').execute()
            return [state['code'] for state in response.data]
        except Exception as e:
            logger.error(f"Failed to fetch all state codes: {str(e)}")
            raise

    def _get_physical_nexus(self, analysis_id: str) -> Dict[str, str]:
        """
        Fetch physical nexus data for an analysis.

        Returns dict mapping state_code -> nexus_date (ISO string)
        Example: {'CA': '2020-01-15', 'NY': '2021-06-01'}
        """
        try:
            response = self.supabase.table('physical_nexus')\
                .select('state_code, nexus_date')\
                .eq('analysis_id', analysis_id)\
                .execute()

            # Build map of state_code -> nexus_date
            physical_nexus_map = {}
            for record in response.data:
                physical_nexus_map[record['state_code']] = record['nexus_date']

            logger.info(f"Loaded physical nexus for {len(physical_nexus_map)} states: {list(physical_nexus_map.keys())}")
            return physical_nexus_map

        except Exception as e:
            logger.error(f"Failed to fetch physical nexus for analysis {analysis_id}: {str(e)}")
            # Return empty dict on error - don't fail the entire calculation
            return {}

    # ========================================================================
    # Database Save Methods
    # ========================================================================

    def _save_results_to_database(self, analysis_id: str, results: List[Dict]):
        """
        Save state results to database (multi-year).
        """
        try:
            # Prepare data for insertion
            state_results = []
            for result in results:
                state_results.append({
                    'analysis_id': analysis_id,
                    'state': result['state'],
                    'year': result['year'],
                    'nexus_type': result['nexus_type'],
                    'nexus_date': result['nexus_date'],
                    'obligation_start_date': result['obligation_start_date'],
                    'first_nexus_year': result.get('first_nexus_year'),
                    'gross_sales': result.get('gross_sales', result['total_sales']),
                    'total_sales': result['total_sales'],
                    'exempt_sales': result.get('exempt_sales', 0),
                    'direct_sales': result['direct_sales'],
                    'marketplace_sales': result['marketplace_sales'],
                    'taxable_sales': result.get('taxable_sales', result['total_sales']),
                    'exposure_sales': result.get('exposure_sales', result.get('taxable_sales', result['total_sales'])),
                    'transaction_count': result.get('transaction_count', 0),
                    'estimated_liability': result['estimated_liability'],
                    'base_tax': result['base_tax'],
                    'interest': result['interest'],
                    'penalties': result['penalties'],
                    'penalty_breakdown': result.get('penalty_breakdown'),  # Detailed penalty breakdown
                    'approaching_threshold': result.get('approaching_threshold', False),
                    'threshold': result.get('threshold', 100000),
                    # Calculation metadata for transparency
                    'interest_rate': result.get('interest_rate'),
                    'interest_method': result.get('interest_method'),
                    'days_outstanding': result.get('days_outstanding'),
                    'penalty_rate': result.get('penalty_rate')
                })

            # Delete existing results for this analysis
            self.supabase.table('state_results').delete().eq('analysis_id', analysis_id).execute()

            # Insert new results in batches
            batch_size = 50
            for i in range(0, len(state_results), batch_size):
                batch = state_results[i:i + batch_size]
                self.supabase.table('state_results').insert(batch).execute()

            logger.info(f"Saved {len(state_results)} state-year results for analysis {analysis_id}")

        except Exception as e:
            logger.error(f"Error saving results to database: {str(e)}")
            raise

    def _update_analysis_summary(
        self,
        analysis_id: str,
        total_liability: float,
        states_with_nexus: int
    ):
        """
        Update analysis table with summary information.
        """
        try:
            self.supabase.table('analyses').update({
                'status': 'complete',
                'total_liability': total_liability,
                'states_with_nexus': states_with_nexus,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', analysis_id).execute()

        except Exception as e:
            logger.error(f"Error updating analysis summary: {str(e)}")
            raise

    def _auto_populate_state_assessments(self, analysis_id: str):
        """
        Auto-populate state_assessments table from analysis state_results.
        This creates worklist items for states that need attention after analysis completes.
        """
        try:
            # Get analysis to find client_id and organization_id
            analysis = self.supabase.table('analyses').select(
                'client_id, organization_id'
            ).eq('id', analysis_id).maybe_single().execute()

            if not analysis.data:
                logger.warning(f"Analysis {analysis_id} not found for state assessment population")
                return

            client_id = analysis.data.get('client_id')
            org_id = analysis.data.get('organization_id')

            if not client_id or not org_id:
                logger.warning(f"Analysis {analysis_id} missing client_id or organization_id")
                return

            # Get state results from the analysis
            results = self.supabase.table('state_results').select(
                'state, has_nexus, physical_nexus, economic_nexus, total_sales, '
                'estimated_total_liability, threshold_percentage, first_nexus_date'
            ).eq('analysis_id', analysis_id).execute()

            if not results.data:
                logger.info(f"No state results to import for analysis {analysis_id}")
                return

            # Get existing assessments for this client
            existing = self.supabase.table('state_assessments').select(
                'state'
            ).eq('client_id', client_id).execute()

            existing_states = {a['state'] for a in (existing.data or [])}

            # Create assessments for states not already tracked
            assessments_to_create = []
            for result in results.data:
                if result['state'] in existing_states:
                    continue

                # Determine nexus status
                nexus_status = 'unknown'
                if result.get('has_nexus'):
                    nexus_status = 'has_nexus'
                elif result.get('threshold_percentage') and result['threshold_percentage'] >= 75:
                    nexus_status = 'approaching'
                elif result.get('total_sales', 0) == 0:
                    nexus_status = 'no_nexus'

                # Determine nexus type
                nexus_type = None
                if result.get('physical_nexus') and result.get('economic_nexus'):
                    nexus_type = 'both'
                elif result.get('physical_nexus'):
                    nexus_type = 'physical'
                elif result.get('economic_nexus'):
                    nexus_type = 'economic'

                assessments_to_create.append({
                    'client_id': client_id,
                    'analysis_id': analysis_id,
                    'organization_id': org_id,
                    'state': result['state'],
                    'nexus_status': nexus_status,
                    'nexus_type': nexus_type,
                    'total_sales': result.get('total_sales'),
                    'estimated_liability': result.get('estimated_total_liability'),
                    'threshold_percentage': result.get('threshold_percentage'),
                    'first_exposure_date': result.get('first_nexus_date'),
                    'assessed_at': datetime.utcnow().isoformat(),
                })

            if assessments_to_create:
                self.supabase.table('state_assessments').insert(assessments_to_create).execute()
                logger.info(
                    f"Auto-populated {len(assessments_to_create)} state assessments for "
                    f"client {client_id} from analysis {analysis_id}"
                )
            else:
                logger.info(f"No new state assessments to create (all states already tracked)")

        except Exception as e:
            # Log but don't fail the analysis - state assessments can be imported manually
            logger.warning(f"Failed to auto-populate state assessments: {str(e)}")
