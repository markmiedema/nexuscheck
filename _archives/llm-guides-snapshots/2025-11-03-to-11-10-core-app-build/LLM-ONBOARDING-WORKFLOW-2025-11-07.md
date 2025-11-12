# LLM Onboarding Workflow

**Last Updated:** 2025-11-07
**Purpose:** Standard process for new LLM sessions to get oriented quickly and work effectively

---

## 🎯 Quick Start (5-10 minutes)

Every new LLM session should follow this workflow to get oriented:

### STEP 1: Read Current Status (2 minutes)
**File:** `_05-development/CURRENT_STATUS_2025-11-05.md`

**What to Learn:**
- What's working right now
- What's completed vs in progress
- Current phase and next steps
- Known limitations

**Action:** After reading, mentally note what phase the project is in.

---

### STEP 2: Read Active Sprint Plan (3 minutes)
**File:** `_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`

**What to Learn:**
- What we're building next
- Priority order
- Acceptance criteria for each sprint
- Timeline and effort estimates

**Action:** Identify which sprint is currently active (check "In Progress" section at bottom).

---

### STEP 3: Read Project Overview (2 minutes)
**File:** `00-START-HERE.md`

**What to Learn:**
- Overall project structure
- File organization
- Where to find specific information
- Critical rules for working on this project

**Action:** Bookmark locations of key documentation folders mentally.

---

### STEP 4: Understand the User (2 minutes)
**File:** `_08-llm-guides/PROJECT-SUMMARY.md` (sections: "The Problem" and "Target User Details")

**What to Learn:**
- Who uses this tool (former Big 4 SALT professionals)
- What problem we're solving (12-20 hour manual analyses)
- What they value (accuracy, time savings, professional output)
- Success criteria

**Action:** Remember: These are tax professionals, not developers. Everything must be accurate and professional.

---

### STEP 5: Ask User for Context (1 minute)
**Before starting work, ALWAYS ask:**

```
I've read the documentation and I see we're in [CURRENT PHASE/SPRINT].
What would you like to work on today?

Options I see:
- Continue Sprint [X]: [Sprint name]
- Fix a bug
- Add a feature
- Update documentation
- Something else

Which would be most helpful?
```

**Why:** User may have changed priorities since documentation was last updated. Always confirm before diving in.

---

## 📚 Optional Deep Dives (As Needed)

### If Working on Technical Implementation:
**Read:**
- `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` - API endpoints and architecture
- `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` - **CRITICAL before coding**
- `_04-technical-specs/data-model-specification.md` - Database schema
- `_04-technical-specs/state-rules-schema.md` - State rules structure

### If Working on Feature Design:
**Read:**
- `_04-technical-specs/PHASE_2B_SCREEN_SPECIFICATIONS.md` - UX specifications
- `_02-requirements/mvp-scope.md` - What's in/out of MVP scope
- `_02-requirements/target-users.md` - User personas and needs

### If Making Architectural Decisions:
**Read:**
- `_07-decisions/decision-log.md` - Past decisions and rationale
- `_03-planning/workflow-phases.md` - Overall development roadmap

### If Understanding Phase Completion:
**Read:**
- `docsplans/PHASE_1A_COMPLETION_SUMMARY.md` - Phase 1A details
- `docsplans/PHASE_1B_IMPLEMENTATION_SUMMARY.md` - Phase 1B details
- `docsplans/PHASE_2_IMPLEMENTATION_SUMMARY.md` - Phase 2 details

---

## ⚠️ CRITICAL RULES (Never Skip These)

### 1. ALWAYS Use TodoWrite Tool
- For any multi-step task (3+ steps)
- Mark tasks in_progress BEFORE starting
- Mark completed IMMEDIATELY after finishing
- Only ONE task in_progress at a time

### 2. NEVER Commit Without User Request
- Don't use git commit unless user explicitly asks
- Don't push unless user explicitly asks
- Don't create PRs automatically

### 3. ALWAYS Read Before Editing
- Use Read tool on any file before editing
- Never edit files you haven't read in this session
- Check file timestamps to avoid editing stale files

### 4. ALWAYS Ask Before Big Decisions
- Use AskUserQuestion tool for:
  - Architectural choices
  - Library/framework selection
  - Database schema changes
  - UX/UI design decisions
  - Priority changes

### 5. Professional Accuracy is CRITICAL
- This is tax software - errors have real financial consequences
- When in doubt, ask for clarification
- Always verify calculations with tests
- Never guess at tax rules

---

## 🔄 Documentation Update Responsibilities

### After Completing a Sprint:
1. Update `SPRINT_PLAN_BETA_TO_PILOT.md`:
   - Mark sprint as ✅ complete
   - Add actual hours spent
   - Note any issues/blockers discovered
   - Update "Sprint Completion Log" section

2. Update `CURRENT_STATUS_2025-11-05.md`:
   - Move completed items from "⚠️ What Needs Fixing" to "✅ What's Working"
   - Update phase status
   - Update "Last Updated" date

3. Ask user: "Should I update the documentation now or continue to next sprint?"

### Weekly (Every Friday):
1. Remind user: "It's Friday - should we update project documentation?"
2. Review and update:
   - Current status
   - Sprint progress
   - Any new decisions made
   - Known issues

### When Adding New Features:
1. Update relevant technical specs
2. Add to decision log if architectural choice made
3. Update sprint plan if priority changes

---

## 💡 Tips for Effective LLM Collaboration

### Do This:
✅ Read documentation before asking questions
✅ Use TodoWrite for task tracking
✅ Ask clarifying questions when ambiguous
✅ Propose solutions, don't just implement
✅ Think about the tax professional user
✅ Test thoroughly - accuracy is critical
✅ Update documentation as you go

### Don't Do This:
❌ Skip reading documentation
❌ Make assumptions about requirements
❌ Implement without proposing first
❌ Commit code without user approval
❌ Ignore test failures
❌ Forget to update documentation
❌ Over-engineer solutions

---

## 📋 Checklist for Starting Work

Before writing any code, confirm you've done:

- [ ] Read current status document
- [ ] Read active sprint plan
- [ ] Identified which sprint is active
- [ ] Asked user what to work on
- [ ] Read relevant technical specs for the task
- [ ] Created TodoWrite tasks for multi-step work
- [ ] Understand acceptance criteria for the feature
- [ ] Know what "done" looks like

---

## 🎬 Example Session Start

**Good:**
```
LLM: I've reviewed the documentation and see we're in Sprint 1A: Analysis Management.
     The goal is to build the analyses list page and retrieval functionality.

     I see from the sprint plan that this includes:
     - Analyses list page (show all previous)
     - View past analysis (click to view)
     - Optional delete functionality

     Would you like me to:
     A) Start with the backend GET /analyses endpoint?
     B) Start with the frontend list page?
     C) Review what's already built first?

     What would be most helpful?
```

**Bad:**
```
LLM: What do you want to work on?
```
*(No context, didn't read docs, puts burden on user)*

---

## 🚨 When Documentation is Out of Date

If you notice documentation doesn't match reality:

1. **Don't assume documentation is wrong** - Check with user first
2. **Ask:** "I see the docs say X, but I'm seeing Y. Which is correct?"
3. **Offer to update:** "Should I update the documentation to reflect this?"
4. **Update immediately:** Don't leave docs stale

---

## 📞 Need Help?

If you're a new LLM and something is unclear:

1. Check `00-START-HERE.md` - "Finding What You Need" section
2. Read `_08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md`
3. Ask the user for clarification - they're the expert

---

**Last Updated:** 2025-11-07
**Next Review:** Weekly on Fridays
**Document Owner:** Mark (Project Lead)
