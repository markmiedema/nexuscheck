# backend/tests/test_column_detector.py
import pytest
from app.services.column_detector import ColumnDetector


def test_detect_exact_column_names():
    """Test detection with exact column names"""
    columns = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
    assert result['mappings']['transaction_date'] == 'transaction_date'
    assert result['mappings']['customer_state'] == 'customer_state'
    assert result['mappings']['revenue_amount'] == 'revenue_amount'
    assert result['mappings']['sales_channel'] == 'sales_channel'
    assert result['confidence']['transaction_date'] == 'high'


def test_detect_common_variants():
    """Test detection with common column name variants"""
    columns = ['date', 'state', 'amount', 'channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
    assert result['mappings']['transaction_date'] == 'date'
    assert result['mappings']['customer_state'] == 'state'
    assert result['mappings']['revenue_amount'] == 'amount'
    assert result['mappings']['sales_channel'] == 'channel'


def test_partial_detection():
    """Test when only some columns are detected"""
    columns = ['date', 'state', 'total']  # Missing sales_channel

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == False
    assert 'transaction_date' in result['mappings']
    assert 'customer_state' in result['mappings']
    assert 'sales_channel' not in result['mappings']


def test_confidence_scoring():
    """Test that confidence decreases for less common variants"""
    columns = ['invoice_date', 'buyer_state', 'total_amount', 'order_source']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    # Later patterns should have lower confidence
    assert result['confidence']['transaction_date'] in ['medium', 'low']
    assert result['confidence']['customer_state'] in ['medium', 'low']


def test_case_insensitive_matching():
    """Test that matching is case-insensitive"""
    columns = ['TRANSACTION_DATE', 'Customer_State', 'Revenue_Amount', 'Sales_Channel']

    detector = ColumnDetector(columns)
    result = detector.detect_mappings()

    assert result['all_required_detected'] == True
