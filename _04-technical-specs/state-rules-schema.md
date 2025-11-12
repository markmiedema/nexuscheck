# Nexus Check - State Rules Database Specification

**Created:** 2025-11-02
**Updated:** 2025-11-11 (status clarification)
**Document Type:** Technical Reference - Database Schema
**Status:** Implemented in production Supabase database
**Database:** Supabase (Managed PostgreSQL)

**Note:** This document was created during database design (Nov 2025). The schema described here is implemented in the production database. Use as reference for database structure and query patterns.

---

## Table of Contents
1. [Database Schema Overview](#1-database-schema-overview)
2. [Economic Nexus Thresholds](#2-economic-nexus-thresholds)
3. [Marketplace Facilitator Rules](#3-marketplace-facilitator-rules)
4. [Tax Rates](#4-tax-rates)
5. [Interest and Penalty Rates](#5-interest-and-penalty-rates)
6. [State Metadata](#6-state-metadata)
7. [Query Patterns](#7-query-patterns)
8. [Data Maintenance Strategy](#8-data-maintenance-strategy)
9. [Initial Data Population](#9-initial-data-population)

---

## 1. Database Schema Overview

### 1.1 Design Principles

**For MVP:**
- Simple, queryable structure
- Support current rules (historical changes optional for V1.1)
- Easy to update when states change rules
- Optimized for nexus analysis queries

**For Future:**
- Historical threshold tracking (effective_from/effective_to dates)
- Product taxability rules
- Local tax rate variations
- Special rules and exemptions

### 1.2 Core Tables

1. **`states`** - State metadata and basic information
2. **`economic_nexus_thresholds`** - Revenue and transaction thresholds by state
3. **`marketplace_facilitator_rules`** - How each state treats marketplace sales
4. **`tax_rates`** - State base rate + average local rate
5. **`interest_penalty_rates`** - Interest and penalty calculations by state
6. **`state_registration_info`** - Registration requirements and VDA information (Tier 2)

---

## 2. Economic Nexus Thresholds

### 2.1 Table: `economic_nexus_thresholds`

```sql
CREATE TABLE economic_nexus_thresholds (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  threshold_type VARCHAR(20) NOT NULL, -- 'revenue', 'transaction', 'both', 'or'
  revenue_threshold DECIMAL(12,2), -- NULL if no revenue threshold
  transaction_threshold INTEGER, -- NULL if no transaction threshold
  threshold_operator VARCHAR(10) NOT NULL, -- 'and', 'or'
  effective_from DATE NOT NULL, -- When this threshold became effective
  effective_to DATE, -- NULL if currently active
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_threshold_type CHECK (threshold_type IN ('revenue', 'transaction', 'both', 'or')),
  CONSTRAINT valid_operator CHECK (threshold_operator IN ('and', 'or')),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT valid_thresholds CHECK (
    (threshold_type = 'revenue' AND revenue_threshold IS NOT NULL) OR
    (threshold_type = 'transaction' AND transaction_threshold IS NOT NULL) OR
    (threshold_type IN ('both', 'or') AND revenue_threshold IS NOT NULL AND transaction_threshold IS NOT NULL)
  )
);

-- Index for fast querying current thresholds
CREATE INDEX idx_nexus_thresholds_current 
ON economic_nexus_thresholds(state) 
WHERE effective_to IS NULL;

-- Index for historical queries (V1.1)
CREATE INDEX idx_nexus_thresholds_effective 
ON economic_nexus_thresholds(state, effective_from, effective_to);
```

### 2.2 Threshold Types Explained

**`threshold_type` Values:**

- **`revenue`**: Only revenue threshold applies
  - Example: California - $500,000 in gross revenue
  
- **`transaction`**: Only transaction count threshold applies
  - Example: (hypothetical) - 200 transactions
  
- **`both`**: Must meet BOTH thresholds (AND logic)
  - Example: (rare) - $100,000 revenue AND 200 transactions
  - `threshold_operator` = 'and'
  
- **`or`**: Must meet EITHER threshold (OR logic)
  - Example: Texas - $500,000 revenue OR 200 transactions
  - `threshold_operator` = 'or'

### 2.3 Sample Data

```sql
-- California (revenue only)
INSERT INTO economic_nexus_thresholds (state, threshold_type, revenue_threshold, threshold_operator, effective_from) 
VALUES ('CA', 'revenue', 500000.00, 'or', '2019-04-01');

-- Texas (revenue OR transactions)
INSERT INTO economic_nexus_thresholds (state, threshold_type, revenue_threshold, transaction_threshold, threshold_operator, effective_from) 
VALUES ('TX', 'or', 500000.00, 200, 'or', '2019-10-01');

-- New York (revenue only, but changed over time)
INSERT INTO economic_nexus_thresholds (state, threshold_type, revenue_threshold, threshold_operator, effective_from, effective_to) 
VALUES ('NY', 'revenue', 500000.00, 'or', '2019-01-01', '2021-12-31');

INSERT INTO economic_nexus_thresholds (state, threshold_type, revenue_threshold, threshold_operator, effective_from) 
VALUES ('NY', 'revenue', 100000.00, 'or', '2022-01-01');
```

### 2.4 Query Pattern for Nexus Determination

```sql
-- Get current threshold for a state
SELECT 
  threshold_type,
  revenue_threshold,
  transaction_threshold,
  threshold_operator
FROM economic_nexus_thresholds
WHERE state = 'CA'
  AND effective_to IS NULL
LIMIT 1;

-- Get threshold for a specific date (V1.1 - historical support)
SELECT 
  threshold_type,
  revenue_threshold,
  transaction_threshold,
  threshold_operator
FROM economic_nexus_thresholds
WHERE state = 'CA'
  AND effective_from <= '2022-06-15'
  AND (effective_to IS NULL OR effective_to >= '2022-06-15')
LIMIT 1;
```

---

## 3. Marketplace Facilitator Rules

### 3.1 Table: `marketplace_facilitator_rules`

```sql
CREATE TABLE marketplace_facilitator_rules (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  
  -- Does this state have marketplace facilitator laws?
  has_mf_law BOOLEAN NOT NULL DEFAULT TRUE,
  mf_law_effective_date DATE, -- When MF law took effect
  
  -- Do marketplace sales count toward economic nexus thresholds?
  count_toward_threshold BOOLEAN NOT NULL,
  
  -- Should we exclude MF sales from liability calculation?
  exclude_from_liability BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Additional rules
  remote_seller_must_register BOOLEAN NOT NULL DEFAULT FALSE, -- Even if only MF sales
  
  notes TEXT, -- Special considerations or exceptions
  
  effective_from DATE NOT NULL,
  effective_to DATE, -- NULL if currently active
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Index for current rules
CREATE INDEX idx_mf_rules_current 
ON marketplace_facilitator_rules(state) 
WHERE effective_to IS NULL;
```

### 3.2 Field Explanations

**`count_toward_threshold`:**
- **TRUE**: Marketplace sales count when determining if nexus exists
  - Example: If threshold is $100k, and you have $80k direct + $30k marketplace = $110k total â†' Nexus exists
- **FALSE**: Only direct sales count toward threshold
  - Example: Same scenario â†' Only $80k counts â†' No nexus

**`exclude_from_liability`:**
- **TRUE** (default): Marketplace already collected tax, exclude from liability estimate
- **FALSE** (rare): Include in liability (marketplace may not have collected)

**`remote_seller_must_register`:**
- **TRUE**: Seller must register even if 100% marketplace sales
- **FALSE** (common): No registration needed if only marketplace sales

### 3.3 Sample Data

```sql
-- California (MF sales count toward threshold, excluded from liability)
INSERT INTO marketplace_facilitator_rules (
  state, 
  has_mf_law, 
  mf_law_effective_date,
  count_toward_threshold, 
  exclude_from_liability,
  remote_seller_must_register,
  effective_from
) VALUES (
  'CA', 
  TRUE, 
  '2019-10-01',
  TRUE, 
  TRUE,
  FALSE,
  '2019-10-01'
);

-- Texas (MF sales count, excluded from liability)
INSERT INTO marketplace_facilitator_rules (
  state, 
  has_mf_law, 
  mf_law_effective_date,
  count_toward_threshold, 
  exclude_from_liability,
  remote_seller_must_register,
  effective_from
) VALUES (
  'TX', 
  TRUE, 
  '2019-10-01',
  TRUE, 
  TRUE,
  FALSE,
  '2019-10-01'
);

-- Florida (MF sales do NOT count toward threshold, excluded from liability)
INSERT INTO marketplace_facilitator_rules (
  state, 
  has_mf_law, 
  mf_law_effective_date,
  count_toward_threshold, 
  exclude_from_liability,
  remote_seller_must_register,
  effective_from,
  notes
) VALUES (
  'FL', 
  TRUE, 
  '2021-07-01',
  FALSE, 
  TRUE,
  FALSE,
  '2021-07-01',
  'Only direct sales count toward $100k threshold'
);
```

### 3.4 Query Pattern

```sql
-- Get current marketplace rules for a state
SELECT 
  count_toward_threshold,
  exclude_from_liability,
  remote_seller_must_register,
  notes
FROM marketplace_facilitator_rules
WHERE state = 'CA'
  AND effective_to IS NULL
LIMIT 1;
```

---

## 4. Tax Rates

### 4.1 Table: `tax_rates`

```sql
CREATE TABLE tax_rates (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  
  -- State base rate
  state_rate DECIMAL(6,4) NOT NULL, -- 0.0825 for 8.25%
  
  -- Average local rate (for estimates)
  avg_local_rate DECIMAL(6,4) NOT NULL DEFAULT 0.0000, -- 0.0250 for 2.50%
  
  -- Combined rate (for convenience)
  combined_avg_rate DECIMAL(6,4) GENERATED ALWAYS AS (state_rate + avg_local_rate) STORED,
  
  -- Rate effective dates
  effective_from DATE NOT NULL,
  effective_to DATE, -- NULL if currently active
  
  notes TEXT, -- Special considerations (e.g., "varies by county")
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_rates CHECK (state_rate >= 0 AND state_rate <= 1),
  CONSTRAINT valid_local_rates CHECK (avg_local_rate >= 0 AND avg_local_rate <= 1),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Index for current rates
CREATE INDEX idx_tax_rates_current 
ON tax_rates(state) 
WHERE effective_to IS NULL;

-- Index for historical rates (V1.1)
CREATE INDEX idx_tax_rates_effective 
ON tax_rates(state, effective_from, effective_to);
```

### 4.2 Rate Calculation Approach

**For MVP:**
- Use `combined_avg_rate` for all liability estimates
- Single rate per state (no city/county variations)
- Historical rate changes optional (use current rate for all years)

**For Future (Tier 2):**
- City/county level rates
- Historical rate tracking
- ZIP code lookups

### 4.3 Sample Data

```sql
-- California (7.25% state + 1.00% avg local = 8.25% combined)
INSERT INTO tax_rates (state, state_rate, avg_local_rate, effective_from) 
VALUES ('CA', 0.0725, 0.0100, '2011-07-01');

-- Texas (6.25% state + 1.75% avg local = 8.00% combined)
INSERT INTO tax_rates (state, state_rate, avg_local_rate, effective_from) 
VALUES ('TX', 0.0625, 0.0175, '2006-01-01');

-- New York (4.00% state + 4.50% avg local = 8.50% combined)
INSERT INTO tax_rates (state, state_rate, avg_local_rate, effective_from) 
VALUES ('NY', 0.0400, 0.0450, '2005-06-01');

-- Delaware (0% - no sales tax)
INSERT INTO tax_rates (state, state_rate, avg_local_rate, effective_from, notes) 
VALUES ('DE', 0.0000, 0.0000, '1900-01-01', 'No sales tax in Delaware');
```

### 4.4 Query Pattern

```sql
-- Get current tax rate for a state
SELECT 
  state_rate,
  avg_local_rate,
  combined_avg_rate
FROM tax_rates
WHERE state = 'CA'
  AND effective_to IS NULL
LIMIT 1;

-- Calculate liability for a state
SELECT 
  SUM(sales_amount) * (
    SELECT combined_avg_rate 
    FROM tax_rates 
    WHERE state = 'CA' AND effective_to IS NULL
  ) AS estimated_tax
FROM sales_transactions
WHERE customer_state = 'CA'
  AND sales_channel != 'Amazon' -- Exclude marketplace
  AND transaction_date >= '2021-01-01';
```

---

## 5. Interest and Penalty Rates

### 5.1 Table: `interest_penalty_rates`

```sql
CREATE TABLE interest_penalty_rates (
  id SERIAL PRIMARY KEY,
  state CHAR(2) NOT NULL REFERENCES states(code),
  
  -- Interest calculation
  annual_interest_rate DECIMAL(6,4) NOT NULL, -- 0.0300 for 3% annual
  interest_calculation_method VARCHAR(20) NOT NULL, -- 'simple', 'compound_monthly', 'compound_daily'
  
  -- Penalty rates
  late_registration_penalty_rate DECIMAL(6,4), -- Flat rate (e.g., 0.10 for 10%)
  late_registration_penalty_min DECIMAL(10,2), -- Minimum penalty amount
  late_registration_penalty_max DECIMAL(10,2), -- Maximum penalty amount
  
  late_filing_penalty_rate DECIMAL(6,4),
  late_payment_penalty_rate DECIMAL(6,4),
  
  -- Penalty calculation method
  penalty_applies_to VARCHAR(20) DEFAULT 'tax', -- 'tax', 'tax_plus_interest'
  
  -- VDA waiver information
  vda_interest_waived BOOLEAN DEFAULT FALSE,
  vda_penalties_waived BOOLEAN DEFAULT TRUE, -- Most states waive penalties in VDA
  vda_lookback_period_months INTEGER, -- How far back VDA typically goes (e.g., 36 months)
  
  notes TEXT,
  
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_rates CHECK (annual_interest_rate >= 0 AND annual_interest_rate <= 1),
  CONSTRAINT valid_calculation_method CHECK (interest_calculation_method IN ('simple', 'compound_monthly', 'compound_daily')),
  CONSTRAINT valid_dates CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Index for current rates
CREATE INDEX idx_interest_penalty_current 
ON interest_penalty_rates(state) 
WHERE effective_to IS NULL;
```

### 5.2 Interest Calculation Methods

**`simple`**: Interest = Principal Ã-- Rate Ã-- Time
- Most common for sales tax
- Example: $10,000 tax Ã-- 3% Ã-- 3 years = $900

**`compound_monthly`**: Interest compounds monthly
- Some states (rare)
- More complex calculation

**`compound_daily`**: Interest compounds daily
- Very rare for sales tax
- Highest complexity

### 5.3 Sample Data

```sql
-- California (3% simple interest, 10% penalty)
INSERT INTO interest_penalty_rates (
  state, 
  annual_interest_rate, 
  interest_calculation_method,
  late_registration_penalty_rate,
  vda_penalties_waived,
  vda_lookback_period_months,
  effective_from,
  notes
) VALUES (
  'CA', 
  0.0300, 
  'simple',
  0.10,
  TRUE,
  48,
  '2010-01-01',
  'Interest and penalties can be waived with VDA'
);

-- Texas (1.5% monthly = 18% annual, compounded)
INSERT INTO interest_penalty_rates (
  state, 
  annual_interest_rate, 
  interest_calculation_method,
  late_registration_penalty_rate,
  vda_penalties_waived,
  vda_lookback_period_months,
  effective_from,
  notes
) VALUES (
  'TX', 
  0.0150, 
  'compound_monthly',
  0.05,
  TRUE,
  36,
  '2010-01-01',
  'Interest calculated monthly at 1.5% per month'
);

-- New York (2% + 1% compounded daily = complex)
INSERT INTO interest_penalty_rates (
  state, 
  annual_interest_rate, 
  interest_calculation_method,
  late_registration_penalty_rate,
  late_registration_penalty_min,
  late_registration_penalty_max,
  vda_penalties_waived,
  vda_lookback_period_months,
  effective_from,
  notes
) VALUES (
  'NY', 
  0.0300, 
  'compound_daily',
  0.10,
  50.00,
  NULL,
  TRUE,
  36,
  '2010-01-01',
  'Interest rate changes quarterly. Minimum $50 penalty.'
);
```

### 5.4 MVP Simplification

**For MVP:**
- Use simple interest only (ignore compound methods)
- Use flat penalty rate (10% of tax is common estimate)
- Skip minimum/maximum penalty logic
- Clearly note in report: "Interest and penalties are estimates"

**Calculation:**
```python
# Simple interest calculation for MVP
years_outstanding = (current_date - nexus_date).days / 365.25
interest = base_tax * interest_rate * years_outstanding
penalties = base_tax * penalty_rate  # Flat 10%
total_liability = base_tax + interest + penalties
```

---

## 6. State Metadata

### 6.1 Table: `states`

```sql
CREATE TABLE states (
  code CHAR(2) PRIMARY KEY, -- 'CA', 'NY', etc.
  name VARCHAR(50) NOT NULL, -- 'California', 'New York'
  
  -- Does this state have sales tax?
  has_sales_tax BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Economic nexus effective date (when did state adopt economic nexus)
  economic_nexus_effective_date DATE,
  
  -- State-level flags
  has_local_taxes BOOLEAN NOT NULL DEFAULT FALSE, -- Does state allow local taxes?
  has_home_rule_cities BOOLEAN NOT NULL DEFAULT FALSE, -- Home rule cities file separately
  
  -- VDA program information
  has_vda_program BOOLEAN NOT NULL DEFAULT TRUE,
  vda_contact_email VARCHAR(100),
  vda_contact_phone VARCHAR(20),
  state_tax_website VARCHAR(255),
  
  -- Registration info
  registration_url VARCHAR(255),
  typical_processing_time_days INTEGER, -- How long registration takes
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert all 50 states + DC
INSERT INTO states (code, name, has_sales_tax) VALUES
  ('AL', 'Alabama', TRUE),
  ('AK', 'Alaska', FALSE), -- No state sales tax (local taxes exist)
  ('AZ', 'Arizona', TRUE),
  ('AR', 'Arkansas', TRUE),
  ('CA', 'California', TRUE),
  ('CO', 'Colorado', TRUE),
  ('CT', 'Connecticut', TRUE),
  ('DE', 'Delaware', FALSE), -- No sales tax
  ('DC', 'District of Columbia', TRUE),
  ('FL', 'Florida', TRUE),
  ('GA', 'Georgia', TRUE),
  ('HI', 'Hawaii', TRUE),
  ('ID', 'Idaho', TRUE),
  ('IL', 'Illinois', TRUE),
  ('IN', 'Indiana', TRUE),
  ('IA', 'Iowa', TRUE),
  ('KS', 'Kansas', TRUE),
  ('KY', 'Kentucky', TRUE),
  ('LA', 'Louisiana', TRUE),
  ('ME', 'Maine', TRUE),
  ('MD', 'Maryland', TRUE),
  ('MA', 'Massachusetts', TRUE),
  ('MI', 'Michigan', TRUE),
  ('MN', 'Minnesota', TRUE),
  ('MS', 'Mississippi', TRUE),
  ('MO', 'Missouri', TRUE),
  ('MT', 'Montana', FALSE), -- No sales tax
  ('NE', 'Nebraska', TRUE),
  ('NV', 'Nevada', TRUE),
  ('NH', 'New Hampshire', FALSE), -- No sales tax
  ('NJ', 'New Jersey', TRUE),
  ('NM', 'New Mexico', TRUE),
  ('NY', 'New York', TRUE),
  ('NC', 'North Carolina', TRUE),
  ('ND', 'North Dakota', TRUE),
  ('OH', 'Ohio', TRUE),
  ('OK', 'Oklahoma', TRUE),
  ('OR', 'Oregon', FALSE), -- No sales tax
  ('PA', 'Pennsylvania', TRUE),
  ('RI', 'Rhode Island', TRUE),
  ('SC', 'South Carolina', TRUE),
  ('SD', 'South Dakota', TRUE),
  ('TN', 'Tennessee', TRUE),
  ('TX', 'Texas', TRUE),
  ('UT', 'Utah', TRUE),
  ('VT', 'Vermont', TRUE),
  ('VA', 'Virginia', TRUE),
  ('WA', 'Washington', TRUE),
  ('WV', 'West Virginia', TRUE),
  ('WI', 'Wisconsin', TRUE),
  ('WY', 'Wyoming', TRUE);
```

### 6.2 States Without Sales Tax

**Five states have no sales tax:**
- Alaska (AK) - Local taxes may apply
- Delaware (DE)
- Montana (MT)
- New Hampshire (NH)
- Oregon (OR)

**Handling in nexus analysis:**
- Still show in report if physical nexus present
- Flag as "No sales tax" with $0 liability
- Note if local taxes may apply (Alaska)

---

## 7. Query Patterns

### 7.1 Complete Nexus Analysis Query

```sql
-- Get all rules needed for nexus analysis for a specific state
SELECT 
  s.code AS state_code,
  s.name AS state_name,
  s.has_sales_tax,
  
  -- Nexus thresholds
  ent.threshold_type,
  ent.revenue_threshold,
  ent.transaction_threshold,
  ent.threshold_operator,
  
  -- Marketplace rules
  mfr.count_toward_threshold AS mf_count_toward_threshold,
  mfr.exclude_from_liability AS mf_exclude_from_liability,
  
  -- Tax rates
  tr.state_rate,
  tr.avg_local_rate,
  tr.combined_avg_rate,
  
  -- Interest and penalties
  ipr.annual_interest_rate,
  ipr.interest_calculation_method,
  ipr.late_registration_penalty_rate,
  ipr.vda_penalties_waived
  
FROM states s
LEFT JOIN economic_nexus_thresholds ent 
  ON ent.state = s.code AND ent.effective_to IS NULL
LEFT JOIN marketplace_facilitator_rules mfr 
  ON mfr.state = s.code AND mfr.effective_to IS NULL
LEFT JOIN tax_rates tr 
  ON tr.state = s.code AND tr.effective_to IS NULL
LEFT JOIN interest_penalty_rates ipr 
  ON ipr.state = s.code AND ipr.effective_to IS NULL
WHERE s.code = 'CA';
```

### 7.2 Get States Needing Economic Nexus Analysis

```sql
-- Get all states where economic nexus might apply (has sales tax + has threshold)
SELECT 
  s.code,
  s.name,
  ent.revenue_threshold,
  ent.transaction_threshold,
  ent.threshold_operator
FROM states s
INNER JOIN economic_nexus_thresholds ent 
  ON ent.state = s.code AND ent.effective_to IS NULL
WHERE s.has_sales_tax = TRUE
ORDER BY s.name;
```

### 7.3 Bulk Load All Current Rules

```sql
-- Single query to get all current rules (efficient for caching)
SELECT 
  s.code,
  s.name,
  s.has_sales_tax,
  ent.threshold_type,
  ent.revenue_threshold,
  ent.transaction_threshold,
  ent.threshold_operator,
  mfr.count_toward_threshold,
  mfr.exclude_from_liability,
  tr.combined_avg_rate,
  ipr.annual_interest_rate,
  ipr.late_registration_penalty_rate
FROM states s
LEFT JOIN economic_nexus_thresholds ent 
  ON ent.state = s.code AND ent.effective_to IS NULL
LEFT JOIN marketplace_facilitator_rules mfr 
  ON mfr.state = s.code AND mfr.effective_to IS NULL
LEFT JOIN tax_rates tr 
  ON tr.state = s.code AND tr.effective_to IS NULL
LEFT JOIN interest_penalty_rates ipr 
  ON ipr.state = s.code AND ipr.effective_to IS NULL
WHERE s.has_sales_tax = TRUE
ORDER BY s.code;
```

---

## 8. Data Maintenance Strategy

### 8.1 Update Frequency

**Quarterly Review:**
- Economic nexus thresholds (states rarely change these)
- Tax rates (some states adjust annually)
- Marketplace facilitator rules (relatively stable)

**Annual Review:**
- Interest rates (some states adjust annually)
- State metadata (contact info, URLs)

**Ad-Hoc Updates:**
- Major legislative changes
- New state adopts economic nexus
- Court decision changes rules

### 8.2 Update Process

**For Current Rules (MVP):**
1. Update existing row with new values
2. Set `updated_at` timestamp
3. Add notes about what changed
4. No need to preserve history (yet)

**For Historical Rules (V1.1):**
1. Set `effective_to` on old record
2. Insert new record with `effective_from` = day after old `effective_to`
3. Ensures no gaps or overlaps in effective dates

### 8.3 Data Sources

**Reliable sources for rules:**
- [Sales Tax Institute](https://www.salestaxinstitute.com/)
- State Department of Revenue websites (official)
- [Avalara State Guides](https://www.avalara.com/taxrates/)
- [TaxJar State Guides](https://www.taxjar.com/states)
- [Bloomberg Tax](https://www.bloombergtax.com/) (paid subscription)

**What to track:**
- State legislature bills affecting thresholds
- State Department of Revenue bulletins
- Court cases (rare but impactful)

### 8.4 Validation Checks

**Before deploying data updates:**
```sql
-- Ensure no overlapping effective dates
SELECT state, COUNT(*) 
FROM economic_nexus_thresholds 
WHERE effective_to IS NULL 
GROUP BY state 
HAVING COUNT(*) > 1;

-- Ensure all states have current rules
SELECT code 
FROM states 
WHERE has_sales_tax = TRUE
  AND code NOT IN (
    SELECT state FROM economic_nexus_thresholds WHERE effective_to IS NULL
  );

-- Ensure all rates are valid (0-100%)
SELECT * FROM tax_rates 
WHERE combined_avg_rate < 0 OR combined_avg_rate > 1;
```

### 8.5 Audit Trail

```sql
-- Track all changes to state rules
CREATE TABLE state_rules_audit (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(100), -- User email or 'SYSTEM'
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Trigger function to log changes (example for economic_nexus_thresholds)
CREATE OR REPLACE FUNCTION audit_state_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO state_rules_audit (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), current_user);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO state_rules_audit (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), current_user);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER audit_nexus_thresholds
AFTER INSERT OR UPDATE ON economic_nexus_thresholds
FOR EACH ROW EXECUTE FUNCTION audit_state_rules();

-- Repeat for other tables
```

---

## 9. Initial Data Population

### 9.1 MVP States (Top 10 by E-commerce Volume)

**Priority states for initial data:**
1. California (CA)
2. Texas (TX)
3. New York (NY)
4. Florida (FL)
5. Illinois (IL)
6. Pennsylvania (PA)
7. Ohio (OH)
8. Georgia (GA)
9. North Carolina (NC)
10. Washington (WA)

**Rationale:**
- Cover ~60% of typical e-commerce sales
- Validate tool with real-world data
- Expand to all 45 sales tax states after MVP validation

### 9.2 Data Population Script (Python + Supabase)

```python
from supabase import create_client, Client
import os
from decimal import Decimal
from datetime import date

# Initialize Supabase client
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

def populate_state_rules():
    """Populate initial state rules for MVP"""
    
    # California
    ca_rules = {
        'threshold': {
            'state': 'CA',
            'threshold_type': 'revenue',
            'revenue_threshold': Decimal('500000.00'),
            'threshold_operator': 'or',
            'effective_from': date(2019, 4, 1),
            'notes': 'Economic nexus applies to retail sales'
        },
        'marketplace': {
            'state': 'CA',
            'has_mf_law': True,
            'mf_law_effective_date': date(2019, 10, 1),
            'count_toward_threshold': True,
            'exclude_from_liability': True,
            'remote_seller_must_register': False,
            'effective_from': date(2019, 10, 1)
        },
        'tax_rate': {
            'state': 'CA',
            'state_rate': Decimal('0.0725'),
            'avg_local_rate': Decimal('0.0100'),
            'effective_from': date(2011, 7, 1),
            'notes': 'Base rate 7.25% + avg local 1%'
        },
        'interest_penalty': {
            'state': 'CA',
            'annual_interest_rate': Decimal('0.0300'),
            'interest_calculation_method': 'simple',
            'late_registration_penalty_rate': Decimal('0.10'),
            'vda_penalties_waived': True,
            'vda_lookback_period_months': 48,
            'effective_from': date(2010, 1, 1)
        }
    }
    
    # Insert California rules
    supabase.table('economic_nexus_thresholds').insert(ca_rules['threshold']).execute()
    supabase.table('marketplace_facilitator_rules').insert(ca_rules['marketplace']).execute()
    supabase.table('tax_rates').insert(ca_rules['tax_rate']).execute()
    supabase.table('interest_penalty_rates').insert(ca_rules['interest_penalty']).execute()
    
    # Texas
    tx_rules = {
        'threshold': {
            'state': 'TX',
            'threshold_type': 'or',
            'revenue_threshold': Decimal('500000.00'),
            'transaction_threshold': 200,
            'threshold_operator': 'or',
            'effective_from': date(2019, 10, 1),
            'notes': '$500k revenue OR 200 transactions'
        },
        'marketplace': {
            'state': 'TX',
            'has_mf_law': True,
            'mf_law_effective_date': date(2019, 10, 1),
            'count_toward_threshold': True,
            'exclude_from_liability': True,
            'remote_seller_must_register': False,
            'effective_from': date(2019, 10, 1)
        },
        'tax_rate': {
            'state': 'TX',
            'state_rate': Decimal('0.0625'),
            'avg_local_rate': Decimal('0.0175'),
            'effective_from': date(2006, 1, 1),
            'notes': 'Base rate 6.25% + avg local 1.75%'
        },
        'interest_penalty': {
            'state': 'TX',
            'annual_interest_rate': Decimal('0.0150'),
            'interest_calculation_method': 'compound_monthly',
            'late_registration_penalty_rate': Decimal('0.05'),
            'vda_penalties_waived': True,
            'vda_lookback_period_months': 36,
            'effective_from': date(2010, 1, 1),
            'notes': '1.5% per month compounded'
        }
    }
    
    # Insert Texas rules
    supabase.table('economic_nexus_thresholds').insert(tx_rules['threshold']).execute()
    supabase.table('marketplace_facilitator_rules').insert(tx_rules['marketplace']).execute()
    supabase.table('tax_rates').insert(tx_rules['tax_rate']).execute()
    supabase.table('interest_penalty_rates').insert(tx_rules['interest_penalty']).execute()
    
    # Repeat for other top 10 states...
    
    print("âœ… State rules populated successfully")

if __name__ == "__main__":
    populate_state_rules()
```

### 9.3 CSV Import (Alternative)

Create CSV files for bulk import via Supabase dashboard:

**`economic_nexus_thresholds.csv`:**
```csv
state,threshold_type,revenue_threshold,transaction_threshold,threshold_operator,effective_from,notes
CA,revenue,500000.00,,or,2019-04-01,Economic nexus
TX,or,500000.00,200,or,2019-10-01,$500k OR 200 transactions
NY,revenue,100000.00,,or,2022-01-01,Changed from $500k in 2022
FL,revenue,100000.00,,or,2021-07-01,
IL,revenue,100000.00,,or,2021-01-01,
PA,revenue,100000.00,,or,2019-07-01,
OH,revenue,100000.00,,or,2019-08-01,
GA,revenue,100000.00,,or,2020-01-01,
NC,revenue,100000.00,,or,2020-11-01,
WA,revenue,100000.00,,or,2020-01-01,
```

**`tax_rates.csv`:**
```csv
state,state_rate,avg_local_rate,effective_from,notes
CA,0.0725,0.0100,2011-07-01,Base 7.25% + avg local 1%
TX,0.0625,0.0175,2006-01-01,Base 6.25% + avg local 1.75%
NY,0.0400,0.0450,2005-06-01,Base 4% + avg local 4.5%
FL,0.0600,0.0100,2001-01-01,Base 6% + avg local 1%
IL,0.0625,0.0250,2010-01-01,Base 6.25% + avg local 2.5%
PA,0.0600,0.0000,2016-08-01,No local sales tax
OH,0.0575,0.0175,2005-07-01,Base 5.75% + avg local 1.75%
GA,0.0400,0.0300,2017-01-01,Base 4% + avg local 3%
NC,0.0475,0.0225,2016-11-01,Base 4.75% + avg local 2.25%
WA,0.0650,0.0250,2010-04-01,Base 6.5% + avg local 2.5%
```

---

## 10. Implementation Checklist

### Phase 1: Schema Creation
- [ ] Create all tables in Supabase
- [ ] Add indexes for performance
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create audit triggers (optional for MVP)

### Phase 2: Initial Data Load
- [ ] Populate `states` table (all 50 states + DC)
- [ ] Add rules for top 10 MVP states
- [ ] Validate data completeness
- [ ] Test queries for nexus analysis

### Phase 3: Testing
- [ ] Write unit tests for query patterns
- [ ] Test with sample sales data
- [ ] Verify calculations match manual calculations
- [ ] Benchmark query performance

### Phase 4: Documentation
- [ ] Document data sources used
- [ ] Create update procedures
- [ ] Write API documentation for accessing rules
- [ ] Create admin guide for updating rules

---

## 11. Future Enhancements (Post-MVP)

### V1.1: Historical Threshold Tracking
- Enable `effective_to` logic for threshold changes
- Adjust nexus determination to use historical thresholds
- Report when nexus date shifts due to threshold change

### V1.2: Product Taxability
- Add `product_taxability_rules` table
- Map product categories to taxable/exempt by state
- Refine liability estimates with product-level detail

### V1.3: Exact Local Rates
- Add `local_tax_rates` table (city/county level)
- Integrate ZIP code to tax jurisdiction mapping
- Replace average rates with exact rates

### V1.4: SST States Handling
- Track Streamlined Sales Tax (SST) member states
- Special rules for SST registration and filing
- Centralized registration benefits

---

## 12. API Access Layer (FastAPI)

### 12.1 Suggested Endpoint Structure

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date

app = FastAPI()

class StateRules(BaseModel):
    state_code: str
    state_name: str
    has_sales_tax: bool
    threshold_type: Optional[str]
    revenue_threshold: Optional[Decimal]
    transaction_threshold: Optional[int]
    threshold_operator: Optional[str]
    mf_count_toward_threshold: bool
    mf_exclude_from_liability: bool
    tax_rate: Decimal
    interest_rate: Decimal
    penalty_rate: Decimal

@app.get("/api/state-rules/{state_code}", response_model=StateRules)
async def get_state_rules(state_code: str, as_of_date: Optional[date] = None):
    """
    Get all rules for a specific state
    
    Args:
        state_code: 2-letter state abbreviation (e.g., 'CA')
        as_of_date: Optional date for historical rules (V1.1 feature)
    
    Returns:
        Complete rule set for nexus analysis
    """
    # Query Supabase for rules
    # Return combined result
    pass

@app.get("/api/state-rules", response_model=List[StateRules])
async def get_all_state_rules():
    """Get rules for all states with sales tax"""
    # Bulk query for caching
    pass

@app.get("/api/states-with-sales-tax", response_model=List[str])
async def get_sales_tax_states():
    """Get list of state codes that have sales tax"""
    # Simple query
    pass
```

---

## Document Status

**Last Updated:** 2025-11-02  
**Status:** Draft - Ready for Review  
**Next Steps:**  
1. Review schema design
2. Set up tables in Supabase
3. Populate initial data for MVP states
4. Test query patterns with sample data

**Change Log:**
- 2025-11-02: Initial draft created with complete schema design
