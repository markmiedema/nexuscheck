# Phase 2B: User Flow Design - Screen Specifications

**Last Updated:** 2025-11-03
**Status:** Complete - Ready for Phase 3 (Technical Architecture)
**Phase:** 2B - User Flow Design
**Validated By:** Project stakeholder

---

## Executive Summary

Phase 2B defines the complete user experience for the Nexus Check MVP, focusing on SALT professionals at boutique agencies. The flow consists of 7 core screens that guide users from CSV upload through nexus determination to exportable client reports.

**Key Design Principles:**
- **Professional First:** Conservative, serious design for tax professionals
- **Efficiency:** 10-15 minute workflow from upload to report
- **Transparency:** Show calculations, confidence scores, and decision factors
- **Client-Ready:** Exportable reports suitable for client presentations
- **Error Recovery:** Never lose user work, always provide clear next steps

---

## Target User Profile

**Primary User:** SALT Tax Professional at boutique/small agency
**Experience Level:** Former Big 4, expert in SALT, comfortable with Excel
**Use Case:** Analyzing client nexus obligations across multiple states
**Success Criteria:** Reduce 12-20 hours of manual work to <1 hour

---

## 7-Screen MVP Flow

### Navigation Flow
```
1. Client Setup → 2. CSV Upload → 3. Data Mapping → 4. Analysis Results (Dashboard) →
5. State-by-State Table → 6. State Detail View → 7. Export & Reports
```

---

## Screen 1: Client Setup / Project Initialization

### Purpose
Initialize a new nexus analysis with basic client information and analysis parameters.

### Screen Elements

**Header:**
- Logo/branding
- User profile icon
- Navigation breadcrumb: "New Analysis"

**Main Content:**
```
New Nexus Analysis
─────────────────────────────────────────

Client Information:
  Company Name: [________________]
  Analysis Period: [MM/YYYY] to [MM/YYYY]

Business Type:
  ○ Product Sales (Physical goods)
  ○ Digital Products/Services
  ○ Mixed (Products + Services)

Known State Registrations (Optional):
  [+ Add State]

  California
    Registration Date: [MM/DD/YYYY]
    [Remove]

Notes (Optional):
  [Text area for internal notes]

[Cancel]  [Continue to Upload →]
```

### Validation Rules
- Company name: Required, 1-200 characters
- Analysis period: Required, start date must be before end date, cannot be future dates
- Business type: Required selection
- Known registrations: Optional, validate state code if provided

### User Actions
- Fill in client information
- Select business type
- Optionally add known state registrations
- Click "Continue to Upload"

### Error States
- **Missing required fields:** Highlight in red with message "Required field"
- **Invalid date range:** Show error "End date must be after start date"
- **Future dates:** Show error "Analysis period cannot include future dates"

### Data Persistence
- Auto-save every 30 seconds
- Store in `analyses` table with status = 'setup'

---

## Screen 2: CSV Upload & Preview

### Purpose
Allow user to upload transaction data CSV and preview contents before processing.

### Screen Elements

**Breadcrumb:** Client Setup > Upload Data

**Main Content:**
```
Upload Transaction Data
─────────────────────────────────────────

┌─────────────────────────────────────────┐
│                                         │
│     📁 Drag and drop CSV file here      │
│                                         │
│          or [Choose File]               │
│                                         │
│   Accepted formats: .csv, .xlsx, .xls  │
│   Maximum size: 50 MB                   │
│                                         │
└─────────────────────────────────────────┘

Need help? [Download CSV Template]

Required Columns:
  • transaction_date (MM/DD/YYYY or YYYY-MM-DD)
  • customer_state (2-letter code: CA, NY, etc.)
  • revenue_amount (numeric, no $ or commas)
  • sales_channel (marketplace, direct, or other)

Optional Columns:
  • transaction_id
  • product_type (product, service, digital)
  • customer_type (B2B, B2C)
```

**After Upload - Preview:**
```
✓ File uploaded: client-transactions-2024.csv (15.2 MB)
  10,245 transactions found

Preview (first 10 rows):
┌──────────┬─────────────────┬───────┬────────┬─────────┐
│ Date     │ State │ Amount   │ Type   │ Channel │
├──────────┼─────────────────┼───────┼────────┼─────────┤
│ 01/15/21 │ CA    │ 1,234.50 │ direct │ website │
│ 01/16/21 │ NY    │ 567.00   │ direct │ website │
│ ...      │ ...   │ ...      │ ...    │ ...     │
└──────────┴─────────────────┴───────┴────────┴─────────┘

Detected Columns:
  ✓ transaction_date (Date format: MM/DD/YY)
  ✓ customer_state (2-letter codes detected)
  ✓ revenue_amount (Numeric values)
  ✓ sales_channel (Values: marketplace, direct)

[← Back]  [Upload Different File]  [Continue to Mapping →]
```

### Validation Rules

**File Level:**
- Format: Must be .csv, .xlsx, or .xls
- Size: Maximum 50 MB
- Encoding: UTF-8 preferred, auto-detect others

**Data Level (Preview Check):**
- At least 1 transaction row (beyond header)
- Contains columns that map to required fields
- No completely empty columns

### User Actions
- Drag-and-drop or click to select file
- View preview of uploaded data
- Download template if needed
- Upload different file if errors
- Continue to mapping

### Error States

**File Upload Errors:**
```
⚠️ Upload Error

File too large (75 MB)
Maximum allowed size is 50 MB

Suggestions:
  • Split data into multiple analyses by year
  • Remove unnecessary columns
  • Compress using Excel's "Save As" feature

[Try Again]
```

**Data Quality Warnings:**
```
⚠️ Data Quality Issues Detected

We found potential issues:
  • 15 rows with missing state codes
  • 3 rows with $0.00 amounts
  • 45 rows with future dates

You can still continue - we'll flag these during validation.

[Continue Anyway]  [Upload Different File]
```

### Data Persistence
- Upload file to Supabase Storage
- Create record in `data_upload_log` table
- Update `analyses.status` = 'uploaded'
- Store file reference in `analyses.upload_file_path`

---

## Screen 3: Data Mapping & Confirmation

### Purpose
Map CSV columns to required system fields, handle edge cases, and confirm data is ready for analysis.

### Screen Elements

**Breadcrumb:** Client Setup > Upload Data > Map Columns

**Main Content:**
```
Map Your Data Columns
─────────────────────────────────────────

Match your CSV columns to the required fields.
We've auto-detected most mappings - please verify.

Transaction Date (Required)
  Your column: [transaction_date ▼]
  Sample values: 01/15/2021, 01/16/2021, 01/17/2021
  Date format: [MM/DD/YYYY ▼]
  ✓ Looks good

Customer State (Required)
  Your column: [customer_state ▼]
  Sample values: CA, NY, TX, FL, WA
  ✓ All valid state codes

Revenue Amount (Required)
  Your column: [revenue_amount ▼]
  Sample values: 1234.50, 567.00, 8901.25
  ✓ All numeric values

Sales Channel (Required)
  Your column: [sales_channel ▼]
  Sample values: marketplace, direct, marketplace
  ⚠️ Contains values: "amazon", "ebay"
     Map to: [marketplace ▼]

Product Type (Optional)
  Your column: [Not mapped ▼] or [Skip this field]

Customer Type (Optional)
  Your column: [Not mapped ▼] or [Skip this field]

─────────────────────────────────────────

Data Summary:
  Total transactions: 10,245
  Date range: 01/15/2021 - 12/31/2024
  States found: 35
  Estimated processing time: 30-45 seconds

[← Back to Upload]  [Validate & Process →]
```

### Validation Rules

**Mapping Validation:**
- All required fields must be mapped
- Optional fields can be skipped
- Cannot map multiple source columns to same target field
- Date format must match actual data

**Data Validation (Run on "Validate"):**
- All dates parseable in specified format
- All state codes valid (50 states + DC + territories)
- All amounts numeric and non-negative
- All sales_channel values valid (marketplace, direct, other)

### User Actions
- Review auto-detected mappings
- Adjust mappings using dropdowns
- Select date format
- Map ambiguous values (e.g., "amazon" → "marketplace")
- Click "Validate & Process" to start analysis

### Error States

**Mapping Errors:**
```
⚠️ Cannot Process

Please fix these issues:
  ✗ Transaction Date: No column mapped
  ✗ Revenue Amount: Selected column "price" contains non-numeric values
    Examples: "$1,234.50", "free", "N/A"

[Review Mappings]
```

**Validation Errors (After clicking Validate):**
```
⚠️ Data Validation Failed

Found 47 issues across 45 rows:

Invalid State Codes (15 rows):
  • Row 23: "C" → Did you mean CA or CT?
  • Row 156: "California" → Should be "CA"
  • [View all 15 issues]

Invalid Dates (12 rows):
  • Row 67: "13/45/2021" → Invalid date
  • Row 891: "2026-01-15" → Future date
  • [View all 12 issues]

Invalid Amounts (20 rows):
  • Row 103: "$1,234.50" → Remove $ and commas
  • Row 445: "-150.00" → Negative amount
  • [View all 20 issues]

[Download Error Report (CSV)]
[← Go Back to Fix Data]  [Exclude Invalid Rows & Continue]
```

### Data Persistence
- Save column mappings to `analyses` table metadata
- Update `analyses.status` = 'validating'
- After successful validation: `analyses.status` = 'processing'
- Log validation errors to `error_logs` table

---

## Screen 4: Analysis Results Overview (Dashboard)

### Purpose
High-level summary of nexus determination results with visual indicators and key metrics.

### Screen Elements

**Breadcrumb:** Client Setup > Upload > Map > Results

**Header Section:**
```
Analysis Complete ✓
─────────────────────────────────────────
ACME Corporation | 2021-2024
Processed 10,245 transactions across 35 states
Generated: November 3, 2025 at 2:45 PM
```

**Summary Cards:**
```
┌─────────────────┬─────────────────┬─────────────────┐
│ States w/ Nexus │ Est. Liability  │ Confidence      │
│                 │                 │                 │
│      15         │   $241,397      │     High        │
│  ↑ 3 from 2023  │  +$45K vs 2023  │   ⚠️ 2 flagged  │
└─────────────────┴─────────────────┴─────────────────┘
```

**US Map Visualization:**
```
[Interactive US Map]

Color Coding:
  🟢 Green:  No nexus (20 states)
  🟡 Yellow: Approaching threshold - within 10% (3 states)
  🔴 Red:    Has nexus obligation (15 states)
  🔵 Blue:   Registered / Known physical presence (5 states)

Click any state for details
```

**Quick Stats:**
```
Nexus Breakdown:
  • Physical Nexus: 3 states (CA, NY, TX)
  • Economic Nexus: 12 additional states
  • No Nexus: 35 states below threshold

Approaching Threshold:
  • Florida: $98,450 of $100,000 (98%)
  • Illinois: $96,200 of $100,000 (96%)
  • Ohio: $91,500 of $100,000 (92%)
```

**Action Buttons:**
```
[View Detailed Table]  [Generate Client Report]  [Export to Excel]

[Save Analysis]  [Start New Analysis]
```

### Calculation Logic

**Nexus Status Categories:**
1. **Has Nexus** (Red): Revenue >= threshold OR physical presence
2. **Approaching** (Yellow): Revenue >= 90% of threshold
3. **No Nexus** (Green): Revenue < 90% of threshold
4. **Known Registration** (Blue): Listed in initial setup

**Confidence Score:**
- High: All states have clear rules, no edge cases
- Medium: 1-2 states require manual review (e.g., special products, affiliate nexus)
- Low: 3+ states flagged for review OR data quality issues

### User Actions
- Hover over map to see state summary
- Click state on map to jump to detail view
- Click "View Detailed Table" to see Screen 5
- Click "Generate Client Report" to jump to Screen 7
- Download Excel export for further analysis

### Data Persistence
- Results stored in:
  - `nexus_determination` table (one row per state)
  - `tax_liability_estimate` table (one row per state w/ nexus)
  - `marketplace_sales` table (aggregated by state)
- Update `analyses.status` = 'completed'
- Update `analyses.completed_at` timestamp

---

## Screen 5: State-by-State Results Table

### Purpose
Comprehensive sortable/filterable table of all states with detailed nexus and liability information.

### Screen Elements

**Header:**
```
Detailed State Results
─────────────────────────────────────────
ACME Corporation | 2021-2024

Filters:
  Nexus Status: [All ▼]  [Has Nexus] [No Nexus] [Approaching]
  Registration: [All ▼]  [Registered] [Not Registered]
  Confidence:   [All ▼]  [High] [Medium] [Low]

Search: [____________] 🔍
```

**Results Table:**
```
┌────────┬────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┐
│ State  │ Nexus      │ Revenue     │ Threshold    │ Est.         │ Confidence│ Action  │
│        │ Status     │ (Total)     │ Comparison   │ Liability    │ Score     │         │
├────────┼────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┤
│ 🔴 CA  │ Physical + │ $2,745,000  │ $500k (549%) │ $161,695     │ High ✓    │ Details │
│        │ Economic   │ Direct:     │ Nexus since: │              │           │         │
│        │            │ $1,647,000  │ 06/01/2020   │              │           │         │
│        │            │ Mktp:       │              │              │           │         │
│        │            │ $1,098,000  │              │              │           │         │
├────────┼────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┤
│ 🔴 FL  │ Economic   │ $523,890    │ $100k (524%) │ $58,456      │ High ✓    │ Details │
│        │            │ Direct:     │ Nexus since: │              │           │         │
│        │            │ $523,890    │ 03/15/2021   │              │           │         │
│        │            │ Mktp: $0    │              │              │           │         │
├────────┼────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┤
│ 🟡 GA  │ Approaching│ $98,450     │ $100k (98%)  │ $0           │ High ✓    │ Details │
│        │            │ Direct:     │ Watch closely│              │           │         │
│        │            │ $98,450     │              │              │           │         │
├────────┼────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┤
│ 🟢 AL  │ No Nexus   │ $12,450     │ $250k (5%)   │ $0           │ High ✓    │ Details │
│        │            │ Direct:     │              │              │           │         │
│        │            │ $12,450     │              │              │           │         │
└────────┴────────────┴─────────────┴──────────────┴──────────────┴───────────┴─────────┘

[Export Table to Excel]  [Generate Report for Selected States]  [← Back to Dashboard]
```

### Sorting & Filtering

**Sortable Columns:**
- State (alphabetical)
- Nexus Status (Has Nexus > Approaching > No Nexus)
- Total Revenue (high to low)
- Estimated Liability (high to low)
- Confidence Score (Low > Medium > High)

**Default Sort:** Nexus Status (Has Nexus first), then Liability (high to low)

**Filter Options:**
- Nexus Status: All, Has Nexus, Approaching, No Nexus
- Registration Status: All, Registered, Not Registered
- Confidence Score: All, High, Medium, Low
- Search: Free text search on state name/code

### User Actions
- Sort by any column header
- Filter using dropdown menus
- Search for specific states
- Click "Details" to view Screen 6 for that state
- Select multiple states (checkbox) and generate report for subset
- Export table to Excel

### Data Source
- Queries `nexus_determination` table
- Joins with `tax_liability_estimate` table
- Aggregates from `marketplace_sales` table
- Calculated fields:
  - Threshold percentage: `(revenue / threshold) * 100`
  - Nexus since date: First date when cumulative revenue exceeded threshold

---

## Screen 6: State Detail View (Drill-Down)

### Purpose
Complete breakdown of nexus determination and liability calculation for a single state.

### Screen Elements

**Breadcrumb:** Results > State Details > California

**State Header:**
```
California Nexus Analysis
─────────────────────────────────────────
Status: ✓ Has Nexus (Physical + Economic)
Nexus Established: June 1, 2020
Registration Required: Yes
Confidence: High ✓
```

**Section 1: Nexus Determination**
```
┌─────────────────────────────────────────┐
│ NEXUS DETERMINATION                     │
├─────────────────────────────────────────┤
│                                         │
│ Economic Nexus:                         │
│   Threshold: $500,000 in annual sales  │
│   Your Sales: $2,745,000 (549% of      │
│              threshold)                 │
│   Status: ✓ Exceeds threshold          │
│   Date Triggered: March 15, 2020       │
│                                         │
│ Physical Nexus:                         │
│   ✓ Office location                     │
│   Established: June 1, 2020            │
│   Status: Active                       │
│                                         │
│ Marketplace Facilitator Impact:        │
│   Marketplace sales: $1,098,000        │
│   ⓘ CA requires marketplace sellers to │
│     collect tax. These sales count     │
│     toward nexus threshold but are     │
│     excluded from your liability.      │
│                                         │
│ Conclusion:                            │
│   You have nexus based on physical     │
│   presence and economic activity.      │
│   Registration required.               │
└─────────────────────────────────────────┘
```

**Section 2: Sales Breakdown**
```
┌─────────────────────────────────────────┐
│ SALES BREAKDOWN                         │
├─────────────────────────────────────────┤
│                                         │
│ Total Sales to California: $2,745,000  │
│                                         │
│ By Channel:                             │
│   Direct Sales:      $1,647,000 (60%)  │
│   Marketplace Sales: $1,098,000 (40%)  │
│                                         │
│ By Year:                                │
│   2021: $645,000                        │
│   2022: $712,000                        │
│   2023: $689,000                        │
│   2024: $699,000                        │
│                                         │
│ Taxable Sales (Direct Only):           │
│   $1,647,000                            │
│   (Marketplace excluded per CA rules)   │
└─────────────────────────────────────────┘
```

**Section 3: Tax Rates**
```
┌─────────────────────────────────────────┐
│ TAX RATES                               │
├─────────────────────────────────────────┤
│                                         │
│ State Rate:     7.25%                   │
│ Avg Local Rate: 1.73%                   │
│ Combined Rate:  8.98%                   │
│                                         │
│ ⓘ Note: Actual local rates vary by     │
│   destination. This is the statewide   │
│   average. Final liability may differ. │
└─────────────────────────────────────────┘
```

**Section 4: Estimated Liability**
```
┌─────────────────────────────────────────┐
│ ESTIMATED LIABILITY                     │
├─────────────────────────────────────────┤
│                                         │
│ Taxable Sales:      $1,647,000          │
│ × Combined Rate:    8.98%               │
│ ───────────────────────────────────     │
│ Base Tax:           $147,901            │
│                                         │
│ Interest (3 years): $11,093 @ 7.5%     │
│   Calculated using simple interest     │
│   from estimated nexus date            │
│                                         │
│ Penalties:          $2,501              │
│   Late filing:      $1,479 (10%)       │
│   Late payment:     $1,022 (negligence)│
│                                         │
│ ═══════════════════════════════════     │
│ TOTAL ESTIMATED LIABILITY: $161,695     │
│ ═══════════════════════════════════     │
│                                         │
│ ⚠️  This is an estimate. Actual         │
│    liability depends on:                │
│    • Exact local tax rates              │
│    • Product exemptions                 │
│    • Actual registration date           │
│    • Penalty assessment policies        │
│                                         │
│ [Show Calculation Details]              │
└─────────────────────────────────────────┘
```

**Section 5: Registration & Compliance**
```
┌─────────────────────────────────────────┐
│ REGISTRATION & COMPLIANCE               │
├─────────────────────────────────────────┤
│                                         │
│ Registration Status:                    │
│   ✓ Registered on June 1, 2020         │
│   Permit #: SR-CA-123456                │
│                                         │
│ Filing Frequency:                       │
│   Quarterly (based on liability)        │
│                                         │
│ Next Filing Due:                        │
│   January 31, 2026 (Q4 2025)           │
│                                         │
│ Voluntary Disclosure:                   │
│   ⓘ VDA may reduce penalties            │
│   [Learn more about VDA]                │
└─────────────────────────────────────────┘
```

**Section 6: Confidence Factors**
```
┌─────────────────────────────────────────┐
│ CONFIDENCE ASSESSMENT                   │
├─────────────────────────────────────────┤
│                                         │
│ Overall Confidence: High ✓              │
│                                         │
│ Factors:                                │
│   ✓ Clear economic nexus rules         │
│   ✓ Physical presence confirmed         │
│   ✓ Marketplace rules straightforward   │
│   ✓ No special product categories       │
│   ✓ Registration date confirmed         │
│                                         │
│ No manual review required               │
└─────────────────────────────────────────┘
```

**Action Buttons:**
```
[← Back to All States]  [Next State: Florida →]

[Add to Report]  [Export State Detail (PDF)]  [Flag for Review]
```

### Calculation Details (Expandable)

When user clicks "Show Calculation Details":
```
┌─────────────────────────────────────────┐
│ DETAILED CALCULATION                    │
├─────────────────────────────────────────┤
│                                         │
│ BASE TAX CALCULATION:                   │
│                                         │
│ 2021: $645,000 × 8.98% = $57,921        │
│ 2022: $712,000 × 8.98% = $63,938        │
│ 2023: $689,000 × 8.98% = $61,872        │
│ 2024: $699,000 × 8.98% = $62,770        │
│ ───────────────────────────────────     │
│ Total Base Tax: $246,501                │
│                                         │
│ INTEREST CALCULATION:                   │
│                                         │
│ Using simple interest at 7.5%:          │
│ 2021 tax ($57,921) × 4 years = $17,376  │
│ 2022 tax ($63,938) × 3 years = $14,414  │
│ 2023 tax ($61,872) × 2 years = $9,281   │
│ 2024 tax ($62,770) × 1 year  = $4,708   │
│ ───────────────────────────────────     │
│ Total Interest: $45,779                 │
│                                         │
│ PENALTY CALCULATION:                    │
│                                         │
│ Late Filing: 10% of base tax            │
│   $246,501 × 10% = $24,650              │
│                                         │
│ Late Payment: Negligence (10%)          │
│   $246,501 × 10% = $24,650              │
│                                         │
│ Total Penalties: $49,300                │
│                                         │
│ ═══════════════════════════════════     │
│ TOTAL LIABILITY: $341,580               │
│ ═══════════════════════════════════     │
│                                         │
│ Note: VDA could reduce penalties        │
│ to $0-5% depending on state policy.     │
└─────────────────────────────────────────┘
```

### User Actions
- Scroll through sections
- Expand "Show Calculation Details"
- Navigate to previous/next state
- Add state to custom report
- Export individual state detail as PDF
- Flag state for manual review

### Data Source
- Primary: `nexus_determination` table (state-specific row)
- Joins:
  - `tax_liability_estimate` table
  - `marketplace_sales` table
  - `physical_nexus` table
  - `states` table (for thresholds and rules)
  - `state_tax_rates` table
  - `state_interest_penalty_rates` table

---

## Screen 7: Export & Report Generation

### Purpose
Generate professional client-ready reports and provide export options for further analysis.

### Screen Elements

**Header:**
```
Generate Report
─────────────────────────────────────────
ACME Corporation | 2021-2024
```

**Report Configuration:**
```
┌─────────────────────────────────────────┐
│ REPORT OPTIONS                          │
├─────────────────────────────────────────┤
│                                         │
│ Report Type:                            │
│   ● Executive Summary (for client)      │
│   ○ Detailed Analysis (full technical)  │
│   ○ State-by-State Breakdown            │
│   ○ Custom (select sections)            │
│                                         │
│ States to Include:                      │
│   ● All states with nexus (15)          │
│   ○ Selected states only                │
│     [Select States...]                  │
│   ○ All states (including no nexus)     │
│                                         │
│ Include:                                │
│   ☑ Executive summary                   │
│   ☑ Nexus determination by state        │
│   ☑ Liability estimates                 │
│   ☑ Calculation methodology             │
│   ☑ Compliance recommendations          │
│   ☐ Raw transaction data                │
│   ☐ Methodology appendix                │
│                                         │
│ Branding:                               │
│   Prepared by: [Your Firm Name]         │
│   Logo: [Upload Logo] (Optional)        │
│                                         │
│ ⓘ Executive Summary report is           │
│   designed for client presentations     │
│   and includes high-level findings      │
│   with actionable recommendations.      │
└─────────────────────────────────────────┘

[Preview Report]  [Generate PDF]
```

**Export Options:**
```
┌─────────────────────────────────────────┐
│ EXPORT OPTIONS                          │
├─────────────────────────────────────────┤
│                                         │
│ Additional Formats:                     │
│                                         │
│   [Export to Excel]                     │
│   Includes: All states, detailed calcs, │
│   pivot tables, charts                  │
│                                         │
│   [Export to CSV]                       │
│   Raw data for custom analysis          │
│                                         │
│   [API Export]                          │
│   JSON format for integrations          │
└─────────────────────────────────────────┘
```

**Report Preview (When "Preview Report" clicked):**
```
┌─────────────────────────────────────────┐
│ [PDF Preview Thumbnail]                 │
│                                         │
│ 📄 Page 1: Cover Page                   │
│ 📄 Page 2: Executive Summary            │
│ 📄 Page 3-5: State-by-State Analysis    │
│ 📄 Page 6: Recommendations              │
│ 📄 Page 7: Appendix                     │
│                                         │
│ Total Pages: 7                          │
│ File Size: ~2.5 MB                      │
│                                         │
│ [◄ Prev] [Next ►] [Close Preview]       │
└─────────────────────────────────────────┘
```

**After Generation:**
```
✓ Report Generated Successfully!

Your nexus analysis report is ready.

ACME-Corporation-Nexus-Analysis-2021-2024.pdf
Generated: November 3, 2025 at 3:15 PM

[📥 Download PDF Report]
[📧 Email Report]
[🔗 Get Shareable Link (expires in 7 days)]

Additional Exports:
[Download Excel]  [Download CSV]  [Get JSON]

─────────────────────────────────────────

Analysis Storage:
This analysis will be stored until: February 1, 2026 (90 days)

[Delete Analysis Now]  [Extend Storage Period]
[Save to Client File]  [Start New Analysis]
```

### Report Template Structure

**Executive Summary Report (Default):**

1. **Cover Page**
   - Client name
   - Analysis period
   - Prepared by
   - Date generated
   - Firm logo (if provided)

2. **Executive Summary (1 page)**
   - Key findings (# states with nexus, total liability)
   - Critical deadlines
   - Top 3-5 recommendations
   - High-level risk assessment

3. **Nexus Summary Table (1 page)**
   - All states with nexus
   - Nexus type, date established
   - Revenue, liability estimate
   - Registration status

4. **State-by-State Details (1-2 pages per state with nexus)**
   - Nexus determination
   - Sales breakdown
   - Liability calculation
   - Compliance requirements

5. **Recommendations (1 page)**
   - Priority actions (register, file returns, VDA opportunities)
   - Timeline for compliance
   - Estimated costs
   - Risk mitigation

6. **Appendix (1-2 pages)**
   - Methodology
   - Assumptions
   - Data sources
   - Confidence assessment
   - Disclaimers

**Detailed Analysis Report:**
- All sections from Executive Summary
- Plus: Complete transaction summary
- Plus: Calculation detail for every state
- Plus: Full marketplace facilitator analysis
- Plus: Historical nexus timeline charts

### User Actions
- Select report type and options
- Preview before generating
- Generate PDF
- Download or email report
- Export to Excel/CSV/JSON
- Save analysis or delete
- Start new analysis

### Data Persistence
- Generated reports stored in Supabase Storage
- Reference saved in `analyses.report_file_path`
- Update `analyses.report_generated_at` timestamp
- Store report configuration in `analyses` metadata

---

## Cross-Screen Features

### Auto-Save
- Triggers every 30 seconds on Screens 1-3
- Visual indicator: "Saved 12 seconds ago" in top-right corner
- Saves to `analyses` table with current `status`

### Progress Indicator
Shows current position in workflow:
```
1. Setup ✓ → 2. Upload ✓ → 3. Map → 4. Results → 5. Export
```

### Error Recovery
- If browser closes during processing:
  - On return: Show prompt "Resume incomplete analysis for ACME Corp?"
  - Options: [Resume] [Start New] [Delete]
- If processing fails:
  - Show error screen with error ID
  - Options: [Retry] [Contact Support] [Start Over]
  - Preserve uploaded data

### Help & Support
Available on all screens:
- Help icon (?) in top-right
- Context-sensitive help text
- Link to documentation
- Contact support button

---

## Technical Requirements

### Performance Targets
- **Screen Load Time:** < 2 seconds for all screens
- **CSV Upload:** Support up to 50 MB, process in < 30 seconds
- **Analysis Processing:** 10,000 transactions in < 60 seconds
- **Report Generation:** PDF created in < 10 seconds
- **Auto-Save:** Non-blocking, < 500ms response time

### Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE support

### Responsive Design
- Desktop only for MVP (min width: 1280px)
- Optimized for 1920×1080 displays
- Mobile/tablet support in Tier 2

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support

---

## Data Security & Privacy

### Data Handling
- All transaction data encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- No data shared between users (RLS policies)
- User-controlled retention (immediate, 90 days, 1 year)

### Report Security
- Generated reports stored securely
- Shareable links expire after 7 days
- Email delivery uses encrypted connections
- Downloaded reports not tracked after download

---

## Success Metrics

### User Experience
- Time to complete workflow: < 15 minutes (target: 10 minutes)
- User satisfaction: > 4.5/5 on ease of use
- Error rate: < 5% of analyses fail validation
- Support requests: < 10% of users need help

### Technical Performance
- Uptime: 99.5%+
- Processing success rate: > 98%
- Report generation success: > 99.5%
- Data accuracy: 90-95% (validated against manual analysis)

---

## Next Steps (Phase 3)

With Phase 2B complete, proceed to Phase 3: Technical Architecture
- Select specific frameworks (Next.js, FastAPI)
- Design API endpoints for each screen interaction
- Define database query patterns
- Plan deployment infrastructure
- Establish testing strategy

---

## Appendix: Screen Flow Diagram

```
Start
  ↓
┌─────────────────────────────────────┐
│ 1. Client Setup                     │
│ - Company name, period              │
│ - Business type                     │
│ - Known registrations               │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. CSV Upload & Preview             │
│ - Drag/drop or select file          │
│ - View preview                      │
│ - Validate format                   │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. Data Mapping & Confirmation      │
│ - Map CSV columns                   │
│ - Handle edge cases                 │
│ - Validate data                     │
└─────────────────────────────────────┘
  ↓
  [Processing...]
  ↓
┌─────────────────────────────────────┐
│ 4. Analysis Results Dashboard       │
│ - Summary cards                     │
│ - US map visualization              │
│ - Quick stats                       │
└─────────────────────────────────────┘
  ↓
  ├──→ [View Details] ──→ ┌────────────────────────────────┐
  │                       │ 5. State-by-State Table         │
  │                       │ - Sortable/filterable           │
  │                       │ - All states listed             │
  │                       └────────────────────────────────┘
  │                         ↓
  │                       ┌────────────────────────────────┐
  │                       │ 6. State Detail View            │
  │                       │ - Complete breakdown            │
  │                       │ - Calculation details           │
  │                       │ - Confidence factors            │
  │                       └────────────────────────────────┘
  │                         ↓
  └──→ [Generate Report] ──→ ┌────────────────────────────┐
                              │ 7. Export & Report Generation│
                              │ - Configure report           │
                              │ - Preview                    │
                              │ - Download/export            │
                              └────────────────────────────┘
                                ↓
                              [Complete]
```

---

## Document Change Log

| Date       | Changes                                    | Author          |
|------------|--------------------------------------------|-----------------|
| 2025-11-03 | Initial creation - Phase 2B complete       | Project Team    |

---

**Status:** ✅ Phase 2B Complete - Ready for Phase 3 (Technical Architecture)
