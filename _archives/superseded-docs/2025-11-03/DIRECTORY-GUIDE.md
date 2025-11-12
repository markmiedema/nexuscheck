# Directory Organization Guide

**Created:** 2025-11-01

---

## How to Organize the Downloaded Files

You've downloaded documentation files with prefixes like `[01-project-overview]_vision.md`. Here's how to organize them:

### Step 1: Create the Directory Structure

Create a main project folder called `SALT-Tax-Tool` with these subdirectories:

```
SALT-Tax-Tool/
├── 01-project-overview/
├── 02-requirements/
├── 03-planning/
├── 04-technical-specs/
├── 05-state-rules/
├── 06-development/
├── 07-decisions/
└── 08-templates/
```

### Step 2: Place Files in Correct Directories

Move each downloaded file to its corresponding directory, removing the bracket prefix:

**Root directory files:**
- `00-START-HERE.md` → Root
- `PROJECT-SUMMARY.md` → Root
- `LLM-INSTRUCTIONS.md` → Root

**01-project-overview/ files:**
- `[01-project-overview]_vision.md` → Rename to `vision.md` and place in `01-project-overview/`

**02-requirements/ files:**
- `[02-requirements]_target-users.md` → Rename to `target-users.md` and place in `02-requirements/`
- `[02-requirements]_mvp-scope.md` → Rename to `mvp-scope.md` and place in `02-requirements/`

**03-planning/ files:**
- `[03-planning]_task-breakdown.md` → Rename to `task-breakdown.md` and place in `03-planning/`
- `[03-planning]_priority-tiers.md` → Rename to `priority-tiers.md` and place in `03-planning/`
- `[03-planning]_workflow-phases.md` → Rename to `workflow-phases.md` and place in `03-planning/`

**07-decisions/ files:**
- `[07-decisions]_decision-log.md` → Rename to `decision-log.md` and place in `07-decisions/`

---

## Final Structure

When complete, your directory should look like this:

```
SALT-Tax-Tool/
├── 00-START-HERE.md
├── PROJECT-SUMMARY.md
├── LLM-INSTRUCTIONS.md
├── 01-project-overview/
│   └── vision.md
├── 02-requirements/
│   ├── target-users.md
│   └── mvp-scope.md
├── 03-planning/
│   ├── task-breakdown.md
│   ├── priority-tiers.md
│   └── workflow-phases.md
├── 04-technical-specs/
│   └── (empty - to be populated)
├── 05-state-rules/
│   └── (empty - to be populated)
├── 06-development/
│   └── (empty - to be populated)
├── 07-decisions/
│   └── decision-log.md
└── 08-templates/
    └── (empty - to be populated)
```

---

## Quick Tip

Optional: Create simple README.md files in each subdirectory to describe what belongs there. For example:

**01-project-overview/README.md:**
```markdown
# Project Overview
Vision, goals, and high-level context for the project.
```

**02-requirements/README.md:**
```markdown
# Requirements
Detailed requirements, user profiles, and MVP scope definition.
```

(And so on for each directory)

---

## Verification

To verify your structure is correct:
1. `00-START-HERE.md` should be in the root
2. Each numbered directory (01-08) should exist
3. Files should be in their corresponding directories
4. File names should NOT have the `[XX-directory]_` prefix anymore

---

## Next Steps

Once organized:
1. Read `00-START-HERE.md`
2. Read `PROJECT-SUMMARY.md` for complete context
3. Start working on Phase 1, Step 1: Data Model Design
4. See `03-planning/workflow-phases.md` for detailed next steps
