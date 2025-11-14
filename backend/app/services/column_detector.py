"""Service for auto-detecting column mappings from CSV headers"""
from typing import Dict, List, Optional
from datetime import datetime

# State name to code mapping for normalization
STATE_NAME_MAPPING = {
    # Full names
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'puerto rico': 'PR',

    # Common abbreviations and variants
    'd.c.': 'DC', 'wash': 'WA', 'calif': 'CA', 'mass': 'MA', 'penn': 'PA',
    'conn': 'CT', 'miss': 'MS', 'tenn': 'TN', 'wash.': 'WA', 'calif.': 'CA'
}

# Date formats to try (in order of preference)
DATE_FORMATS = [
    '%Y-%m-%d',      # 2024-01-15 (ISO, preferred)
    '%m/%d/%Y',      # 01/15/2024 (US common)
    '%d/%m/%Y',      # 15/01/2024 (EU common)
    '%Y/%m/%d',      # 2024/01/15
    '%m-%d-%Y',      # 01-15-2024
    '%d-%m-%Y',      # 15-01-2024
    '%b %d, %Y',     # Jan 15, 2024
]

# Sales channel normalization mapping
CHANNEL_MAPPING = {
    # Marketplace variants
    'marketplace': 'marketplace',
    'market place': 'marketplace',
    'market': 'marketplace',
    'amazon': 'marketplace',
    'ebay': 'marketplace',
    'etsy': 'marketplace',
    'shopify': 'marketplace',
    'walmart': 'marketplace',
    'platform': 'marketplace',
    'third party': 'marketplace',
    'third-party': 'marketplace',
    '3rd party': 'marketplace',

    # Direct variants
    'direct': 'direct',
    'website': 'direct',
    'web': 'direct',
    'online': 'direct',
    'own site': 'direct',
    'company site': 'direct',
    'retail': 'direct',
    'store': 'direct',
    'in-store': 'direct',
    'instore': 'direct',
}


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
            'transaction_date', 'transaction date',
            'date', 'order_date', 'order date',
            'sale_date', 'sale date', 'sales_date',
            'txn_date', 'trans_date', 'transaction_dt',
            'invoice_date', 'invoice date',
            'purchase_date', 'purchase date',
            'created_date', 'created_at', 'created at',
            'order_created', 'order_timestamp',
            'timestamp', 'datetime'
        ],
        'customer_state': [
            'customer_state', 'customer state',
            'state', 'buyer_state', 'buyer state',
            'ship_to_state', 'ship to state', 'shipto_state',
            'shipping_state', 'shipping state',
            'customer_location', 'destination_state', 'destination state',
            'dest_state', 'to_state', 'delivery_state',
            'recipient_state', 'ship_state',
            'province', 'customer_province'
        ],
        'revenue_amount': [
            'revenue_amount', 'revenue amount', 'revenue',
            'amount', 'sales_amount', 'sales amount', 'sales',
            'total', 'total_amount', 'total amount',
            'price', 'sale_amount', 'order_total', 'order total',
            'gross_sales', 'gross sales', 'gross_amount',
            'line_total', 'subtotal', 'sub_total',
            'net_amount', 'net_sales', 'value'
        ],
        'sales_channel': [
            'sales_channel', 'sales channel',
            'channel', 'source', 'order_source', 'order source',
            'marketplace', 'platform', 'seller',
            'sale_channel', 'sales_source',
            'fulfillment_channel', 'fulfillment channel',
            'order_channel', 'channel_name', 'sales_platform'
        ],
        'revenue_stream': [
            'revenue_stream', 'revenue stream',
            'product_type', 'product type',
            'product_category', 'product category',
            'item_type', 'item type',
            'item_category', 'category',
            'product_line', 'product line',
            'revenue_type', 'revenue type',
            'goods_type', 'service_type',
            'line_of_business', 'sku_category',
            'business_line'
        ],
        # Optional columns for exempt sales
        'is_taxable': [
            'is_taxable', 'is taxable', 'taxable',
            'tax_status', 'tax status', 'taxability',
            'exempt', 'is_exempt', 'is exempt',
            'taxable_flag', 'tax_exempt', 'tax exempt',
            'exemption_status', 'subject_to_tax'
        ],
        'exempt_amount': [
            'exempt_amount', 'exempt amount', 'exempt',
            'exempt_sales', 'exempt sales',
            'non_taxable_amount', 'non taxable amount',
            'exemption_amount', 'exemption amount',
            'exempt_amt', 'tax_exempt_amount',
            'nontaxable_amount'
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

    @classmethod
    def normalize_state_code(cls, value: Optional[str]) -> Optional[str]:
        """
        Normalize state value to 2-letter code.

        Handles:
        - Full state names (case-insensitive)
        - Existing codes (pass through)
        - Whitespace trimming

        Returns uppercase 2-letter code or original value if not found.
        """
        if not value or not isinstance(value, str):
            return value

        # Trim and lowercase for matching
        cleaned = value.strip().lower()

        # Already a 2-letter code?
        if len(cleaned) == 2 and cleaned.isalpha():
            return cleaned.upper()

        # Look up in mapping
        if cleaned in STATE_NAME_MAPPING:
            return STATE_NAME_MAPPING[cleaned]

        # Return original if no match found
        return value.strip().upper()

    @staticmethod
    def normalize_date(value) -> str:
        """
        Normalize date value to YYYY-MM-DD format.

        Tries multiple date formats in order.
        Returns ISO format (YYYY-MM-DD) or raises ValueError.
        """
        import pandas as pd

        if pd.isna(value):
            raise ValueError("Date value is NaN")

        # Already a datetime object?
        if isinstance(value, (datetime, pd.Timestamp)):
            return value.strftime('%Y-%m-%d')

        # String - try parsing with multiple formats
        if isinstance(value, str):
            value = value.strip()

            # Try each format
            for fmt in DATE_FORMATS:
                try:
                    parsed = datetime.strptime(value, fmt)
                    return parsed.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            # No format worked
            raise ValueError(f"Could not parse date: {value}")

        raise ValueError(f"Unexpected date type: {type(value)}")

    @staticmethod
    def normalize_channel(value: str) -> str:
        """
        Normalize sales channel to 'direct' or 'marketplace'.

        Defaults to 'direct' if not recognized.
        """
        if not value or not isinstance(value, str):
            return 'direct'

        # Trim and lowercase for matching
        cleaned = value.strip().lower()

        # Look up in mapping
        return CHANNEL_MAPPING.get(cleaned, 'direct')

    @staticmethod
    def calculate_taxable_amount(
        revenue_amount: float,
        is_taxable: Optional[str] = None,
        exempt_amount: Optional[float] = None
    ) -> tuple:
        """
        Calculate taxable amount using hybrid logic.

        Priority:
        1. If exempt_amount specified, subtract from revenue
        2. If is_taxable specified, use Y/N logic
        3. Default to fully taxable

        Args:
            revenue_amount: Gross revenue for transaction
            is_taxable: Optional boolean string (Y/N, True/False, etc.)
            exempt_amount: Optional exempt dollar amount

        Returns:
            Tuple of (taxable_amount, is_taxable_bool, exempt_amount)
        """
        revenue = float(revenue_amount) if revenue_amount else 0.0

        # Priority 1: exempt_amount specified
        if exempt_amount is not None:
            try:
                exempt = float(exempt_amount)
                # Cap exempt at revenue (can't exempt more than sold)
                exempt = min(exempt, revenue)
                exempt = max(exempt, 0)  # Can't be negative
                taxable = revenue - exempt
                return (taxable, taxable > 0, exempt)
            except (ValueError, TypeError):
                pass

        # Priority 2: is_taxable specified
        if is_taxable is not None and str(is_taxable).strip() != '':
            val_str = str(is_taxable).upper().strip()
            # Check for "false" values
            if val_str in ['N', 'NO', 'FALSE', '0', 'F', 'EXEMPT', 'NON-TAXABLE']:
                return (0.0, False, revenue)
            # Anything else treated as taxable
            else:
                return (revenue, True, 0.0)

        # Priority 3: Default to fully taxable
        return (revenue, True, 0.0)

    def normalize_data(self, df, mappings: Dict) -> Dict:
        """
        Apply all normalizations to DataFrame.

        This is the master normalization method that:
        1. Normalizes dates to YYYY-MM-DD
        2. Normalizes state names to codes
        3. Normalizes sales channels
        4. Normalizes revenue streams
        5. Calculates taxable amounts

        Args:
            df: pandas DataFrame with raw CSV data
            mappings: Column mapping dict from detect_mappings()

        Returns:
            Dict with:
                - df: Normalized DataFrame
                - transformations: List of transformations applied
                - warnings: List of warnings
        """
        import pandas as pd

        df = df.copy()
        transformations = []
        warnings = []

        # Rename columns based on mappings
        reverse_mapping = {v: k for k, v in mappings.items()}
        df = df.rename(columns=reverse_mapping)

        # Track validation errors
        validation_errors = []

        # 1. Normalize dates with error tracking
        if 'transaction_date' in df.columns:
            date_col = 'transaction_date'
            for idx, value in enumerate(df[date_col]):
                try:
                    df.at[idx, date_col] = self.normalize_date(value)
                except ValueError as e:
                    validation_errors.append(f"Row {idx + 2}: {str(e)}")
                    df.at[idx, date_col] = None

            # If too many errors, raise exception
            if len(validation_errors) > len(df) * 0.1:  # More than 10% invalid
                raise ValueError(f"Too many date parsing errors:\n" + "\n".join(validation_errors[:10]))

            transformations.append('Normalized dates to YYYY-MM-DD format')

            if len(validation_errors) > 0:
                warnings.append({
                    'field': 'transaction_date',
                    'message': f'{len(validation_errors)} dates could not be parsed and were set to null',
                    'count': len(validation_errors)
                })

        # 2. Normalize state codes
        if 'customer_state' in df.columns:
            df['customer_state'] = df['customer_state'].apply(self.normalize_state_code)
            transformations.append('Normalized state names to 2-letter codes')

        # 3. Normalize sales channel values
        if 'sales_channel' in df.columns:
            df['sales_channel'] = df['sales_channel'].apply(self.normalize_channel)
            transformations.append('Normalized sales channels to "marketplace" or "direct"')
        else:
            # Default to 'direct' if column not present
            df['sales_channel'] = 'direct'

        # 4. Normalize revenue streams
        if 'revenue_stream' in df.columns:
            df['revenue_stream'] = df['revenue_stream'].apply(self.normalize_revenue_stream)
            transformations.append('Normalized revenue streams to standard categories')

        # 5. Calculate taxable amounts
        if 'revenue_amount' in df.columns:
            df['taxable_amount'] = None
            df['is_taxable'] = None
            df['exempt_amount_calc'] = None

            for idx, row in df.iterrows():
                revenue = row.get('revenue_amount')
                is_tax = row.get('is_taxable') if 'is_taxable' in df.columns else None
                exempt = row.get('exempt_amount') if 'exempt_amount' in df.columns else None

                taxable, is_taxable_bool, exempt_calc = self.calculate_taxable_amount(
                    revenue, is_tax, exempt
                )

                df.at[idx, 'taxable_amount'] = taxable
                df.at[idx, 'is_taxable'] = is_taxable_bool
                df.at[idx, 'exempt_amount_calc'] = exempt_calc

            transformations.append('Calculated taxable amounts based on exempt sales data')

        return {
            'df': df,
            'transformations': transformations,
            'warnings': warnings
        }

    def validate_normalized_data(self, df) -> Dict:
        """
        Validate normalized data and return errors/warnings.

        Checks:
        - Invalid state codes
        - Future dates
        - Negative amounts
        - Null required fields
        - Exempt > Revenue

        Args:
            df: Normalized DataFrame

        Returns:
            Dict with validation results
        """
        import pandas as pd
        from datetime import datetime

        errors = []
        warnings = []

        # Valid US state codes
        valid_states = set(STATE_NAME_MAPPING.values())

        # 1. Validate state codes
        if 'customer_state' in df.columns:
            invalid_states_df = df[~df['customer_state'].isin(valid_states) & df['customer_state'].notna()]
            if len(invalid_states_df) > 0:
                invalid_codes = invalid_states_df['customer_state'].unique()
                errors.append({
                    'field': 'customer_state',
                    'message': f'Invalid state codes found: {", ".join(invalid_codes)}',
                    'count': len(invalid_states_df),
                    'severity': 'error'
                })

        # 2. Validate dates
        if 'transaction_date' in df.columns:
            # Null dates
            null_dates = df['transaction_date'].isna().sum()
            if null_dates > 0:
                errors.append({
                    'field': 'transaction_date',
                    'message': f'{null_dates} transactions have invalid or missing dates',
                    'count': null_dates,
                    'severity': 'error'
                })

            # Future dates
            try:
                df_with_dates = df[df['transaction_date'].notna()].copy()
                df_with_dates['transaction_date'] = pd.to_datetime(df_with_dates['transaction_date'])
                future_dates = df_with_dates[df_with_dates['transaction_date'] > pd.Timestamp.now()]
                if len(future_dates) > 0:
                    warnings.append({
                        'field': 'transaction_date',
                        'message': f'{len(future_dates)} transactions have future dates',
                        'count': len(future_dates),
                        'severity': 'warning'
                    })
            except:
                pass

        # 3. Validate amounts
        if 'revenue_amount' in df.columns:
            # Negative amounts
            negative = df[df['revenue_amount'] < 0]
            if len(negative) > 0:
                warnings.append({
                    'field': 'revenue_amount',
                    'message': f'{len(negative)} transactions have negative amounts',
                    'count': len(negative),
                    'severity': 'warning'
                })

            # Null amounts
            null_amounts = df['revenue_amount'].isna().sum()
            if null_amounts > 0:
                errors.append({
                    'field': 'revenue_amount',
                    'message': f'{null_amounts} transactions have missing amounts',
                    'count': null_amounts,
                    'severity': 'error'
                })

        # 4. Validate exempt amounts
        if 'exempt_amount_calc' in df.columns and 'revenue_amount' in df.columns:
            over_exempt = df[df['exempt_amount_calc'] > df['revenue_amount']]
            if len(over_exempt) > 0:
                warnings.append({
                    'field': 'exempt_amount',
                    'message': f'{len(over_exempt)} transactions have exempt amount > revenue (capped at revenue)',
                    'count': len(over_exempt),
                    'severity': 'warning'
                })

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'total_rows': len(df),
            'valid_rows': len(df) - sum(e['count'] for e in errors if e['severity'] == 'error')
        }
