# State Detail Page Design

**Date:** January 4, 2025
**Status:** Design Complete - Ready for Implementation
**Designer:** Collaborative design with user

## Overview

Design for the state-specific detail page that users reach by clicking on any state from the State-by-State Results table. This page combines comprehensive sales analysis with compliance requirements information.

## Design Principles

1. **Both Analysis and Compliance** - Equal weight to transaction data analysis and compliance obligations
2. **Year-by-Year View** - Support multi-year lookback analysis with year filtering
3. **Comprehensive but Focused** - Show depth without overwhelming (expandable sections)
4. **Action-Oriented** - Clear guidance on what users need to do based on nexus status

## Critical Business Rule: Sticky Nexus

**Important:** Once economic nexus is established in a state, it typically persists until the business formally closes their state account. This affects the calculation logic:

- Year 1: $150k → Nexus established
- Year 2: $60k → Nexus still active (doesn't fall off)
- Year 3: $80k → Nexus still active

The UI must communicate this clearly and calculate nexus year-by-year while tracking when it was first established.

---

## Page Route

`/analysis/[analysisId]/states/[stateCode]`

**Example:** `/analysis/abc-123/states/CA`

---

## 1. Header Section

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Analysis Name > State Results > California              │ ← Breadcrumb
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔵 California                            [← Back]      │ ← Large state name + nexus badge
│  🔴 Has Nexus  |  $285,000 Total  |  41 Transactions   │ ← Quick stats bar
│                                                          │
│  📅 Year: [2024 ▼]  Analysis Period: Jan 1 - Dec 31    │ ← Year selector
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Components

**Breadcrumb Navigation:**
- Format: `Analysis Name > State Results > [State Name]`
- Each segment clickable to navigate back
- Provides context and easy navigation

**State Header:**
- State name as H1
- Nexus status badge (color-coded)
  - 🔴 Red = Has Nexus
  - 🟡 Yellow = Approaching (90-100% of threshold)
  - 🟢 Green = No Nexus
- Back button returns to state results table

**Quick Stats Bar:**
- Total sales for selected year
- Total transaction count for selected year
- Updates when year selector changes

**Year Selector:**
- Dropdown showing only years present in uploaded data
- Defaults to most recent year
- Shows analysis period for context: "Analysis Period: [start] - [end]"
- **Behavior:** Changing year updates all sections below (sales analysis, chart, transactions)

---

## 2. Sales Analysis Section

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Sales Analysis - 2024                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ $85,000  │  │   15     │  │ $60,000  │  │ $25,000 ││
│  │Total Sales│  │Trans.    │  │Direct    │  │Marketplace││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                          │
│  Threshold Status                                        │
│  ├─ Threshold: $500,000                                 │
│  ├─ Your Sales: $85,000 (17% of threshold)             │
│  └─ Amount until nexus: $415,000                        │
│  Progress bar: [████░░░░░░░░░░░░░░] 17%                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Summary Cards (Top Row)

Four metric cards displaying:
1. **Total Sales** - Sum of all sales_amount for state/year
2. **Transaction Count** - Number of transactions for state/year
3. **Direct Sales** - Sum where sales_channel = 'direct'
4. **Marketplace Sales** - Sum where sales_channel = 'marketplace'

**Styling:** Card components with large numbers, small labels

### Threshold Status Box

Displays nexus threshold proximity with:
- State's threshold amount (from economic_nexus_thresholds table)
- Current sales as dollar amount and percentage
- Amount remaining (if below threshold) OR amount over (if above threshold)
- Visual progress bar showing percentage of threshold reached

**Color Coding:**
- Green bar: < 90% of threshold
- Yellow bar: 90-100% of threshold
- Red bar: > 100% of threshold

---

## 3. Monthly Sales Trend Chart

### Layout
```
┌────────────────────────────────────────────────────────┐
│  Monthly Sales Trend                                    │
│  ┌────────────────────────────────────────────────────┐│
│  │        [Line chart showing monthly sales]           ││
│  │  $     ─ ─ ─ ─ ─ ─ Threshold ($500k) ─ ─ ─ ─      ││
│  │  │           ●                                       ││
│  │  │        ●     ●        ●                          ││
│  │  │     ●           ●  ●                             ││
│  │  └──────────────────────────────────────────────────││
│  │    Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec  ││
│  └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

### Chart Specifications

**Chart Type:** Line chart

**Data:**
- X-axis: Months (Jan-Dec)
- Y-axis: Sales amount in dollars
- Data points: Monthly sales totals

**Visual Elements:**
1. **Line with points** showing monthly sales
2. **Horizontal dashed line** showing threshold amount
3. **Special annotation** if threshold was crossed (mark the specific month)
4. **Tooltip on hover** showing exact amount and transaction count

**Special Cases:**
- If nexus crossed during the year: Highlight the month where running total exceeded threshold
- If sparse data: Show only months with transactions, not all 12 months

**Component:** Use recharts library (LineChart component)

---

## 4. Transaction List (Expandable)

### Collapsed State (Default)
```
┌─────────────────────────────────────────────────────────┐
│  [▼ View All Transactions (15)]  (Collapsed by default) │
└─────────────────────────────────────────────────────────┘
```

Button shows transaction count in parentheses.

### Expanded State
```
┌─────────────────────────────────────────────────────────┐
│  [▲ Hide Transactions]                    [Export CSV]  │
├─────────────────────────────────────────────────────────┤
│  Search: [_____________]  Channel: [All ▼]              │
├─────────────────────────────────────────────────────────┤
│  Date ↓    Trans ID     Customer     Amount    Channel  │Running Total│
├─────────────────────────────────────────────────────────┤
│  2024-01-15  TX001  CUST-CA-001  $22,000   Direct      $22,000      │
│  2024-04-14  TX002  CUST-CA-002  $21,500   Marketplace $43,500      │
│  2024-07-22  TX003  CUST-CA-003  $20,500   Direct      $64,000      │
│  2024-10-05  TX004  CUST-CA-004  $21,000   Marketplace $85,000      │
├─────────────────────────────────────────────────────────┤
│  Showing 4 of 4 transactions                             │
│  Items per page: [10 ▼] [25] [50] [All]                │
└─────────────────────────────────────────────────────────┘
```

### Table Columns

1. **Date** - transaction_date (sortable, default: descending)
2. **Transaction ID** - transaction_id from upload
3. **Customer ID** - customer_id from upload
4. **Amount** - sales_amount (sortable)
5. **Sales Channel** - Direct or Marketplace
6. **Running Total** ⭐ - Cumulative sales up to this transaction

**Running Total Column:** Key insight - shows progression toward threshold and identifies exactly when nexus was crossed.

### Table Features

**Filtering:**
- **Search bar** - Filters by Transaction ID or Customer ID (client-side)
- **Channel filter** - Dropdown: All, Direct, Marketplace

**Sorting:**
- Click column headers to sort
- Default: Date descending (most recent first)
- Sortable columns: Date, Amount

**Pagination:**
- Dropdown options: 10, 25, 50, All per page
- Default: 25 per page
- Show "Showing X of Y transactions"

**Export:**
- "Export CSV" button downloads all transactions for this state/year
- Filename format: `{state_code}_{year}_transactions.csv`

**Visual Highlighting:**
- If nexus was crossed during this year: Highlight the row where running total exceeds threshold
- Highlighting: Yellow background or left border

### Edge Cases

**Zero Transactions:**
- Don't show transaction table section at all
- Sales Analysis section shows $0 and "No transactions recorded"

**Large Transaction Count (100+):**
- Default pagination: 25 per page
- Consider virtual scrolling for performance (future enhancement)

---

## 5. Compliance Requirements Section

This section appears below Sales Analysis and changes dynamically based on nexus status.

### 5A. States WITH Nexus (Red Status)

```
┌─────────────────────────────────────────────────────────┐
│  📋 Compliance Requirements                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠️ Action Required - Nexus Established                 │
│                                                          │
│  Nexus first established: 2022                          │
│  Current year status: Active (continuing from 2022)     │
│                                                          │
│  ⚠️ Important: Once nexus is established, it typically  │
│  persists until you formally close your state account.  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Required Actions                                        │
│  ─────────────────                                       │
│  □ Register for California sales tax permit             │
│    Register by: 30 days from nexus date                 │
│    → [Register Online - CA DOR Portal]                  │
│                                                          │
│  □ Collect sales tax on future California sales         │
│    Effective: Date nexus was established                │
│                                                          │
│  □ File sales tax returns                               │
│    Filing frequency: Based on your volume               │
│    First filing deadline: TBD after registration        │
│    → [View Filing Requirements]                         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  State Tax Information                                   │
│  ─────────────────────                                   │
│  State Tax Rate: 7.25%                                  │
│  Average Local Rate: 2.43%                              │
│  Combined Rate: 9.68%                                   │
│                                                          │
│  Economic Nexus Threshold: $500,000 revenue             │
│  Transaction Threshold: N/A                             │
│  Threshold Type: Revenue only (OR logic)                │
│                                                          │
│  Registration Fee: $0                                   │
│  Filing Frequencies: Monthly, Quarterly, Annual         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Helpful Resources                                       │
│  ─────────────────                                       │
│  → California Department of Tax and Fee Administration   │
│  → Sales Tax Registration Portal                        │
│  → Filing Frequency Guidelines                          │
│  → FAQ: Economic Nexus in California                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Components

**Status Banner:**
- Alert styling (red/orange accent)
- Shows "Action Required - Nexus Established"
- Displays first year nexus was established
- Shows current year status (especially if continuing from previous year)
- Educational note about nexus persistence

**Required Actions Checklist:**
- Visual checkbox list (not interactive for MVP)
- Three standard actions:
  1. Register for state sales tax permit
  2. Collect sales tax on future sales
  3. File sales tax returns
- Each action includes:
  - Clear description
  - Timeline/deadline
  - Link to relevant resource (state portal)

**State Tax Information:**
- Tax rates from database (state_rate, avg_local_rate, combined)
- Threshold information (revenue and/or transaction thresholds)
- Threshold operator (OR/AND)
- Registration fee
- Available filing frequencies

**Helpful Resources:**
- Links to state Department of Revenue website
- Registration portal
- Filing guidance
- FAQ/help resources

---

### 5B. States APPROACHING Nexus (Yellow Status)

```
┌─────────────────────────────────────────────────────────┐
│  📋 Compliance Requirements                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⚠️ Approaching Nexus Threshold                         │
│                                                          │
│  Your sales: $95,000 (95% of $100,000 threshold)       │
│  Amount until nexus: $5,000                             │
│                                                          │
│  You're close to triggering economic nexus in Ohio.     │
│  With just $5,000 more in sales, you'll need to         │
│  register and collect tax.                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Prepare for Nexus                                       │
│  ──────────────────                                      │
│  When you cross the threshold, you'll need to:          │
│                                                          │
│  1. Register for Ohio sales tax permit within 30 days   │
│  2. Begin collecting sales tax on Ohio sales            │
│  3. File returns based on your sales volume             │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  State Tax Information                                   │
│  ──────────────────                                      │
│  [Same format as "Has Nexus" section]                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Helpful Resources                                       │
│  ──────────────────                                      │
│  [Same format as "Has Nexus" section]                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Key Differences from "Has Nexus"

- Warning tone (yellow/orange) not urgent action required
- Shows gap to threshold prominently
- "Prepare for Nexus" section instead of "Required Actions"
- Future-oriented language ("When you cross..." not "You must...")
- Still includes full tax information for planning

---

### 5C. States with NO Nexus (Green Status - Below 90%)

```
┌─────────────────────────────────────────────────────────┐
│  📋 Compliance Requirements                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ No Nexus - No Action Required                       │
│                                                          │
│  Your sales: $45,000 (45% of $100,000 threshold)       │
│  Amount until nexus: $55,000                            │
│                                                          │
│  You have not established economic nexus in New Jersey. │
│  No compliance obligations at this time.                │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  State Tax Information                                   │
│  ──────────────────                                      │
│  Economic Nexus Threshold: $100,000 revenue             │
│                              OR 200 transactions         │
│                                                          │
│  State Tax Rate: 6.625%                                 │
│  Local Tax: None                                        │
│  Combined Rate: 6.625%                                  │
│                                                          │
│  Note: If you reach the threshold, you'll need to       │
│  register within 30 days and begin collecting tax.      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Helpful Resources                                       │
│  ──────────────────                                      │
│  → New Jersey Division of Taxation                      │
│  → Economic Nexus Overview                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Key Differences

- Positive tone with green checkmark
- Shows gap to threshold for monitoring
- Minimal compliance section (just reference info)
- Brief note about what happens if threshold is reached
- Fewer resources (just state website and overview)

---

### 5D. States with ZERO Sales (Green Status)

```
┌─────────────────────────────────────────────────────────┐
│  📋 Compliance Requirements                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ℹ️ No Sales Activity                                   │
│                                                          │
│  No transactions recorded in Texas for 2024.            │
│                                                          │
│  Ready to expand to this state? Here's what you'll      │
│  need to know when you reach the nexus threshold.       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  State Tax Information                                   │
│  ──────────────────                                      │
│  Economic Nexus Threshold: $500,000 revenue             │
│                                                          │
│  State Tax Rate: 6.25%                                  │
│  Average Local Rate: 1.94%                              │
│  Combined Rate: 8.19%                                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Helpful Resources                                       │
│  ──────────────────                                      │
│  → Texas Comptroller of Public Accounts                 │
│  → Sales Tax Information                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Key Differences

- Informational tone (blue info icon)
- **No Sales Analysis section shown** (page starts with compliance section)
- Expansion-oriented messaging
- Just basic threshold and tax rate info
- Minimal resources

---

## 6. Backend Requirements

### New API Endpoint

**Route:** `GET /api/v1/analyses/{analysis_id}/states/{state_code}`

**Query Parameters:**
- `year` (optional, integer) - Filter to specific year. If omitted, return all years.

**Authentication:** Requires JWT token, validates user owns the analysis

**Response Structure:**

```json
{
  "state_code": "CA",
  "state_name": "California",
  "analysis_id": "abc-123",
  "analysis_period": {
    "start_date": "2022-01-01",
    "end_date": "2024-12-31",
    "years_available": [2022, 2023, 2024]
  },
  "year_data": [
    {
      "year": 2024,
      "nexus_status": "approaching",
      "nexus_first_established_year": null,
      "summary": {
        "total_sales": 85000.00,
        "transaction_count": 15,
        "direct_sales": 60000.00,
        "marketplace_sales": 25000.00
      },
      "threshold_info": {
        "revenue_threshold": 500000,
        "transaction_threshold": null,
        "threshold_operator": "or",
        "percentage_of_threshold": 17.0,
        "amount_until_nexus": 415000.00,
        "amount_over_nexus": null,
        "approaching": false
      },
      "monthly_sales": [
        {
          "month": "2024-01",
          "sales": 7500.00,
          "transaction_count": 2
        },
        {
          "month": "2024-02",
          "sales": 6200.00,
          "transaction_count": 1
        }
        // ... all 12 months (include 0 for months with no sales)
      ],
      "transactions": [
        {
          "transaction_id": "TX001",
          "transaction_date": "2024-01-15",
          "customer_id": "CUST-CA-001",
          "sales_amount": 22000.00,
          "sales_channel": "direct",
          "running_total": 22000.00
        }
        // ... all transactions for state/year, ordered by date
      ]
    }
    // ... data for other years (2023, 2022)
  ],
  "compliance_info": {
    "tax_rates": {
      "state_rate": 7.25,
      "avg_local_rate": 2.43,
      "combined_rate": 9.68
    },
    "threshold_info": {
      "revenue_threshold": 500000,
      "transaction_threshold": null,
      "threshold_operator": "or"
    },
    "registration_info": {
      "registration_fee": 0,
      "filing_frequencies": ["Monthly", "Quarterly", "Annual"],
      "registration_url": "https://onlineservices.cdtfa.ca.gov/",
      "dor_website": "https://www.cdtfa.ca.gov/"
    }
  }
}
```

### Database Queries

**1. Get all transactions for state:**
```python
result = supabase.table('sales_transactions')\
    .select('transaction_id, transaction_date, customer_id, sales_amount, sales_channel')\
    .eq('analysis_id', analysis_id)\
    .eq('customer_state', state_code)\
    .order('transaction_date')\
    .execute()
```

**2. Get threshold information:**
```python
result = supabase.table('economic_nexus_thresholds')\
    .select('*')\
    .eq('state', state_code)\
    .is_('effective_to', 'null')\
    .execute()
```

**3. Get tax rates:**
```python
result = supabase.table('tax_rates')\
    .select('state_rate, avg_local_rate')\
    .eq('state', state_code)\
    .execute()
```

**4. Get state name:**
```python
result = supabase.table('states')\
    .select('code, name')\
    .eq('code', state_code)\
    .execute()
```

**5. Get analysis metadata:**
```python
result = supabase.table('analyses')\
    .select('id, user_id, created_at')\
    .eq('id', analysis_id)\
    .eq('user_id', user_id)\
    .execute()
```

### Backend Processing Logic

#### Year-by-Year Calculation

For each year present in the dataset:

1. **Filter transactions** to calendar year (Jan 1 - Dec 31)
2. **Calculate summary metrics:**
   - Total sales (sum of sales_amount)
   - Transaction count
   - Direct sales (sum where sales_channel = 'direct')
   - Marketplace sales (sum where sales_channel = 'marketplace')
3. **Determine nexus status** for that specific year:
   - Compare totals to threshold
   - Apply OR/AND logic
   - Classify as: none, approaching (90-100%), has_nexus (>100%)
4. **Calculate monthly aggregates:**
   - Group transactions by month
   - Sum sales and count transactions per month
   - Include all 12 months (0 for months with no sales)
5. **Add running totals:**
   - Sort transactions by date
   - Calculate cumulative sum
   - Add running_total field to each transaction

#### Multi-Year Nexus Logic

**Critical:** Process years in chronological order.

```python
nexus_first_established = None

for year in sorted(years):
    # Calculate nexus for this year
    has_nexus_this_year = check_nexus(year_sales, threshold)

    if has_nexus_this_year and nexus_first_established is None:
        nexus_first_established = year

    year_data[year]['nexus_first_established_year'] = nexus_first_established

    # Determine status
    if has_nexus_this_year:
        year_data[year]['nexus_status'] = 'has_nexus'
    elif nexus_first_established is not None:
        # Below threshold but nexus continues from previous year
        year_data[year]['nexus_status'] = 'active_continuing'
    elif approaching_threshold(year_sales, threshold):
        year_data[year]['nexus_status'] = 'approaching'
    else:
        year_data[year]['nexus_status'] = 'none'
```

**Note:** For MVP, we calculate nexus establishment but may not fully implement the "continuing" status in the UI. This will be noted with the educational message about nexus persistence.

### Data Sources Summary

| Data Element | Database Table | Column(s) |
|--------------|----------------|-----------|
| Transactions | `sales_transactions` | transaction_id, transaction_date, customer_id, sales_amount, sales_channel |
| State name | `states` | code, name |
| Thresholds | `economic_nexus_thresholds` | revenue_threshold, transaction_threshold, threshold_operator |
| Tax rates | `tax_rates` | state_rate, avg_local_rate |
| Analysis metadata | `analyses` | id, user_id, created_at |

### Error Handling

**404 Not Found:**
- Invalid state_code (not in states table)
- Invalid analysis_id
- State has no data in this analysis (still return 200 with empty transactions)

**403 Forbidden:**
- Analysis doesn't belong to authenticated user

**400 Bad Request:**
- Invalid year parameter (not an integer)
- Year outside analysis date range

---

## 7. Frontend Components

### New Components to Build

#### 1. StateDetailHeader
**Props:**
- stateName: string
- stateCode: string
- nexusStatus: 'has_nexus' | 'approaching' | 'none'
- totalSales: number
- transactionCount: number
- yearsAvailable: number[]
- selectedYear: number
- onYearChange: (year: number) => void
- analysisName: string

**Responsibilities:**
- Render breadcrumb navigation
- Display state name with nexus badge
- Show quick stats
- Render year selector dropdown

---

#### 2. SalesAnalysisSection
**Props:**
- yearData: YearData object
- thresholdInfo: ThresholdInfo object

**Responsibilities:**
- Render four summary cards
- Display threshold status box with progress bar
- Container for monthly chart and transaction table

---

#### 3. MonthlyTrendChart
**Props:**
- monthlyData: Array<{ month: string, sales: number }>
- threshold: number
- nexusCrossedMonth?: string

**Responsibilities:**
- Render line chart with recharts
- Show threshold line
- Annotate nexus crossing month if applicable
- Tooltips on hover

**Library:** recharts (already used in project)

---

#### 4. TransactionTable
**Props:**
- transactions: Transaction[]
- initiallyExpanded?: boolean

**Responsibilities:**
- Expandable/collapsible table
- Search and filter functionality
- Sorting
- Pagination
- Export to CSV
- Highlight threshold-crossing row

**Key Feature:** Running total column

---

#### 5. ComplianceSection
**Props:**
- nexusStatus: 'has_nexus' | 'approaching' | 'none' | 'zero_sales'
- nexusFirstEstablishedYear?: number
- currentYear: number
- complianceInfo: ComplianceInfo object
- summary: { totalSales: number, transactionCount: number }
- thresholdInfo: ThresholdInfo object

**Responsibilities:**
- Render appropriate variant based on nexusStatus
- Display required actions or preparatory guidance
- Show state tax information
- Provide resource links

---

#### 6. ThresholdProgressBar
**Props:**
- currentSales: number
- threshold: number
- status: 'safe' | 'approaching' | 'exceeded'

**Responsibilities:**
- Visual progress bar
- Color coding (green/yellow/red)
- Percentage display

---

### Existing Components to Reuse

From shadcn/ui:
- Button
- Card
- Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- Input (for search)
- Select (for filters and pagination)
- Badge (for nexus status)

---

## 8. Multi-Year Nexus Calculation - CRITICAL BUG TO FIX

### Current Problem

The existing `nexus_calculator.py` aggregates ALL transactions regardless of date:

```python
# Current implementation (INCORRECT for multi-year):
def _aggregate_transactions_by_state(self, analysis_id: str) -> Dict:
    result = self.supabase.table('sales_transactions') \
        .select('*') \
        .eq('analysis_id', analysis_id) \
        .execute()

    # This sums ALL transactions across ALL years
    total_sales = float(state_df['sales_amount'].sum())
```

**Problem:**
- 2022: $95k → No nexus
- 2023: $98k → No nexus
- 2024: $92k → No nexus
- **Current calculation:** $285k total → NEXUS (WRONG!)

### Required Fix

Nexus must be calculated **per calendar year** (or per rolling 12-month period depending on state rules).

**New approach:**

```python
def _aggregate_transactions_by_state_and_year(self, analysis_id: str) -> Dict:
    """
    Aggregate transactions by state AND year.

    Returns nested dict: {state_code: {year: {aggregates}}}
    """
    result = self.supabase.table('sales_transactions') \
        .select('*') \
        .eq('analysis_id', analysis_id) \
        .execute()

    df = pd.DataFrame(result.data)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['year'] = df['transaction_date'].dt.year

    aggregates = {}
    for state_code in df['customer_state'].unique():
        state_df = df[df['customer_state'] == state_code]
        aggregates[state_code] = {}

        for year in state_df['year'].unique():
            year_df = state_df[state_df['year'] == year]
            aggregates[state_code][year] = {
                'total_sales': float(year_df['sales_amount'].sum()),
                'transaction_count': len(year_df),
                'direct_sales': float(year_df[year_df['sales_channel'] == 'direct']['sales_amount'].sum()),
                'marketplace_sales': float(year_df[year_df['sales_channel'] == 'marketplace']['sales_amount'].sum())
            }

    return aggregates
```

**Then determine nexus year-by-year:**

```python
for state_code, years_data in state_aggregates.items():
    nexus_first_year = None

    for year in sorted(years_data.keys()):
        year_aggregates = years_data[year]

        # Check nexus for THIS year only
        has_nexus = check_threshold(
            year_aggregates['total_sales'],
            year_aggregates['transaction_count'],
            threshold
        )

        if has_nexus and nexus_first_year is None:
            nexus_first_year = year

        # Save result for this state/year combination
        results.append({
            'state': state_code,
            'year': year,
            'nexus_status': 'has_nexus' if has_nexus else 'none',
            'nexus_first_established_year': nexus_first_year,
            ...
        })
```

**Database Schema Change Required:**

The `state_results` table needs a `year` column:

```sql
ALTER TABLE state_results ADD COLUMN year INTEGER;
```

This allows storing one row per state per year instead of one row per state.

### Implementation Priority

**CRITICAL:** This bug must be fixed before multi-year uploads are supported. Otherwise the tool will incorrectly report nexus obligations.

**Options:**
1. Fix before state detail page implementation
2. Block multi-year uploads until fixed (add validation)
3. Add clear warning in UI: "Multi-year analysis not yet supported"

---

## 9. Implementation Order

Recommended sequence:

1. **Fix duplicate route definition bug** (quick win, 5 min)
2. **Design database schema changes** for year-based nexus storage
3. **Fix multi-year nexus calculation logic** (CRITICAL, 2-3 hours)
4. **Implement backend API endpoint** for state detail (1-2 hours)
5. **Build frontend components** in this order:
   - StateDetailHeader (30 min)
   - SalesAnalysisSection with summary cards (1 hour)
   - ThresholdProgressBar (30 min)
   - MonthlyTrendChart (1-2 hours)
   - TransactionTable (2-3 hours)
   - ComplianceSection variants (2 hours)
6. **Wire up year selector** to re-fetch data (30 min)
7. **Test with single-year data** (1 hour)
8. **Test with multi-year data** (1 hour)
9. **Code review and refinement** (1 hour)

**Total estimate:** 12-16 hours

---

## 10. Future Enhancements (Post-MVP)

Features to consider after initial implementation:

1. **Registration Status Tracking**
   - Add "Are you registered in this state?" toggle
   - Track registration date
   - Show "Nexus Active (Registered)" vs "Nexus Active (Not Registered)" status

2. **Notes/Comments System**
   - Allow tax agents to add notes per state
   - "Registered on 3/15/2024, quarterly filing"

3. **Export Improvements**
   - Export multi-year comparison
   - Export compliance checklist as PDF
   - Generate client-ready reports

4. **Advanced Filtering**
   - Filter by customer
   - Filter by date range within year
   - Filter by amount range

5. **Quarterly View**
   - Toggle between monthly/quarterly chart
   - Show Q1, Q2, Q3, Q4 breakdowns for tax filing alignment

6. **State Comparison**
   - "Compare with another state" feature
   - Side-by-side view of two states

7. **Alerts/Notifications**
   - Email alert when approaching threshold
   - Dashboard widget showing "5 states approaching nexus"

---

## 11. Open Questions

1. **Registration portal URLs:** Do we need to populate these in the database, or can we use a lookup table/constant?
2. **Filing frequencies:** Should these be dynamic per state from database, or static reference data?
3. **DOR contact info:** Should we include phone numbers/email for state DORs?
4. **Multi-state registration:** Any states that allow centralized registration (SST)?

---

## 12. Success Criteria

This design is successful if:

1. ✅ Tax agents can click any state and see comprehensive analysis
2. ✅ Year filtering works correctly for multi-year lookback
3. ✅ Users can identify exactly when nexus was crossed (transaction-level detail)
4. ✅ Clear action items are presented based on nexus status
5. ✅ Zero-sales states still provide useful planning information
6. ✅ Page loads in < 2 seconds for states with 100+ transactions
7. ✅ Users can export transaction data for further analysis
8. ✅ Mobile responsive (stacks sections vertically)

---

## Appendix A: Example User Flows

### Flow 1: Tax Agent Reviewing High-Liability State

1. User views State Results table, sees California with $285k sales
2. Clicks on California row
3. Lands on state detail page, defaults to 2024
4. Sees summary: $85k in 2024, approaching threshold (17%)
5. Changes year selector to 2023: $60k (below threshold)
6. Changes year selector to 2022: $140k, nexus established! 🔴
7. Sees compliance section: "Nexus first established: 2022"
8. Reads required actions: Register, collect tax, file returns
9. Clicks "Register Online" link, opens CA DOR portal
10. Expands transaction table to verify the calculation
11. Sees running total, confirms threshold was crossed in August 2022
12. Exports CSV for client records

### Flow 2: Tax Agent Monitoring Approaching State

1. User views State Results table, sees Ohio with yellow dot
2. Clicks on Ohio row
3. Sees banner: "Approaching Nexus Threshold"
4. Sees: $95k of $100k threshold (95%)
5. Only $5k until nexus triggered
6. Reads "Prepare for Nexus" section
7. Notes the requirements for when threshold is crossed
8. Views monthly chart, sees spike in Q4
9. Plans to monitor closely in next quarter

### Flow 3: Tax Agent Planning Expansion

1. User wants to know tax implications for expanding to Texas
2. Navigates to State Results table
3. Clicks on Texas (currently $0 sales)
4. Sees "No Sales Activity" message
5. Reads: "Nexus threshold: $500,000"
6. Notes combined tax rate: 8.19%
7. Plans sales strategy knowing the high threshold
8. Bookmarks page for future reference

---

## Appendix B: Accessibility Considerations

- All interactive elements keyboard accessible
- Color coding supplemented with icons/text (not color-only)
- ARIA labels on charts and complex widgets
- Semantic HTML headings (H1, H2, H3 hierarchy)
- Focus indicators visible on all controls
- Screen reader friendly table headers

---

**End of Design Document**
