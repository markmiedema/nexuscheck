# SALT Tax Tool - Data Model Specification

**Created:** 2025-11-02  
**Purpose:** Define data structures for input, processing, and output  
**Status:** Phase 1, Step 1 - Ready for Review

---

## Table of Contents
1. [Excel Input Schema](#1-excel-input-schema)
2. [Physical Nexus Data Structure](#2-physical-nexus-data-structure)
3. [Report Output Format](#3-report-output-format)
4. [Validation Rules](#4-validation-rules)
5. [Edge Cases & Handling](#5-edge-cases--handling)

---

## 1. Excel Input Schema

### 1.1 Required Columns (Sales Data)

| Column Name | Data Type | Required | Description | Example |
|-------------|-----------|----------|-------------|---------|
| `transaction_date` | Date | Yes | Date of transaction | 2024-03-15 |
| `customer_state` | String (2-char) | Yes | US state abbreviation | CA, NY, TX |
| `sales_amount` | Decimal | Yes | Gross sales amount | 1250.00 |
| `sales_channel` | String/Enum | Yes | How sale was made | Direct, Amazon, eBay, Shopify |

### 1.2 Optional But Recommended Columns

| Column Name | Data Type | Required | Description | Example |
|-------------|-----------|----------|-------------|---------|
| `transaction_id` | String | No | Unique transaction identifier | INV-2024-0001 |
| `transaction_count` | Integer | No | Number of transactions (if aggregated) | 1, 5, 100 |
| `product_category` | String | No | For future taxability analysis | Electronics, Clothing |
| `tax_collected` | Decimal | No | Tax already collected (if any) | 95.63 |

### 1.3 Physical Nexus Columns (Optional - Alternative to Form Input)

If included in the sales spreadsheet:

| Column Name | Data Type | Required | Description | Example |
|-------------|-----------|----------|-------------|---------|
| `physical_nexus_states` | String | No | Comma-separated states | CA, NY, FL |
| `nexus_type_{STATE}` | String | No | Type of presence per state | office, warehouse, employee |
| `nexus_date_{STATE}` | Date | No | When nexus established | 2022-01-15 |

**Recommendation:** Use separate Physical Nexus Form (see Section 2) for cleaner UX

### 1.4 Sales Channel Enumeration

**Standard Values:**
- `Direct` - Direct sales from company website/store
- `Amazon` - Amazon Marketplace
- `eBay` - eBay Marketplace
- `Walmart` - Walmart Marketplace
- `Shopify_Direct` - Shopify store (non-marketplace)
- `Etsy` - Etsy Marketplace
- `Other_Marketplace` - Other marketplace facilitator
- `Other_Direct` - Other direct sales

**Marketplace Classification:**
- Marketplace: Amazon, eBay, Walmart, Etsy, Other_Marketplace
- Direct: Direct, Shopify_Direct, Other_Direct

**Note:** Users can add custom values; tool should prompt for marketplace vs. direct classification

### 1.5 Date Format Handling

**Accepted Formats:**
- ISO 8601: `2024-03-15`
- US Format: `03/15/2024` or `3/15/2024`
- Alternative: `2024-03-15`, `15-Mar-2024`, `March 15, 2024`

**Excel Date Handling:**
- Accept Excel serial dates (automatically converted)
- Handle timezone-less dates (assume UTC or user-specified timezone)

**Multi-Year Requirement:**
- Must support 3-4 year lookback
- Date range: Typically 2021-01-01 to 2024-12-31 (example)

---

## 2. Physical Nexus Data Structure

### 2.1 Data Model (In-App Form)

```json
{
  "business_info": {
    "company_name": "Example Corp",
    "analysis_period": {
      "start_date": "2021-01-01",
      "end_date": "2024-12-31"
    },
    "industry": "E-commerce",
    "business_type": "C-Corp"
  },
  "physical_nexus": [
    {
      "state": "CA",
      "nexus_types": ["office", "employees"],
      "established_date": "2020-06-01",
      "still_active": true,
      "notes": "Main headquarters with 15 employees"
    },
    {
      "state": "NY",
      "nexus_types": ["warehouse", "inventory"],
      "established_date": "2022-03-15",
      "ended_date": "2023-12-31",
      "still_active": false,
      "notes": "3PL warehouse, closed end of 2023"
    }
  ]
}
```

### 2.2 Nexus Types Enumeration

**Standard Physical Nexus Types:**
- `office` - Physical office location
- `warehouse` - Warehouse or fulfillment center
- `employees` - Employees (remote or in-state)
- `inventory` - Inventory stored in-state
- `retail_location` - Retail store or showroom
- `property` - Real property owned or leased
- `affiliate` - Affiliated entity creating nexus
- `other` - Other physical presence (requires notes)

**Multiple Types Allowed:** A state can have multiple nexus types

### 2.3 Form UI Specification

**Step 1: Business Information**
- Company name (text)
- Analysis period (date range picker)
- Industry (dropdown, optional)
- Business type (dropdown, optional)

**Step 2: Physical Nexus by State**
- "Do you have physical presence in any states?" (Yes/No)
- If Yes, show state-by-state entry:
  - State (dropdown)
  - Nexus types (multi-select checkboxes)
  - Established date (date picker)
  - Still active? (Yes/No toggle)
  - If No: End date (date picker)
  - Notes (optional text area)
  - "+ Add Another State" button

**Step 3: Review & Confirm**
- Summary table of all physical nexus
- Edit/Delete options
- Proceed to data upload

---

## 3. Report Output Format

### 3.1 PDF Report Structure

#### **Section 1: Executive Summary (1 page)**
- Company name
- Analysis period
- Total states with nexus
- Total estimated liability (all states, all years)
- Key findings (3-5 bullet points)
- Recommended next steps

#### **Section 2: Nexus Determination Summary (1-2 pages)**

**Table Format:**

| State | Nexus Type | Nexus Date | Threshold Exceeded | Liability (Total) |
|-------|------------|------------|-------------------|-------------------|
| CA | Physical | 2020-06-01 | N/A | $45,678 |
| NY | Economic | 2023-04-15 | $100k Revenue | $12,345 |
| TX | Economic | 2022-11-20 | 200 Transactions | $8,901 |
| FL | Both | 2021-01-01 | $100k Revenue | $23,456 |

**Legend:**
- Physical nexus overrides economic nexus determination
- Economic nexus date = first date threshold exceeded
- Liability = estimated uncollected tax + interest + penalties

#### **Section 3: State-by-State Detail (Multiple pages)**

**For Each State with Nexus:**

```
STATE: CALIFORNIA
Nexus Status: PHYSICAL NEXUS
Nexus Date: June 1, 2020
Physical Presence: Office, Employees

Economic Nexus Analysis:
- Threshold: $500,000 in sales
- 2021: $450,000 (Below threshold)
- 2022: $625,000 (Exceeded threshold)
- 2023: $780,000 (Exceeded threshold)
- 2024: $890,000 (Exceeded threshold)

Sales Breakdown:
- Total Sales: $2,745,000
- Direct Sales: $1,647,000
- Marketplace Sales: $1,098,000 (excluded from liability)

Estimated Liability:
- Taxable Sales: $1,647,000
- Estimated Tax Rate: 8.25% (state avg)
- Base Tax: $135,878
- Interest (3 years avg): $12,229
- Penalties (10% estimated): $13,588
- TOTAL: $161,695

Notes:
- Physical nexus present since 2020 - registration required regardless of sales
- Marketplace sales excluded (Amazon, eBay collected tax)
- Interest calculated using state rate of 3% annually
- Penalties are estimates; actual may vary based on VDA
```

#### **Section 4: Multi-Year Liability Summary (1 page)**

**Table Format:**

| State | 2021 | 2022 | 2023 | 2024 | Total |
|-------|------|------|------|------|-------|
| CA | $35,000 | $38,500 | $42,000 | $46,195 | $161,695 |
| NY | $0 | $0 | $8,000 | $4,345 | $12,345 |
| TX | $0 | $5,000 | $2,500 | $1,401 | $8,901 |
| FL | $15,000 | $16,000 | $18,000 | $9,456 | $58,456 |
| **TOTAL** | **$50,000** | **$59,500** | **$70,500** | **$61,397** | **$241,397** |

#### **Section 5: Assumptions & Limitations (1 page)**

**Standard Disclaimers:**
- Liability estimates use average state/local combined rates
- Actual rates vary by jurisdiction; exact calculation needed for filing
- Marketplace facilitator sales excluded from liability (tax already collected)
- Interest and penalties are estimates; actual may vary
- Product taxability assumed (no exemptions analyzed)
- This analysis requires professional review before client delivery

**Specific Assumptions for This Analysis:**
- [List any assumptions made due to data limitations]
- [Flag any edge cases requiring manual review]
- [Note any states requiring additional analysis]

#### **Section 6: Recommended Next Steps (1 page)**

**Standard Recommendations:**
1. **High Priority States (>$50k liability):** [List states]
   - Consider VDA (Voluntary Disclosure Agreement)
   - Evaluate lookback period negotiation
   
2. **Medium Priority States ($10k-$50k liability):** [List states]
   - Evaluate VDA vs. direct registration
   - Review compliance cost vs. liability

3. **Low Priority States (<$10k liability):** [List states]
   - Consider prospective registration
   - May not be cost-effective to address retroactively

4. **Additional Analysis Required:**
   - [List any states or issues needing deeper review]
   - [Flag affiliate nexus or complex situations]

---

### 3.2 Data Structure for Report Generation

```json
{
  "report_metadata": {
    "generated_date": "2024-11-15",
    "analysis_period": {
      "start_date": "2021-01-01",
      "end_date": "2024-12-31"
    },
    "company_name": "Example Corp",
    "report_version": "1.0"
  },
  
  "executive_summary": {
    "total_states_with_nexus": 15,
    "total_liability": 241397.00,
    "physical_nexus_states": ["CA", "FL"],
    "economic_nexus_states": ["NY", "TX", "WA", "..."],
    "key_findings": [
      "Physical nexus in CA and FL creates immediate compliance obligation",
      "Economic nexus established in 13 states during lookback period",
      "Estimated liability of $241,397 across all states and years",
      "Marketplace facilitator sales ($2.1M) excluded from liability",
      "VDA recommended for 8 high-priority states"
    ],
    "recommended_actions": [
      "Pursue VDA for states with >$50k liability",
      "Register prospectively in low-liability states",
      "Review product taxability for specific exemptions"
    ]
  },
  
  "nexus_determinations": [
    {
      "state": "CA",
      "nexus_type": "physical",
      "nexus_date": "2020-06-01",
      "physical_nexus_details": {
        "types": ["office", "employees"],
        "notes": "Main headquarters with 15 employees"
      },
      "economic_nexus_analysis": {
        "threshold": {
          "revenue": 500000,
          "transactions": null
        },
        "sales_by_year": {
          "2021": 450000,
          "2022": 625000,
          "2023": 780000,
          "2024": 890000
        },
        "threshold_exceeded_date": "2022-03-15"
      },
      "sales_breakdown": {
        "total_sales": 2745000,
        "direct_sales": 1647000,
        "marketplace_sales": 1098000
      },
      "liability_estimate": {
        "taxable_sales": 1647000,
        "tax_rate": 0.0825,
        "base_tax": 135878,
        "interest": 12229,
        "penalties": 13588,
        "total": 161695,
        "by_year": {
          "2021": 35000,
          "2022": 38500,
          "2023": 42000,
          "2024": 46195
        }
      },
      "flags": [],
      "notes": [
        "Physical nexus present since 2020 - registration required regardless of sales",
        "Marketplace sales excluded (Amazon, eBay collected tax)"
      ]
    }
  ],
  
  "assumptions": [
    "Average state/local combined tax rates used for estimates",
    "Marketplace facilitator sales excluded from liability calculations",
    "Product taxability assumed; no exemptions analyzed",
    "Interest calculated using published state rates",
    "Penalties estimated at 10% of base tax (varies by state)"
  ],
  
  "flags_for_review": [
    {
      "state": "TX",
      "issue": "Transaction count threshold - estimated from revenue",
      "severity": "medium",
      "recommendation": "Request transaction-level data for precise analysis"
    }
  ]
}
```

---

## 4. Validation Rules

### 4.1 Excel Input Validation

**Required Field Validation:**
- `transaction_date`: Must be valid date, cannot be future-dated
- `customer_state`: Must be valid 2-letter US state code (including DC)
- `sales_amount`: Must be numeric, must be >= 0
- `sales_channel`: Must be non-empty string

**Data Quality Checks:**
- **Date Range:** Warn if transactions span >4 years
- **State Codes:** Flag invalid state codes (with suggestions for common typos)
- **Negative Sales:** Flag for review (returns/refunds acceptable, but needs confirmation)
- **Missing Sales Channel:** If blank, prompt user to classify
- **Duplicate Transactions:** If `transaction_id` provided, check for duplicates

**Row-Level Validation Messages:**
```
Row 145: Invalid state code "C" - did you mean "CT"?
Row 223: Negative sales amount (-$500.00) - is this a return/refund?
Row 456: Date is in the future (2025-06-15) - please verify
```

### 4.2 Physical Nexus Validation

**Required Fields:**
- State (must be valid US state code)
- Nexus types (at least one selected)
- Established date (must be valid date)
- Still active (Yes/No)

**Logical Validation:**
- If "Still Active" = No, then "End Date" is required
- End date must be after established date
- Established date cannot be after analysis end date
- Warn if nexus established >10 years ago (unusual for lookback)

### 4.3 Cross-Validation

**Sales Data vs. Physical Nexus:**
- If physical nexus in state, must have sales data (or flag as "no sales")
- If large sales in state with no nexus, flag for review

**Analysis Period:**
- Physical nexus dates should overlap with analysis period
- Warn if nexus established outside of analysis period

---

## 5. Edge Cases & Handling

### 5.1 Aggregated Data

**Problem:** User provides monthly/quarterly summaries instead of transactions

**Handling:**
- Accept aggregated data
- Use `transaction_count` column for transaction thresholds
- If `transaction_count` missing, estimate: `sales_amount / average_transaction_value`
- Flag estimate with warning: "Transaction count estimated - may affect accuracy"

### 5.2 Missing Sales Channel

**Problem:** Sales channel column blank or inconsistent

**Handling:**
- Prompt user to classify during upload
- Provide bulk classification option: "All blank = Direct" or "All blank = [Selected Channel]"
- Default: Treat as Direct (conservative approach)
- Flag in report: "Sales channel unspecified - assumed Direct"

### 5.3 Historical Threshold Changes

**Problem:** State changed threshold mid-year (e.g., $500k to $100k)

**Handling (MVP):**
- Use current threshold for all years (simplification)
- Flag in report: "State threshold changes not reflected - manual review recommended"
- [DECISION NEEDED] Implement threshold history in V1.1?

### 5.4 Transaction Threshold Without Transaction Count

**Problem:** State has transaction threshold (e.g., 200 transactions) but user only has revenue

**Handling:**
- Estimate transactions: `total_sales / $100` (conservative average)
- Apply threshold using estimate
- Flag prominently: "Transaction count estimated - request actual data for accuracy"
- Offer in report: "Cannot confirm transaction threshold - recommend manual verification"

### 5.5 Multi-Location Local Rates

**Problem:** Sales to multiple cities in same state with different local rates

**Handling (MVP):**
- Use state average local rate (acceptable per project requirements)
- Note in report: "Average local rates used - exact rates needed for filing"
- [FUTURE] Implement city-level rates in Tier 2

### 5.6 Partial Year Nexus

**Problem:** Nexus established mid-year (e.g., July 1, 2022)

**Handling:**
- Only include sales after nexus date in liability calculation
- Pro-rate annual liability
- Clearly show nexus date in report

### 5.7 Affiliate Nexus

**Problem:** Potential affiliate nexus (complex, fact-specific)

**Handling:**
- Do NOT attempt to determine automatically (out of scope)
- Flag for manual review: "Potential affiliate nexus situations not analyzed"
- Provide questionnaire in physical nexus form: "Do you have affiliated entities in any states?"
- If Yes: "Affiliate nexus requires manual analysis - consult SALT professional"

### 5.8 Product Taxability

**Problem:** Some products may be exempt (food, clothing, software, etc.)

**Handling (MVP):**
- Assume all products taxable (conservative)
- Note in report: "Product taxability not analyzed - all sales assumed taxable"
- [FUTURE] Implement product-level taxability in Tier 2

### 5.9 Data Quality Issues

**Problem:** Messy real-world data (missing rows, inconsistent formats, errors)

**Handling:**
- Robust parsing with error recovery
- Show validation summary before processing
- Allow user to correct errors or proceed with warnings
- Track data quality score: `clean_rows / total_rows`
- If quality <90%, show prominent warning

---

## 6. Implementation Notes

### 6.1 Data Type Standards

**Dates:**
- Store internally as ISO 8601 strings or Date objects
- Display in user's preferred format (default: MM/DD/YYYY for US users)

**Currency:**
- Store as Decimal type (not Float) to avoid rounding errors
- Display with 2 decimal places
- Always use $ symbol for clarity

**State Codes:**
- Always uppercase for consistency
- Validate against standard list (50 states + DC + territories if needed)

**Percentages:**
- Store as decimal (0.0825 for 8.25%)
- Display as percentage (8.25%)

### 6.2 Database Schema Considerations

**Sales Transactions Table:**
```sql
CREATE TABLE sales_transactions (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id),
  transaction_date DATE NOT NULL,
  customer_state CHAR(2) NOT NULL,
  sales_amount DECIMAL(12,2) NOT NULL,
  sales_channel VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  transaction_count INTEGER DEFAULT 1,
  tax_collected DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Physical Nexus Table:**
```sql
CREATE TABLE physical_nexus (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id),
  state CHAR(2) NOT NULL,
  nexus_type VARCHAR(50) NOT NULL,
  established_date DATE NOT NULL,
  ended_date DATE,
  still_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**State Results Table:**
```sql
CREATE TABLE state_results (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id),
  state CHAR(2) NOT NULL,
  nexus_type VARCHAR(20), -- 'physical', 'economic', 'both', 'none'
  nexus_date DATE,
  total_sales DECIMAL(12,2),
  direct_sales DECIMAL(12,2),
  marketplace_sales DECIMAL(12,2),
  estimated_liability DECIMAL(12,2),
  base_tax DECIMAL(12,2),
  interest DECIMAL(12,2),
  penalties DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Next Steps

### 7.1 Immediate (Before Development)
1. Review this data model with users/stakeholders
2. Create sample Excel template for users
3. Define state rules database schema (separate document)
4. Wireframe the physical nexus intake form

### 7.2 Development Preparation
1. Choose tech stack (Python/pandas for data processing recommended)
2. Select PDF generation library (ReportLab, WeasyPrint, or similar)
3. Plan file upload/storage infrastructure
4. Design processing pipeline architecture

### 7.3 Validation
1. Create test datasets (clean, messy, edge cases)
2. Generate sample reports
3. User testing with real SALT professionals
4. Iterate on report format based on feedback

---

## Appendix A: Sample Excel Template

**File Name:** `SALT-Analysis-Template.xlsx`

**Sheet 1: Sales Data**

| transaction_date | customer_state | sales_amount | sales_channel | transaction_id | notes |
|-----------------|----------------|--------------|---------------|----------------|-------|
| 2024-01-15 | CA | 1250.00 | Direct | INV-2024-0001 | |
| 2024-01-16 | NY | 850.50 | Amazon | | |
| 2024-01-17 | TX | 2100.00 | Direct | INV-2024-0002 | |

**Sheet 2: Instructions**
- Field descriptions
- Sales channel options
- Data format requirements
- Common errors to avoid

**Sheet 3: Physical Nexus (Optional)**
- If user prefers spreadsheet over form

---

## Appendix B: State Code Validation List

**Valid State Codes:**
AL, AK, AZ, AR, CA, CO, CT, DE, DC, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY

**Common Typos:**
- "C" â†’ CT, CA, CO
- "N" â†’ NY, NJ, NM, NC, ND, NE, NV, NH
- "Calif" â†’ CA
- "Mass" â†’ MA

---

## Document Status

**Last Updated:** 2025-11-02  
**Status:** Draft - Ready for Review  
**Reviewers:** SALT professionals, development team  
**Next Review:** After stakeholder feedback  

**Change Log:**
- 2025-11-02: Initial draft created
