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
from .interest_calculator import InterestCalculator

logger = logging.getLogger(__name__)


class NexusCalculatorV2:
    """
    Phase 1A Nexus Calculator with chronological processing.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.interest_calculator = InterestCalculator(supabase_client)

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
        else:
            # Unsupported lookback period (Phase 1C, 1D)
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

            # Sum sales in rolling window
            rolling_total = 0
            rolling_count = 0

            for check_month in all_months:
                # Convert to datetime for comparison
                check_date = datetime(check_month[0], check_month[1], 1)
                window_end = datetime(current_month[0], current_month[1], 1)

                if window_start_date <= check_date <= window_end:
                    month_txns = transactions_by_month[check_month]
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
                    'state_code': state_code,
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
    # Helper Functions
    # ========================================================================

    def _find_threshold_crossing(
        self,
        transactions: List[Dict],
        threshold_config: Dict
    ) -> Dict:
        """
        Find exact transaction that crossed the threshold.

        Returns:
            - has_nexus: bool
            - nexus_date: datetime when crossed
            - threshold_transaction_id: ID of transaction that crossed
            - running_total: total sales when crossed
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
        taxable_sales = 0
        transaction_count = 0

        logger.info(f"[MARKETPLACE DEBUG] State {state_code}, Year {year}, MF Rule: {mf_rule}")

        for txn in transactions:
            # Parse as timezone-naive for consistent comparison
            txn_date_str = txn['transaction_date'].replace('Z', '').replace('+00:00', '')
            txn_date = datetime.fromisoformat(txn_date_str)
            amount = float(txn['sales_amount'])
            channel = txn.get('sales_channel', 'direct')

            # Count all transactions and sales
            total_sales += amount
            transaction_count += 1

            if channel == 'direct':
                direct_sales += amount
            else:
                marketplace_sales += amount

            # Determine if taxable
            if txn_date >= obligation_start_date:
                if channel == 'direct':
                    taxable_sales += amount
                elif channel == 'marketplace':
                    # Marketplace sales: exclude from liability by default (MF collects tax)
                    # Only include if explicitly configured to NOT exclude
                    if mf_rule and mf_rule.get('exclude_from_liability') == False:
                        logger.info(f"[MARKETPLACE DEBUG] Including marketplace sales ${amount} in taxable (exclude_from_liability=False)")
                        taxable_sales += amount
                    else:
                        logger.info(f"[MARKETPLACE DEBUG] Excluding marketplace sales ${amount} from taxable (mf_rule={mf_rule})")
                    # else: exclude marketplace sales (default behavior)

        # Calculate tax
        combined_rate = tax_rate_config.get('combined_rate', 0)
        base_tax = taxable_sales * combined_rate

        logger.info(f"[MARKETPLACE DEBUG] Final: total_sales=${total_sales}, direct=${direct_sales}, marketplace=${marketplace_sales}, taxable=${taxable_sales}, base_tax=${base_tax}")

        # Phase 2: Calculate interest and penalties
        interest = 0
        penalties = 0
        interest_rate = 0
        calculation_method = 'simple'
        days_outstanding = 0
        penalty_rate = 0

        if base_tax > 0 and state_code and year:
            # Calculate to end of the year being analyzed
            calculation_date = datetime(year, 12, 31)

            try:
                interest_result = self.interest_calculator.calculate_interest_and_penalties(
                    base_tax=base_tax,
                    obligation_start_date=obligation_start_date,
                    calculation_date=calculation_date,
                    state_code=state_code,
                    interest_penalty_config=interest_penalty_config
                )
                interest = interest_result.get('interest', 0)
                penalties = interest_result.get('penalties', 0)

                # Capture calculation metadata for transparency
                interest_rate = interest_result.get('interest_rate', 0)
                calculation_method = interest_result.get('calculation_method', 'simple')
                days_outstanding = interest_result.get('days_outstanding', 0)
                # Calculate penalty rate: penalties / base_tax (if base_tax > 0)
                penalty_rate = (penalties / base_tax) if base_tax > 0 else 0

                logger.debug(
                    f"{state_code} {year}: Base tax ${base_tax:,.2f}, "
                    f"Interest ${interest:,.2f}, Penalties ${penalties:,.2f}"
                )
            except Exception as e:
                logger.error(f"Error calculating interest/penalties for {state_code} {year}: {str(e)}")
                # Continue with zero interest/penalties on error

        estimated_liability = base_tax + interest + penalties

        return {
            'total_sales': total_sales,
            'direct_sales': direct_sales,
            'marketplace_sales': marketplace_sales,
            'taxable_sales': taxable_sales,
            'transaction_count': transaction_count,
            'estimated_liability': round(estimated_liability, 2),
            'base_tax': round(base_tax, 2),
            'interest': round(interest, 2),
            'penalties': round(penalties, 2),
            'approaching_threshold': False,  # TODO: Calculate
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
        """
        total_sales = sum(float(t['sales_amount']) for t in transactions)
        transaction_count = len(transactions)

        direct_sales = sum(
            float(t['sales_amount']) for t in transactions
            if t.get('sales_channel', 'direct') == 'direct'
        )
        marketplace_sales = total_sales - direct_sales

        return {
            'state': state_code,
            'year': year,
            'nexus_type': 'none',
            'nexus_date': None,
            'obligation_start_date': None,
            'first_nexus_year': None,
            'total_sales': total_sales,
            'direct_sales': direct_sales,
            'marketplace_sales': marketplace_sales,
            'taxable_sales': 0,
            'transaction_count': transaction_count,
            'estimated_liability': 0,
            'base_tax': 0,
            'interest': 0,
            'penalties': 0,
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
            'total_sales': 0,
            'direct_sales': 0,
            'marketplace_sales': 0,
            'taxable_sales': 0,
            'transaction_count': 0,
            'estimated_liability': 0,
            'base_tax': 0,
            'interest': 0,
            'penalties': 0,
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

    def _get_interest_penalty_config(self, state_code: str) -> Optional[Dict]:
        """
        Get current interest/penalty configuration for a state.

        Phase 2: Fetch from interest_penalty_rates table.
        """
        try:
            result = self.supabase.table('interest_penalty_rates') \
                .select('*') \
                .eq('state_code', state_code) \
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
                    'total_sales': result['total_sales'],
                    'direct_sales': result['direct_sales'],
                    'marketplace_sales': result['marketplace_sales'],
                    'taxable_sales': result.get('taxable_sales', result['total_sales']),
                    'transaction_count': result.get('transaction_count', 0),
                    'estimated_liability': result['estimated_liability'],
                    'base_tax': result['base_tax'],
                    'interest': result['interest'],
                    'penalties': result['penalties'],
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
