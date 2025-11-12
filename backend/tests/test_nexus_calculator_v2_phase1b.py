"""
Tests for Phase 1B Nexus Calculator V2 - Rolling 12-Month Lookback

Tests rolling 12-month window logic for 5 states:
- Illinois (IL)
- Texas (TX)
- Tennessee (TN)
- Minnesota (MN)
- Mississippi (MS)
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock
from app.services.nexus_calculator_v2 import NexusCalculatorV2


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    return Mock()


@pytest.fixture
def calculator(mock_supabase):
    """Create calculator instance with mocked supabase."""
    return NexusCalculatorV2(mock_supabase)


# ============================================================================
# Test Case 1: Illinois - Rolling 12-Month Basic Scenario
# ============================================================================

def test_illinois_rolling_12_month_basic(calculator):
    """
    Illinois rolling 12-month lookback - basic nexus establishment.

    Scenario:
    - $100K threshold
    - Monthly sales gradually build up over 4 months
    - Nexus established in April when rolling 12-month total exceeds $100K

    Timeline:
    Jan 2024: $20K → Rolling: $20K → No nexus
    Feb 2024: $25K → Rolling: $45K → No nexus
    Mar 2024: $30K → Rolling: $75K → No nexus
    Apr 2024: $35K → Rolling: $110K → NEXUS! (April 2024)
    May 2024: $10K → Rolling: $120K → Has nexus (sticky)

    Expected:
    - Nexus established: April 2024
    - Obligation starts: May 1, 2024
    - Liability: From May 1 forward
    """
    transactions = [
        # January 2024
        {'id': 'TX001', 'transaction_date': '2024-01-15T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        # February 2024
        {'id': 'TX002', 'transaction_date': '2024-02-10T00:00:00Z', 'sales_amount': 25000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        # March 2024
        {'id': 'TX003', 'transaction_date': '2024-03-08T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        # April 2024 - CROSSES THRESHOLD
        {'id': 'TX004', 'transaction_date': '2024-04-12T00:00:00Z', 'sales_amount': 35000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        # May 2024
        {'id': 'TX005', 'transaction_date': '2024-05-20T00:00:00Z', 'sales_amount': 10000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.0625,
        'avg_local_rate': 0.0267,
        'combined_rate': 0.0892
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='IL',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 1 result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify nexus established
    assert result['year'] == 2024
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] == '2024-04-12'  # First transaction in April
    assert result['obligation_start_date'] == '2024-05-01'  # Next month
    assert result['first_nexus_year'] == 2024

    # Verify sales totals
    assert result['total_sales'] == 120000
    assert result['direct_sales'] == 120000
    assert result['marketplace_sales'] == 0

    # Verify liability (only May sales after obligation start)
    assert result['taxable_sales'] == 10000  # Only May sales
    expected_liability = 10000 * 0.0892
    assert abs(result['estimated_liability'] - expected_liability) < 1


# ============================================================================
# Test Case 2: Texas - Rolling 12-Month with Marketplace Facilitator
# ============================================================================

def test_texas_rolling_12_month_with_marketplace(calculator):
    """
    Texas rolling 12-month lookback with marketplace sales counted.

    Texas counts marketplace sales toward $500K threshold.

    Scenario:
    - $500K threshold
    - Mix of direct and marketplace sales
    - Nexus established when rolling total exceeds $500K

    Timeline:
    Jan 2024: $100K direct + $50K marketplace = $150K → Rolling: $150K → No nexus
    Feb 2024: $120K direct + $60K marketplace = $180K → Rolling: $330K → No nexus
    Mar 2024: $90K direct + $40K marketplace = $130K → Rolling: $460K → No nexus
    Apr 2024: $80K direct + $30K marketplace = $110K → Rolling: $570K → NEXUS!

    Expected:
    - Nexus established: April 2024
    - Marketplace sales counted toward threshold
    - Liability: Only direct sales after obligation starts
    """
    transactions = [
        # January 2024
        {'id': 'TX101', 'transaction_date': '2024-01-10T00:00:00Z', 'sales_amount': 100000, 'sales_channel': 'direct', 'customer_state': 'TX'},
        {'id': 'TX102', 'transaction_date': '2024-01-20T00:00:00Z', 'sales_amount': 50000, 'sales_channel': 'marketplace', 'customer_state': 'TX'},
        # February 2024
        {'id': 'TX103', 'transaction_date': '2024-02-05T00:00:00Z', 'sales_amount': 120000, 'sales_channel': 'direct', 'customer_state': 'TX'},
        {'id': 'TX104', 'transaction_date': '2024-02-25T00:00:00Z', 'sales_amount': 60000, 'sales_channel': 'marketplace', 'customer_state': 'TX'},
        # March 2024
        {'id': 'TX105', 'transaction_date': '2024-03-08T00:00:00Z', 'sales_amount': 90000, 'sales_channel': 'direct', 'customer_state': 'TX'},
        {'id': 'TX106', 'transaction_date': '2024-03-18T00:00:00Z', 'sales_amount': 40000, 'sales_channel': 'marketplace', 'customer_state': 'TX'},
        # April 2024 - CROSSES THRESHOLD
        {'id': 'TX107', 'transaction_date': '2024-04-03T00:00:00Z', 'sales_amount': 80000, 'sales_channel': 'direct', 'customer_state': 'TX'},
        {'id': 'TX108', 'transaction_date': '2024-04-15T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'marketplace', 'customer_state': 'TX'},
        # May 2024 (after obligation starts)
        {'id': 'TX109', 'transaction_date': '2024-05-10T00:00:00Z', 'sales_amount': 50000, 'sales_channel': 'direct', 'customer_state': 'TX'},
    ]

    threshold_config = {
        'revenue_threshold': 500000,
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.0625,
        'avg_local_rate': 0.0195,
        'combined_rate': 0.0820
    }

    mf_rule = {
        'has_mf_law': True,
        'counted_toward_threshold': True,  # Texas counts marketplace toward threshold
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='TX',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 1 result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify nexus established
    assert result['year'] == 2024
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] == '2024-04-03'  # First transaction in April
    assert result['obligation_start_date'] == '2024-05-01'
    assert result['first_nexus_year'] == 2024

    # Verify sales totals
    assert result['total_sales'] == 620000
    assert result['direct_sales'] == 440000
    assert result['marketplace_sales'] == 180000

    # Verify liability (only direct sales from May forward)
    assert result['taxable_sales'] == 50000  # Only May direct sales
    expected_liability = 50000 * 0.0820
    assert abs(result['estimated_liability'] - expected_liability) < 1


# ============================================================================
# Test Case 3: Tennessee - Rolling 12-Month Multi-Year Sticky Nexus
# ============================================================================

def test_tennessee_rolling_multi_year_sticky(calculator):
    """
    Tennessee rolling 12-month lookback with multi-year sticky nexus.

    Scenario:
    - Nexus established in 2023
    - 2024 has lower sales but sticky nexus applies

    Expected:
    - 2023: Nexus established
    - 2024: Sticky nexus (full year obligation)
    """
    transactions = [
        # 2023 - Build up to nexus
        {'id': 'TN01', 'transaction_date': '2023-01-15T00:00:00Z', 'sales_amount': 25000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN02', 'transaction_date': '2023-02-10T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN03', 'transaction_date': '2023-03-05T00:00:00Z', 'sales_amount': 35000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN04', 'transaction_date': '2023-04-20T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'TN'},  # CROSSES $100K
        # Rest of 2023
        {'id': 'TN05', 'transaction_date': '2023-06-15T00:00:00Z', 'sales_amount': 15000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN06', 'transaction_date': '2023-09-10T00:00:00Z', 'sales_amount': 10000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        # 2024 - Below threshold but sticky nexus
        {'id': 'TN07', 'transaction_date': '2024-02-15T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN08', 'transaction_date': '2024-05-20T00:00:00Z', 'sales_amount': 25000, 'sales_channel': 'direct', 'customer_state': 'TN'},
        {'id': 'TN09', 'transaction_date': '2024-08-10T00:00:00Z', 'sales_amount': 15000, 'sales_channel': 'direct', 'customer_state': 'TN'},
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.07,
        'avg_local_rate': 0.0275,
        'combined_rate': 0.0975
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='TN',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 2 results (2023, 2024)
    assert len(results) == 2

    # Check 2023 - Nexus established
    result_2023 = next(r for r in results if r['year'] == 2023)
    assert result_2023['nexus_type'] == 'economic'
    assert result_2023['nexus_date'] == '2023-04-20'  # April transaction
    assert result_2023['obligation_start_date'] == '2023-05-01'
    assert result_2023['first_nexus_year'] == 2023
    assert result_2023['total_sales'] == 135000

    # Check 2024 - Sticky nexus
    result_2024 = next(r for r in results if r['year'] == 2024)
    assert result_2024['nexus_type'] == 'economic'
    assert result_2024['nexus_date'] == '2023-04-20'  # Same as 2023 (sticky)
    assert result_2024['obligation_start_date'] == '2024-01-01'  # Full year
    assert result_2024['first_nexus_year'] == 2023
    assert result_2024['total_sales'] == 60000
    # Full year liability for 2024
    expected_liability_2024 = 60000 * 0.0975
    assert abs(result_2024['estimated_liability'] - expected_liability_2024) < 1


# ============================================================================
# Test Case 4: Minnesota - Rolling 12-Month Just Under Threshold
# ============================================================================

def test_minnesota_rolling_just_under_threshold(calculator):
    """
    Minnesota rolling 12-month where sales stay just under threshold.

    Scenario:
    - $100K threshold
    - Monthly sales build up but never quite reach $100K in rolling window

    Expected:
    - No nexus established
    """
    transactions = [
        {'id': 'MN01', 'transaction_date': '2024-01-10T00:00:00Z', 'sales_amount': 15000, 'sales_channel': 'direct', 'customer_state': 'MN'},
        {'id': 'MN02', 'transaction_date': '2024-02-15T00:00:00Z', 'sales_amount': 18000, 'sales_channel': 'direct', 'customer_state': 'MN'},
        {'id': 'MN03', 'transaction_date': '2024-03-20T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'MN'},
        {'id': 'MN04', 'transaction_date': '2024-04-25T00:00:00Z', 'sales_amount': 22000, 'sales_channel': 'direct', 'customer_state': 'MN'},
        {'id': 'MN05', 'transaction_date': '2024-05-30T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'MN'},
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.0688,
        'avg_local_rate': 0.0055,
        'combined_rate': 0.0743
    }

    mf_rule = None

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='MN',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 1 result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify NO nexus (total is $95K, under $100K threshold)
    assert result['year'] == 2024
    assert result['nexus_type'] == 'none'
    assert result['estimated_liability'] == 0
    assert result['total_sales'] == 95000


# ============================================================================
# Test Case 5: Mississippi - Rolling 12-Month Exact Threshold
# ============================================================================

def test_mississippi_rolling_exact_threshold(calculator):
    """
    Mississippi rolling 12-month where sales hit exactly $250K threshold.

    Scenario:
    - $250K threshold
    - Rolling total hits exactly $250K

    Expected:
    - Nexus established when rolling total >= $250K
    """
    transactions = [
        {'id': 'MS01', 'transaction_date': '2024-01-05T00:00:00Z', 'sales_amount': 50000, 'sales_channel': 'direct', 'customer_state': 'MS'},
        {'id': 'MS02', 'transaction_date': '2024-02-10T00:00:00Z', 'sales_amount': 60000, 'sales_channel': 'direct', 'customer_state': 'MS'},
        {'id': 'MS03', 'transaction_date': '2024-03-15T00:00:00Z', 'sales_amount': 70000, 'sales_channel': 'direct', 'customer_state': 'MS'},
        {'id': 'MS04', 'transaction_date': '2024-04-20T00:00:00Z', 'sales_amount': 70000, 'sales_channel': 'direct', 'customer_state': 'MS'},  # Exactly $250K
        {'id': 'MS05', 'transaction_date': '2024-05-25T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'direct', 'customer_state': 'MS'},
    ]

    threshold_config = {
        'revenue_threshold': 250000,
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.07,
        'avg_local_rate': 0.0007,
        'combined_rate': 0.0707
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='MS',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 1 result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify nexus established (rolling total = $250K >= $250K threshold)
    assert result['year'] == 2024
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] == '2024-04-20'  # When it hit $250K
    assert result['obligation_start_date'] == '2024-05-01'
    assert result['first_nexus_year'] == 2024

    # Verify liability (May sales after obligation starts)
    assert result['total_sales'] == 280000
    assert result['taxable_sales'] == 30000
    expected_liability = 30000 * 0.0707
    assert abs(result['estimated_liability'] - expected_liability) < 1


# ============================================================================
# Test Case 6: Illinois - Rolling 12-Month Across Year Boundary
# ============================================================================

def test_illinois_rolling_across_year_boundary(calculator):
    """
    Illinois rolling 12-month where window spans across calendar years.

    Scenario:
    - Sales in late 2023
    - Nexus established in early 2024 when rolling window includes 2023 sales

    Expected:
    - Proper rolling window calculation across year boundary
    - Nexus detected correctly
    """
    transactions = [
        # Late 2023
        {'id': 'IL101', 'transaction_date': '2023-10-15T00:00:00Z', 'sales_amount': 30000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        {'id': 'IL102', 'transaction_date': '2023-11-20T00:00:00Z', 'sales_amount': 35000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        {'id': 'IL103', 'transaction_date': '2023-12-10T00:00:00Z', 'sales_amount': 25000, 'sales_channel': 'direct', 'customer_state': 'IL'},
        # Early 2024 - Crosses threshold when including 2023 sales
        {'id': 'IL104', 'transaction_date': '2024-01-05T00:00:00Z', 'sales_amount': 15000, 'sales_channel': 'direct', 'customer_state': 'IL'},  # Rolling: $105K
        {'id': 'IL105', 'transaction_date': '2024-02-10T00:00:00Z', 'sales_amount': 20000, 'sales_channel': 'direct', 'customer_state': 'IL'},
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or',
        'lookback_period': 'Rolling 12 Months'
    }

    tax_rate_config = {
        'state_rate': 0.0625,
        'avg_local_rate': 0.0267,
        'combined_rate': 0.0892
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='IL',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should have 2 results (2023, 2024)
    assert len(results) == 2

    # Check 2023 - No nexus yet
    result_2023 = next(r for r in results if r['year'] == 2023)
    assert result_2023['nexus_type'] == 'none'  # Only $90K in 2023
    assert result_2023['estimated_liability'] == 0

    # Check 2024 - Nexus established
    result_2024 = next(r for r in results if r['year'] == 2024)
    assert result_2024['nexus_type'] == 'economic'
    assert result_2024['nexus_date'] == '2024-01-05'  # Jan when rolling hits $105K
    assert result_2024['obligation_start_date'] == '2024-02-01'
    assert result_2024['first_nexus_year'] == 2024

    # Verify liability (only Feb sales after obligation starts)
    assert result_2024['taxable_sales'] == 20000
    expected_liability = 20000 * 0.0892
    assert abs(result_2024['estimated_liability'] - expected_liability) < 1
