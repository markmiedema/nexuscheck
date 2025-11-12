r"""
Import state research data from JSON files into Supabase

This script reads the parsed JSON files from D:\SALT-Tax-Data\parsed_data
and imports them into the three Supabase tables:
- interest_penalty_rates
- vda_programs
- (penalties are part of interest_penalty_rates table)
"""

import os
import json
import glob
from datetime import datetime
from supabase import create_client

# Supabase credentials
# Try environment variables first, fall back to hardcoded values
SUPABASE_URL = os.getenv('SUPABASE_URL') or "https://aljqqzdpndvuojkwfkfz.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsanFxemRwbmR2dW9qa3dma2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEwODcwMywiZXhwIjoyMDc3Njg0NzAzfQ."
    "pTxo-0dW1MpODJaqDpmG9Q9SCikxL8977s0-UxZ6yBc"
)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing Supabase credentials")
    exit(1)

# Data directory
DATA_DIR = r"D:\SALT-Tax-Data\parsed_data"

# Connect to Supabase
print("Connecting to Supabase...")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✓ Connected\n")

# ============================================================================
# Helper Functions
# ============================================================================

def convert_percentage_to_decimal(value):
    """Convert percentage (10.00) to decimal (0.10)"""
    if value is None:
        return None
    if isinstance(value, str):
        # Don't try to parse text - return None and let it fail with a clear error
        return None
    return float(value) / 100.0

def process_interest_file(file_path):
    """Process an interest JSON file"""
    with open(file_path, 'r') as f:
        data = json.load(f)

    records = []
    for state_data in data:
        # Map the JSON fields to database fields
        record = {
            'state_code': state_data['state_code'],
            'annual_interest_rate': convert_percentage_to_decimal(state_data['annual_interest_rate']),
            'annual_interest_rate_type': state_data.get('annual_interest_rate_type'),
            'periodic_rate': state_data.get('periodic_rate'),
            'periodic_rate_unit': state_data.get('periodic_rate_unit'),
            'calculation_method': state_data['calculation_method'],
            'update_frequency': state_data['update_frequency'],
            'rate_basis': state_data.get('rate_basis'),
            'rate_formula': state_data.get('rate_formula'),
            'interest_begins': state_data.get('interest_begins'),
            'interest_accrual_details': state_data.get('interest_accrual_details'),
            'effective_date': state_data.get('effective_date'),
            'next_change_date': state_data.get('next_change_date'),
            'statute_citation': state_data.get('statute_citation'),
            'statute_url': state_data.get('statute_url'),
            'dor_page_url': state_data.get('dor_page_url'),
            'special_notes': state_data.get('special_notes'),
            'confidence_level': state_data.get('confidence_level'),
            'confidence_reason': state_data.get('confidence_reason'),
            'research_date': state_data['research_date']
        }
        records.append(record)

    return records

def process_penalties_file(file_path):
    """Process a penalties JSON file and return updates for interest_penalty_rates"""
    with open(file_path, 'r') as f:
        data = json.load(f)

    updates = []
    for state_data in data:
        # Map penalty fields
        update = {
            'state_code': state_data['state_code'],
            'late_filing_penalty_rate': convert_percentage_to_decimal(state_data.get('late_filing_penalty_rate')),
            'late_filing_penalty_structure': state_data.get('late_filing_penalty_structure'),
            'late_filing_penalty_tiers': state_data.get('late_filing_penalty_tiers'),
            'late_filing_flat_fee': state_data.get('late_filing_flat_fee'),
            'late_filing_minimum': state_data.get('late_filing_minimum'),
            'late_filing_maximum_pct': convert_percentage_to_decimal(state_data.get('late_filing_maximum_pct')),
            'late_payment_penalty_rate': convert_percentage_to_decimal(state_data.get('late_payment_penalty_rate')),
            'late_payment_penalty_structure': state_data.get('late_payment_penalty_structure'),
            'late_payment_penalty_tiers': state_data.get('late_payment_penalty_tiers'),
            'late_payment_minimum': state_data.get('late_payment_minimum'),
            'late_payment_maximum_pct': convert_percentage_to_decimal(state_data.get('late_payment_maximum_pct')),
            'penalty_stacking_allowed': state_data.get('penalty_stacking_allowed'),
            'penalty_stacking_type': state_data.get('penalty_stacking_type'),
            'penalty_combined_max_pct': convert_percentage_to_decimal(state_data.get('penalty_combined_max_pct')),
            'penalty_basis': state_data.get('penalty_basis'),
            'penalty_calculated_on': state_data.get('penalty_calculated_on'),
            'penalty_waiver_available': state_data.get('penalty_waiver_available'),
            'penalty_waiver_criteria': state_data.get('penalty_waiver_criteria'),
            'regulation_citation': state_data.get('regulation_citation')
        }
        updates.append(update)

    return updates

def process_vda_file(file_path):
    """Process a VDA JSON file"""
    with open(file_path, 'r') as f:
        data = json.load(f)

    records = []
    for state_data in data:
        record = {
            'state_code': state_data['state_code'],
            'program_exists': state_data['program_exists'],
            'program_type': state_data.get('program_type'),
            'program_url': state_data.get('program_url'),
            'penalties_waived': state_data.get('penalties_waived'),
            'penalty_treatment': state_data.get('penalty_treatment'),
            'penalty_waiver_details': state_data.get('penalty_waiver_details'),
            'penalty_quote': state_data.get('penalty_quote'),
            'penalty_source_url': state_data.get('penalty_source_url'),
            'interest_waived': state_data['interest_waived'],
            'interest_treatment': state_data.get('interest_treatment'),
            'interest_reduction_details': state_data.get('interest_reduction_details'),
            'interest_quote': state_data.get('interest_quote'),
            'interest_source_urls': state_data.get('interest_source_urls'),
            'lookback_period_months': state_data.get('lookback_period_months'),
            'lookback_period_description': state_data.get('lookback_period_description'),
            'lookback_formula': state_data.get('lookback_formula'),
            'collected_tax_lookback': state_data.get('collected_tax_lookback'),
            'collected_tax_lookback_description': state_data.get('collected_tax_lookback_description'),
            'collected_tax_penalty_treatment': state_data.get('collected_tax_penalty_treatment'),
            'must_not_be_contacted': state_data.get('must_not_be_contacted'),
            'contact_bar_years': state_data.get('contact_bar_years'),
            'contact_bar_description': state_data.get('contact_bar_description'),
            'must_not_be_under_audit': state_data.get('must_not_be_under_audit'),
            'reasonable_cause_required': state_data.get('reasonable_cause_required'),
            'anonymous_available': state_data.get('anonymous_available'),
            'minimum_liability_amount': state_data.get('minimum_liability_amount'),
            'other_eligibility_requirements': state_data.get('other_eligibility_requirements'),
            'application_online_available': state_data.get('application_online_available'),
            'application_method': state_data.get('application_method'),
            'application_form_number': state_data.get('application_form_number'),
            'application_form_url': state_data.get('application_form_url'),
            'application_email': state_data.get('application_email'),
            'application_phone': state_data.get('application_phone'),
            'application_address': state_data.get('application_address'),
            'application_timeline_days': state_data.get('application_timeline_days'),
            'special_provisions': state_data.get('special_provisions'),
            'payment_plan_available': state_data.get('payment_plan_available'),
            'multistate_program_available': state_data.get('multistate_program_available'),
            'uncertain_tax_program_available': state_data.get('uncertain_tax_program_available'),
            'uncertain_tax_program_description': state_data.get('uncertain_tax_program_description'),
            'vda_statute_citation': state_data.get('vda_statute_citation'),
            'vda_statute_url': state_data.get('vda_statute_url'),
            'vda_page_url': state_data.get('vda_page_url'),
            'vda_form_instructions_url': state_data.get('vda_form_instructions_url'),
            'confidence_level': state_data.get('confidence_level'),
            'confidence_reason': state_data.get('confidence_reason'),
            'research_date': state_data['research_date']
        }
        records.append(record)

    return records

# ============================================================================
# Main Import Logic
# ============================================================================

print("=" * 70)
print("IMPORTING STATE RESEARCH DATA")
print("=" * 70)
print()

# Track statistics
stats = {
    'interest_imported': 0,
    'penalties_updated': 0,
    'vda_imported': 0,
    'errors': []
}

# Get all JSON files
interest_files = glob.glob(os.path.join(DATA_DIR, "*_interest.json"))
penalty_files = glob.glob(os.path.join(DATA_DIR, "*_penalties.json"))
vda_files = glob.glob(os.path.join(DATA_DIR, "*_vda.json"))

print(f"Found {len(interest_files)} interest files")
print(f"Found {len(penalty_files)} penalty files")
print(f"Found {len(vda_files)} VDA files")
print()

# ============================================================================
# Step 1: Import Interest Rates
# ============================================================================

print("=" * 70)
print("STEP 1: Importing Interest Rates")
print("=" * 70)

for file_path in sorted(interest_files):
    filename = os.path.basename(file_path)
    print(f"\nProcessing {filename}...")

    try:
        records = process_interest_file(file_path)

        for record in records:
            state_code = record['state_code']

            # Upsert (insert or update)
            result = supabase.table('interest_penalty_rates').upsert(
                record,
                on_conflict='state_code,effective_date'
            ).execute()

            print(f"  ✓ {state_code}: Interest rate imported")
            stats['interest_imported'] += 1

    except Exception as e:
        error_msg = f"Error processing {filename}: {str(e)}"
        print(f"  ✗ {error_msg}")
        stats['errors'].append(error_msg)

# ============================================================================
# Step 2: Update with Penalty Information
# ============================================================================

print("\n" + "=" * 70)
print("STEP 2: Updating with Penalty Information")
print("=" * 70)

for file_path in sorted(penalty_files):
    filename = os.path.basename(file_path)
    print(f"\nProcessing {filename}...")

    try:
        updates = process_penalties_file(file_path)

        for update in updates:
            state_code = update.pop('state_code')

            # Update the existing record
            result = supabase.table('interest_penalty_rates').update(
                update
            ).eq('state_code', state_code).execute()

            print(f"  ✓ {state_code}: Penalties updated")
            stats['penalties_updated'] += 1

    except Exception as e:
        error_msg = f"Error processing {filename}: {str(e)}"
        print(f"  ✗ {error_msg}")
        stats['errors'].append(error_msg)

# ============================================================================
# Step 3: Import VDA Programs
# ============================================================================

print("\n" + "=" * 70)
print("STEP 3: Importing VDA Programs")
print("=" * 70)

for file_path in sorted(vda_files):
    filename = os.path.basename(file_path)
    print(f"\nProcessing {filename}...")

    try:
        records = process_vda_file(file_path)

        for record in records:
            state_code = record['state_code']

            # Upsert (insert or update)
            result = supabase.table('vda_programs').upsert(
                record,
                on_conflict='state_code'
            ).execute()

            print(f"  ✓ {state_code}: VDA program imported")
            stats['vda_imported'] += 1

    except Exception as e:
        error_msg = f"Error processing {filename}: {str(e)}"
        print(f"  ✗ {error_msg}")
        stats['errors'].append(error_msg)

# ============================================================================
# Summary
# ============================================================================

print("\n" + "=" * 70)
print("IMPORT SUMMARY")
print("=" * 70)
print(f"Interest rates imported: {stats['interest_imported']}")
print(f"Penalty updates applied: {stats['penalties_updated']}")
print(f"VDA programs imported: {stats['vda_imported']}")

if stats['errors']:
    print(f"\n⚠️  Errors encountered: {len(stats['errors'])}")
    for error in stats['errors']:
        print(f"  - {error}")
else:
    print("\n✅ All data imported successfully!")

print("\n" + "=" * 70)
print("NEXT STEPS")
print("=" * 70)
print("1. Run the compatibility view SQL (create_phase2_compatibility_view.sql)")
print("2. Test the Phase 2 calculations with real data")
print("3. Update frontend to display new detailed fields")
print("\n" + "=" * 70)
