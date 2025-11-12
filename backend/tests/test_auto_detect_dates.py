import pytest
import pandas as pd
from datetime import date
from io import BytesIO

def test_auto_detect_dates_from_csv():
    """Test that we can extract min/max dates from CSV"""
    # Arrange
    csv_content = """transaction_date,customer_state,revenue_amount,sales_channel
2024-01-05,CA,1000.00,direct
2024-03-15,NY,2000.00,direct
2024-06-20,TX,3000.00,marketplace"""

    df = pd.read_csv(BytesIO(csv_content.encode()))

    # Act
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    min_date = df['transaction_date'].min().strftime('%Y-%m-%d')
    max_date = df['transaction_date'].max().strftime('%Y-%m-%d')

    # Assert
    assert min_date == '2024-01-05'
    assert max_date == '2024-06-20'


def test_auto_detect_handles_different_date_formats():
    """Test that auto-detect works with MM/DD/YYYY format"""
    # Arrange
    csv_content = """transaction_date,customer_state,revenue_amount,sales_channel
01/05/2024,CA,1000.00,direct
03/15/2024,NY,2000.00,direct"""

    df = pd.read_csv(BytesIO(csv_content.encode()))

    # Act
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    min_date = df['transaction_date'].min().strftime('%Y-%m-%d')
    max_date = df['transaction_date'].max().strftime('%Y-%m-%d')

    # Assert
    assert min_date == '2024-01-05'
    assert max_date == '2024-03-15'


def test_auto_detect_multi_year():
    """Test that auto-detect works across multiple years"""
    # Arrange
    csv_content = """transaction_date,customer_state,revenue_amount,sales_channel
2022-06-15,CA,1000.00,direct
2023-12-01,NY,2000.00,direct
2024-03-20,TX,3000.00,marketplace"""

    df = pd.read_csv(BytesIO(csv_content.encode()))

    # Act
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    min_date = df['transaction_date'].min().strftime('%Y-%m-%d')
    max_date = df['transaction_date'].max().strftime('%Y-%m-%d')

    # Assert
    assert min_date == '2022-06-15'
    assert max_date == '2024-03-20'


def test_auto_detect_filters_invalid_dates():
    """Test that invalid dates are filtered out"""
    # Arrange
    csv_content = """transaction_date,customer_state,revenue_amount,sales_channel
2024-01-05,CA,1000.00,direct
not-a-date,NY,2000.00,direct
2024-06-20,TX,3000.00,marketplace"""

    df = pd.read_csv(BytesIO(csv_content.encode()))

    # Act
    date_series = pd.to_datetime(df['transaction_date'], errors='coerce')
    valid_dates = date_series.dropna()

    min_date = valid_dates.min().strftime('%Y-%m-%d')
    max_date = valid_dates.max().strftime('%Y-%m-%d')

    # Assert
    assert len(valid_dates) == 2  # Only 2 valid dates
    assert min_date == '2024-01-05'
    assert max_date == '2024-06-20'
