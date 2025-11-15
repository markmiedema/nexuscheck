"""
Simple Interest and Penalty Calculator for v1 Estimates

This is a simplified version for estimation purposes.
For v2 VDA filing, use the full interest_calculator.py with state-specific rules.

Professional standard: Use simple interest and standardized penalties for estimates.
"""
from decimal import Decimal
from datetime import date
from typing import Dict


class SimpleInterestCalculator:
    """
    Simplified interest and penalty calculator for estimation purposes.

    Uses industry-standard estimation methods:
    - Simple interest (not compound)
    - Standard penalty percentages
    - Easy to explain to clients
    """

    # Standard penalty rates (industry averages for estimates)
    LATE_REGISTRATION_RATE = Decimal('0.10')  # 10% of tax
    LATE_REGISTRATION_CAP = Decimal('500.00')  # Often capped at $500
    LATE_FILING_RATE = Decimal('0.10')  # 10% (assumes ~2 months late at 5%/month)
    LATE_PAYMENT_RATE = Decimal('0.05')  # 5% (assumes ~10 months late at 0.5%/month)

    def calculate_simple_interest(
        self,
        principal: Decimal,
        annual_rate: Decimal,
        start_date: date,
        end_date: date
    ) -> Decimal:
        """
        Calculate simple interest.

        Formula: Interest = Principal × Annual Rate × (Days / 365)

        Args:
            principal: Base tax amount owed
            annual_rate: Annual interest rate (e.g., 0.06 for 6%)
            start_date: Date tax obligation began
            end_date: Date interest calculated through (usually today)

        Returns:
            Interest amount
        """
        if principal <= 0:
            return Decimal('0.00')

        if start_date >= end_date:
            return Decimal('0.00')

        days_outstanding = (end_date - start_date).days

        # Simple interest formula
        interest = principal * annual_rate * (Decimal(days_outstanding) / Decimal('365'))

        return interest.quantize(Decimal('0.01'))

    def calculate_standard_penalties(
        self,
        base_tax: Decimal,
        include_registration: bool = True,
        include_filing: bool = True,
        include_payment: bool = True
    ) -> Dict[str, Decimal]:
        """
        Calculate standard penalty estimates.

        Uses industry-standard percentages for estimation:
        - Late registration: 10% of tax (capped at $500)
        - Late filing: 10% of tax (assumes 2 months × 5%)
        - Late payment: 5% of tax (assumes 10 months × 0.5%)

        Args:
            base_tax: Tax amount owed
            include_registration: Include late registration penalty
            include_filing: Include late filing penalty
            include_payment: Include late payment penalty

        Returns:
            Dictionary with penalty breakdowns
        """
        penalties = {
            'late_registration': Decimal('0.00'),
            'late_filing': Decimal('0.00'),
            'late_payment': Decimal('0.00'),
            'total_penalties': Decimal('0.00')
        }

        if base_tax <= 0:
            return penalties

        # Late registration penalty (one-time)
        if include_registration:
            late_reg = base_tax * self.LATE_REGISTRATION_RATE
            penalties['late_registration'] = min(late_reg, self.LATE_REGISTRATION_CAP)

        # Late filing penalty (per return)
        if include_filing:
            penalties['late_filing'] = base_tax * self.LATE_FILING_RATE

        # Late payment penalty (ongoing)
        if include_payment:
            penalties['late_payment'] = base_tax * self.LATE_PAYMENT_RATE

        # Total
        penalties['total_penalties'] = (
            penalties['late_registration'] +
            penalties['late_filing'] +
            penalties['late_payment']
        )

        return penalties

    def calculate_full_liability(
        self,
        base_tax: Decimal,
        annual_interest_rate: Decimal,
        obligation_start_date: date,
        calculation_date: date = None
    ) -> Dict[str, Decimal]:
        """
        Calculate complete liability estimate: tax + interest + penalties.

        Args:
            base_tax: Tax amount owed
            annual_interest_rate: State's annual interest rate
            obligation_start_date: When tax obligation began
            calculation_date: Date to calculate through (default: today)

        Returns:
            Dictionary with complete breakdown
        """
        if calculation_date is None:
            calculation_date = date.today()

        # Calculate interest
        interest = self.calculate_simple_interest(
            principal=base_tax,
            annual_rate=annual_interest_rate,
            start_date=obligation_start_date,
            end_date=calculation_date
        )

        # Calculate penalties
        penalties = self.calculate_standard_penalties(base_tax)

        # Calculate days outstanding (for reporting)
        days_outstanding = (calculation_date - obligation_start_date).days

        return {
            'base_tax': base_tax.quantize(Decimal('0.01')),
            'interest': interest,
            'interest_rate': annual_interest_rate,
            'interest_method': 'simple',
            'days_outstanding': days_outstanding,
            'late_registration_penalty': penalties['late_registration'],
            'late_filing_penalty': penalties['late_filing'],
            'late_payment_penalty': penalties['late_payment'],
            'total_penalties': penalties['total_penalties'],
            'estimated_total_liability': (
                base_tax + interest + penalties['total_penalties']
            ).quantize(Decimal('0.01'))
        }


# Example usage
if __name__ == '__main__':
    calculator = SimpleInterestCalculator()

    # Example: $10,000 tax due, 6% interest, 180 days outstanding
    result = calculator.calculate_full_liability(
        base_tax=Decimal('10000.00'),
        annual_interest_rate=Decimal('0.06'),
        obligation_start_date=date(2024, 6, 1),
        calculation_date=date(2024, 12, 1)
    )

    print("Liability Estimate:")
    print(f"  Base Tax:              ${result['base_tax']:>10,.2f}")
    print(f"  Interest (6%, 183 days): ${result['interest']:>10,.2f}")
    print(f"  Late Registration:     ${result['late_registration_penalty']:>10,.2f}")
    print(f"  Late Filing:           ${result['late_filing_penalty']:>10,.2f}")
    print(f"  Late Payment:          ${result['late_payment_penalty']:>10,.2f}")
    print(f"  {'─' * 40}")
    print(f"  Estimated Total:       ${result['estimated_total_liability']:>10,.2f}")
    print()
    print("  * Estimates only. Actual amounts may vary.")
    print("  * Penalties may be reduced through VDA.")
