"""
Tests for nexus calculation engine.
"""

import pytest
from decimal import Decimal
from unittest.mock import Mock, MagicMock
from app.services.nexus_calculator import NexusCalculator


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    return Mock()


@pytest.fixture
def calculator(mock_supabase):
    """Create calculator instance with mocked supabase."""
    return NexusCalculator(mock_supabase)


def test_tax_rate_not_divided_by_100(calculator, mock_supabase):
    """
    Verify tax rate is used as-is (already decimal).
    Bug: Code was dividing 0.0825 by 100 = 0.000825, making liability 100x too low.
    """
    # Tax rate stored in database as decimal
    tax_rate = {
        'state_rate': 0.0725,      # 7.25%
        'avg_local_rate': 0.0100,  # 1.00%
        'combined_rate': 0.0825    # 8.25%
    }

    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }

    # $100,000 in sales should trigger nexus and $8,250 liability
    result = calculator._determine_state_nexus(
        state_code='CA',
        total_sales=100000.0,
        transaction_count=150,
        direct_sales=100000.0,
        marketplace_sales=0.0,
        threshold=threshold,
        tax_rate=tax_rate
    )

    # Assertions
    assert result['nexus_type'] == 'economic'
    assert result['total_sales'] == 100000.0

    # Critical: Tax should be $100,000 * 0.0825 = $8,250
    # NOT $100,000 * 0.000825 = $82.50 (the bug)
    assert result['base_tax'] == 8250.0
    assert result['estimated_liability'] == 8250.0


def test_marketplace_sales_excluded_from_liability(calculator, mock_supabase):
    """
    Verify marketplace sales are excluded from liability when state has MF law.

    Marketplace facilitator law:
    - Marketplace sales COUNT toward threshold determination
    - Marketplace sales EXCLUDED from liability (marketplace collects tax)
    """
    # Mock marketplace facilitator rules query
    mock_mf_result = Mock()
    mock_mf_result.data = [{
        'state': 'CA',
        'has_mf_law': True,
        'count_toward_threshold': True,
        'exclude_from_liability': True
    }]

    mock_supabase.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value = mock_mf_result

    tax_rate = {
        'combined_rate': 0.0825  # 8.25%
    }

    threshold = {
        'revenue_threshold': 100000,
        'transaction_threshold': 200,
        'threshold_operator': 'or'
    }

    # MF rules for California
    mf_rules = {
        'has_mf_law': True,
        'count_toward_threshold': True,
        'exclude_from_liability': True
    }

    # $100K direct + $50K marketplace = $150K total
    # Threshold check: $150K → NEXUS ✅
    # Liability: Only $100K (direct) × 8.25% = $8,250
    result = calculator._determine_state_nexus(
        state_code='CA',
        total_sales=150000.0,
        transaction_count=250,
        direct_sales=100000.0,
        marketplace_sales=50000.0,
        threshold=threshold,
        tax_rate=tax_rate,
        mf_rules=mf_rules
    )

    # Should have nexus (total $150K exceeds $100K threshold)
    assert result['nexus_type'] == 'economic'

    # But liability should only be on $100K direct sales
    # NOT on $150K total
    assert result['base_tax'] == 8250.0  # $100K * 8.25%
    assert result['estimated_liability'] == 8250.0
