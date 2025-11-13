"""Service for auto-detecting column mappings from CSV headers"""
from typing import Dict, List, Optional


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
        ],
        'revenue_stream': [
            'revenue_stream',
            'revenue stream',
            'product_type',
            'product type',
            'product_category',
            'product category',
            'item_type',
            'item type',
            'item_category',
            'category',
            'product_line',
            'product line',
            'revenue_type',
            'revenue type',
            'goods_type',
            'service_type',
            'line_of_business',
            'sku_category',
            'business_line',
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

    @staticmethod
    def normalize_revenue_stream(value: Optional[str]) -> Optional[str]:
        """
        Normalize revenue stream values to standard categories.

        This helps standardize different ways businesses might describe
        the same revenue stream and can be used for default taxability rules.

        Args:
            value: Raw revenue stream value from CSV

        Returns:
            Normalized category or original value if no match
        """
        if not value or str(value).strip() == '':
            return None

        val_lower = str(value).lower().strip()

        # Food & Beverage (often partially exempt)
        food_variants = [
            'food', 'grocery', 'groceries', 'food & beverage', 'f&b',
            'restaurant', 'prepared food', 'unprepared food', 'bakery',
            'produce', 'meat', 'dairy', 'beverages', 'snacks'
        ]
        if any(v in val_lower for v in food_variants):
            return 'food_beverage'

        # Clothing (exempt in some states)
        clothing_variants = [
            'clothing', 'apparel', 'clothes', 'garments', 'fashion',
            'shoes', 'footwear', 'accessories', 'textiles'
        ]
        if any(v in val_lower for v in clothing_variants):
            return 'clothing'

        # Digital Goods (complex rules, varies by state)
        digital_variants = [
            'digital', 'software', 'saas', 'download', 'streaming',
            'digital goods', 'digital products', 'digital services',
            'ebook', 'music download', 'app', 'subscription'
        ]
        if any(v in val_lower for v in digital_variants):
            return 'digital_goods'

        # Services (often exempt from sales tax)
        service_variants = [
            'service', 'services', 'consulting', 'professional services',
            'labor', 'installation', 'maintenance', 'repair', 'support'
        ]
        if any(v in val_lower for v in service_variants):
            return 'services'

        # Manufacturing Equipment (often exempt)
        manufacturing_variants = [
            'manufacturing', 'machinery', 'equipment', 'industrial',
            'production equipment', 'manufacturing equipment', 'capital equipment'
        ]
        if any(v in val_lower for v in manufacturing_variants):
            return 'manufacturing_equipment'

        # Resale (exempt with valid certificate)
        resale_variants = [
            'resale', 'wholesale', 'for resale', 'reseller', 'distributor'
        ]
        if any(v in val_lower for v in resale_variants):
            return 'resale'

        # Medical/Healthcare (often exempt)
        medical_variants = [
            'medical', 'healthcare', 'prescription', 'rx', 'pharmaceutical',
            'medical supplies', 'medical equipment', 'health'
        ]
        if any(v in val_lower for v in medical_variants):
            return 'medical'

        # Physical Products (generally taxable)
        product_variants = [
            'product', 'goods', 'merchandise', 'physical goods',
            'tangible', 'items', 'retail'
        ]
        if any(v in val_lower for v in product_variants):
            return 'physical_products'

        # If no match, return original value (preserves user's categorization)
        return value

    @staticmethod
    def get_revenue_stream_taxability_guidance(revenue_stream: str) -> Dict:
        """
        Provide taxability guidance for a given revenue stream.

        NOTE: This is guidance only. Actual taxability varies by state
        and specific circumstances. Users should consult tax professionals.

        Args:
            revenue_stream: Normalized revenue stream category

        Returns:
            Dict with guidance information
        """
        guidance = {
            'food_beverage': {
                'typically_taxable': False,
                'notes': 'Often exempt for unprepared food; prepared food usually taxable. Varies significantly by state.',
                'examples': 'Groceries (exempt in most states), Restaurant meals (taxable in most states)'
            },
            'clothing': {
                'typically_taxable': False,
                'notes': 'Some states exempt clothing entirely, some have price thresholds, some tax fully.',
                'examples': 'NY exempts under $110, PA exempts all clothing, CA taxes all clothing'
            },
            'digital_goods': {
                'typically_taxable': True,
                'notes': 'Complex and rapidly changing. Many states now tax digital products.',
                'examples': 'Software downloads, streaming services, ebooks, digital music'
            },
            'services': {
                'typically_taxable': False,
                'notes': 'Most states do not tax professional services, but rules vary.',
                'examples': 'Consulting, legal services, accounting (generally exempt)'
            },
            'manufacturing_equipment': {
                'typically_taxable': False,
                'notes': 'Many states exempt machinery used directly in manufacturing.',
                'examples': 'Production equipment, industrial machinery'
            },
            'resale': {
                'typically_taxable': False,
                'notes': 'Exempt with valid resale certificate in most states.',
                'examples': 'Wholesale purchases for resale'
            },
            'medical': {
                'typically_taxable': False,
                'notes': 'Prescription drugs generally exempt; medical equipment varies.',
                'examples': 'Prescription medications (exempt), OTC drugs (varies), medical devices (varies)'
            },
            'physical_products': {
                'typically_taxable': True,
                'notes': 'Tangible personal property generally subject to sales tax.',
                'examples': 'Electronics, home goods, toys, general merchandise'
            }
        }

        return guidance.get(revenue_stream, {
            'typically_taxable': True,
            'notes': 'Unknown category. Assume taxable unless you have specific exemption.',
            'examples': 'Consult tax professional for guidance'
        })
