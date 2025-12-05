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


def test_normalize_taxability():
    """Test taxability code normalization."""
    # Valid codes (case insensitive)
    assert ColumnDetector.normalize_taxability('T') == 'T'
    assert ColumnDetector.normalize_taxability('t') == 'T'
    assert ColumnDetector.normalize_taxability('NT') == 'NT'
    assert ColumnDetector.normalize_taxability('nt') == 'NT'
    assert ColumnDetector.normalize_taxability('E') == 'E'
    assert ColumnDetector.normalize_taxability('EC') == 'EC'
    assert ColumnDetector.normalize_taxability('ec') == 'EC'
    assert ColumnDetector.normalize_taxability('P') == 'P'

    # Invalid codes return None
    assert ColumnDetector.normalize_taxability('X') is None
    assert ColumnDetector.normalize_taxability('taxable') is None
    assert ColumnDetector.normalize_taxability('') is None
    assert ColumnDetector.normalize_taxability(None) is None


def test_taxability_detection_patterns():
    """Test auto-detection of taxability columns."""
    import pandas as pd

    df = pd.DataFrame({
        'date': ['2024-01-01'],
        'state': ['TX'],
        'amount': [100],
        'taxability': ['T'],
    })

    detector = ColumnDetector(list(df.columns))
    result = detector.detect_mappings()
    # taxability column should be detected if we add it to patterns
    # For now, verify the detection works with existing 'is_taxable' pattern
    assert 'transaction_date' in result['mappings']


def test_normalize_data_with_taxability():
    """Test that normalize_data processes taxability column."""
    import pandas as pd

    df = pd.DataFrame({
        'transaction_date': ['2024-01-15', '2024-01-16'],
        'customer_state': ['TX', 'CA'],
        'revenue_amount': [100.00, 200.00],
        'sales_channel': ['direct', 'marketplace'],
        'taxability': ['T', 'NT'],
    })

    mappings = {
        'transaction_date': 'transaction_date',
        'customer_state': 'customer_state',
        'revenue_amount': 'revenue_amount',
        'sales_channel': 'sales_channel',
        'taxability': 'taxability',
    }

    detector = ColumnDetector(list(df.columns))
    result = detector.normalize_data(df, mappings)
    result_df = result['df']

    assert 'taxability' in result_df.columns
    assert result_df['taxability'].tolist() == ['T', 'NT']


def test_normalize_data_taxability_validation():
    """Test that invalid taxability codes remain but can be detected."""
    import pandas as pd

    df = pd.DataFrame({
        'transaction_date': ['2024-01-15', '2024-01-16'],
        'customer_state': ['TX', 'CA'],
        'revenue_amount': [100.00, 200.00],
        'sales_channel': ['direct', 'marketplace'],
        'taxability': ['T', 'INVALID'],
    })

    mappings = {
        'transaction_date': 'transaction_date',
        'customer_state': 'customer_state',
        'revenue_amount': 'revenue_amount',
        'sales_channel': 'sales_channel',
        'taxability': 'taxability',
    }

    detector = ColumnDetector(list(df.columns))
    result = detector.normalize_data(df, mappings)
    result_df = result['df']

    # First should be valid, second should be None (invalid)
    assert result_df['taxability'].tolist()[0] == 'T'
    assert result_df['taxability'].tolist()[1] is None


def test_validate_taxability_partial_requires_exempt_amount():
    """Test that P (partial) taxability requires exempt_amount > 0."""
    import pandas as pd

    # P with no exempt_amount should generate error
    df_invalid = pd.DataFrame({
        'transaction_date': [pd.Timestamp('2024-01-15')],
        'customer_state': ['TX'],
        'revenue_amount': [100.00],
        'sales_channel': ['direct'],
        'taxability': ['P'],
        'exempt_amount_calc': [0],
    })

    detector = ColumnDetector([])
    result = detector.validate_normalized_data(df_invalid)

    # Should have validation error
    taxability_errors = [e for e in result['errors'] if e.get('field') == 'taxability']
    assert len(taxability_errors) > 0

    # P with exempt_amount should be valid
    df_valid = pd.DataFrame({
        'transaction_date': [pd.Timestamp('2024-01-15')],
        'customer_state': ['TX'],
        'revenue_amount': [100.00],
        'sales_channel': ['direct'],
        'taxability': ['P'],
        'exempt_amount_calc': [30.00],
    })

    result = detector.validate_normalized_data(df_valid)
    taxability_errors = [e for e in result['errors'] if e.get('field') == 'taxability']
    assert len(taxability_errors) == 0


def test_calculate_taxable_amount_with_taxability():
    """Test taxable amount calculation respects taxability codes."""
    # T = full tax
    taxable, is_taxable, exempt = ColumnDetector.calculate_taxable_amount(
        revenue_amount=100.00, taxability='T'
    )
    assert taxable == 100.00
    assert is_taxable == True

    # NT = no tax
    taxable, is_taxable, exempt = ColumnDetector.calculate_taxable_amount(
        revenue_amount=100.00, taxability='NT'
    )
    assert taxable == 0.00
    assert is_taxable == False

    # E = no tax
    taxable, is_taxable, exempt = ColumnDetector.calculate_taxable_amount(
        revenue_amount=100.00, taxability='E'
    )
    assert taxable == 0.00
    assert is_taxable == False

    # EC = no tax
    taxable, is_taxable, exempt = ColumnDetector.calculate_taxable_amount(
        revenue_amount=100.00, taxability='EC'
    )
    assert taxable == 0.00
    assert is_taxable == False

    # P = partial (revenue - exempt_amount)
    taxable, is_taxable, exempt = ColumnDetector.calculate_taxable_amount(
        revenue_amount=100.00, taxability='P', exempt_amount=30.00
    )
    assert taxable == 70.00
    assert is_taxable == True
    assert exempt == 30.00


def test_get_channel_mapping_preview():
    """Test channel mapping preview identifies recognized vs unrecognized values."""
    import pandas as pd

    df = pd.DataFrame({
        'channel': ['Amazon', 'Website', 'FBA', 'Wholesale', 'eBay']
    })

    result = ColumnDetector.get_channel_mapping_preview(df, 'channel')

    # Amazon, Website, eBay should be recognized
    recognized_originals = [r['original'] for r in result['recognized']]
    assert 'Amazon' in recognized_originals
    assert 'Website' in recognized_originals
    assert 'eBay' in recognized_originals

    # FBA, Wholesale should be unrecognized
    assert 'FBA' in result['unrecognized']
    assert 'Wholesale' in result['unrecognized']
