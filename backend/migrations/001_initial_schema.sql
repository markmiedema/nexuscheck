-- ============================================================================
-- SALT Tax Tool - Initial Database Schema Migration
-- ============================================================================
-- Created: 2025-11-02
-- Purpose: Create all 12 core tables for SALT nexus analysis tool
-- Database: Supabase (PostgreSQL)
--
-- IMPORTANT: This script uses EXACT schema from specification files
-- Do NOT modify table structures without updating specification documents
-- ============================================================================

-- Drop tables in reverse dependency order (for clean redeployment)
-- ============================================================================

DROP TABLE IF EXISTS interest_penalty_rates CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;
DROP TABLE IF EXISTS marketplace_facilitator_rules CASCADE;
DROP TABLE IF EXISTS economic_nexus_thresholds CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS state_results CASCADE;
DROP TABLE IF EXISTS physical_nexus CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS states CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
-- Purpose: Track users, authentication, and account-level settings
-- Dependencies: None
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP

  -- Future: Firm branding info (Tier 2)
  -- firm_logo_path TEXT,
  -- firm_contact_email VARCHAR(255),
  -- etc.
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- ============================================================================
-- TABLE 2: states
-- ============================================================================
-- Purpose: State metadata and basic information
-- Dependencies: None
-- ============================================================================

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

-- ============================================================================
-- TABLE 3: analyses
-- ============================================================================
-- Purpose: Track each nexus analysis with status, retention, and metadata
-- Dependencies: users
-- ============================================================================

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Client & Analysis Info
  client_company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  business_type VARCHAR(50),
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,

  -- File Storage Paths
  uploaded_file_path TEXT, -- Temp storage during processing (deleted after)
  report_storage_path TEXT, -- PDF in Supabase Storage

  -- Status Tracking (see Section 8)
  status VARCHAR(20) DEFAULT 'draft',
    -- 'draft', 'processing', 'complete', 'error'
  error_message TEXT,
  last_error_at TIMESTAMP,

  -- Results Summary
  total_liability DECIMAL(12,2),
  states_with_nexus INTEGER,

  -- Retention Policy (see Section 9)
  retention_policy VARCHAR(20) NOT NULL DEFAULT '90_days',
    -- 'delete_immediate', '90_days', '1_year'
  auto_delete_date DATE,
  deleted_at TIMESTAMP, -- Soft delete (30-day recovery)

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'processing', 'complete', 'error')
  ),
  CONSTRAINT valid_period CHECK (
    analysis_period_end > analysis_period_start
  ),
  CONSTRAINT valid_retention CHECK (
    retention_policy IN ('delete_immediate', '90_days', '1_year')
  )
);

-- Indexes
CREATE INDEX idx_analyses_user ON analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_auto_delete ON analyses(auto_delete_date)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE 4: sales_transactions
-- ============================================================================
-- Purpose: Store uploaded sales transaction data per analysis
-- Dependencies: analyses
-- ============================================================================

CREATE TABLE sales_transactions (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  customer_state CHAR(2) NOT NULL,
  sales_amount DECIMAL(12,2) NOT NULL,
  sales_channel VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  transaction_count INTEGER DEFAULT 1,
  tax_collected DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE 5: physical_nexus
-- ============================================================================
-- Purpose: Store physical nexus data per analysis
-- Dependencies: analyses
-- ============================================================================

CREATE TABLE physical_nexus (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  nexus_type VARCHAR(50) NOT NULL,
  established_date DATE NOT NULL,
  ended_date DATE,
  still_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE 6: state_results
-- ============================================================================
-- Purpose: Store calculated nexus results per state per analysis
-- Dependencies: analyses
-- ============================================================================

CREATE TABLE state_results (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
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

-- ============================================================================
-- TABLE 7: error_logs
-- ============================================================================
-- Purpose: Track errors during analysis processing
-- Dependencies: users, analyses
-- ============================================================================

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  analysis_id UUID REFERENCES analyses(id),

  -- Error Classification
  error_type VARCHAR(50) NOT NULL,
    -- 'validation', 'processing', 'pdf_generation', 'infrastructure'
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB, -- Additional relevant data

  -- Tracking
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_logs_type ON error_logs(error_type, created_at);
CREATE INDEX idx_error_logs_analysis ON error_logs(analysis_id);
CREATE INDEX idx_error_logs_user ON error_logs(user_id, created_at);

-- ============================================================================
-- TABLE 8: audit_log
-- ============================================================================
-- Purpose: Compliance and security tracking
-- Dependencies: users
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),

  -- Action Details
  action VARCHAR(50) NOT NULL,
    -- login, analysis_created, data_exported, analysis_deleted, etc.
  resource_type VARCHAR(50), -- analysis, user, report
  resource_id UUID,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================================================
-- TABLE 9: economic_nexus_thresholds
-- ============================================================================
-- Purpose: Revenue and transaction thresholds by state
-- Dependencies: states
-- ============================================================================

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

-- ============================================================================
-- TABLE 10: marketplace_facilitator_rules
-- ============================================================================
-- Purpose: How each state treats marketplace sales
-- Dependencies: states
-- ============================================================================

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

-- ============================================================================
-- TABLE 11: tax_rates
-- ============================================================================
-- Purpose: State base rate + average local rate
-- Dependencies: states
-- ============================================================================

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

-- ============================================================================
-- TABLE 12: interest_penalty_rates
-- ============================================================================
-- Purpose: Interest and penalty calculations by state
-- Dependencies: states
-- ============================================================================

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

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- NEXT STEPS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all 12 tables created successfully
-- 3. Populate states table with all 50 states + DC
-- 4. Populate initial state rules for MVP states (CA, TX, NY, FL, IL, PA, OH, GA, NC, WA)
-- 5. Set up Row Level Security (RLS) policies for multi-tenant access
--
-- VALIDATION QUERIES:
--
-- -- Check all tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
--
-- -- Check foreign key constraints
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY';
--
-- ============================================================================
