"""Service for auto-detecting column mappings from CSV headers"""
from typing import Dict, List


class ColumnDetector:
    """
    Auto-detect which columns map to required fields based on column names.

    Uses pattern matching with confidence scoring:
    - high: exact match or most common variant
    - medium: common variant
    - low: less common but valid variant
    """

    # Patterns ordered by confidence (first = highest)
    COLUMN_PATTERNS = {
        'transaction_date': [
            'transaction_date',
            'date',
            'order_date',
            'sale_date',
            'txn_date',
            'trans_date',
            'invoice_date',
        ],
        'customer_state': [
            'customer_state',
            'state',
            'buyer_state',
            'ship_to_state',
            'shipping_state',
            'customer_location',
            'destination_state',
        ],
        'revenue_amount': [
            'revenue_amount',
            'amount',
            'sales_amount',
            'total',
            'price',
            'revenue',
            'sales',
            'total_amount',
        ],
        'sales_channel': [
            'sales_channel',
            'channel',
            'source',
            'marketplace',
            'order_source',
            'sale_channel',
        ]
    }

    def __init__(self, columns: List[str]):
        """
        Initialize detector with CSV column names.

        Args:
            columns: List of column names from CSV
        """
        self.columns = columns

    def detect_mappings(self) -> Dict:
        """
        Detect column mappings with confidence scores.

        Returns:
            Dict with:
                - mappings: Dict of field -> detected column name
                - confidence: Dict of field -> confidence level
                - all_required_detected: Boolean
        """
        mappings = {}
        confidence = {}

        for field, patterns in self.COLUMN_PATTERNS.items():
            for i, pattern in enumerate(patterns):
                # Case-insensitive matching
                match = next(
                    (col for col in self.columns if col.lower() == pattern.lower()),
                    None
                )
                if match:
                    mappings[field] = match

                    # Assign confidence based on pattern position
                    if i == 0:
                        confidence[field] = 'high'
                    elif i < 3:
                        confidence[field] = 'medium'
                    else:
                        confidence[field] = 'low'
                    break

        return {
            'mappings': mappings,
            'confidence': confidence,
            'all_required_detected': len(mappings) == 4
        }

    def get_sample_values(self, df, max_samples: int = 5) -> Dict[str, List[str]]:
        """
        Extract sample values for each column.

        Args:
            df: pandas DataFrame with transaction data
            max_samples: Maximum number of unique sample values per column

        Returns:
            Dict mapping column name to list of sample values (as strings)
        """
        samples = {}

        for col in self.columns:
            if col in df.columns:
                # Get unique non-null values
                unique_vals = df[col].dropna().unique()[:max_samples]
                # Convert to strings
                samples[col] = [str(val) for val in unique_vals]

        return samples
