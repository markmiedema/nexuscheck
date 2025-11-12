"""
Import State Nexus Rules from JSON

Reads state_sales_tax_nexus.json and updates the database with:
- Lookback period for each state
- Economic nexus thresholds
- Marketplace exclusion rules

Run this script after migration 010 to populate state-specific lookback periods.
"""

import json
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.supabase import get_supabase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def parse_threshold_string(threshold_str):
    """
    Parse threshold string like "$100,000 OR 200 transactions" into components.

    Returns:
        dict with revenue_threshold, transaction_threshold, operator
    """
    threshold_str = threshold_str.upper()

    # Determine operator
    if ' AND ' in threshold_str:
        operator = 'and'
        parts = threshold_str.split(' AND ')
    elif ' OR ' in threshold_str:
        operator = 'or'
        parts = threshold_str.split(' OR ')
    else:
        operator = 'or'  # Default
        parts = [threshold_str]

    revenue_threshold = None
    transaction_threshold = None

    for part in parts:
        part = part.strip()

        # Check for revenue threshold (starts with $)
        if '$' in part:
            # Extract number, removing $ and commas
            revenue_str = part.replace('$', '').replace(',', '').split()[0]
            try:
                revenue_threshold = float(revenue_str)
            except ValueError:
                logger.warning(f"Could not parse revenue threshold from: {part}")

        # Check for transaction threshold (contains "transaction")
        elif 'TRANSACTION' in part:
            # Extract number
            trans_str = part.split()[0]
            try:
                transaction_threshold = int(trans_str)
            except ValueError:
                logger.warning(f"Could not parse transaction threshold from: {part}")

    return {
        'revenue_threshold': revenue_threshold,
        'transaction_threshold': transaction_threshold,
        'operator': operator
    }


def get_state_code_from_name(state_name):
    """
    Convert state name to 2-letter code.
    """
    state_codes = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
        'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
        'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
        'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
        'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
        'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
        'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
        'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Puerto Rico': 'PR',
        'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
        'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
        'Wisconsin': 'WI', 'Wyoming': 'WY'
    }
    return state_codes.get(state_name)


def import_state_nexus_rules():
    """
    Import state nexus rules from JSON file into database.
    """
    # Load JSON file
    json_path = Path(__file__).parent.parent.parent / 'test-data' / 'config' / 'state_sales_tax_nexus.json'

    if not json_path.exists():
        logger.error(f"JSON file not found: {json_path}")
        return

    logger.info(f"Loading state nexus rules from: {json_path}")

    with open(json_path, 'r') as f:
        data = json.load(f)

    states_data = data.get('states', [])
    logger.info(f"Found {len(states_data)} states in JSON")

    # Connect to database
    supabase = get_supabase()

    updated_count = 0
    skipped_count = 0

    for state_info in states_data:
        state_name = state_info.get('state')
        state_code = get_state_code_from_name(state_name)

        if not state_code:
            logger.warning(f"Could not find state code for: {state_name}")
            skipped_count += 1
            continue

        # Parse threshold string
        threshold_str = state_info.get('economic_nexus_threshold', '')
        threshold_data = parse_threshold_string(threshold_str)

        lookback_period = state_info.get('lookback_period')

        logger.info(f"Processing {state_code} ({state_name})")
        logger.info(f"  Lookback: {lookback_period}")
        logger.info(f"  Revenue threshold: ${threshold_data['revenue_threshold']:,.0f}" if threshold_data['revenue_threshold'] else "  No revenue threshold")
        logger.info(f"  Transaction threshold: {threshold_data['transaction_threshold']}" if threshold_data['transaction_threshold'] else "  No transaction threshold")
        logger.info(f"  Operator: {threshold_data['operator'].upper()}")

        try:
            # Update economic_nexus_thresholds table
            # Find current active threshold for this state
            result = supabase.table('economic_nexus_thresholds') \
                .select('*') \
                .eq('state', state_code) \
                .is_('effective_to', 'null') \
                .execute()

            if result.data:
                # Update existing record
                threshold_id = result.data[0]['id']

                update_data = {
                    'lookback_period': lookback_period,
                    'revenue_threshold': threshold_data['revenue_threshold'],
                    'transaction_threshold': threshold_data['transaction_threshold'],
                    'threshold_operator': threshold_data['operator']
                }

                supabase.table('economic_nexus_thresholds') \
                    .update(update_data) \
                    .eq('id', threshold_id) \
                    .execute()

                logger.info(f"  ✓ Updated existing threshold record")
            else:
                # Insert new record
                insert_data = {
                    'state': state_code,
                    'threshold_type': 'revenue' if threshold_data['revenue_threshold'] else 'transaction',
                    'revenue_threshold': threshold_data['revenue_threshold'],
                    'transaction_threshold': threshold_data['transaction_threshold'],
                    'threshold_operator': threshold_data['operator'],
                    'lookback_period': lookback_period,
                    'effective_from': '2018-01-01',  # Approximate - most states enacted around 2018-2020
                    'effective_to': None
                }

                supabase.table('economic_nexus_thresholds') \
                    .insert(insert_data) \
                    .execute()

                logger.info(f"  ✓ Created new threshold record")

            # Update marketplace_facilitator_rules if exclusion info available
            marketplace_excluded = state_info.get('marketplace_transactions_excluded', False)

            # Check if marketplace rule exists
            mf_result = supabase.table('marketplace_facilitator_rules') \
                .select('*') \
                .eq('state', state_code) \
                .is_('effective_to', 'null') \
                .execute()

            if mf_result.data:
                # Update existing
                mf_id = mf_result.data[0]['id']
                supabase.table('marketplace_facilitator_rules') \
                    .update({
                        'exclude_from_liability': marketplace_excluded
                    }) \
                    .eq('id', mf_id) \
                    .execute()

                logger.info(f"  ✓ Updated marketplace facilitator rule")

            updated_count += 1

        except Exception as e:
            logger.error(f"  ✗ Error processing {state_code}: {str(e)}")
            skipped_count += 1
            continue

    logger.info(f"\n{'='*60}")
    logger.info(f"Import complete!")
    logger.info(f"Updated: {updated_count} states")
    logger.info(f"Skipped: {skipped_count} states")
    logger.info(f"{'='*60}")


if __name__ == '__main__':
    import_state_nexus_rules()
