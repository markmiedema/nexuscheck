"""
Tests for Phase 2 Interest Calculator

Tests all three interest calculation methods and penalty calculations.
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock
from app.services.interest_calculator import InterestCalculator


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    return Mock()


@pytest.fixture
def calculator(mock_supabase):
    """Create interest calculator instance with mocked supabase."""
    return InterestCalculator(mock_supabase)


# ============================================================================
# Test Case 1: Simple Interest Calculation (California-style)
# ============================================================================

def test_simple_interest_california(calculator):
    """
    Test simple interest calculation (most common method).

    California example:
    - Base tax: $10,000
    - Annual rate: 3% (0.03)
    - Time: 2 years
    - Expected interest: $10,000 × 0.03 × 2 = $600
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2022, 4, 1)
    calculation_date = datetime(2024, 3, 31)  # Exactly 2 years

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='CA',
        interest_penalty_config=config
    )

    # Verify interest (allowing for slight rounding due to days calculation)
    assert abs(result['interest'] - 600.00) < 1, f"Expected ~$600, got ${result['interest']}"
    assert result['calculation_method'] == 'simple'
    assert result['interest_rate'] == 0.03

    # Verify penalty (10% of base tax)
    assert result['penalties'] == 1000.00, f"Expected $1,000, got ${result['penalties']}"

    # Verify time calculations (approximately 2 years)
    assert 1.99 <= result['years_outstanding'] <= 2.01


# ============================================================================
# Test Case 2: Compound Monthly Interest (Texas-style)
# ============================================================================

def test_compound_monthly_interest_texas(calculator):
    """
    Test compound monthly interest calculation.

    Texas example:
    - Base tax: $10,000
    - Monthly rate: 1.5% (0.015)
    - Months: 24
    - Expected: $10,000 × [(1.015)^24 - 1] ≈ $4,295
    """
    config = {
        'annual_interest_rate': 0.18,  # 1.5% per month = 18% annual (0.015 × 12)
        'interest_calculation_method': 'compound_monthly',
        'late_registration_penalty_rate': 0.05,
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2022, 1, 1)
    calculation_date = datetime(2024, 1, 1)  # 24 months

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='TX',
        interest_penalty_config=config
    )

    # Verify compound monthly interest
    # Formula: 10000 * [(1.015)^24 - 1] = 10000 * 0.4295 = 4295
    expected_interest = 10000 * ((1.015 ** 24) - 1)
    assert abs(result['interest'] - expected_interest) < 10, \
        f"Expected ~${expected_interest:.2f}, got ${result['interest']}"

    assert result['calculation_method'] == 'compound_monthly'
    assert result['interest_rate'] == 0.18  # Annual rate (1.5% × 12)

    # Verify penalty (5% of base tax)
    assert result['penalties'] == 500.00


# ============================================================================
# Test Case 3: Compound Daily Interest (New York-style)
# ============================================================================

def test_compound_daily_interest_new_york(calculator):
    """
    Test compound daily interest calculation.

    New York example:
    - Base tax: $10,000
    - Annual rate: 3% (0.03)
    - Days: 730 (2 years)
    - Expected: $10,000 × [(1 + 0.03/365)^730 - 1] ≈ $609
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'compound_daily',
        'late_registration_penalty_rate': 0.10,
        'late_registration_penalty_min': 50.00,
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2022, 1, 1)
    calculation_date = datetime(2024, 1, 1)  # 730 days

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='NY',
        interest_penalty_config=config
    )

    # Verify compound daily interest
    daily_rate = 0.03 / 365
    expected_interest = 10000 * ((1 + daily_rate) ** 730 - 1)
    assert abs(result['interest'] - expected_interest) < 5, \
        f"Expected ~${expected_interest:.2f}, got ${result['interest']}"

    assert result['calculation_method'] == 'compound_daily'

    # Verify penalty with minimum
    assert result['penalties'] == 1000.00  # 10% of $10K > $50 min


# ============================================================================
# Test Case 4: Penalty Applies to Tax + Interest
# ============================================================================

def test_penalty_applies_to_tax_plus_interest(calculator):
    """
    Test penalty calculation when it applies to tax + interest.

    Some states apply penalties to the total of tax + interest.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'penalty_applies_to': 'tax_plus_interest'
    }

    obligation_start = datetime(2022, 1, 1)
    calculation_date = datetime(2024, 1, 1)  # 2 years

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='FL',
        interest_penalty_config=config
    )

    # Interest: $10,000 × 0.03 × ~2 years = ~$600
    # (731 days = 2.00274 years, so slightly more than $600)
    assert abs(result['interest'] - 600.00) < 5, \
        f"Expected ~$600, got ${result['interest']}"

    # Penalty: (Base tax + Interest) × 0.10
    expected_penalty = (10000 + result['interest']) * 0.10
    assert abs(result['penalties'] - expected_penalty) < 1, \
        f"Expected ~${expected_penalty:.2f}, got ${result['penalties']}"


# ============================================================================
# Test Case 5: Minimum Penalty
# ============================================================================

def test_minimum_penalty_applied(calculator):
    """
    Test that minimum penalty is applied when calculated penalty is too low.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'late_registration_penalty_min': 100.00,  # $100 minimum
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2023, 1, 1)
    calculation_date = datetime(2024, 1, 1)

    # Low base tax that would trigger minimum
    result = calculator.calculate_interest_and_penalties(
        base_tax=500,  # Would be $50 penalty, but minimum is $100
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='NY',
        interest_penalty_config=config
    )

    # Calculated penalty: $500 × 0.10 = $50
    # But minimum is $100, so should apply $100
    assert result['penalties'] == 100.00


# ============================================================================
# Test Case 6: Maximum Penalty
# ============================================================================

def test_maximum_penalty_applied(calculator):
    """
    Test that maximum penalty cap is applied when calculated penalty is too high.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'late_registration_penalty_max': 5000.00,  # $5,000 maximum
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2022, 1, 1)
    calculation_date = datetime(2024, 1, 1)

    # High base tax that would exceed maximum
    result = calculator.calculate_interest_and_penalties(
        base_tax=100000,  # Would be $10,000 penalty, but max is $5,000
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='IL',
        interest_penalty_config=config
    )

    # Calculated penalty: $100,000 × 0.10 = $10,000
    # But maximum is $5,000, so should cap at $5,000
    assert result['penalties'] == 5000.00


# ============================================================================
# Test Case 7: Zero Tax (No Interest/Penalties)
# ============================================================================

def test_zero_tax_no_interest_or_penalties(calculator):
    """
    Test that zero base tax results in zero interest and penalties.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10
    }

    obligation_start = datetime(2022, 1, 1)
    calculation_date = datetime(2024, 1, 1)

    result = calculator.calculate_interest_and_penalties(
        base_tax=0,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='CA',
        interest_penalty_config=config
    )

    assert result['interest'] == 0
    assert result['penalties'] == 0
    assert result['days_outstanding'] == 0


# ============================================================================
# Test Case 8: Same Day Calculation (No Time Elapsed)
# ============================================================================

def test_same_day_no_interest(calculator):
    """
    Test that no interest/penalties accrue on the same day.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10
    }

    same_date = datetime(2024, 1, 1)

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=same_date,
        calculation_date=same_date,
        state_code='CA',
        interest_penalty_config=config
    )

    assert result['interest'] == 0
    assert result['penalties'] == 0
    assert result['days_outstanding'] == 0


# ============================================================================
# Test Case 9: VDA Scenario - Penalties Waived
# ============================================================================

def test_vda_penalties_waived(calculator):
    """
    Test VDA scenario where penalties are waived but interest is charged.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'vda_interest_waived': False,
        'vda_penalties_waived': True,
        'vda_lookback_period_months': 48
    }

    obligation_start = datetime(2020, 1, 1)
    vda_filing_date = datetime(2024, 1, 1)

    result = calculator.calculate_vda_liability(
        base_tax=10000,
        obligation_start_date=obligation_start,
        vda_filing_date=vda_filing_date,
        state_code='CA',
        interest_penalty_config=config
    )

    # Interest should be calculated (4 years)
    expected_interest = 10000 * 0.03 * 4
    assert result['interest'] == expected_interest

    # Penalties should be waived
    assert result['penalties'] == 0
    assert result['vda_penalties_waived'] == True


# ============================================================================
# Test Case 10: VDA Scenario - Interest and Penalties Both Waived
# ============================================================================

def test_vda_interest_and_penalties_waived(calculator):
    """
    Test VDA scenario where both interest and penalties are waived.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'vda_interest_waived': True,
        'vda_penalties_waived': True,
        'vda_lookback_period_months': 36
    }

    obligation_start = datetime(2020, 1, 1)
    vda_filing_date = datetime(2024, 1, 1)

    result = calculator.calculate_vda_liability(
        base_tax=10000,
        obligation_start_date=obligation_start,
        vda_filing_date=vda_filing_date,
        state_code='TX',
        interest_penalty_config=config
    )

    # Both should be waived
    assert result['interest'] == 0
    assert result['penalties'] == 0
    assert result['vda_interest_waived'] == True
    assert result['vda_penalties_waived'] == True
    assert result['total_liability'] == 10000  # Only base tax


# ============================================================================
# Test Case 11: VDA Lookback Period Truncation
# ============================================================================

def test_vda_lookback_period_truncation(calculator):
    """
    Test that VDA lookback period limits how far back interest is calculated.

    Example: If obligation started 6 years ago, but VDA lookback is 4 years,
    interest should only be calculated for the most recent 4 years.
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'vda_interest_waived': False,
        'vda_penalties_waived': True,
        'vda_lookback_period_months': 48  # 4 years
    }

    # Obligation started 6 years ago
    obligation_start = datetime(2018, 1, 1)
    vda_filing_date = datetime(2024, 1, 1)

    result = calculator.calculate_vda_liability(
        base_tax=10000,
        obligation_start_date=obligation_start,
        vda_filing_date=vda_filing_date,
        state_code='CA',
        interest_penalty_config=config
    )

    # Interest should only be for 4 years (VDA lookback), not 6 years
    expected_interest = 10000 * 0.03 * 4  # $1,200
    assert result['interest'] == expected_interest, \
        f"Expected ${expected_interest} (4 years), got ${result['interest']}"


# ============================================================================
# Test Case 12: Partial Year Interest Calculation
# ============================================================================

def test_partial_year_interest(calculator):
    """
    Test interest calculation for partial years (e.g., 1.5 years).
    """
    config = {
        'annual_interest_rate': 0.03,
        'interest_calculation_method': 'simple',
        'late_registration_penalty_rate': 0.10,
        'penalty_applies_to': 'tax'
    }

    obligation_start = datetime(2023, 1, 1)
    calculation_date = datetime(2024, 7, 1)  # 1.5 years

    result = calculator.calculate_interest_and_penalties(
        base_tax=10000,
        obligation_start_date=obligation_start,
        calculation_date=calculation_date,
        state_code='CA',
        interest_penalty_config=config
    )

    # Interest: $10,000 × 0.03 × 1.5 = $450
    expected_interest = 10000 * 0.03 * 1.5
    assert abs(result['interest'] - expected_interest) < 5, \
        f"Expected ~${expected_interest}, got ${result['interest']}"

    # Verify years_outstanding is approximately 1.5
    assert 1.4 <= result['years_outstanding'] <= 1.6
