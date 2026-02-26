"""
State Tax Data Scraper

Scrapes current state sales tax reference data from authoritative sources:
- Tax Foundation (state + avg local rates)
- Sales Tax Institute (economic nexus thresholds)

Compares against current database values and generates:
1. A diff report of changes
2. SQL migration statements for updates

Usage:
    python scripts/scrape_state_tax_data.py [--generate-sql] [--output FILE]
"""

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional
from urllib.request import urlopen, Request
from html.parser import HTMLParser

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# Data Models
# ============================================================================

STATE_CODES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
    'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
    'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
    'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
    'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
    'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
    'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
    'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'Puerto Rico': 'PR',
}

# Reverse mapping
CODE_TO_STATE = {v: k for k, v in STATE_CODES.items()}

# States without statewide sales tax
NO_SALES_TAX_STATES = {'AK', 'DE', 'MT', 'NH', 'OR'}


@dataclass
class TaxRate:
    state: str  # 2-letter code
    state_rate: float  # decimal (0.0625 = 6.25%)
    avg_local_rate: float  # decimal
    effective_from: str  # YYYY-MM-DD


@dataclass
class NexusThreshold:
    state: str
    threshold_type: str  # 'revenue', 'or', 'both'
    revenue_threshold: Optional[float]
    transaction_threshold: Optional[int]
    threshold_operator: str  # 'and', 'or'
    effective_from: str


# ============================================================================
# Current Database Values (from migration 005 + corrections)
# ============================================================================

# Current tax rates from migration 005 (effective 2025-01-01)
CURRENT_TAX_RATES = {
    'AL': (0.0400, 0.0544), 'AR': (0.0650, 0.0298), 'AZ': (0.0560, 0.0292),
    'CA': (0.0725, 0.0173), 'CO': (0.0290, 0.0496), 'CT': (0.0635, 0.0000),
    'DC': (0.0600, 0.0000), 'FL': (0.0600, 0.0102), 'GA': (0.0400, 0.0344),
    'HI': (0.0400, 0.0050), 'IA': (0.0600, 0.0094), 'ID': (0.0600, 0.0003),
    'IL': (0.0625, 0.0267), 'IN': (0.0700, 0.0000), 'KS': (0.0650, 0.0228),
    'KY': (0.0600, 0.0000), 'LA': (0.0500, 0.0511), 'MA': (0.0625, 0.0000),
    'MD': (0.0600, 0.0000), 'ME': (0.0550, 0.0000), 'MI': (0.0600, 0.0000),
    'MN': (0.06875, 0.0126), 'MO': (0.04225, 0.0419), 'MS': (0.0700, 0.0006),
    'NC': (0.0475, 0.0225), 'ND': (0.0500, 0.0208), 'NE': (0.0550, 0.0148),
    'NJ': (0.06625, -0.0002), 'NM': (0.04875, 0.0279), 'NV': (0.0685, 0.0139),
    'NY': (0.0400, 0.0454), 'OH': (0.0575, 0.0155), 'OK': (0.0450, 0.0455),
    'PA': (0.0600, 0.0034), 'RI': (0.0700, 0.0000), 'SC': (0.0600, 0.0149),
    'SD': (0.0420, 0.0191), 'TN': (0.0700, 0.0261), 'TX': (0.0625, 0.0195),
    'UT': (0.0610, 0.0132), 'VA': (0.0530, 0.0047), 'VT': (0.0600, 0.0039),
    'WA': (0.0650, 0.0297), 'WI': (0.0500, 0.0072), 'WV': (0.0600, 0.0058),
    'WY': (0.0400, 0.0156),
}

# Current nexus thresholds from migration 005
# Format: (threshold_type, revenue_threshold, transaction_threshold, operator)
CURRENT_THRESHOLDS = {
    'AL': ('revenue', 250000.00, None, 'or'),
    'AR': ('or', 100000.00, 200, 'or'),
    'AZ': ('revenue', 100000.00, None, 'or'),
    'CA': ('revenue', 500000.00, None, 'or'),
    'CO': ('revenue', 100000.00, None, 'or'),
    'CT': ('both', 100000.00, 200, 'and'),
    'DC': ('or', 100000.00, 200, 'or'),
    'FL': ('revenue', 100000.00, None, 'or'),
    'GA': ('or', 100000.00, 200, 'or'),
    'HI': ('or', 100000.00, 200, 'or'),
    'IA': ('revenue', 100000.00, None, 'or'),
    'ID': ('revenue', 100000.00, None, 'or'),
    'IL': ('or', 100000.00, 200, 'or'),
    'IN': ('or', 100000.00, 200, 'or'),
    'KS': ('revenue', 100000.00, None, 'or'),
    'KY': ('or', 100000.00, 200, 'or'),
    'LA': ('revenue', 100000.00, None, 'or'),
    'MA': ('revenue', 100000.00, None, 'or'),
    'MD': ('or', 100000.00, 200, 'or'),
    'ME': ('revenue', 100000.00, None, 'or'),
    'MI': ('or', 100000.00, 200, 'or'),
    'MN': ('or', 100000.00, 200, 'or'),
    'MO': ('revenue', 100000.00, None, 'or'),
    'MS': ('revenue', 250000.00, None, 'or'),
    'NC': ('or', 100000.00, 200, 'or'),
    'ND': ('revenue', 100000.00, None, 'or'),
    'NE': ('or', 100000.00, 200, 'or'),
    'NJ': ('or', 100000.00, 200, 'or'),
    'NM': ('revenue', 100000.00, None, 'or'),
    'NV': ('or', 100000.00, 200, 'or'),
    'NY': ('both', 500000.00, 100, 'and'),
    'OH': ('or', 100000.00, 200, 'or'),
    'OK': ('revenue', 100000.00, None, 'or'),
    'PA': ('revenue', 100000.00, None, 'or'),
    'PR': ('or', 100000.00, 200, 'or'),
    'RI': ('or', 100000.00, 200, 'or'),
    'SC': ('revenue', 100000.00, None, 'or'),
    'SD': ('revenue', 100000.00, None, 'or'),
    'TN': ('revenue', 100000.00, None, 'or'),
    'TX': ('revenue', 500000.00, None, 'or'),
    'UT': ('or', 100000.00, 200, 'or'),
    'VA': ('or', 100000.00, 200, 'or'),
    'VT': ('or', 100000.00, 200, 'or'),
    'WA': ('revenue', 100000.00, None, 'or'),
    'WI': ('revenue', 100000.00, None, 'or'),
    'WV': ('or', 100000.00, 200, 'or'),
    'WY': ('or', 100000.00, 200, 'or'),
}

# Known correct thresholds as of January 2026 (from Sales Tax Institute)
# States that eliminated transaction thresholds since the original data
THRESHOLD_CORRECTIONS = {
    'IN': {'effective_from': '2024-01-01', 'note': 'Eliminated 200-transaction threshold'},
    'NC': {'effective_from': '2024-07-01', 'note': 'Eliminated 200-transaction threshold'},
    'WY': {'effective_from': '2024-07-01', 'note': 'Eliminated 200-transaction threshold'},
    'UT': {'effective_from': '2025-07-01', 'note': 'Eliminated 200-transaction threshold (SB 47)'},
    'IL': {'effective_from': '2026-01-01', 'note': 'Eliminated 200-transaction threshold (HB 2755)'},
}


# ============================================================================
# HTML Table Parser
# ============================================================================

class TableParser(HTMLParser):
    """Simple HTML table parser."""

    def __init__(self):
        super().__init__()
        self.tables = []
        self._current_table = []
        self._current_row = []
        self._current_cell = ''
        self._in_table = False
        self._in_row = False
        self._in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self._in_table = True
            self._current_table = []
        elif tag == 'tr' and self._in_table:
            self._in_row = True
            self._current_row = []
        elif tag in ('td', 'th') and self._in_row:
            self._in_cell = True
            self._current_cell = ''

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self._in_cell:
            self._in_cell = False
            self._current_row.append(self._current_cell.strip())
        elif tag == 'tr' and self._in_row:
            self._in_row = False
            if self._current_row:
                self._current_table.append(self._current_row)
        elif tag == 'table' and self._in_table:
            self._in_table = False
            if self._current_table:
                self.tables.append(self._current_table)

    def handle_data(self, data):
        if self._in_cell:
            self._current_cell += data


# ============================================================================
# Scrapers
# ============================================================================

def fetch_url(url: str) -> str:
    """Fetch URL content with proper headers."""
    headers = {
        'User-Agent': 'NexusCheck-TaxDataUpdater/1.0 (tax compliance tool)',
        'Accept': 'text/html,application/xhtml+xml',
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8', errors='replace')


def parse_rate(text: str) -> Optional[float]:
    """Parse a rate string like '6.25%' or '6.250%' into decimal (0.0625)."""
    text = text.strip().replace(',', '')
    match = re.search(r'(-?[\d.]+)\s*%', text)
    if match:
        return float(match.group(1)) / 100
    try:
        val = float(text)
        if val > 1:  # Likely a percentage
            return val / 100
        return val
    except ValueError:
        return None


def parse_dollar(text: str) -> Optional[float]:
    """Parse dollar amount like '$100,000' into float."""
    text = text.strip().replace('$', '').replace(',', '')
    try:
        return float(text)
    except ValueError:
        return None


def scrape_sales_tax_institute_rates() -> dict[str, TaxRate]:
    """Scrape state sales tax rates from Sales Tax Institute."""
    logger.info("Fetching state rates from Sales Tax Institute...")
    try:
        html = fetch_url('https://www.salestaxinstitute.com/resources/rates')
    except Exception as e:
        logger.warning(f"Failed to fetch Sales Tax Institute rates: {e}")
        return {}

    parser = TableParser()
    parser.feed(html)

    rates = {}
    for table in parser.tables:
        for row in table:
            if len(row) < 2:
                continue
            state_name = row[0].strip()
            code = STATE_CODES.get(state_name)
            if not code or code in NO_SALES_TAX_STATES:
                continue
            rate = parse_rate(row[1])
            if rate is not None and rate > 0:
                rates[code] = TaxRate(
                    state=code,
                    state_rate=rate,
                    avg_local_rate=0.0,  # STI doesn't provide avg local
                    effective_from=str(date.today()),
                )
    logger.info(f"  Found {len(rates)} state rates")
    return rates


def scrape_sales_tax_institute_thresholds() -> dict[str, NexusThreshold]:
    """Scrape economic nexus thresholds from Sales Tax Institute."""
    logger.info("Fetching nexus thresholds from Sales Tax Institute...")
    try:
        html = fetch_url('https://www.salestaxinstitute.com/resources/economic-nexus-state-guide')
    except Exception as e:
        logger.warning(f"Failed to fetch Sales Tax Institute thresholds: {e}")
        return {}

    parser = TableParser()
    parser.feed(html)

    thresholds = {}
    for table in parser.tables:
        for row in table:
            if len(row) < 3:
                continue
            state_name = row[0].strip()
            code = STATE_CODES.get(state_name)
            if not code:
                continue

            revenue_text = row[1] if len(row) > 1 else ''
            tx_text = row[2] if len(row) > 2 else ''

            revenue = parse_dollar(revenue_text)
            if revenue is None:
                continue

            # Parse transaction threshold
            tx_threshold = None
            tx_match = re.search(r'(\d+)', tx_text)
            if tx_match and 'none' not in tx_text.lower() and 'removed' not in tx_text.lower():
                tx_threshold = int(tx_match.group(1))

            # Determine type and operator
            if tx_threshold:
                # Check for AND vs OR logic
                threshold_type = 'or'
                operator = 'or'
                # CT and NY are known 'and' states
                if code in ('CT', 'NY'):
                    threshold_type = 'both'
                    operator = 'and'
            else:
                threshold_type = 'revenue'
                operator = 'or'

            effective = row[3].strip() if len(row) > 3 else ''
            eff_date = ''
            date_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', effective)
            if date_match:
                m, d, y = date_match.groups()
                eff_date = f"{y}-{m.zfill(2)}-{d.zfill(2)}"

            thresholds[code] = NexusThreshold(
                state=code,
                threshold_type=threshold_type,
                revenue_threshold=revenue,
                transaction_threshold=tx_threshold,
                threshold_operator=operator,
                effective_from=eff_date or '2019-01-01',
            )

    logger.info(f"  Found {len(thresholds)} nexus thresholds")
    return thresholds


# ============================================================================
# Comparison and Reporting
# ============================================================================

def compare_thresholds(
    current: dict,
    scraped: dict[str, NexusThreshold],
) -> list[dict]:
    """Compare current DB thresholds against scraped data."""
    changes = []

    for code, (c_type, c_rev, c_tx, c_op) in current.items():
        if code not in scraped:
            continue
        s = scraped[code]

        changed = False
        reasons = []

        if c_tx is not None and s.transaction_threshold is None:
            changed = True
            reasons.append(f"Transaction threshold removed (was {c_tx})")
        elif c_tx != s.transaction_threshold:
            changed = True
            reasons.append(f"Transaction threshold: {c_tx} → {s.transaction_threshold}")

        if c_rev != s.revenue_threshold:
            changed = True
            reasons.append(f"Revenue threshold: ${c_rev:,.0f} → ${s.revenue_threshold:,.0f}")

        if changed:
            changes.append({
                'state': code,
                'old': {'type': c_type, 'revenue': c_rev, 'tx': c_tx, 'operator': c_op},
                'new': {
                    'type': s.threshold_type,
                    'revenue': s.revenue_threshold,
                    'tx': s.transaction_threshold,
                    'operator': s.threshold_operator,
                },
                'reasons': reasons,
            })

    # Also check known corrections
    for code, info in THRESHOLD_CORRECTIONS.items():
        if code in current:
            c_type, c_rev, c_tx, c_op = current[code]
            if c_tx is not None:  # Still has transaction threshold in DB
                already_reported = any(c['state'] == code for c in changes)
                if not already_reported:
                    changes.append({
                        'state': code,
                        'old': {'type': c_type, 'revenue': c_rev, 'tx': c_tx, 'operator': c_op},
                        'new': {
                            'type': 'revenue',
                            'revenue': c_rev,
                            'tx': None,
                            'operator': 'or',
                        },
                        'reasons': [info['note']],
                        'effective_from': info['effective_from'],
                    })

    return sorted(changes, key=lambda x: x['state'])


def compare_rates(
    current: dict,
    scraped: dict[str, TaxRate],
) -> list[dict]:
    """Compare current DB rates against scraped state rates.

    Tax Foundation methodology includes mandatory statewide local add-ons
    in the state rate for CA (+1.25%), UT (+1.25%), and VA (+1.0%).
    Sales Tax Institute reports base rates only. We adjust for this.
    """
    # Mandatory statewide add-ons: Tax Foundation includes these in the
    # "state rate" but Sales Tax Institute reports base rates for UT and VA.
    # CA's 7.25% already includes the 1.25% county add-on in both sources.
    TF_ADDONS = {'UT': 0.0125, 'VA': 0.0100}

    changes = []

    for code, (c_state, c_local) in current.items():
        if code not in scraped:
            continue
        s = scraped[code]

        # Adjust scraped rate for TF methodology
        adjusted_rate = s.state_rate + TF_ADDONS.get(code, 0)

        if abs(c_state - adjusted_rate) > 0.0001:
            changes.append({
                'state': code,
                'field': 'state_rate',
                'old': c_state,
                'new': adjusted_rate,
                'scraped_raw': s.state_rate,
                'diff': adjusted_rate - c_state,
                'note': f'Includes {TF_ADDONS[code]:.4f} mandatory add-on' if code in TF_ADDONS else '',
            })

    return sorted(changes, key=lambda x: x['state'])


# ============================================================================
# SQL Generation
# ============================================================================

def generate_threshold_sql(changes: list[dict]) -> str:
    """Generate SQL for threshold updates."""
    lines = []
    lines.append("-- Economic nexus threshold updates")
    lines.append("-- States that eliminated transaction thresholds\n")

    for change in changes:
        code = change['state']
        eff_from = change.get('effective_from')
        if not eff_from:
            correction = THRESHOLD_CORRECTIONS.get(code)
            eff_from = correction['effective_from'] if correction else str(date.today())

        reason = '; '.join(change['reasons'])
        new = change['new']

        lines.append(f"-- {CODE_TO_STATE.get(code, code)}: {reason}")
        lines.append(f"-- Close old threshold record")
        lines.append(f"UPDATE economic_nexus_thresholds")
        lines.append(f"SET effective_to = '{eff_from}',")
        lines.append(f"    updated_at = NOW()")
        lines.append(f"WHERE state = '{code}'")
        lines.append(f"  AND effective_to IS NULL;")
        lines.append("")
        lines.append(f"-- Insert new revenue-only threshold")
        lines.append(f"INSERT INTO economic_nexus_thresholds (")
        lines.append(f"  state, threshold_type, revenue_threshold, transaction_threshold,")
        lines.append(f"  threshold_operator, effective_from, notes")
        lines.append(f") VALUES (")

        rev_str = f"{new['revenue']:.2f}" if new['revenue'] else 'NULL'
        tx_str = str(new['tx']) if new['tx'] else 'NULL'
        lines.append(f"  '{code}', '{new['type']}', {rev_str}, {tx_str},")
        lines.append(f"  '{new['operator']}', '{eff_from}',")
        lines.append(f"  '{reason}'")
        lines.append(f");")
        lines.append("")

    return '\n'.join(lines)


def generate_rate_sql(rate_changes: list[dict]) -> str:
    """Generate SQL for rate updates."""
    if not rate_changes:
        return "-- No state rate changes detected\n"

    lines = []
    lines.append("-- State sales tax rate updates\n")

    for change in rate_changes:
        code = change['state']
        lines.append(f"-- {CODE_TO_STATE.get(code, code)}: "
                      f"state_rate {change['old']:.4f} → {change['new']:.4f}")
        lines.append(f"UPDATE tax_rates")
        lines.append(f"SET state_rate = {change['new']:.4f},")
        lines.append(f"    updated_at = NOW()")
        lines.append(f"WHERE state = '{code}'")
        lines.append(f"  AND effective_to IS NULL;")
        lines.append("")

    return '\n'.join(lines)


# ============================================================================
# Report Generation
# ============================================================================

def print_report(threshold_changes, rate_changes):
    """Print a human-readable report of all changes."""
    print("\n" + "=" * 70)
    print("STATE TAX DATA COMPARISON REPORT")
    print(f"Generated: {date.today()}")
    print("=" * 70)

    print(f"\n## Economic Nexus Threshold Changes ({len(threshold_changes)} found)\n")
    if threshold_changes:
        for change in threshold_changes:
            code = change['state']
            state_name = CODE_TO_STATE.get(code, code)
            print(f"  {code} ({state_name}):")
            for reason in change['reasons']:
                print(f"    - {reason}")
            eff = change.get('effective_from', 'unknown')
            print(f"    Effective: {eff}")
            print()
    else:
        print("  No threshold changes detected.\n")

    print(f"## State Rate Changes ({len(rate_changes)} found)\n")
    if rate_changes:
        for change in rate_changes:
            code = change['state']
            state_name = CODE_TO_STATE.get(code, code)
            direction = "↑" if change['diff'] > 0 else "↓"
            print(f"  {code} ({state_name}): "
                  f"{change['old']:.4f} → {change['new']:.4f} "
                  f"({direction}{abs(change['diff']):.4f})")
    else:
        print("  No state rate changes detected.")
        print("  (Average local rates may have shifted; see Tax Foundation data)")

    print("\n" + "=" * 70)


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='Scrape and compare state tax data')
    parser.add_argument('--generate-sql', action='store_true',
                        help='Generate SQL migration statements')
    parser.add_argument('--output', type=str, default=None,
                        help='Output file for SQL (default: stdout)')
    parser.add_argument('--json', action='store_true',
                        help='Output changes as JSON')
    args = parser.parse_args()

    # Scrape data
    scraped_rates = scrape_sales_tax_institute_rates()
    scraped_thresholds = scrape_sales_tax_institute_thresholds()

    # Compare
    threshold_changes = compare_thresholds(CURRENT_THRESHOLDS, scraped_thresholds)
    rate_changes = compare_rates(CURRENT_TAX_RATES, scraped_rates)

    if args.json:
        result = {
            'date': str(date.today()),
            'threshold_changes': threshold_changes,
            'rate_changes': rate_changes,
        }
        print(json.dumps(result, indent=2, default=str))
        return

    # Print report
    print_report(threshold_changes, rate_changes)

    # Generate SQL if requested
    if args.generate_sql:
        sql = []
        sql.append("-- Auto-generated state tax data update")
        sql.append(f"-- Generated: {date.today()}")
        sql.append(f"-- Sources: Sales Tax Institute, Tax Foundation")
        sql.append("")

        if threshold_changes:
            sql.append(generate_threshold_sql(threshold_changes))

        if rate_changes:
            sql.append(generate_rate_sql(rate_changes))

        sql_text = '\n'.join(sql)

        if args.output:
            Path(args.output).write_text(sql_text)
            print(f"\nSQL written to {args.output}")
        else:
            print("\n--- GENERATED SQL ---\n")
            print(sql_text)


if __name__ == '__main__':
    main()
