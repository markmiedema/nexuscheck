# Development Workflow Phases

**Last Updated:** 2025-11-01  
**Location:** Save as `03-planning/workflow-phases.md`

---

## Overview

This document defines the logical sequence for building the Nexus Check, from planning through execution. Each phase builds on the previous one.

**Current Phase:** Phase 1 - Define the "What" (Foundation)

---

## Phase 1: Define the "What" (Foundation)

**Status:** ðŸ”„ IN PROGRESS - Step 1 of 2 upcoming

**Goal:** Establish clear requirements and data structures before any code

### Step 1: Data Model Design â¬œ NEXT
**Time:** 2-3 hours

**Deliverables:**
- Input data schema (Excel columns, data types, validation rules)
- Output data structure (report format and contents)
- Intermediate data models (how we store/transform data)
- Physical nexus data structure

**Why First:** Can't design flows or pick technology without knowing what data we're handling.

**Output:** `04-technical-specs/data-model.md`

---

### Step 2: State Rules Database Structure â¬œ UPCOMING
**Time:** 3-4 hours

**Deliverables:**
- Schema for state nexus thresholds (economic + marketplace rules)
- Schema for tax rates (state + average local)
- Schema for physical nexus rules
- Update and maintenance strategy
- Data sources for populating initial database

**Why Second:** This is our business logic database - understanding what rules we need informs both data model and processing complexity.

**Output:** `04-technical-specs/state-rules-schema.md`

**Dependencies:** Step 1 complete

---

## Phase 2: Define the "How Users Experience It" (Design)

**Status:** â¬œ NOT STARTED

**Goal:** Map the user journey and key interaction points

### Step 3: User Flow Mapping â¬œ UPCOMING
**Time:** 2-3 hours

**Deliverables:**
- End-to-end user journey (client intake â†’ polished report)
- Key decision points and error states
- Wireframes for critical screens:
  - Upload interface
  - Physical nexus form
  - Results review
  - Report generation
  - Settings/configuration

**Why Third:** Now that we know the data and rules, we can design how users interact with it. This reveals UX requirements that affect technical decisions.

**Output:** `04-technical-specs/user-flows.md` + wireframes

**Dependencies:** Steps 1-2 complete

---

## Phase 3: Define the "How We Build It" (Technical Planning)

**Status:** â¬œ NOT STARTED

**Goal:** Make informed technical decisions based on clear requirements

### Step 4: Technical Architecture â¬œ UPCOMING
**Time:** 3-4 hours

**Deliverables:**
- Tech stack selection:
  - Frontend framework
  - Backend framework
  - Database
  - Hosting/infrastructure
  - File storage
- Processing pipeline design (upload â†’ validation â†’ calculation â†’ report)
- Infrastructure plan (compute, storage, scalability)
- Third-party services needed (if any)
- Security and data privacy approach

**Why Fourth:** With clear understanding of data, rules, and UX, we can make informed technical decisions. Picking tech before understanding requirements = over-engineering or wrong choices.

**Output:** `04-technical-specs/architecture.md`

**Dependencies:** Steps 1-3 complete

---

## Phase 4: Execute (Build)

**Status:** â¬œ NOT STARTED

**Goal:** Build iteratively in logical chunks

### Development Sprints (Recommended Order):

#### Sprint 1: Data Upload & Validation â¬œ
**Time:** 2-3 weeks

**Features:**
- File upload interface
- Excel parsing (.xlsx, .xls, .csv)
- Data validation
- Error handling and user feedback
- Data preview

**Success:** User can upload file and see validated data

---

#### Sprint 2: Physical Nexus Intake â¬œ
**Time:** 1-2 weeks

**Features:**
- Physical nexus questionnaire OR spreadsheet import
- State-by-state presence tracking
- Nexus date capture
- Edit/update capability

**Success:** User can input physical nexus information

---

#### Sprint 3: Economic Nexus Calculation Engine â¬œ
**Time:** 3-4 weeks

**Features:**
- State-by-state threshold checking
- Marketplace facilitator rules
- Historical nexus timeline calculation
- Multi-year analysis
- Results storage

**Success:** Accurate nexus determination for uploaded data

---

#### Sprint 4: Liability Estimation Engine â¬œ
**Time:** 2-3 weeks

**Features:**
- Tax rate lookup (state + avg local)
- Uncollected tax calculation
- Interest calculation
- Penalty estimation
- Multi-year summary

**Success:** Accurate liability estimates by state

---

#### Sprint 5: Report Generation â¬œ
**Time:** 2-3 weeks

**Features:**
- Professional PDF output
- Nexus analysis section
- Liability summary section
- Executive summary
- Export functionality
- Branding/customization

**Success:** Client-ready reports generated

---

#### Sprint 6: Polish & Testing â¬œ
**Time:** 2-3 weeks

**Features:**
- Bug fixes
- Performance optimization
- Edge case handling
- User testing
- Documentation
- Deployment preparation

**Success:** Production-ready MVP

---

## Phase 5: Launch & Iterate

**Status:** â¬œ NOT STARTED

**Goal:** Get MVP in users' hands and gather feedback

### Activities:
- Beta user recruitment
- User testing and feedback
- Bug fixes and refinements
- Feature prioritization for Tier 2
- Pricing validation
- Marketing preparation

**Success Metrics:**
- 10+ beta users
- 90%+ accuracy validation
- 11+ hour time savings confirmed
- Users willing to pay

---

## Current Status Summary

### Completed:
âœ… Problem definition  
âœ… User research  
âœ… Task breakdown  
âœ… MVP scope definition  
âœ… Priority planning  
âœ… Project structure setup  

### Current Task:
ðŸ”„ **Phase 1, Step 1: Data Model Design**

### Next Up:
â­ï¸ State Rules Database Structure  
â­ï¸ User Flow Mapping  
â­ï¸ Technical Architecture  

---

## Decision Points by Phase

### Phase 1 Decisions:
- What Excel columns are required vs. optional?
- How do we handle missing or invalid data?
- What date formats do we support?
- Physical nexus: form vs. spreadsheet vs. both?

### Phase 2 Decisions:
- Upload first or physical nexus first?
- How much detail in results review?
- Inline editing or separate edit mode?

### Phase 3 Decisions:
- Monolith or microservices?
- Serverless or traditional hosting?
- Which database? (SQL vs. NoSQL)
- Authentication approach?

### Phase 4 Decisions:
- Sprint order (can we parallelize any?)
- Testing strategy?
- Deployment approach?

---

## Risk Mitigation

### Known Risks:

**State rule complexity**
- **Risk:** State rules are more complex than anticipated
- **Mitigation:** Start with economic nexus only, add affiliate/other types later
- **Fallback:** Flag complex scenarios for manual review

**Data quality issues**
- **Risk:** Real-world data is messier than expected
- **Mitigation:** Robust validation, clear error messages, graceful degradation
- **Fallback:** Allow manual data correction

**Accuracy concerns**
- **Risk:** 90% accuracy harder to achieve than expected
- **Mitigation:** Conservative calculations, clear assumptions, human review required
- **Fallback:** Position as "first pass" tool, not final answer

**Technical complexity**
- **Risk:** Architecture choices don't scale or perform
- **Mitigation:** Choose proven, simple tech stack
- **Fallback:** Can refactor later if needed

---

## Recommended Next Action

**Start with Data Model Design:**
1. Define the Excel input schema
2. Define physical nexus data structure  
3. Define report output format
4. Document validation rules

This takes 2-3 hours but provides clarity for all subsequent work.

**Then move to:** State Rules Database Structure
