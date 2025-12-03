"""
Interest and Penalty Calculation Service - Phase 2

Implements state-specific interest and penalty calculations based on database rules.

Supports three interest calculation methods:
1. Simple interest (most common)
2. Compound monthly interest
3. Compound daily interest
"""

import logging
from typing import Dict, Optional
from decimal import Decimal
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)


class InterestCalculator:
    """
    Calculates interest and penalties for unpaid sales tax based on state rules.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def calculate_interest_and_penalties(
        self,
        base_tax: float,
        obligation_start_date: datetime,
        calculation_date: datetime,
        state_code: str,
        interest_penalty_config: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate interest and penalties for unpaid tax.

        Args:
            base_tax: Base tax liability amount
            obligation_start_date: When tax collection obligation began
            calculation_date: Date to calculate up to (usually today or end of analysis period)
            state_code: Two-letter state code
            interest_penalty_config: Pre-fetched config (optional, will fetch if not provided)

        Returns:
            Dictionary with:
            - interest: Calculated interest amount
            - penalties: Calculated penalty amount
            - interest_rate: Annual rate used
            - calculation_method: Method used
            - days_outstanding: Number of days
            - years_outstanding: Decimal years
        """
        if base_tax <= 0:
            return {
                'interest': 0,
                'penalties': 0,
                'interest_rate': 0,
                'calculation_method': 'none',
                'days_outstanding': 0,
                'years_outstanding': 0
            }

        # Get interest/penalty config if not provided
        if not interest_penalty_config:
            interest_penalty_config = self._get_interest_penalty_config(state_code)

        if not interest_penalty_config:
            logger.warning(f"No interest/penalty config for {state_code}, using defaults")
            interest_penalty_config = self._get_default_config()

        # Calculate time period
        days_outstanding = (calculation_date - obligation_start_date).days
        years_outstanding = days_outstanding / 365.25

        if days_outstanding <= 0:
            return {
                'interest': 0,
                'penalties': 0,
                'interest_rate': interest_penalty_config.get('annual_interest_rate', 0),
                'calculation_method': interest_penalty_config.get('interest_calculation_method', 'none'),
                'days_outstanding': 0,
                'years_outstanding': 0
            }

        # Calculate interest based on method
        annual_interest_rate = interest_penalty_config.get('annual_interest_rate', 0)
        calculation_method = interest_penalty_config.get('interest_calculation_method', 'simple')

        if calculation_method == 'simple':
            interest = self._calculate_simple_interest(
                principal=base_tax,
                annual_rate=annual_interest_rate,
                years=years_outstanding
            )
        elif calculation_method == 'compound_monthly':
            interest = self._calculate_compound_monthly_interest(
                principal=base_tax,
                annual_rate=annual_interest_rate,
                days=days_outstanding
            )
        elif calculation_method == 'compound_daily':
            interest = self._calculate_compound_daily_interest(
                principal=base_tax,
                annual_rate=annual_interest_rate,
                days=days_outstanding
            )
        else:
            logger.warning(f"Unknown calculation method: {calculation_method}, using simple")
            interest = self._calculate_simple_interest(
                principal=base_tax,
                annual_rate=annual_interest_rate,
                years=years_outstanding
            )

        # Calculate penalties
        penalties = self._calculate_penalties(
            base_tax=base_tax,
            interest=interest,
            config=interest_penalty_config
        )

        return {
            'interest': round(interest, 2),
            'penalties': round(penalties, 2),
            'interest_rate': annual_interest_rate,
            'calculation_method': calculation_method,
            'days_outstanding': days_outstanding,
            'years_outstanding': round(years_outstanding, 2)
        }

    # ========================================================================
    # Interest Calculation Methods
    # ========================================================================

    def _calculate_simple_interest(
        self,
        principal: float,
        annual_rate: float,
        years: float
    ) -> float:
        """
        Calculate simple interest.

        Formula: Interest = Principal × Rate × Time

        Example:
            Principal: $10,000
            Rate: 3% (0.03)
            Time: 2.5 years
            Interest = $10,000 × 0.03 × 2.5 = $750

        Most common method for sales tax.
        """
        interest = principal * annual_rate * years
        logger.debug(
            f"Simple interest: ${principal:,.2f} × {annual_rate:.4f} × {years:.2f}yr = ${interest:,.2f}"
        )
        return interest

    def _calculate_compound_monthly_interest(
        self,
        principal: float,
        annual_rate: float,
        days: int
    ) -> float:
        """
        Calculate compound monthly interest.

        Formula: Interest = Principal × [(1 + Rate/12)^months - 1]

        Example (Texas):
            Principal: $10,000
            Monthly rate: 1.5% (0.015)
            Months: 24
            Interest = $10,000 × [(1.015)^24 - 1] = $10,000 × 0.4295 = $4,295

        Used by Texas and a few other states.
        """
        months = days / 30.44  # Average days per month
        monthly_rate = annual_rate / 12

        # Compound formula: A = P(1 + r)^n, Interest = A - P
        compound_factor = (1 + monthly_rate) ** months
        interest = principal * (compound_factor - 1)

        logger.debug(
            f"Compound monthly: ${principal:,.2f} × [(1 + {monthly_rate:.4f})^{months:.1f} - 1] = ${interest:,.2f}"
        )
        return interest

    def _calculate_compound_daily_interest(
        self,
        principal: float,
        annual_rate: float,
        days: int
    ) -> float:
        """
        Calculate compound daily interest.

        Formula: Interest = Principal × [(1 + Rate/365)^days - 1]

        Example:
            Principal: $10,000
            Daily rate: 0.03 / 365 = 0.0000822
            Days: 730 (2 years)
            Interest = $10,000 × [(1.0000822)^730 - 1] = $10,000 × 0.0609 = $609

        Rare for sales tax (mainly New York and a few others).
        """
        daily_rate = annual_rate / 365

        # Compound formula: A = P(1 + r)^n, Interest = A - P
        compound_factor = (1 + daily_rate) ** days
        interest = principal * (compound_factor - 1)

        logger.debug(
            f"Compound daily: ${principal:,.2f} × [(1 + {daily_rate:.6f})^{days} - 1] = ${interest:,.2f}"
        )
        return interest

    # ========================================================================
    # Penalty Calculation
    # ========================================================================

    def _calculate_penalties(
        self,
        base_tax: float,
        interest: float,
        config: Dict
    ) -> float:
        """
        Calculate penalties based on state rules.

        Most states apply penalties to base tax only.
        Some states apply to tax + interest.

        Common penalty types:
        - Late registration: Flat % or fixed amount
        - Late filing: Per period or % of tax
        - Late payment: % of tax
        """
        # For Phase 2, use simplified penalty calculation
        # Most common: flat % of base tax (e.g., 10%)

        penalty_rate = config.get('late_registration_penalty_rate', 0)

        if not penalty_rate:
            return 0

        # Determine what penalties apply to
        penalty_applies_to = config.get('penalty_applies_to', 'tax')

        if penalty_applies_to == 'tax_plus_interest':
            penalty_base = base_tax + interest
        else:  # 'tax' (default)
            penalty_base = base_tax

        penalties = penalty_base * penalty_rate

        # Apply min/max if specified
        min_penalty = config.get('late_registration_penalty_min')
        max_penalty = config.get('late_registration_penalty_max')

        if min_penalty and penalties < min_penalty:
            penalties = min_penalty
            logger.debug(f"Applied minimum penalty: ${penalties:.2f}")

        if max_penalty and penalties > max_penalty:
            penalties = max_penalty
            logger.debug(f"Applied maximum penalty: ${penalties:.2f}")

        logger.debug(
            f"Penalties: ${penalty_base:,.2f} × {penalty_rate:.4f} = ${penalties:,.2f}"
        )

        return penalties

    # ========================================================================
    # Database Access
    # ========================================================================

    def _get_interest_penalty_config(self, state_code: str) -> Optional[Dict]:
        """
        Fetch interest/penalty config from database for a state.

        Returns current (effective_to IS NULL) config.
        """
        try:
            result = self.supabase.table('interest_penalty_rates') \
                .select('*') \
                .eq('state', state_code) \
                .is_('effective_to', 'null') \
                .limit(1) \
                .execute()

            if result.data:
                return result.data[0]

            logger.warning(f"No interest/penalty config found for {state_code}")
            return None

        except Exception as e:
            logger.error(f"Error fetching interest/penalty config for {state_code}: {str(e)}")
            return None

    def _get_default_config(self) -> Dict:
        """
        Return default interest/penalty config when state-specific not available.

        Uses conservative estimates:
        - 3% simple annual interest (common average)
        - 10% penalty (typical)
        """
        return {
            'annual_interest_rate': 0.03,
            'interest_calculation_method': 'simple',
            'late_registration_penalty_rate': 0.10,
            'penalty_applies_to': 'tax',
            'vda_penalties_waived': True,
            'vda_lookback_period_months': 48
        }

    # ========================================================================
    # VDA Scenarios
    # ========================================================================

    def calculate_vda_liability(
        self,
        base_tax: float,
        obligation_start_date: datetime,
        vda_filing_date: datetime,
        state_code: str,
        interest_penalty_config: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate liability for Voluntary Disclosure Agreement (VDA) scenario.

        Most states:
        - Waive penalties
        - Charge interest (sometimes reduced)
        - Limit lookback period (e.g., 3-4 years instead of unlimited)

        Args:
            base_tax: Base tax liability
            obligation_start_date: When obligation started
            vda_filing_date: When VDA is filed
            state_code: Two-letter state code
            interest_penalty_config: Pre-fetched config

        Returns:
            Dictionary with VDA-adjusted interest/penalties
        """
        if not interest_penalty_config:
            interest_penalty_config = self._get_interest_penalty_config(state_code)

        if not interest_penalty_config:
            interest_penalty_config = self._get_default_config()

        # Calculate normal interest/penalties
        normal_calc = self.calculate_interest_and_penalties(
            base_tax=base_tax,
            obligation_start_date=obligation_start_date,
            calculation_date=vda_filing_date,
            state_code=state_code,
            interest_penalty_config=interest_penalty_config
        )

        # Apply VDA waivers
        vda_interest_waived = interest_penalty_config.get('vda_interest_waived', False)
        vda_penalties_waived = interest_penalty_config.get('vda_penalties_waived', True)

        vda_interest = 0 if vda_interest_waived else normal_calc['interest']
        vda_penalties = 0 if vda_penalties_waived else normal_calc['penalties']

        # Check lookback period limit
        vda_lookback_months = interest_penalty_config.get('vda_lookback_period_months')
        if vda_lookback_months:
            earliest_vda_date = vda_filing_date - relativedelta(months=vda_lookback_months)
            if obligation_start_date < earliest_vda_date:
                # Truncate to VDA lookback period
                truncated_calc = self.calculate_interest_and_penalties(
                    base_tax=base_tax,
                    obligation_start_date=earliest_vda_date,
                    calculation_date=vda_filing_date,
                    state_code=state_code,
                    interest_penalty_config=interest_penalty_config
                )
                vda_interest = 0 if vda_interest_waived else truncated_calc['interest']
                logger.info(
                    f"VDA lookback limited to {vda_lookback_months} months "
                    f"(from {earliest_vda_date.date()} instead of {obligation_start_date.date()})"
                )

        return {
            'base_tax': base_tax,
            'interest': round(vda_interest, 2),
            'penalties': round(vda_penalties, 2),
            'total_liability': round(base_tax + vda_interest + vda_penalties, 2),
            'vda_interest_waived': vda_interest_waived,
            'vda_penalties_waived': vda_penalties_waived,
            'vda_lookback_months': vda_lookback_months,
            'calculation_method': normal_calc['calculation_method'],
            'days_outstanding': normal_calc['days_outstanding']
        }
