# Decision Log Updates - State Rules Database Design

**Date:** 2025-11-02  
**Context:** Phase 1, Step 2 - State Rules Database Schema Design  
**Purpose:** Document key architectural decisions made during database design

---

## New Decisions to Add to Decision Log

### Historical Threshold Support (V1.1 Ready)
**Date:** 2025-11-02  
**Context:** Some states change economic nexus thresholds over time (e.g., NY went from $500k to $100k in 2022)  
**Decision:** Include `effective_from` and `effective_to` columns in all rules tables, but MVP will only query current rules (WHERE effective_to IS NULL)  
**Rationale:**  
- Database structure supports historical tracking without adding MVP complexity
- V1.1 can enable historical accuracy by simply changing query logic
- No schema migration needed when adding historical support
- "Build for V1.1, use for MVP" approach
- Minimal storage overhead (only a few hundred rows per table)

**Alternatives Considered:**  
- No historical support in schema (rejected - would require migration later)
- Full historical implementation in MVP (rejected - adds complexity without immediate value)
- Separate historical tables (rejected - over-engineered)

**Implications:**  
- Queries always filter `WHERE effective_to IS NULL` for MVP
- Database includes ~10% more columns that aren't used yet
- Easy path to V1.1 feature: remove the NULL filter
- Data population scripts should set `effective_from` even if not using it

**Revisit If:** Never - this is a good future-proofing decision

---

### Separate Tables for Different Rule Types
**Date:** 2025-11-02  
**Context:** Could store all rules in one big table with columns for everything, or separate by rule type  
**Decision:** Create separate tables: `economic_nexus_thresholds`, `marketplace_facilitator_rules`, `tax_rates`, `interest_penalty_rates`  
**Rationale:**  
- Each rule type has different effective dates and update schedules
- Cleaner schema (no nullable columns for mutually exclusive data)
- Easier to maintain (update one rule type without touching others)
- Better query performance (smaller tables, more targeted indexes)
- More understandable for future developers

**Alternatives Considered:**  
- Single `state_rules` table with JSONB (rejected - harder to query, no schema validation)
- EAV pattern (Entity-Attribute-Value) (rejected - overly complex, poor performance)

**Implications:**  
- Need JOIN queries to get complete rule set
- Four INSERT statements when adding a new state (acceptable)
- More tables to maintain (but each is simpler)

**Revisit If:** Never - this is standard database normalization

---

### Generated Column for Combined Tax Rate
**Date:** 2025-11-02  
**Context:** Combined rate = state_rate + avg_local_rate, used frequently in calculations  
**Decision:** Use PostgreSQL GENERATED column: `combined_avg_rate GENERATED ALWAYS AS (state_rate + avg_local_rate) STORED`  
**Rationale:**  
- No risk of state_rate and combined_avg_rate getting out of sync
- Stored (not computed on-the-fly) for performance
- Simplifies application code (don't need to add rates everywhere)
- Database enforces consistency automatically
- Zero maintenance burden

**Alternatives Considered:**  
- Calculate in application code every time (rejected - error prone, inconsistent)
- Separate `combined_avg_rate` column (rejected - can get out of sync)
- Computed column (rejected - stored is faster for frequent reads)

**Implications:**  
- Cannot directly update `combined_avg_rate` (it's calculated)
- Must update `state_rate` or `avg_local_rate` to change combined
- Saves ~50-100 calculations per analysis

**Revisit If:** Never - this is a clear win

---

### Include Interest/Penalty Tables in MVP
**Date:** 2025-11-02  
**Context:** Interest and penalties are "estimates" in MVP; could hardcode simple assumptions  
**Decision:** Include full `interest_penalty_rates` table in MVP, but only use simple interest calculation  
**Rationale:**  
- Proper database structure now = easier to enhance later
- Different states DO have different rates (3% CA vs 18% TX annualized)
- Using actual rates vs. hardcoded "10%" is more accurate
- No additional complexity in application code
- Shows professionalism to users (we researched actual rates)
- VDA information (penalty waivers, lookback periods) useful for Tier 2

**Alternatives Considered:**  
- Hardcode "3% interest, 10% penalties" (rejected - not accurate across states)
- Add in Tier 2 only (rejected - might as well add now while designing schema)
- Don't store VDA information (rejected - will need it soon)

**Implications:**  
- MVP uses simple interest only (ignore `interest_calculation_method`)
- Database has fields MVP doesn't fully utilize
- Easy upgrade path for Tier 2 (use compound interest methods)

**Revisit If:** Never - marginal effort now, significant value later

---

### Marketplace Facilitator "Count Toward Threshold" Field
**Date:** 2025-11-02  
**Context:** Some states count marketplace sales toward economic nexus threshold, others don't  
**Decision:** Include explicit `count_toward_threshold` boolean in `marketplace_facilitator_rules` table  
**Rationale:**  
- This is a critical distinction that affects nexus determination
- Without this, we'd incorrectly determine nexus for some states
- Florida specifically does NOT count marketplace sales toward $100k threshold
- Most states DO count them, but we can't assume all do
- Single boolean = simple to query and understand

**Alternatives Considered:**  
- Assume all states count marketplace sales (rejected - incorrect for FL and possibly others)
- Hardcode exceptions in application logic (rejected - not maintainable)
- Leave this for manual review (rejected - defeats automation purpose)

**Implications:**  
- Must research and populate this field for each state
- Application logic must check this when aggregating sales for threshold comparison
- Report must note when marketplace sales don't count

**Revisit If:** Never - this is essential for accuracy

---

### Top 10 States for MVP Data Population
**Date:** 2025-11-02  
**Context:** 45 states have sales tax; populating all at once is time-consuming  
**Decision:** Start with top 10 states by e-commerce volume for MVP: CA, TX, NY, FL, IL, PA, OH, GA, NC, WA  
**Rationale:**  
- Covers ~60% of typical e-commerce sales
- Enough to validate tool with real client data
- Can expand to all 45 states after MVP proves value
- Easier to maintain and test with smaller dataset initially
- Users can provide feedback on rule accuracy with smaller set

**Alternatives Considered:**  
- All 45 states upfront (rejected - too much work for unvalidated product)
- Only 5 states (rejected - too limited for real client data)
- User-selected states (rejected - inconsistent experience)

**Implications:**  
- Tool will show "Rules not available for this state" for others
- Must prioritize which 10 states carefully
- Need to add remaining 35 states before wider launch
- Data population takes ~2-3 days instead of 1-2 weeks

**Revisit If:** After 10+ paying customers request coverage in other states

---

### Audit Trail Table (Optional)
**Date:** 2025-11-02  
**Context:** Need to track who changed state rules and when for compliance/debugging  
**Decision:** Include `state_rules_audit` table design in spec, but mark as optional for MVP  
**Rationale:**  
- Good practice for any business-critical data
- Helpful for debugging ("why did this state's calculation change?")
- Required for SOC 2 compliance (if we pursue enterprise clients)
- Triggers are easy to add/remove
- Minimal performance impact

**Alternatives Considered:**  
- No audit trail (rejected - hard to debug issues)
- Use Supabase built-in audit (investigation - may be sufficient)
- Application-level logging only (rejected - database changes bypassed)

**Implications:**  
- Slightly more complex database setup
- Storage grows over time (but slowly)
- May use Supabase's built-in audit instead

**Revisit If:** Supabase's built-in audit logging is sufficient for our needs

---

## Open Questions Resolved

### Transaction Thresholds Without Transaction Data
**Previous Status:** [QUESTION]  
**Current Status:** Resolved in Data Model Spec  
**Decision:** Estimate transactions using `total_sales / $100` with prominent warning flag  
**Documented In:** Data Model Specification, Section 5.4

### Physical Nexus Intake Timing
**Previous Status:** [QUESTION]  
**Current Status:** Resolved in Data Model Spec  
**Decision:** Physical nexus form before data upload  
**Documented In:** Data Model Specification, Section 2

---

## Implementation Notes

When implementing this schema in Supabase:

1. **Create tables in order:**
   - `states` (no dependencies)
   - `economic_nexus_thresholds` (references states)
   - `marketplace_facilitator_rules` (references states)
   - `tax_rates` (references states)
   - `interest_penalty_rates` (references states)

2. **Add indexes after initial data load:**
   - More efficient to load data first, then index
   - Exception: Primary keys (automatic)

3. **Test queries before production:**
   - Verify JOIN performance with 10 states
   - Benchmark bulk query (all rules at once)
   - Ensure queries return in <100ms

4. **Set up Row Level Security (RLS):**
   - All state rules tables are read-only for users
   - Only admin role can UPDATE/INSERT
   - Prevents accidental rule changes

---

## Next Steps After This Design

1. **Review with stakeholders** - Ensure schema meets all requirements
2. **Create Supabase migration scripts** - Turn SQL into actual tables
3. **Build data population scripts** - Python scripts for top 10 states
4. **Write API layer** - FastAPI endpoints to access rules
5. **Begin Phase 2** - User flow mapping and wireframes

---

**Status:** Ready to implement in Supabase  
**Estimated Time to Implement:** 4-6 hours (tables + initial data)  
**Blockers:** None
