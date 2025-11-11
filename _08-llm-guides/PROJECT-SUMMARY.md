# Nexus Check - Complete Project Summary

**Created:** 2025-11-01
**Last Updated:** 2025-11-10
**Purpose:** Comprehensive reference for all planning and requirements discussions

---

## Executive Summary

We're building a SALT (State and Local Tax) automation tool for boutique tax agencies. The tool automates the most time-consuming task in their workflow: 3-4 year lookback nexus analysis.

**Core Value Prop:** Reduce 12-20 hours of manual work to minutes of processing + <1 hour review

**Target Market:** SALT professionals who left Big 4 firms for boutique agencies and lost access to expensive enterprise tools

**MVP Focus:** Nexus determination + liability estimation tool

---

## The Problem (Detailed)

### User Profile:
- Former Big 4 SALT tax professionals
- Now work at boutique agencies (2-20 person firms)
- Specialize in sales tax compliance
- Lost access to Big 4 infrastructure and tools
- Everything is now manual (Excel-based)
- Can't afford enterprise tools ($50k+/year)

### Current Pain Point:
- 3-4 year lookback nexus analysis takes 12-20 hours manually
- Clients pay $5,000-$25,000 for this analysis
- Most time spent on data processing, not analysis
- Tedious, repetitive work limits capacity to take more clients

---

## The Solution (MVP)

### What We're Building:
**Tool:** Automated Nexus Analysis & Liability Estimation

**Input:** Excel spreadsheet with sales data + physical nexus info

**Process:** 
1. Upload sales data
2. Capture physical nexus information
3. Run economic nexus analysis (state-by-state)
4. Calculate liability estimates  
5. Generate professional report

**Output:** Client-ready report with nexus determinations and liability summary

**Time Savings:** 12-20 hours â†’ minutes + <1 hour review

---

## Key Features (MVP Scope)

### 1. Data Upload & Validation
- Accept Excel files (.xlsx, .xls, .csv)
- Required columns: Date, State, Sales Amount, Sales Channel
- Validate data completeness
- Handle messy real-world data

### 2. Physical Nexus Tracking
- Capture physical presence by state (office, warehouse, employees, inventory)
- Record nexus establishment dates
- Two input methods: spreadsheet columns OR in-app form

### 3. Economic Nexus Analysis
- Check sales against state thresholds ($100k revenue, 200 transactions, etc.)
- Apply marketplace facilitator rules (some states count, others don't)
- Historical timeline (when did nexus begin?)
- Multi-year analysis (3-4 year lookback)

### 4. Liability Estimation
- Calculate uncollected tax by state
- Use state rate + average local rate (not exact - acceptable for estimates)
- Exclude marketplace-facilitated sales (marketplace already collected)
- Calculate interest and penalties (basic)
- Multi-year summary

### 5. Report Generation
- Professional PDF output
- State-by-state nexus determination
- Liability summary by state and year
- Executive summary for clients
- Ready for review and delivery (<1 hour touch-up needed)

---

## Critical Design Decisions

### Human-in-the-Loop
- Tool assists, doesn't replace professional judgment
- 90-95% accuracy target (not 100%)
- Always requires human review
- Clear flagging of assumptions and edge cases

### Physical Nexus Included
- Physical nexus overrides economic nexus
- Without this, determinations could be completely wrong
- Simple to implement (questionnaire or spreadsheet)
- Essential for accuracy

### Marketplace Facilitator Handling
- Critical for e-commerce clients
- Without it, liability could be overstated by 50-80%
- Some states count marketplace sales toward thresholds, others don't
- Must exclude from liability (marketplace collected tax)

### Average Local Rates (Not Exact)
- Acceptable for initial estimates
- Industry standard approach
- Exact rates only needed for final VDA/filing (not MVP scope)
- Significantly reduces complexity

### Excel-Based Input
- No API integrations for MVP
- Users already export to Excel in current workflow
- Zero friction to adopt
- API integrations can come later after validation

---

## What's Explicitly OUT of Scope (MVP)

- âŒ Exact local tax rate lookups
- âŒ Affiliate nexus automation (flag for manual review)
- âŒ Product taxability analysis
- âŒ VDA application preparation
- âŒ Registration automation
- âŒ Return filing
- âŒ Ongoing monitoring/alerts
- âŒ API integrations
- âŒ Multi-user features
- âŒ Client portal

**Rationale:** Focus on highest-ROI feature first; add others after validation

---

## Build Priority Tiers

### Tier 1 (MVP - Build First): 
Core nexus analysis tool
- Data ingestion
- Nexus determination
- Liability estimation
- Report generation
**Target: 8-12 weeks**

### Tier 2 (Natural Extensions):
Enhanced features
- Better physical/affiliate nexus detection
- Timeline visualization
- Compliance gap analysis
- Basic exemption certificate tracking
**Target: 6-10 weeks**

### Tier 3 (Platform Expansion):
Additional workflow phases
- VDA preparation assistance
- Registration forms
- Basic return preparation
- Ongoing monitoring
**Target: 12-16 weeks**

---

## Development Workflow (Current Plan)

### Phase 1: Define the "What" (CURRENT)
1. **Data Model Design** â† NEXT STEP
   - Excel input schema
   - Physical nexus structure
   - Output format
   
2. **State Rules Database Structure**
   - Nexus thresholds schema
   - Tax rates schema
   - Maintenance strategy

### Phase 2: Define the "How Users Experience It"
3. **User Flow Mapping**
   - End-to-end journey
   - Wireframes
   - Decision points

### Phase 3: Define the "How We Build It"
4. **Technical Architecture**
   - Tech stack selection
   - Processing pipeline
   - Infrastructure plan

### Phase 4: Execute (Build)
5. **Development Sprints**
   - Sprint 1: Data upload & validation
   - Sprint 2: Physical nexus intake
   - Sprint 3: Economic nexus engine
   - Sprint 4: Liability estimation
   - Sprint 5: Report generation
   - Sprint 6: Polish & testing

---

## Success Metrics

### MVP is Successful If:
1. Users confirm 11+ hour time savings per engagement
2. 90%+ accuracy on nexus determinations  
3. Users willing to pay after trial
4. Reports require <1 hour editing before client delivery
5. Tool handles messy real-world data reliably

### MVP Fails If:
1. Still takes 8+ hours per engagement
2. Accuracy below 85%
3. Reports require extensive rework
4. Can't handle real-world data
5. Users revert to manual processes

---

## Target User Details

### Technical Proficiency:
- **Comfortable with:** Excel (advanced), web apps, state portals
- **Not comfortable with:** Writing code, command line, complex configs

**Key insight:** They're power users of business software, not developers

### What They Value:
- Time savings (billable at $150-300/hour)
- Accuracy (errors damage relationships)
- Professional output (reports must look polished)
- Ease of use (no time to learn complex software)
- Fair pricing (will pay but not enterprise prices)

### Buying Decision:
- Will this pay for itself on a single engagement?
- Is it reliable enough to use with real clients?
- Can I start using it today?

---

## Open Questions Requiring Decisions

### Historical Threshold Changes
Should we track when states changed thresholds mid-period?
- More accurate but more complex
- Recommendation: Defer to V1.1

### Transaction-Based Thresholds
User has revenue but state requires transaction count - how to handle?
- Options: Flag for review, estimate transactions, require transaction data
- Recommendation: Estimate with clear warning

### Physical Nexus Intake Timing
Before or after data upload?
- Recommendation: Before upload (better UX)

### Pricing Model
Monthly subscription, per-use, or tiered?
- Options: $199-499/month, $49-99/report, or tiered
- Decision needed: Before launch

---

## Next Immediate Steps

1. **Design Data Model** (2-3 hours)
   - Define Excel schema
   - Define physical nexus structure
   - Define report output
   - Document validation rules

2. **Design State Rules Database** (3-4 hours)
   - Schema for thresholds
   - Schema for tax rates
   - Update strategy
   - Data sources

3. **Map User Flows** (2-3 hours)
   - Journey from upload to report
   - Wireframe key screens
   - Define error states

4. **Plan Technical Architecture** (3-4 hours)
   - Choose tech stack
   - Design processing pipeline
   - Plan infrastructure

Then: Begin development

---

## How to Use This Project

### For New LLM Conversations:
1. Share `00-START-HERE.md` first
2. Share this `PROJECT-SUMMARY.md` for full context
3. Share specific files for the task at hand

### File Organization Rules:
- No file over 25,000 tokens
- Break large files into logical parts
- Include "Last Updated" date on all files
- Cross-reference related documents
- Flag questions with [QUESTION] tag
- Flag needed decisions with [DECISION NEEDED] tag

### Directory Structure:
- `01-project-overview/` - Vision and high-level context
- `02-requirements/` - Detailed requirements and scope
- `03-planning/` - Workflow phases and priorities
- `04-technical-specs/` - Data models and architecture (TBD)
- `05-state-rules/` - State tax rules (modular, TBD)
- `06-development/` - Code and implementation (TBD)
- `07-decisions/` - Decision log with rationale
- `08-templates/` - Reusable templates

---

## Key Takeaways

1. **Massive time savings** - 12-20 hours to minutes is transformational
2. **Clear value prop** - Tool pays for itself on single engagement
3. **Real pain point** - Users have lost infrastructure they relied on
4. **Proven market** - Former Big 4 professionals at boutique agencies
5. **Realistic accuracy** - 90-95% with human review is appropriate
6. **Focus on MVP** - Get core value working before expanding
7. **Build sequentially** - Validate before adding more features

---

**Status:** Requirements complete, ready to begin data model design
**Next Action:** Design Excel input schema and output structure
