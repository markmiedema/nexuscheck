# Documentation Update Checklist

**Last Updated:** 2025-11-07
**Purpose:** Standard checklist for keeping project documentation current and accurate

---

## 🔄 Update Triggers

Update documentation whenever:

1. ✅ **Sprint Completed** - After finishing any sprint from the sprint plan
2. ✅ **Feature Added** - When new functionality is implemented
3. ✅ **Bug Fixed** - When fixing significant bugs that affect documentation
4. ✅ **Architecture Changed** - When making technical architecture decisions
5. ✅ **Weekly Review** - Every Friday, review and update as needed
6. ✅ **Phase Transition** - When moving from one phase to another (e.g., Phase 1B → Phase 2)

---

## 📋 After Completing a Sprint

### 1. Update Sprint Plan
**File:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

- [ ] Mark sprint as ✅ complete in the sprint section
- [ ] Add "**Actual Hours:**" line with time spent
- [ ] Update "Sprint Completion Log" section at bottom
- [ ] Note any blockers or issues discovered
- [ ] Adjust upcoming sprint estimates if needed
- [ ] Update "Last Updated" date at top
- [ ] Update "Status:" line if moving to new sprint

**Example:**
```markdown
### Sprint 1A: Analysis Management ✅ COMPLETE
**Estimated:** 8-12 hours | **Actual Hours:** 10 hours
**Priority:** P0 (Blocker)
**Completed:** 2025-11-08

**Issues Encountered:**
- Database query performance needed optimization (added index)
- Frontend pagination was more complex than expected

**Acceptance Criteria:**
- [x] User can see list of all their previous analyses
- [x] User can click to view any past analysis
... (rest of criteria)
```

---

### 2. Update Current Status Document
**File:** `_05-development/CURRENT_STATUS_2025-11-05.md`

- [ ] Move completed features from "⚠️ What Needs Fixing" to "✅ What's Working"
- [ ] Update status percentages (e.g., "60% complete" → "80% complete")
- [ ] Update "Current Phase" if applicable
- [ ] Add to "Recently Completed" section
- [ ] Update "Last Updated" date
- [ ] Update "Next Steps" section with new priorities

---

### 3. Update 00-START-HERE.md
**File:** `00-START-HERE.md`

- [ ] Update "Current Work" section if phase changed
- [ ] Update "Recently Completed" section with new achievements
- [ ] Update "Next Up" section with new priorities
- [ ] Update "Last Updated" date

---

## 📋 When Adding a New Feature

### 1. Document Technical Decisions
**File:** `_07-decisions/decision-log.md`

- [ ] Add entry with:
  - Date
  - Decision made
  - Context/problem being solved
  - Options considered
  - Rationale for choice
  - Consequences/trade-offs

**Template:**
```markdown
### [Date] - [Decision Title]

**Context:** [What problem needed solving?]

**Decision:** [What was decided?]

**Options Considered:**
1. Option A - [pros/cons]
2. Option B - [pros/cons]
3. Option C - [pros/cons]

**Rationale:** [Why this option?]

**Consequences:**
- Positive: [benefits]
- Negative: [trade-offs]
- Risks: [what could go wrong]
```

---

### 2. Update Technical Specs (if applicable)
**Files:** `_04-technical-specs/*`

If feature adds/changes:
- [ ] API endpoints → Update `PHASE_3_TECHNICAL_ARCHITECTURE.md`
- [ ] Database schema → Update `data-model-specification.md`
- [ ] State rules → Update `state-rules-schema.md`
- [ ] Integration points → Update `INTEGRATION_AND_DEPENDENCIES.md`

---

### 3. Update Sprint Plan
**File:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

If feature changes priorities:
- [ ] Add to "Known Gaps & Future Work" section
- [ ] Adjust sprint order if needed
- [ ] Note if this feature was unplanned (why was it added?)

---

## 📋 Weekly Review (Every Friday)

### Quick Check (10-15 minutes)

1. **Review Sprint Progress**
   - [ ] Are we on track for current sprint?
   - [ ] Any blockers to document?
   - [ ] Any priority changes?

2. **Update Status Documents**
   - [ ] `CURRENT_STATUS_2025-11-05.md` - Still accurate?
   - [ ] `SPRINT_PLAN_BETA_TO_PILOT.md` - Reflect this week's progress?
   - [ ] Any "Last Updated" dates need refreshing?

3. **Check for Stale Documentation**
   - [ ] Any TODOs in docs that are now done?
   - [ ] Any "in progress" items that are complete?
   - [ ] Any known issues that are fixed?

4. **Update Dates**
   - [ ] Update "Last Updated" on all modified files
   - [ ] Update "Next Review" dates

---

## 📋 Phase Transition (Major Milestone)

When completing a major phase (e.g., Beta → Pilot):

### 1. Create Phase Completion Summary
**Location:** `docsplans/`
**Filename:** `PHASE_[NAME]_COMPLETION_SUMMARY.md`

Include:
- [ ] Executive summary of what was built
- [ ] Key achievements
- [ ] Time investment (estimated vs actual)
- [ ] Lines of code added
- [ ] Test coverage
- [ ] Known limitations
- [ ] Lessons learned
- [ ] Next phase preview

---

### 2. Archive Old Sprint Plan (if creating new one)
**Process:**
- [ ] Move completed sprint plan to `_archives/development/`
- [ ] Rename with completion date: `SPRINT_PLAN_BETA_TO_PILOT_COMPLETED_2025-11-XX.md`
- [ ] Create new sprint plan for next phase
- [ ] Update `00-START-HERE.md` to reference new sprint plan

---

### 3. Update README.md
**File:** `README.md` (root)

- [ ] Update "Status:" line
- [ ] Update "Features" section
- [ ] Update "In Progress" section
- [ ] Add to "Completed" section

---

## 📋 LLM Session End (Before Closing Session)

At the end of each work session with an LLM:

### 1. Quick Status Check
Ask yourself:
- [ ] Did we complete any sprints?
- [ ] Did we make any technical decisions?
- [ ] Did we add/change any features?
- [ ] Did we discover any bugs/issues?

### 2. Update What Changed
- [ ] Update sprint plan if sprint completed
- [ ] Add to decision log if decisions made
- [ ] Update current status if significant progress
- [ ] Note any blockers discovered

### 3. Leave Breadcrumbs for Next Session
**File:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

At bottom, update "In Progress" section:
```markdown
### In Progress
- Sprint 1A: Analysis Management (started: 2025-11-07, ~4 hours in)
  - ✅ Backend GET /analyses endpoint complete
  - ✅ Database query optimization done
  - ⬜ Frontend list page - in progress
  - ⬜ View past analysis functionality - pending
```

---

## 🎯 Quality Checklist

Before marking documentation as "updated":

- [ ] All "Last Updated" dates are current
- [ ] No conflicting information between docs
- [ ] Status accurately reflects reality
- [ ] Completed items marked with ✅
- [ ] In-progress items marked with ⚠️
- [ ] Future items marked with ⬜
- [ ] Dates are in YYYY-MM-DD format
- [ ] Clear and concise language
- [ ] Spell-checked

---

## 🚨 Red Flags (Documentation Needs Immediate Update)

Update documentation IMMEDIATELY if:

1. ❌ **Documentation contradicts reality**
   - Example: Docs say feature is missing but it's actually built

2. ❌ **Major architectural change**
   - Example: Switched from REST to GraphQL

3. ❌ **Critical bug discovered**
   - Example: Nexus calculations were wrong

4. ❌ **Scope change**
   - Example: MVP requirements changed

5. ❌ **Priority shift**
   - Example: Beta deadline moved up

**Process:**
1. Stop current work
2. Update relevant documentation
3. Inform user of the discrepancy
4. Resume work with accurate docs

---

## 📊 Documentation Health Metrics

### Good Documentation:
- ✅ Updated within last week
- ✅ Matches current code/functionality
- ✅ Clear next steps
- ✅ Accurate status
- ✅ No TODO/FIXME comments older than 2 weeks

### Stale Documentation:
- ⚠️ Updated 1-2 weeks ago
- ⚠️ Some minor inaccuracies
- ⚠️ Unclear priorities
- ⚠️ Some old TODOs

### Critical Documentation Debt:
- ❌ Updated 3+ weeks ago
- ❌ Major inaccuracies
- ❌ Contradicts reality
- ❌ Can't be trusted
- ❌ Many old TODOs

**If documentation is critical debt:**
1. Schedule 2-4 hour documentation sprint
2. Review all major documents
3. Update to match reality
4. Archive anything outdated
5. Establish regular update cadence

---

## 📝 Template: Quick Update Log

Use this to track what was updated and why:

```markdown
## Documentation Update Log

### 2025-11-07
**Changed:** Sprint plan, current status
**Reason:** Completed Sprint 1A
**Files:** SPRINT_PLAN_BETA_TO_PILOT.md, CURRENT_STATUS_2025-11-05.md
**Time:** 15 minutes

### 2025-11-08
**Changed:** Decision log
**Reason:** Decided to use WeasyPrint for PDF generation
**Files:** decision-log.md
**Time:** 5 minutes
```

---

## 🎬 Example: Full Sprint Completion Update

When Sprint 1A completes:

**Time Required:** 15-20 minutes

1. ✅ Update `SPRINT_PLAN_BETA_TO_PILOT.md`:
   - Mark Sprint 1A complete
   - Add actual hours (10 hours)
   - Note issues (pagination complexity)
   - Update completion log

2. ✅ Update `CURRENT_STATUS_2025-11-05.md`:
   - Move "Analysis Management" from missing to working
   - Update percentages
   - Add to recently completed

3. ✅ Update `00-START-HERE.md`:
   - Update "Current Work" if needed
   - Update "Recently Completed"

4. ✅ Check `README.md`:
   - Add "Analysis Management" to features

5. ✅ Update dates:
   - All modified files get new "Last Updated"

**Done!** Documentation is current for next session.

---

**Last Updated:** 2025-11-07
**Next Review:** Weekly on Fridays
**Document Owner:** Mark (Project Lead)
