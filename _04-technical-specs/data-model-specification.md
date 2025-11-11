# Nexus Check - Data Model Specification (UPDATED)

**Created:** 2025-11-02  
**Updated:** 2025-11-02  
**Purpose:** Define data structures for input, processing, and output  
**Status:** Phase 1, Step 1 - Complete with Gap Analysis Updates

---

## UPDATES (2025-11-02)

**Added:**
- Section 7: User Account & Analysis Management Schema
- Section 8: Error Handling & Status Tracking
- Section 9: Retention Policy & Cleanup
- Updated all references to link analyses to user accounts

---

## Table of Contents
1. [Excel Input Schema](#1-excel-input-schema)
2. [Physical Nexus Data Structure](#2-physical-nexus-data-structure)
3. [Report Output Format](#3-report-output-format)
4. [Validation Rules](#4-validation-rules)
5. [Edge Cases & Handling](#5-edge-cases--handling)
6. [Implementation Notes](#6-implementation-notes)
7. [User Account & Analysis Management](#7-user-account--analysis-management) **NEW**
8. [Error Handling & Status Tracking](#8-error-handling--status-tracking) **NEW**
9. [Retention Policy & Cleanup](#9-retention-policy--cleanup) **NEW**

---

## 1. Excel Input Schema

[Content remains the same as original - no changes needed]

---

## 2. Physical Nexus Data Structure

[Content remains the same as original - no changes needed]

---

## 3. Report Output Format

[Content remains the same as original - no changes needed]

---

## 4. Validation Rules

[Content remains the same as original - no changes needed]

---

## 5. Edge Cases & Handling

[Content remains the same as original - no changes needed]

---

## 6. Implementation Notes

[Content remains the same as original - with addition of user_id references]

### 6.2 Database Schema Considerations (UPDATED)

**Sales Transactions Table:**
```sql
CREATE TABLE sales_transactions (
  id SERIAL PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE, -- ADDED
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
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE, -- ADDED
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
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE, -- ADDED
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

## 7. User Account & Analysis Management **NEW**

### 7.1 User Accounts

**Purpose:** Track users, authentication, and account-level settings

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- Future: Firm branding info (Tier 2)
  -- firm_logo_path TEXT,
  -- firm_contact_email VARCHAR(255),
  -- etc.
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);
```

**Authentication:** Handled by Supabase Auth
- Users.id = auth.uid() (Supabase user ID)
- Email verification required
- Password requirements: min 12 chars

### 7.2 Analyses Table (Core)

**Purpose:** Track each nexus analysis with status, retention, and metadata

```sql
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
```

### 7.3 Retention Policy Calculation

**Business Logic:**

```python
def calculate_auto_delete_date(created_at: datetime, retention_policy: str) -> date:
    """Calculate when analysis should be auto-deleted"""
    
    if retention_policy == 'delete_immediate':
        # Delete after first report download (handled separately)
        return None
    
    elif retention_policy == '90_days':
        return (created_at + timedelta(days=90)).date()
    
    elif retention_policy == '1_year':
        return (created_at + timedelta(days=365)).date()
    
    else:
        raise ValueError(f"Invalid retention policy: {retention_policy}")

# Example
analysis_created = datetime(2025, 11, 2, 10, 30)
retention = '90_days'
auto_delete = calculate_auto_delete_date(analysis_created, retention)
# Result: 2026-01-31
```

### 7.4 Data Model - Analysis Creation Flow

```json
{
  "user_id": "abc-123-def",
  "client_company_name": "ACME Corporation",
  "industry": "E-commerce",
  "business_type": "C-Corp",
  "analysis_period": {
    "start_date": "2021-01-01",
    "end_date": "2024-12-31"
  },
  "retention_policy": "90_days",
  "status": "draft"
}
```

**After processing completes:**

```json
{
  "id": "xyz-789-abc",
  "user_id": "abc-123-def",
  "client_company_name": "ACME Corporation",
  "status": "complete",
  "report_storage_path": "/abc-123-def/xyz-789-abc/report.pdf",
  "total_liability": 241397.00,
  "states_with_nexus": 15,
  "auto_delete_date": "2026-01-31",
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:35:00Z"
}
```

---

## 8. Error Handling & Status Tracking **NEW**

### 8.1 Analysis Status States

```
draft â”€â”€â”€â”€â”€â”€> processing â”€â”€â”€â”€â”€â”€> complete
   â”‚              â”‚                   â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€> error â”€â”€â”€â”€â”˜
                              â”‚
                              â””â”€â”€> Can retry to processing
```

**Status Definitions:**

- **`draft`**: Analysis created, data being uploaded/validated
- **`processing`**: Data validated, nexus calculation in progress
- **`complete`**: Analysis finished successfully, report generated
- **`error`**: Processing failed, user can retry

### 8.2 Error Logging Table

```sql
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
```

### 8.3 Error Types

**`validation`**: User's data has issues
```json
{
  "error_type": "validation",
  "error_message": "Invalid state codes found",
  "context": {
    "invalid_rows": [45, 67, 103],
    "invalid_states": ["C", "N", "T"],
    "suggestions": {
      "C": ["CA", "CT", "CO"],
      "N": ["NY", "NJ", "NC"]
    }
  }
}
```

**`processing`**: System error during calculation
```json
{
  "error_type": "processing",
  "error_message": "State rules query failed",
  "context": {
    "state": "CA",
    "step": "economic_nexus_calculation",
    "retry_count": 3
  }
}
```

**`pdf_generation`**: Report generation failed
```json
{
  "error_type": "pdf_generation",
  "error_message": "WeasyPrint rendering error",
  "context": {
    "template": "nexus_analysis_v1.html",
    "calculations_saved": true
  }
}
```

**`infrastructure`**: Database, network, or system failure
```json
{
  "error_type": "infrastructure",
  "error_message": "Database connection timeout",
  "context": {
    "service": "supabase",
    "retry_attempted": true
  }
}
```

### 8.4 Auto-Save & Recovery

**Draft State Auto-Save:**
```sql
-- Update analysis draft state every 30 seconds
UPDATE analyses 
SET 
  updated_at = NOW(),
  -- Save whatever partial progress exists
WHERE id = $analysis_id;
```

**Resume Incomplete Analysis:**
```python
def get_incomplete_analyses(user_id: UUID) -> List[Analysis]:
    """On user login, check for incomplete analyses"""
    return supabase.table('analyses') \
        .select('*') \
        .eq('user_id', user_id) \
        .in_('status', ['draft', 'processing']) \
        .order('updated_at', desc=True) \
        .execute()

# Show user prompt to resume
```

### 8.5 Retry Logic

**Exponential Backoff:**
```python
import asyncio
from typing import Callable, Any

async def retry_with_backoff(
    func: Callable, 
    max_retries: int = 3,
    base_delay: float = 1.0
) -> Any:
    """Retry function with exponential backoff"""
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                # Last attempt failed, raise error
                raise
            
            # Calculate backoff: 1s, 2s, 4s
            delay = base_delay * (2 ** attempt)
            await asyncio.sleep(delay)
            
            # Log retry
            log_error(
                error_type='infrastructure',
                error_message=f'Retry attempt {attempt + 1}/{max_retries}',
                context={'delay_seconds': delay}
            )
```

---

## 9. Retention Policy & Cleanup **NEW**

### 9.1 User Choice UI

**During Analysis Creation:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ New Analysis                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Client Company Name: [____________]     â”‚
â”‚ Analysis Period: [2021] to [2024]      â”‚
â”‚                                         â”‚
â”‚ Data Retention: â“˜                      â”‚
â”‚   â—‹ Delete immediately after download   â”‚
â”‚   â— Keep for 90 days (Recommended)      â”‚
â”‚   â—‹ Keep for 1 year                     â”‚
â”‚                                         â”‚
â”‚ â“˜ Why this matters:                     â”‚
â”‚ â€¢ Longer retention lets you access      â”‚
â”‚   reports later without re-uploading    â”‚
â”‚ â€¢ Shorter retention maximizes privacy   â”‚
â”‚ â€¢ You can change this or delete early   â”‚
â”‚                                         â”‚
â”‚ [Continue] [Cancel]                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 9.2 Scheduled Cleanup Job

**Purpose:** Automatically delete expired analyses

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import date, datetime, timedelta

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2)  # Runs at 2am daily
async def cleanup_expired_analyses():
    """
    1. Soft delete analyses past auto_delete_date
    2. Hard delete analyses soft-deleted >30 days ago
    """
    
    # Step 1: Soft Delete (mark as deleted)
    expired = supabase.table('analyses') \
        .select('id, report_storage_path, user_id, client_company_name') \
        .lte('auto_delete_date', date.today()) \
        .is_('deleted_at', 'null') \
        .execute()
    
    for analysis in expired.data:
        # Mark as deleted (30-day recovery window)
        supabase.table('analyses') \
            .update({'deleted_at': datetime.now()}) \
            .eq('id', analysis['id']) \
            .execute()
        
        # Log for audit
        log_audit_event(
            user_id=analysis['user_id'],
            action='analysis_auto_deleted',
            resource_id=analysis['id']
        )
        
        # Optional: Email user warning
        send_deletion_notice(analysis)
    
    # Step 2: Hard Delete (permanent removal)
    hard_delete_threshold = datetime.now() - timedelta(days=30)
    
    to_delete = supabase.table('analyses') \
        .select('id, report_storage_path') \
        .lt('deleted_at', hard_delete_threshold) \
        .execute()
    
    for analysis in to_delete.data:
        # Delete PDF from Supabase Storage
        if analysis['report_storage_path']:
            supabase.storage \
                .from_('reports') \
                .remove([analysis['report_storage_path']])
        
        # Delete from database (cascades to related tables)
        supabase.table('analyses') \
            .delete() \
            .eq('id', analysis['id']) \
            .execute()
        
        log_audit_event(
            action='analysis_hard_deleted',
            resource_id=analysis['id']
        )
```

### 9.3 Delete Immediate Handling

**Special Case:** `retention_policy = 'delete_immediate'`

```python
async def handle_report_download(analysis_id: UUID):
    """After user downloads report, check if should delete"""
    
    analysis = get_analysis(analysis_id)
    
    if analysis.retention_policy == 'delete_immediate':
        # Mark for deletion immediately
        supabase.table('analyses') \
            .update({
                'deleted_at': datetime.now(),
                'auto_delete_date': date.today()  # Delete tonight
            }) \
            .eq('id', analysis_id) \
            .execute()
        
        # Show user confirmation
        flash_message("Analysis will be deleted tonight for privacy")
```

### 9.4 User-Initiated Deletion

**Any Time Delete:**
```python
async def delete_analysis(analysis_id: UUID, user_id: UUID):
    """User clicks 'Delete' button"""
    
    # Verify ownership
    analysis = supabase.table('analyses') \
        .select('*') \
        .eq('id', analysis_id) \
        .eq('user_id', user_id) \
        .single() \
        .execute()
    
    if not analysis:
        raise PermissionError("Analysis not found or access denied")
    
    # Soft delete (30-day recovery)
    supabase.table('analyses') \
        .update({'deleted_at': datetime.now()}) \
        .eq('id', analysis_id) \
        .execute()
    
    log_audit_event(
        user_id=user_id,
        action='analysis_deleted_by_user',
        resource_id=analysis_id
    )
```

### 9.5 Cascade Delete Behavior

**When analysis is deleted, automatically delete:**
- âœ… All rows in `sales_transactions` (ON DELETE CASCADE)
- âœ… All rows in `physical_nexus` (ON DELETE CASCADE)
- âœ… All rows in `state_results` (ON DELETE CASCADE)
- âœ… PDF file from Supabase Storage (manual cleanup in job)
- âœ… Original upload file if still exists (manual cleanup)

**Database enforces via foreign key constraints:**
```sql
-- Already defined in tables above
REFERENCES analyses(id) ON DELETE CASCADE
```

---

## 10. Audit Logging (Optional but Recommended)

### 10.1 Audit Log Table

```sql
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
```

### 10.2 Common Audit Events

```python
# User authentication
log_audit_event('login', user_id=user.id, ip=request.ip)

# Analysis lifecycle
log_audit_event('analysis_created', resource_id=analysis.id)
log_audit_event('analysis_completed', resource_id=analysis.id)
log_audit_event('report_downloaded', resource_id=analysis.id)
log_audit_event('analysis_deleted', resource_id=analysis.id)

# Data export
log_audit_event('data_exported', resource_id=analysis.id, notes='Excel format')

# Retention changes
log_audit_event('retention_extended', resource_id=analysis.id, 
                notes='Changed from 90 days to 1 year')
```

---

## 11. Summary of Schema Updates

### New Tables Added:
1. âœ… `users` - User accounts
2. âœ… `analyses` - Core analysis tracking with status & retention
3. âœ… `error_logs` - Error tracking and debugging
4. âœ… `audit_log` - Compliance and security tracking

### Existing Tables Updated:
1. âœ… `sales_transactions` - Added `analysis_id` FK
2. âœ… `physical_nexus` - Added `analysis_id` FK
3. âœ… `state_results` - Added `analysis_id` FK

### Key Features Enabled:
- âœ… User account management
- âœ… Multi-analysis support per user
- âœ… User-controlled retention policies
- âœ… Automatic cleanup of expired data
- âœ… Comprehensive error tracking
- âœ… Status tracking and recovery
- âœ… Audit trail for compliance

---

## Appendix: Complete Schema Diagram

```
users
  â”œâ”€â”€ analyses (1:many)
  â”‚     â”œâ”€â”€ sales_transactions (1:many)
  â”‚     â”œâ”€â”€ physical_nexus (1:many)
  â”‚     â”œâ”€â”€ state_results (1:many)
  â”‚     â””â”€â”€ error_logs (1:many)
  â”œâ”€â”€ error_logs (1:many)
  â””â”€â”€ audit_log (1:many)

states
  â”œâ”€â”€ economic_nexus_thresholds (1:many)
  â”œâ”€â”€ marketplace_facilitator_rules (1:many)
  â”œâ”€â”€ tax_rates (1:many)
  â””â”€â”€ interest_penalty_rates (1:many)
```

---

## Document Status

**Last Updated:** 2025-11-02  
**Status:** Complete - Ready for Implementation  
**Phase:** Phase 1 Complete - Ready for Phase 2 (User Flow Mapping)  
**Next Review:** After Phase 2 (validate schema supports UX needs)

**Change Log:**
- 2025-11-02: Added Sections 7-10 (User accounts, error handling, retention, audit)
- 2025-11-02: Updated existing tables with analysis_id foreign keys
- 2025-11-02: Initial draft created (Sections 1-6)
