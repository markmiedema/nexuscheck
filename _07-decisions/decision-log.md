# Nexus Check - Decision Log

**Last Updated:** 2025-11-11
**Date Created:** 2025-11-02
**Purpose:** Document all architectural and scope decisions with rationale

---

## New Decisions (2025-11-02)

### User Account & Data Management
**Date:** 2025-11-02  
**Context:** Need to define how user accounts work, data retention policies, and privacy approach  
**Decision:** 
- Single-user accounts for MVP (no team features)
- User-controlled retention per analysis:
  - Delete immediately after download
  - Store 90 days (default/recommended)
  - Store 1 year
- User can delete early or extend retention anytime
- 30-day soft delete buffer for recovery
- Auto-delete via nightly scheduled job
- Transparent state rules (public API for MVP)
- Private user data (encryption, RLS, audit logs)

**Rationale:**
- Maximum flexibility for privacy-conscious pilot partners
- Simple to implement and explain
- Aligns with "user controls their data" philosophy
- Transparency builds trust for MVP (state rules are public info anyway)
- Protects what matters: client sales data
- Defers complex IP protection until we have real proprietary value

**Alternatives Considered:**
- Fixed retention (rejected - too rigid)
- Separate retention for files vs. data (rejected - confusing UX)
- No transparency (rejected - trust barrier for pilot partners)

**Implications:**
- Need user choice UI during analysis creation
- Need scheduled cleanup job
- Need audit logging for compliance
- Need clear privacy policy
- State rules can be queried/downloaded by anyone

**Revisit If:** Privacy-conscious users reject it, or competitors scrape state rules database

---

### File Storage Strategy
**Date:** 2025-11-02  
**Context:** Define what gets stored where and for how long  
**Decision:**
- **Original Excel files:** Temporary only (in-memory or temp storage during processing), deleted immediately after processing
- **Processed data:** Stored in PostgreSQL database for retention period (matches user choice)
- **Generated PDF reports:** Stored in Supabase Storage for retention period (matches user choice)
- **Processing failures:** User must re-upload (acceptable for MVP)
- **Cleanup:** Scheduled nightly job deletes expired analyses + cascades to files

**Rationale:**
- Minimizes data retention (privacy win)
- PDF storage enables instant retrieval (better UX than regeneration)
- Processed data enables report regeneration if PDF fails
- Simple architecture (no complex file versioning)
- Storage cost negligible (~$0.021/GB/month)

**Alternatives Considered:**
- Keep original files (rejected - privacy concern + unnecessary)
- Regenerate PDF on-demand (rejected - poor UX, extra server load)
- Store only PDF, not processed data (rejected - can't troubleshoot or add features)

**Implications:**
- Need Supabase Storage setup with RLS policies
- Need cascade delete logic (analysis â†' data â†' file)
- Processing failure = re-upload (acceptable for pilot, can improve later)
- Can add features later without asking users to re-upload

**Revisit If:** Users complain about re-uploading after failures (add retry buffer in V1.1)

---

### Report Branding & Customization
**Date:** 2025-11-02  
**Context:** Do reports need firm branding for client delivery?  
**Decision:**
- **MVP:** Generic professional template, no branding, no customization
- **Post-MVP:** High priority Tier 2 feature
  - Firm logo upload
  - Firm name and contact info
  - Custom footer text
  - User name attribution
  - One-time profile setup
- **Not planned:** Color/font customization, multiple templates (Tier 3 if ever)

**Rationale:**
- Fastest path to validation (MVP focus)
- Pilot partners testing functionality, not polish
- Can gather feedback on what branding they actually need
- Still professional enough for review
- Branding is essential for production use, but not for pilot validation

**Alternatives Considered:**
- Include branding in MVP (rejected - scope creep, delays validation)
- No branding ever (rejected - required for real client delivery)

**Implications:**
- Reports look generic in MVP (pilot partners aware this is beta)
- Must build branding feature before broader launch
- Users may copy/paste into their own templates during pilot
- Estimated 1-2 weeks to add post-validation

**Trigger Points for Building:**
- 10+ pilot partners validated MVP
- Feedback: "This is great but I need to brand it"
- Before commercial launch and charging users

**Revisit If:** Pilot partners refuse to use unbranded reports (can accelerate if needed)

---

### Error Handling & Recovery Strategy
**Date:** 2025-11-02  
**Context:** Define how system handles failures and how users recover  
**Decision:**
Comprehensive error handling with multiple safety nets:

**1. Upload/Validation Errors:**
- Validate before processing (catch bad data early)
- Specific, actionable error messages with row numbers
- Suggest fixes ("Did you mean 'CA' instead of 'C'?")
- Downloadable error report (CSV)
- User must fix and re-upload

**2. Processing Errors:**
- Auto-save draft state every 30 seconds
- Auto-retry failed operations (3x with exponential backoff)
- Preserve data even if processing fails
- Log errors server-side for debugging
- User-friendly messages (no stack traces)
- "Try Again" button resumes from last successful step

**3. Report Generation Errors:**
- Save calculation results BEFORE generating PDF
- If PDF fails, offer retry
- Fallback: Download as Excel/JSON
- Don't lose calculations due to PDF error

**4. Partial Failures:**
- Process all states that can be processed
- Flag failed states with clear reason
- Generate report with warnings section
- Let user decide if partial results useful

**5. User Errors (Browser closed, network dropped):**
- Auto-save draft every 30 seconds
- Track status: draft/processing/complete/error
- Offer to resume on next login

**6. Graceful Degradation:**
- If non-critical data missing, use defaults and flag
- Continue processing with assumptions noted
- Don't fail entire analysis over minor issues

**Rationale:**
- Never lose user's work (critical for trust)
- Auto-recovery reduces support burden
- Actionable errors help users fix issues themselves
- Logging enables debugging without user reports
- Graceful degradation maximizes utility

**Alternatives Considered:**
- Minimal error handling (rejected - poor UX, high support burden)
- No auto-save (rejected - users lose work on browser close)
- Fail hard on any error (rejected - reduces utility)

**Implications:**
- Need auto-save mechanism (every 30s)
- Need error_logs table
- Need retry logic with exponential backoff
- Need status tracking in analyses table
- Slightly more complex architecture, but worth it

**Success Criteria:**
- User understands what went wrong
- User knows how to fix it
- Work is never lost
- Can recover without support ticket
- You can debug from logs

**Revisit If:** Never - this is good practice for any production app

---

### Pricing Model (Deferred Decision)
**Date:** 2025-11-02  
**Context:** What to charge post-pilot?  
**Decision:** **Intentionally deferred** until pilot validation complete

**Decision Timeline:**
Decide after:
- 10+ pilot partners actively using tool
- Time savings validated (11+ hours confirmed)
- Accuracy validated (90%+ on real engagements)
- Product-market fit confirmed
- User feedback on willingness to pay

**Expected Decision Point:** 3-6 months post-pilot launch

**Research During Pilot:**
Ask pilot partners:
- "If you had to pay, what model would you prefer?"
- "What's this worth to you per analysis?"
- "How many analyses do you run per month?"
- "Would you pay monthly or per-use?"
- "What price point would make you hesitate?"

**Options to Evaluate Later:**
- Option A: Per-Report ($99-$199 per analysis)
- Option B: Monthly Subscription ($299-$499/month unlimited)
- Option C: Tiered (Free trial + paid tiers)
- Option D: Hybrid (Monthly base + per-report overage)

**Rationale:**
- Need real usage data before pricing decisions
- Pilot provides invaluable pricing research
- No rush - pilot partners aren't paying yet
- Premature pricing could limit options
- Market validation comes first

**Implications:**
- No payment processing in MVP
- No pricing page needed yet
- Focus on product validation, not monetization
- Can experiment with pricing post-pilot

**Revisit When:** Pilot validation complete and ready for commercial launch

---

## Database Schema Additions

### User Account Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Analyses table (updated)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  client_company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  business_type VARCHAR(50),
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- File storage
  uploaded_file_path TEXT,
  report_storage_path TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'draft', -- draft/processing/complete/error
  error_message TEXT,
  last_error_at TIMESTAMP,
  
  -- Results summary
  total_liability DECIMAL(12,2),
  states_with_nexus INTEGER,
  
  -- Retention policy
  retention_policy VARCHAR(20) NOT NULL, -- delete_immediate/90_days/1_year
  auto_delete_date DATE,
  deleted_at TIMESTAMP, -- Soft delete (30-day recovery window)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'processing', 'complete', 'error')),
  CONSTRAINT valid_period CHECK (analysis_period_end > analysis_period_start),
  CONSTRAINT valid_retention CHECK (retention_policy IN ('delete_immediate', '90_days', '1_year'))
);

-- Link existing tables to analyses
ALTER TABLE sales_transactions 
  ADD COLUMN analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE;

ALTER TABLE physical_nexus 
  ADD COLUMN analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE;

ALTER TABLE state_results 
  ADD COLUMN analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_analyses_user ON analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_auto_delete ON analyses(auto_delete_date) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_sales_analysis_state ON sales_transactions(analysis_id, customer_state);
CREATE INDEX idx_physical_nexus_analysis ON physical_nexus(analysis_id, state);
```

### Error Logging

```sql
-- Error logs table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  analysis_id UUID REFERENCES analyses(id),
  
  -- Error details
  error_type VARCHAR(50) NOT NULL, -- validation/processing/pdf_generation/infrastructure
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

### Audit Logging

```sql
-- Audit log table (optional but recommended)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Action details
  action VARCHAR(50) NOT NULL, -- login/analysis_created/data_exported/analysis_deleted
  resource_type VARCHAR(50), -- analysis/user/report
  resource_id UUID,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at);
```

---

## Implementation Notes

### Scheduled Cleanup Job (Python)

```python
# Runs nightly at 2am
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import date, datetime, timedelta

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2)
async def cleanup_expired_analyses():
    """Delete analyses past their retention period"""
    
    # Find analyses past auto_delete_date
    expired = supabase.table('analyses') \
        .select('id, report_storage_path') \
        .lte('auto_delete_date', date.today()) \
        .is_('deleted_at', 'null') \
        .execute()
    
    for analysis in expired.data:
        # Soft delete first (30-day recovery window)
        supabase.table('analyses') \
            .update({'deleted_at': datetime.now()}) \
            .eq('id', analysis['id']) \
            .execute()
        
        # Log it
        log_audit_event('analysis_auto_deleted', analysis['id'])
    
    # Hard delete after 30 days
    hard_delete_threshold = datetime.now() - timedelta(days=30)
    
    to_delete = supabase.table('analyses') \
        .select('id, report_storage_path') \
        .lt('deleted_at', hard_delete_threshold) \
        .execute()
    
    for analysis in to_delete.data:
        # Delete PDF from storage
        if analysis['report_storage_path']:
            supabase.storage.from_('reports').remove([analysis['report_storage_path']])
        
        # Delete database record (cascades to related tables)
        supabase.table('analyses') \
            .delete() \
            .eq('id', analysis['id']) \
            .execute()
        
        log_audit_event('analysis_hard_deleted', analysis['id'])
```

---

## Open Questions Resolved

All major gaps from definition framework analysis are now resolved:

âœ… **User Account Management** - Defined  
âœ… **File Storage Strategy** - Defined  
âœ… **Report Branding** - Scoped (MVP: none, Tier 2: yes)  
âœ… **Error Handling** - Comprehensive strategy defined  
âœ… **Pricing Model** - Intentionally deferred with clear timeline  

---

## Next Steps After Documentation Update

1. **Phase 2: User Flow Mapping** (3 hours)
   - Design upload flow with validation states
   - Design retention choice UI
   - Design error state UX
   - Design resume incomplete analysis flow
   - Create wireframes

2. **Phase 3: Technical Architecture** (3-4 hours)
   - Detail auto-save mechanism
   - Plan retry logic with exponential backoff
   - Design scheduled job infrastructure
   - Plan logging and monitoring

3. **Phase 4: Implementation** (8-12 weeks)
   - Set up Supabase with all tables
   - Implement auto-save
   - Build error handling
   - Create cleanup jobs

---

**Status:** All definition framework gaps resolved
**Ready for:** Phase 2 (User Flow Mapping)
**Blockers:** None

---

## Sprint 1 Planning Decisions (2025-11-11)

### Exempt Sales Handling Strategy
**Date:** 2025-11-11
**Context:** Gross sales vs. taxable sales distinction critical for accuracy - affects both nexus determination and liability calculation
**Decision:**
- **Hybrid approach** supporting both:
  - `is_taxable` column (boolean Y/N per transaction)
  - `exempt_amount` column (dollar value to subtract from revenue)
- **Dual calculation logic:**
  - Use **gross sales** (total revenue) for nexus threshold determination
  - Use **taxable sales** (revenue minus exemptions) for liability calculation
- **Database changes:**
  - Add `taxable_amount`, `is_taxable`, `exempt_amount` columns to transactions
  - Add `gross_sales`, `taxable_sales`, `exempt_sales` to state_results
- **MVP scope:** CSV column approach only
- **Phase 2:** Full taxability rules database (by product/state)

**Rationale:**
- Critical accuracy requirement - nexus thresholds use gross sales, liability uses taxable
- Different industries use different approaches (manufacturing = dollar exemptions, retail = boolean flags)
- Hybrid approach handles both without forcing users to choose
- CSV approach faster to implement than full taxability database
- Real-world data often has one or both columns
- Prevents over-estimation of tax liability

**Alternatives Considered:**
- Boolean only (rejected - doesn't handle partial exemptions)
- Dollar amount only (rejected - cumbersome for simple taxable/exempt flags)
- Skip entirely (rejected - would produce inaccurate liability calculations)
- Full taxability database first (rejected - 4-6 week effort, delays MVP)

**Implications:**
- Updates required to nexus_calculator_v2.py (separate gross/taxable logic)
- Updates to column_detector.py (detect both column types)
- UI must clearly distinguish "Sales for Nexus" vs "Sales for Liability"
- Documentation must explain the difference
- Migration adds 3 columns to transactions, 3 to state_results

**Revisit If:**
- Users frequently need product-level taxability rules (build database)
- CSV approach proves too manual (integrate with e-commerce platforms)

**Implementation:** Sprint 1, Days 6-8

---

### Physical Nexus Implementation Strategy
**Date:** 2025-11-11
**Context:** Current project has physical_nexus table but no frontend UI; pre-MVP had manual entry
**Decision:**
- **MVP (Sprint 1):** Post-upload manual entry UI
  - CRUD interface (add/edit/delete states)
  - Import/Export JSON configuration
  - No CSV column detection for physical nexus
- **Phase 2 (Future):** CSV column support (`has_physical_nexus` flag per transaction)
- **Phase 3 (Future):** CRM integration for automatic detection

**Rationale:**
- Database table already exists (faster implementation)
- Physical nexus changes infrequently (manual entry acceptable)
- Most firms have 5-10 physical nexus states (not hundreds)
- Import/Export enables reuse across analyses
- CSV column approach adds complexity without clear ROI for MVP
- Pilot validation needed before investing in CRM integration

**Alternatives Considered:**
- CSV column first (rejected - more complex, less common use case)
- No UI at all (rejected - critical feature gap, users can't specify physical presence)
- CRM integration first (rejected - premature, need validation first)

**Implications:**
- Need full CRUD API (POST, GET, PATCH, DELETE endpoints)
- Need frontend components (manager, form modal, table)
- Need usePhysicalNexusConfig custom hook
- Users must manually enter physical nexus states (acceptable for MVP)
- Can add CSV column support later without breaking changes

**Revisit If:**
- Users request CSV column support (5+ requests)
- Physical nexus changes frequently for pilot users
- Integration with ERP/CRM becomes common request

**Implementation:** Sprint 1, Days 1-2

---

### VDA Mode Implementation Approach
**Date:** 2025-11-11
**Context:** Pre-MVP had impressive VDA mode; user identified as "favorite feature"
**Decision:**
- **MVP approach:** Start simple, iterate based on usage
  - Binary waiver (penalty waived or not per state)
  - State selection UI (All, None, Top N by penalty/liability)
  - Before/after comparison
  - Savings breakdown table
  - Pie chart visualization
- **Phase 2:** Add complexity
  - Interest waivers (rare but some states offer)
  - Partial waivers (percentage-based)
  - Look-back period variations
  - VDA cost calculator (legal fees, registration)
- **Database:**
  - Add VDA columns to analyses (`vda_enabled`, `vda_selected_states`)
  - Add VDA columns to state_results (`vda_penalty_waived`, `vda_interest_waived`, `vda_total_savings`)

**Rationale:**
- Most states waive 100% of penalties (binary is accurate for MVP)
- Interest waivers rare (~5 states)
- Users want quick "what if" comparison more than precision
- Pilot validation will reveal which complexities matter
- Simple implementation = faster to market
- Can layer complexity based on real usage patterns

**Alternatives Considered:**
- Full complexity first (rejected - 2-3 week effort, unclear ROI)
- No VDA mode in MVP (rejected - user loves this feature, competitive advantage)
- Percentage-based waivers (rejected - adds complexity, most states are 100%)

**Implications:**
- Database migration adds 5 columns
- VDA Calculator service with state-specific rules
- VDA API endpoints (calculate, enable, disable)
- useVDAMode custom hook
- May need refinement after pilot feedback
- State VDA rules need to be researched and loaded

**Revisit If:**
- Users request partial waiver calculations
- Interest waiver states become important
- VDA cost/timeline tracking requested

**Implementation:** Sprint 1, Days 3-5

---

### Column Detection Enhancement Strategy
**Date:** 2025-11-11
**Context:** Pre-MVP had extensive column normalization; current project has basic detection
**Decision:**
- **Keep current architecture** (pattern matching with confidence scoring)
- **Enhance with more aliases:**
  - Date fields: 20+ format variations
  - State fields: Full name -> code mapping (e.g., "California" -> "CA")
  - Sales channel: Normalize variations ("online", "web", "ecommerce" -> "online")
  - Revenue fields: "amount", "total", "gross_sales", "revenue"
- **Add transformations:**
  - Date format auto-detection (MM/DD/YYYY, YYYY-MM-DD, etc.)
  - State name normalization
  - Case-insensitive matching
  - Whitespace trimming
- **Add preview:**
  - Show detected mappings before processing
  - Show transformations applied
  - Allow manual override
- **No ML/AI approach for MVP**

**Rationale:**
- Current pattern matching works, just needs more patterns
- Predictable and debuggable
- Rule-based faster than ML for MVP
- Real-world CSVs use common variations (can enumerate)
- Preview builds trust (user sees what will happen)
- ML/AI adds complexity and unpredictability for marginal gain

**Alternatives Considered:**
- ML-based detection (rejected - overkill, training data needed, less predictable)
- No enhancement (rejected - too many manual mapping errors in pilot)
- Full NLP approach (rejected - unnecessary complexity)

**Implications:**
- Expand ColumnDetector.COLUMN_PATTERNS dictionary
- Add date format detection logic
- Add state name -> code mapping
- Add transformation preview to upload flow
- More comprehensive testing needed (CSV format variations)

**Revisit If:**
- Pattern matching fails on common formats (>10% failure rate)
- Users request AI-powered detection
- CSV formats become too varied to enumerate

**Implementation:** Sprint 1, Days 6-8

---

### Multiple Calculation Methods (Deferred to Sprint 2)
**Date:** 2025-11-11
**Context:** Pre-MVP had 4 calculation methods; user identified as "very important"
**Decision:** **Defer to Sprint 2** (not Sprint 1)
- **Sprint 1:** Calendar year only (current implementation)
- **Sprint 2:** Add remaining methods
  - Rolling 12-month window
  - Trailing 4 quarters
  - Current or prior year (whichever higher)
- **Reasoning:**
  - 4 major features already in Sprint 1 (Physical Nexus, VDA, Exempt Sales, Column Detection)
  - Calculation methods require significant backend refactoring
  - Can validate MVP with calendar year, add flexibility in Sprint 2
  - Pre-MVP code provides clear implementation pattern

**Rationale:**
- Sprint 1 already ambitious (10-12 days, 4 major features)
- Calendar year sufficient for initial validation
- Calculation methods are important but not blocking MVP launch
- Better to ship 4 solid features than 5 half-finished features
- Sprint 2 can focus exclusively on calculation methods + polish

**Alternatives Considered:**
- Include in Sprint 1 (rejected - scope creep, delays validation)
- Skip entirely (rejected - user said "very important")
- Add just one alternative method (rejected - if doing it, do all 4)

**Implications:**
- Sprint 1 MVP limited to calendar year calculations
- Must communicate to pilot partners (temporary limitation)
- Sprint 2 becomes "Calculation Methods + Polish" sprint
- May need to reprocess some pilot analyses in Sprint 2

**Revisit If:**
- Pilot partners refuse to test without multiple methods
- Calendar year proves insufficient for validation

**Implementation:** Sprint 2, Days 1-6

---

### Sprint 1 Documentation Structure
**Date:** 2025-11-11
**Context:** Initial implementation plan exceeded file size limits
**Decision:**
- Create `docs/plans/sprint-1/` folder structure
- Split into 7 focused files:
  - 00-overview.md (goals, timeline, decisions)
  - 01-physical-nexus.md (Days 1-2)
  - 02-vda-mode.md (Days 3-5)
  - 03-column-detection-exempt-sales.md (Days 6-8)
  - 04-integration-polish.md (Days 9-10)
  - 05-testing-documentation.md (Days 11-12)
  - 06-deliverables-next-steps.md (wrap-up, Sprint 2 preview)
- Add README.md (navigation guide)
- Add INDEX.md (status tracker)
- Include complete code examples in each file (copy-paste ready)

**Rationale:**
- Single 60KB file unreadable and hit tool limitations
- Each file maps to specific implementation phase
- Easier to reference during development ("open Day 3 file")
- README provides clear entry point
- Complete code reduces implementation time
- Can update individual files without affecting others

**Alternatives Considered:**
- Keep as single file (rejected - too large, hit limits)
- Separate plan and code (rejected - want everything in one place)
- No code examples (rejected - slows implementation)

**Implications:**
- 9 files total in sprint-1 folder
- Need to maintain consistency across files
- Cross-references between files
- Clear navigation structure critical

**Revisit If:** Never - this structure works well

**Implementation:** Complete (all files created)

---

**Updated Status:** Sprint 1 planning complete, all decisions documented
**Ready for:** Sprint 1 implementation (Day 1: Physical Nexus Backend)
**Blockers:** None
