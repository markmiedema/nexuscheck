"""
Tests for Phase 1A Nexus Calculator V2

Tests chronological processing, multi-year tracking, and calendar year lookback.
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
# Test Case 1: Illinois - Nexus Without Liability
# ============================================================================

def test_illinois_nexus_without_liability(calculator):
    """
    Illinois example: Nexus established but no liability.

    Scenario:
    - Jan 28: $38K direct
    - Apr 12: $42.5K marketplace
    - Jul 3: $35.7K direct (CROSSES $100K threshold)
    - Oct 15: $35K marketplace

    Expected:
    - Nexus established: July 3, 2024
    - Obligation starts: August 1, 2024
    - Liability: $0 (no direct sales after Aug 1)
    """
    transactions = [
        {
            'id': 'TX088',
            'transaction_date': '2024-01-28T00:00:00Z',
            'sales_amount': 38000,
            'sales_channel': 'direct',
            'customer_state': 'IL'
        },
        {
            'id': 'TX089',
            'transaction_date': '2024-04-12T00:00:00Z',
            'sales_amount': 42500,
            'sales_channel': 'marketplace',
            'customer_state': 'IL'
        },
        {
            'id': 'TX010',
            'transaction_date': '2024-07-03T00:00:00Z',
            'sales_amount': 35700,
            'sales_channel': 'direct',
            'customer_state': 'IL'
        },
        {
            'id': 'TX011',
            'transaction_date': '2024-10-15T00:00:00Z',
            'sales_amount': 35000,
            'sales_channel': 'marketplace',
            'customer_state': 'IL'
        }
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or',
        'lookback_period': 'Preceding 12 calendar months'  # Will fall back to calendar year for Phase 1A
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

    # Should return one result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify nexus established
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] == '2024-07-03'  # Third transaction crossed threshold
    assert result['obligation_start_date'] == '2024-08-01'  # First of following month
    assert result['year'] == 2024
    assert result['first_nexus_year'] == 2024

    # Verify no liability (no direct sales after Aug 1)
    assert result['base_tax'] == 0
    assert result['estimated_liability'] == 0
    assert result['taxable_sales'] == 0

    # Verify sales breakdown
    assert result['total_sales'] == 151200  # $38K + $42.5K + $35.7K + $35K
    assert result['direct_sales'] == 73700  # $38K + $35.7K
    assert result['marketplace_sales'] == 77500  # $42.5K + $35K


# ============================================================================
# Test Case 2: Florida - Has Liability
# ============================================================================

def test_florida_nexus_with_liability(calculator):
    """
    Florida example: Nexus with liability.

    Scenario:
    - Jan 15: $45K direct
    - Mar 22: $38.5K marketplace
    - Jun 10: $42K direct (CROSSES $100K threshold)
    - Sep 5: $27K direct

    Expected:
    - Nexus established: June 10, 2024
    - Obligation starts: July 1, 2024
    - Liability: $27,000 × 7.02% = $1,895.40
    """
    transactions = [
        {
            'id': 'TX001',
            'transaction_date': '2024-01-15T00:00:00Z',
            'sales_amount': 45000,
            'sales_channel': 'direct',
            'customer_state': 'FL'
        },
        {
            'id': 'TX002',
            'transaction_date': '2024-03-22T00:00:00Z',
            'sales_amount': 38500,
            'sales_channel': 'marketplace',
            'customer_state': 'FL'
        },
        {
            'id': 'TX003',
            'transaction_date': '2024-06-10T00:00:00Z',
            'sales_amount': 42000,
            'sales_channel': 'direct',
            'customer_state': 'FL'
        },
        {
            'id': 'TX004',
            'transaction_date': '2024-09-05T00:00:00Z',
            'sales_amount': 27000,
            'sales_channel': 'direct',
            'customer_state': 'FL'
        }
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Previous Calendar Year'
    }

    tax_rate_config = {
        'state_rate': 0.0600,
        'avg_local_rate': 0.0102,
        'combined_rate': 0.0702
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='FL',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should return one result for 2024
    assert len(results) == 1
    result = results[0]

    # Verify nexus established
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] == '2024-06-10'
    assert result['obligation_start_date'] == '2024-07-01'
    assert result['year'] == 2024

    # Verify liability
    # Only Sep 5 transaction ($27K) is after July 1
    expected_tax = 27000 * 0.0702  # $1,895.40
    assert abs(result['base_tax'] - expected_tax) < 0.01
    assert result['taxable_sales'] == 27000

    # Verify sales breakdown
    assert result['total_sales'] == 152500
    assert result['direct_sales'] == 114000  # $45K + $42K + $27K
    assert result['marketplace_sales'] == 38500


# ============================================================================
# Test Case 3: Multi-Year with Sticky Nexus
# ============================================================================

def test_multi_year_sticky_nexus(calculator):
    """
    California example: Multi-year with sticky nexus.

    Scenario:
    - 2022 Jun 15: $400K direct
    - 2022 Jun 20: $150K direct (CROSSES $500K threshold)
    - 2022 Aug 20: $50K direct
    - 2023 Feb 10: $75K direct
    - 2023 Nov 5: $80K direct
    - 2024 Mar 15: $90K direct

    Expected:
    - 2022: Nexus established June 20, obligation starts July 1, liability on Aug txn
    - 2023: Sticky nexus (full year), liability on all txns
    - 2024: Sticky nexus (full year), liability on all txns
    """
    transactions = [
        # 2022
        {
            'id': 'TX001',
            'transaction_date': '2022-06-15T00:00:00Z',
            'sales_amount': 400000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        },
        {
            'id': 'TX002',
            'transaction_date': '2022-06-20T00:00:00Z',
            'sales_amount': 150000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        },
        {
            'id': 'TX003',
            'transaction_date': '2022-08-20T00:00:00Z',
            'sales_amount': 50000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        },
        # 2023
        {
            'id': 'TX004',
            'transaction_date': '2023-02-10T00:00:00Z',
            'sales_amount': 75000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        },
        {
            'id': 'TX005',
            'transaction_date': '2023-11-05T00:00:00Z',
            'sales_amount': 80000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        },
        # 2024
        {
            'id': 'TX006',
            'transaction_date': '2024-03-15T00:00:00Z',
            'sales_amount': 90000,
            'sales_channel': 'direct',
            'customer_state': 'CA'
        }
    ]

    threshold_config = {
        'revenue_threshold': 500000,  # High threshold
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Current or Previous Calendar Year'
    }

    tax_rate_config = {
        'state_rate': 0.0725,
        'avg_local_rate': 0.0100,
        'combined_rate': 0.0825
    }

    mf_rule = None  # No marketplace transactions

    # Calculate nexus
    results = calculator._calculate_state_nexus_multi_year(
        state_code='CA',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    # Should return 3 results (2022, 2023, 2024)
    assert len(results) == 3

    # 2022 Result
    result_2022 = results[0]
    assert result_2022['year'] == 2022
    assert result_2022['nexus_date'] == '2022-06-20'  # Second transaction crosses $500K
    assert result_2022['obligation_start_date'] == '2022-07-01'
    assert result_2022['first_nexus_year'] == 2022
    # Only Aug transaction ($50K) is after July 1
    expected_tax_2022 = 50000 * 0.0825  # $4,125
    assert abs(result_2022['base_tax'] - expected_tax_2022) < 0.01

    # 2023 Result - Sticky Nexus
    result_2023 = results[1]
    assert result_2023['year'] == 2023
    assert result_2023['nexus_date'] == '2022-06-20'  # Original nexus date
    assert result_2023['obligation_start_date'] == '2023-01-01'  # Full year (sticky)
    assert result_2023['first_nexus_year'] == 2022  # Original year
    # All transactions in 2023 ($75K + $80K)
    expected_tax_2023 = (75000 + 80000) * 0.0825  # $12,787.50
    assert abs(result_2023['base_tax'] - expected_tax_2023) < 0.01

    # 2024 Result - Sticky Nexus
    result_2024 = results[2]
    assert result_2024['year'] == 2024
    assert result_2024['nexus_date'] == '2022-06-20'  # Original nexus date
    assert result_2024['obligation_start_date'] == '2024-01-01'  # Full year (sticky)
    assert result_2024['first_nexus_year'] == 2022  # Original year
    # All transactions in 2024 ($90K)
    expected_tax_2024 = 90000 * 0.0825  # $7,425
    assert abs(result_2024['base_tax'] - expected_tax_2024) < 0.01


# ============================================================================
# Test Case 4: Helper Function Tests
# ============================================================================

def test_find_threshold_crossing(calculator):
    """Test the threshold crossing detection."""
    transactions = [
        {
            'id': 'TX001',
            'transaction_date': '2024-01-15T00:00:00Z',
            'sales_amount': 40000
        },
        {
            'id': 'TX002',
            'transaction_date': '2024-03-20T00:00:00Z',
            'sales_amount': 35000
        },
        {
            'id': 'TX003',
            'transaction_date': '2024-06-10T00:00:00Z',
            'sales_amount': 30000  # This crosses $100K
        }
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': None,
        'threshold_operator': 'or'
    }

    result = calculator._find_threshold_crossing(transactions, threshold_config)

    assert result['has_nexus'] is True
    assert result['threshold_transaction_id'] == 'TX003'
    assert result['running_total'] == 105000
    assert result['nexus_date'].date().isoformat() == '2024-06-10'


def test_calculate_obligation_start_date(calculator):
    """Test obligation start date calculation."""
    # June 10 → July 1
    june_date = datetime(2024, 6, 10)
    obligation = calculator._calculate_obligation_start_date(june_date)
    assert obligation == datetime(2024, 7, 1)

    # December 20 → January 1 (next year)
    dec_date = datetime(2024, 12, 20)
    obligation = calculator._calculate_obligation_start_date(dec_date)
    assert obligation == datetime(2025, 1, 1)

    # January 5 → February 1
    jan_date = datetime(2024, 1, 5)
    obligation = calculator._calculate_obligation_start_date(jan_date)
    assert obligation == datetime(2024, 2, 1)


def test_no_nexus_result(calculator):
    """Test creating no-nexus result when threshold not met."""
    transactions = [
        {
            'id': 'TX001',
            'transaction_date': '2024-01-15T00:00:00Z',
            'sales_amount': 50000,
            'sales_channel': 'direct',
            'customer_state': 'NY'
        }
    ]

    threshold_config = {
        'revenue_threshold': 500000,  # High threshold, won't be met
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Current or Previous Calendar Year'
    }

    tax_rate_config = {
        'combined_rate': 0.08875
    }

    results = calculator._calculate_state_nexus_multi_year(
        state_code='NY',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=None
    )

    assert len(results) == 1
    result = results[0]

    assert result['nexus_type'] == 'none'
    assert result['nexus_date'] is None
    assert result['obligation_start_date'] is None
    assert result['estimated_liability'] == 0
    assert result['total_sales'] == 50000


def test_transaction_threshold(calculator):
    """Test nexus determination using transaction count threshold."""
    # Create 201 small transactions
    transactions = [
        {
            'id': f'TX{i:03d}',
            'transaction_date': f'2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}T00:00:00Z',
            'sales_amount': 100,
            'sales_channel': 'direct',
            'customer_state': 'GA'
        }
        for i in range(201)
    ]

    threshold_config = {
        'revenue_threshold': 100000,  # Won't be met ($20,100 total)
        'transaction_threshold': 200,  # WILL be met (201 transactions)
        'threshold_operator': 'or',
        'lookback_period': 'Current or Previous Calendar Year'
    }

    tax_rate_config = {
        'combined_rate': 0.07
    }

    mf_rule = None

    results = calculator._calculate_state_nexus_multi_year(
        state_code='GA',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    assert len(results) == 1
    result = results[0]

    # Should have nexus due to transaction count
    assert result['nexus_type'] == 'economic'
    assert result['nexus_date'] is not None
    assert result['transaction_count'] == 201


# ============================================================================
# Test Case 5: Edge Cases
# ============================================================================

def test_zero_sales_state(calculator):
    """Test handling of states with no transactions."""
    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or',
        'lookback_period': 'Current or Previous Calendar Year'
    }

    results = calculator._calculate_state_nexus_multi_year(
        state_code='MT',
        transactions=[],  # No transactions
        threshold_config=threshold_config,
        tax_rate_config=None,
        mf_rule=None
    )

    assert len(results) == 1
    result = results[0]

    assert result['nexus_type'] == 'none'
    assert result['total_sales'] == 0
    assert result['estimated_liability'] == 0


def test_marketplace_only_transactions(calculator):
    """Test state with only marketplace transactions (no liability)."""
    transactions = [
        {
            'id': 'TX001',
            'transaction_date': '2024-03-15T00:00:00Z',
            'sales_amount': 150000,
            'sales_channel': 'marketplace',
            'customer_state': 'WA'
        }
    ]

    threshold_config = {
        'revenue_threshold': 100000,
        'transaction_threshold': None,
        'threshold_operator': 'or',
        'lookback_period': 'Current or Previous Calendar Year'
    }

    tax_rate_config = {
        'combined_rate': 0.092
    }

    mf_rule = {
        'has_mf_law': True,
        'exclude_from_liability': True
    }

    results = calculator._calculate_state_nexus_multi_year(
        state_code='WA',
        transactions=transactions,
        threshold_config=threshold_config,
        tax_rate_config=tax_rate_config,
        mf_rule=mf_rule
    )

    assert len(results) == 1
    result = results[0]

    # Should have nexus (marketplace counts toward threshold)
    assert result['nexus_type'] == 'economic'

    # But no liability (marketplace excluded from liability)
    assert result['estimated_liability'] == 0
    assert result['taxable_sales'] == 0
    assert result['marketplace_sales'] == 150000
