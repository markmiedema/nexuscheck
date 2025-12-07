"""
Penalty and Interest Calculation Service - V2

Comprehensive calculator that handles all state-specific penalty and interest rules
based on the new JSON configuration schema.

Supports:
- Simple, compound monthly, and compound daily interest
- Split-year interest rates (CA, MI, TN, WV)
- Monthly rate specifications (CT, MS, SD)
- Flat percentage penalties with min/max
- Flat fee penalties (TX, WI)
- Per-period penalties with caps (AZ, AR, KY)
- Per-day penalties (RI)
- Tiered penalties by days (WA, IL, TX)
- Base + per-period penalties (NY, CO)
- Combined penalty caps (GA, MS)
- Escalating minimums (NY)
"""

import logging
from typing import Dict, Optional, List, Any
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)


class PenaltyInterestCalculator:
    """
    Calculates interest and penalties based on the new comprehensive config schema.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    # ========================================================================
    # Main Calculation Entry Point
    # ========================================================================

    def calculate(
        self,
        base_tax: float,
        obligation_start_date: date,
        calculation_date: date,
        state_code: str,
        config: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate interest and penalties for unpaid tax.

        Args:
            base_tax: Base tax liability amount
            obligation_start_date: When tax collection obligation began
            calculation_date: Date to calculate up to
            state_code: Two-letter state code
            config: Pre-fetched config (optional, will fetch if not provided)

        Returns:
            Dictionary with detailed breakdown of interest and penalties
        """
        if base_tax <= 0:
            return self._empty_result()

        # Get config if not provided
        if not config:
            config = self._get_config(state_code, calculation_date)

        if not config:
            logger.warning(f"No penalty/interest config for {state_code}, using defaults")
            config = self._get_default_config()

        # Calculate time periods
        days_outstanding = (calculation_date - obligation_start_date).days
        if days_outstanding <= 0:
            return self._empty_result()

        months_outstanding = days_outstanding / 30.44  # Average days per month
        years_outstanding = days_outstanding / 365.25

        # Calculate interest
        interest_config = config.get('interest', {})
        interest = self._calculate_interest(
            principal=Decimal(str(base_tax)),
            config=interest_config,
            obligation_date=obligation_start_date,
            calculation_date=calculation_date,
            days=days_outstanding,
            years=years_outstanding
        )

        # Calculate penalties
        penalty_breakdown = self._calculate_all_penalties(
            base_tax=Decimal(str(base_tax)),
            interest=interest,
            config=config,
            days_late=days_outstanding,
            months_late=int(months_outstanding)
        )

        # Get effective annual rate for display
        effective_rate = self._get_effective_annual_rate(interest_config, calculation_date)

        return {
            'interest': float(interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            'penalties': {
                'late_filing': float(penalty_breakdown.get('late_filing', 0)),
                'late_payment': float(penalty_breakdown.get('late_payment', 0)),
                'negligence': float(penalty_breakdown.get('negligence', 0)) if penalty_breakdown.get('negligence') else None,
                'e_filing_failure': float(penalty_breakdown.get('e_filing_failure', 0)) if penalty_breakdown.get('e_filing_failure') else None,
                'fraud': float(penalty_breakdown.get('fraud', 0)) if penalty_breakdown.get('fraud') else None,
                'operating_without_permit': float(penalty_breakdown.get('operating_without_permit', 0)) if penalty_breakdown.get('operating_without_permit') else None,
                'late_registration': float(penalty_breakdown.get('late_registration', 0)) if penalty_breakdown.get('late_registration') else None,
                'unregistered_business': float(penalty_breakdown.get('unregistered_business', 0)) if penalty_breakdown.get('unregistered_business') else None,
                'cost_of_collection': float(penalty_breakdown.get('cost_of_collection', 0)) if penalty_breakdown.get('cost_of_collection') else None,
                'extended_delinquency': float(penalty_breakdown.get('extended_delinquency', 0)) if penalty_breakdown.get('extended_delinquency') else None,
                'total': float(penalty_breakdown.get('total', 0))
            },
            'total_penalties': float(penalty_breakdown.get('total', 0)),
            'total_liability': float(
                Decimal(str(base_tax)) + interest + penalty_breakdown.get('total', Decimal('0'))
            ),
            'interest_rate': effective_rate,
            'interest_method': interest_config.get('method', 'simple'),
            'days_outstanding': days_outstanding,
            'years_outstanding': round(years_outstanding, 2),
            'state': state_code
        }

    # ========================================================================
    # Interest Calculation
    # ========================================================================

    def _calculate_interest(
        self,
        principal: Decimal,
        config: Dict,
        obligation_date: date,
        calculation_date: date,
        days: int,
        years: float
    ) -> Decimal:
        """Calculate interest based on config."""

        method = config.get('method', 'simple')

        # Handle split-year rates
        if config.get('periods'):
            return self._calculate_split_year_interest(
                principal, config['periods'], method, obligation_date, calculation_date
            )

        # Get annual rate (convert from monthly if needed)
        annual_rate = self._get_effective_annual_rate(config, calculation_date)
        if annual_rate is None or annual_rate == 0:
            return Decimal('0')

        # Calculate based on method
        if method == 'simple':
            interest = self._simple_interest(principal, Decimal(str(annual_rate)), Decimal(str(years)))
        elif method == 'compound_monthly':
            interest = self._compound_monthly_interest(principal, Decimal(str(annual_rate)), days)
        elif method == 'compound_daily':
            interest = self._compound_daily_interest(principal, Decimal(str(annual_rate)), days)
        else:
            logger.warning(f"Unknown interest method: {method}, using simple")
            interest = self._simple_interest(principal, Decimal(str(annual_rate)), Decimal(str(years)))

        # Apply minimum if specified
        min_amount = config.get('minimum_amount')
        if min_amount and interest < Decimal(str(min_amount)):
            interest = Decimal(str(min_amount))

        return interest

    def _calculate_split_year_interest(
        self,
        principal: Decimal,
        periods: List[Dict],
        method: str,
        obligation_date: date,
        calculation_date: date
    ) -> Decimal:
        """Calculate interest across multiple rate periods."""
        total_interest = Decimal('0')

        for period in periods:
            period_start = datetime.strptime(period['start_date'], '%Y-%m-%d').date()
            period_end = datetime.strptime(period['end_date'], '%Y-%m-%d').date()

            # Find overlap with our calculation period
            overlap_start = max(obligation_date, period_start)
            overlap_end = min(calculation_date, period_end)

            if overlap_start >= overlap_end:
                continue  # No overlap

            days_in_period = (overlap_end - overlap_start).days
            years_in_period = days_in_period / 365.25

            # Get rate for this period
            if period.get('annual_rate') is not None:
                annual_rate = Decimal(str(period['annual_rate']))
            elif period.get('monthly_rate') is not None:
                annual_rate = Decimal(str(period['monthly_rate'])) * 12
            else:
                continue

            # Calculate interest for this period
            if method == 'simple':
                period_interest = self._simple_interest(principal, annual_rate, Decimal(str(years_in_period)))
            elif method == 'compound_monthly':
                period_interest = self._compound_monthly_interest(principal, annual_rate, days_in_period)
            elif method == 'compound_daily':
                period_interest = self._compound_daily_interest(principal, annual_rate, days_in_period)
            else:
                period_interest = self._simple_interest(principal, annual_rate, Decimal(str(years_in_period)))

            total_interest += period_interest

        return total_interest

    def _simple_interest(self, principal: Decimal, annual_rate: Decimal, years: Decimal) -> Decimal:
        """Simple interest: P × R × T"""
        return principal * annual_rate * years

    def _compound_monthly_interest(self, principal: Decimal, annual_rate: Decimal, days: int) -> Decimal:
        """Compound monthly: P × [(1 + R/12)^months - 1]"""
        months = Decimal(str(days)) / Decimal('30.44')
        monthly_rate = annual_rate / 12
        compound_factor = (1 + monthly_rate) ** months
        return principal * (compound_factor - 1)

    def _compound_daily_interest(self, principal: Decimal, annual_rate: Decimal, days: int) -> Decimal:
        """Compound daily: P × [(1 + R/365)^days - 1]"""
        daily_rate = annual_rate / 365
        compound_factor = (1 + daily_rate) ** days
        return principal * (compound_factor - 1)

    def _get_effective_annual_rate(self, config: Dict, as_of_date: date) -> Optional[float]:
        """Get the effective annual rate from config."""
        # Check for periods first
        if config.get('periods'):
            for period in config['periods']:
                period_start = datetime.strptime(period['start_date'], '%Y-%m-%d').date()
                period_end = datetime.strptime(period['end_date'], '%Y-%m-%d').date()
                if period_start <= as_of_date <= period_end:
                    if period.get('annual_rate') is not None:
                        return period['annual_rate']
                    elif period.get('monthly_rate') is not None:
                        return period['monthly_rate'] * 12
            # If no matching period, use first period's rate
            if config['periods']:
                first = config['periods'][0]
                if first.get('annual_rate') is not None:
                    return first['annual_rate']
                elif first.get('monthly_rate') is not None:
                    return first['monthly_rate'] * 12

        # Direct rate
        if config.get('annual_rate') is not None:
            return config['annual_rate']
        elif config.get('monthly_rate') is not None:
            return config['monthly_rate'] * 12

        return None

    # ========================================================================
    # Penalty Calculation
    # ========================================================================

    def _calculate_all_penalties(
        self,
        base_tax: Decimal,
        interest: Decimal,
        config: Dict,
        days_late: int,
        months_late: int
    ) -> Dict[str, Decimal]:
        """Calculate all applicable penalties."""

        # Determine penalty base
        penalty_options = config.get('penalty_options', {})
        penalty_base_type = penalty_options.get('penalty_base', 'tax_only')
        if penalty_base_type == 'tax_plus_interest':
            penalty_base = base_tax + interest
        else:
            penalty_base = base_tax

        result = {}
        total = Decimal('0')

        # Core penalties
        penalty_types = [
            ('late_filing', 'late_filing'),
            ('late_payment', 'late_payment'),
            ('negligence', 'negligence'),
            ('e_filing_failure', 'e_filing_failure'),
            ('fraud', 'fraud'),
            ('operating_without_permit', 'operating_without_permit'),
            ('late_registration', 'late_registration'),
            ('unregistered_business', 'unregistered_business'),
            ('cost_of_collection', 'cost_of_collection'),
            ('extended_delinquency', 'extended_delinquency'),
        ]

        for config_key, result_key in penalty_types:
            penalty_rule = config.get(config_key)
            if penalty_rule:
                penalty = self._calculate_penalty(penalty_rule, penalty_base, days_late, months_late)
                result[result_key] = penalty
                total += penalty

        # Apply combined rules if present
        combined_rules = config.get('combined_rules')
        if combined_rules:
            total = self._apply_combined_rules(result, combined_rules, penalty_base, total)

        result['total'] = total
        return result

    def _calculate_penalty(
        self,
        rule: Dict,
        penalty_base: Decimal,
        days_late: int,
        months_late: int
    ) -> Decimal:
        """Calculate a single penalty based on its rule type."""

        penalty_type = rule.get('type')

        if penalty_type == 'flat':
            return self._calc_flat_penalty(rule, penalty_base, days_late)
        elif penalty_type == 'flat_fee':
            return self._calc_flat_fee_penalty(rule)
        elif penalty_type == 'per_period':
            return self._calc_per_period_penalty(rule, penalty_base, days_late, months_late)
        elif penalty_type == 'per_day':
            return self._calc_per_day_penalty(rule, days_late)
        elif penalty_type == 'tiered':
            return self._calc_tiered_penalty(rule, penalty_base, days_late)
        elif penalty_type == 'base_plus_per_period':
            return self._calc_base_plus_per_period_penalty(rule, penalty_base, days_late, months_late)
        else:
            logger.warning(f"Unknown penalty type: {penalty_type}")
            return Decimal('0')

    def _calc_flat_penalty(self, rule: Dict, penalty_base: Decimal, days_late: int) -> Decimal:
        """Calculate flat percentage penalty."""
        rate = Decimal(str(rule.get('rate', 0)))
        penalty = penalty_base * rate

        # Handle max rate cap
        max_rate = rule.get('max_rate')
        if max_rate:
            max_penalty = penalty_base * Decimal(str(max_rate))
            penalty = min(penalty, max_penalty)

        # Handle minimum amount
        min_amount = rule.get('minimum_amount')
        use_greater = rule.get('use_greater_of', False)
        if min_amount:
            min_penalty = Decimal(str(min_amount))
            if use_greater:
                penalty = max(penalty, min_penalty)
            else:
                penalty = max(penalty, min_penalty)

        # Handle additional after X days
        additional = rule.get('additional_after_days')
        if additional:
            if days_late > additional['days']:
                additional_rate = Decimal(str(additional['additional_rate']))
                penalty += penalty_base * additional_rate

        return penalty

    def _calc_flat_fee_penalty(self, rule: Dict) -> Decimal:
        """Calculate flat fee penalty (e.g., TX $50)."""
        return Decimal(str(rule.get('amount', 0)))

    def _calc_per_period_penalty(
        self,
        rule: Dict,
        penalty_base: Decimal,
        days_late: int,
        months_late: int
    ) -> Decimal:
        """Calculate per-period penalty (month or 30 days)."""
        rate_per_period = Decimal(str(rule.get('rate_per_period', 0)))
        period_type = rule.get('period_type', 'month')

        # Calculate periods
        if period_type == '30_days':
            periods = days_late // 30
        else:  # month
            periods = months_late

        periods = max(1, periods)  # At least 1 period if late

        # Calculate penalty
        total_rate = rate_per_period * periods

        # Apply max rate cap
        max_rate = rule.get('max_rate')
        if max_rate:
            total_rate = min(total_rate, Decimal(str(max_rate)))

        penalty = penalty_base * total_rate

        # Handle minimum amount
        min_amount = rule.get('minimum_amount')
        use_greater = rule.get('use_greater_of', False)
        if min_amount:
            min_penalty = Decimal(str(min_amount))
            if use_greater:
                penalty = max(penalty, min_penalty)
            else:
                penalty = max(penalty, min_penalty)

        # Add flat fee if present
        additional_fee = rule.get('additional_flat_fee')
        if additional_fee:
            penalty += Decimal(str(additional_fee))

        return penalty

    def _calc_per_day_penalty(self, rule: Dict, days_late: int) -> Decimal:
        """Calculate per-day penalty (e.g., RI $10/day)."""
        amount_per_day = Decimal(str(rule.get('amount_per_day', 0)))
        max_amount = Decimal(str(rule.get('max_amount', float('inf'))))

        penalty = amount_per_day * days_late
        return min(penalty, max_amount)

    def _calc_tiered_penalty(self, rule: Dict, penalty_base: Decimal, days_late: int) -> Decimal:
        """Calculate tiered penalty based on days late."""
        tiers = rule.get('tiers', [])

        for tier in tiers:
            start_day = tier.get('start_day', 0)
            end_day = tier.get('end_day')  # None means infinity

            if start_day <= days_late:
                if end_day is None or days_late <= end_day:
                    rate = Decimal(str(tier.get('rate', 0)))
                    return penalty_base * rate

        return Decimal('0')

    def _calc_base_plus_per_period_penalty(
        self,
        rule: Dict,
        penalty_base: Decimal,
        days_late: int,
        months_late: int
    ) -> Decimal:
        """Calculate base + per-period penalty (NY style)."""
        base_rate = Decimal(str(rule.get('base_rate', 0)))
        rate_per_period = Decimal(str(rule.get('rate_per_period', 0)))
        period_type = rule.get('period_type', 'month')

        # Calculate periods
        if period_type == '30_days':
            periods = days_late // 30
        else:
            periods = months_late

        periods = max(0, periods)

        # Calculate total rate
        total_rate = base_rate + (rate_per_period * periods)

        # Apply max rate cap
        max_rate = rule.get('max_rate')
        if max_rate:
            total_rate = min(total_rate, Decimal(str(max_rate)))

        penalty = penalty_base * total_rate

        # Determine applicable minimum
        min_amount = Decimal(str(rule.get('minimum_amount', 0)))

        # Check escalating minimums
        escalating = rule.get('escalating_minimums', [])
        for esc in escalating:
            if days_late > esc['after_days']:
                min_amount = max(min_amount, Decimal(str(esc['minimum_amount'])))

        # Apply minimum
        penalty = max(penalty, min_amount)

        return penalty

    def _apply_combined_rules(
        self,
        penalties: Dict[str, Decimal],
        combined_rules: Dict,
        penalty_base: Decimal,
        current_total: Decimal
    ) -> Decimal:
        """Apply combined penalty caps (GA, MS style)."""
        max_combined_rate = Decimal(str(combined_rules.get('max_combined_rate', 1)))
        applies_to = combined_rules.get('applies_to', [])

        # Calculate combined total for affected penalties
        combined_penalties = sum(
            penalties.get(key, Decimal('0'))
            for key in applies_to
        )

        max_combined = penalty_base * max_combined_rate

        if combined_penalties > max_combined:
            # Need to reduce penalties proportionally
            reduction = combined_penalties - max_combined

            # Reduce each affected penalty proportionally
            for key in applies_to:
                if penalties.get(key, Decimal('0')) > 0:
                    proportion = penalties[key] / combined_penalties
                    penalties[key] -= reduction * proportion

            # Recalculate total
            return sum(v for k, v in penalties.items() if k != 'total')

        return current_total

    # ========================================================================
    # Database Access
    # ========================================================================

    def _get_config(self, state_code: str, as_of_date: date) -> Optional[Dict]:
        """Fetch penalty/interest config from database."""
        try:
            result = self.supabase.table('state_penalty_interest_configs') \
                .select('config') \
                .eq('state', state_code) \
                .lte('effective_date', as_of_date.isoformat()) \
                .order('effective_date', desc=True) \
                .limit(1) \
                .execute()

            if result.data:
                return result.data[0]['config']

            logger.warning(f"No penalty/interest config found for {state_code}")
            return None

        except Exception as e:
            logger.error(f"Error fetching config for {state_code}: {str(e)}")
            return None

    def _get_default_config(self) -> Dict:
        """Return default config when state-specific not available."""
        return {
            'interest': {
                'annual_rate': 0.07,
                'method': 'simple'
            },
            'late_filing': {
                'type': 'flat',
                'rate': 0.10
            },
            'late_payment': {
                'type': 'flat',
                'rate': 0.10
            }
        }

    def _empty_result(self) -> Dict:
        """Return empty result for zero tax or invalid dates."""
        return {
            'interest': 0,
            'penalties': {
                'late_filing': 0,
                'late_payment': 0,
                'negligence': None,
                'e_filing_failure': None,
                'fraud': None,
                'operating_without_permit': None,
                'late_registration': None,
                'unregistered_business': None,
                'cost_of_collection': None,
                'extended_delinquency': None,
                'total': 0
            },
            'total_penalties': 0,
            'total_liability': 0,
            'interest_rate': 0,
            'interest_method': 'none',
            'days_outstanding': 0,
            'years_outstanding': 0,
            'state': ''
        }

    # ========================================================================
    # VDA Calculations
    # ========================================================================

    def calculate_vda_liability(
        self,
        base_tax: float,
        obligation_start_date: date,
        vda_filing_date: date,
        state_code: str,
        vda_interest_waived: bool = False,
        vda_penalties_waived: bool = True,
        vda_lookback_months: Optional[int] = None
    ) -> Dict:
        """
        Calculate liability for Voluntary Disclosure Agreement (VDA) scenario.

        Most states:
        - Waive penalties
        - Charge interest (sometimes reduced)
        - Limit lookback period (e.g., 3-4 years)
        """
        # Apply lookback period limit if specified
        effective_start = obligation_start_date
        if vda_lookback_months:
            earliest_date = vda_filing_date - relativedelta(months=vda_lookback_months)
            if obligation_start_date < earliest_date:
                effective_start = earliest_date
                logger.info(
                    f"VDA lookback limited to {vda_lookback_months} months "
                    f"(from {earliest_date} instead of {obligation_start_date})"
                )

        # Calculate normal liability
        result = self.calculate(
            base_tax=base_tax,
            obligation_start_date=effective_start,
            calculation_date=vda_filing_date,
            state_code=state_code
        )

        # Apply VDA waivers
        vda_interest = 0 if vda_interest_waived else result['interest']
        vda_penalties = 0 if vda_penalties_waived else result['total_penalties']

        return {
            'base_tax': base_tax,
            'interest': vda_interest,
            'penalties': vda_penalties,
            'total_liability': base_tax + vda_interest + vda_penalties,
            'vda_interest_waived': vda_interest_waived,
            'vda_penalties_waived': vda_penalties_waived,
            'vda_lookback_months': vda_lookback_months,
            'effective_start_date': effective_start.isoformat() if effective_start else None,
            'original_start_date': obligation_start_date.isoformat() if obligation_start_date else None,
            'interest_method': result['interest_method'],
            'days_outstanding': result['days_outstanding']
        }
