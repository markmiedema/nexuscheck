# New LLM Session - Context Template

**Use this template when starting a new LLM conversation to ensure consistent context and avoid schema drift.**

---

## Copy-Paste Template for New Sessions

```markdown
# SALT Tax Tool - Development Session Context

## Project Overview
I'm building a SALT (State and Local Tax) nexus analysis tool for boutique tax agencies. This tool reduces 12-20 hours of manual nexus determination work down to minutes.

## Current Status
- **Phase:** Phase 2A (Database Implementation)
- **Status:** Database schema complete, migrations ready, awaiting deployment
- **Last Updated:** 2025-11-02

## Critical Information - READ FIRST

### 🚨 DATABASE SCHEMA IS LOCKED AND FROZEN
- All 12 tables are defined and documented
- Migration scripts are created (001-004)
- **DO NOT modify table structures, column names, or data types**
- **USE EXACT SQL** from specification files

### Source of Truth Files:
1. `data-model-specification.md` (Tables 1-7: user data)
2. `state-rules-schema.md` (Tables 8-12: state rules reference data)
3. `migrations/001_initial_schema.sql` (executable SQL)
4. `migrations/002_row_level_security.sql` (29 RLS policies)

## Working Directory
`D:\01 - Projects\SALT-Tax-Tool-Clean`

## What's Already Built

### Phase 1: COMPLETE ✅
- Requirements & planning documentation (12 files)
- Complete database schema (12 tables)
- Migration scripts (001-004)
- RLS security policies (29 policies)
- Validation queries

### Database Schema (LOCKED - DO NOT MODIFY):
**12 Tables:**
1. users
2. analyses
3. sales_transactions
4. physical_nexus
5. state_results
6. error_logs
7. audit_log
8. states
9. economic_nexus_thresholds
10. marketplace_facilitator_rules
11. tax_rates
12. interest_penalty_rates

**Key Features:**
- Multi-tenant with Row Level Security (RLS)
- User-controlled retention policies
- Comprehensive error tracking
- Soft delete with 30-day recovery
- 11 foreign keys with CASCADE DELETE
- 17 performance indexes

## What I Need Help With

[DESCRIBE YOUR SPECIFIC TASK HERE]

Example:
- "Run migration 001 to create all 12 tables in Supabase"
- "Populate states table with all 51 states + DC"
- "Design user flow for upload → analysis → report"
- "Build FastAPI endpoint for nexus calculation"

## Reference Files - Please Read Before Starting

**Essential Context:**
1. `00-START-HERE.md` - Project orientation
2. `DATABASE_IMPLEMENTATION_SUMMARY.md` - Database status
3. `LLM-INSTRUCTIONS.md` - Working rules

**For Database Work:**
1. `data-model-specification.md` - Exact schema for tables 1-7
2. `state-rules-schema.md` - Exact schema for tables 8-12
3. `migrations/001_initial_schema.sql` - SQL to create all tables
4. `migrations/002_row_level_security.sql` - SQL for RLS policies

**For Decisions:**
1. `07-decisions/decision-log.md` - All architectural decisions

## Critical Rules

1. **Schema is LOCKED**: Use exact SQL from specification files
2. **No modifications**: Update docs first if changes are absolutely necessary
3. **Reference by line number**: When using schema, cite exact lines from specification files
4. **No camelCase**: All column names use snake_case
5. **No inventions**: Don't create new tables/columns without documentation update

## Expected Behavior

✅ **GOOD - Do this:**
- "I'll use the exact SQL from `data-model-specification.md` lines 128-143"
- "Reading specification files first before making any suggestions"
- "I notice the schema has this constraint - should I use it as-is?"

❌ **BAD - Stop immediately if you see this:**
- "Here's an improved version of your schema..."
- "I'll create a users table with these fields..." (inventing, not reading)
- Using `userId` instead of `user_id` (camelCase vs snake_case)
- Missing tables or showing only 8 of 12 tables

## Success Criteria

By the end of this session, you should:
- [SPECIFIC DELIVERABLE 1]
- [SPECIFIC DELIVERABLE 2]
- [SPECIFIC DELIVERABLE 3]

Example:
- ✅ All 12 tables created in Supabase
- ✅ RLS policies enabled (green "Restricted" badges)
- ✅ Validation queries confirm schema is correct

## Questions Before Starting?

If anything is unclear, ask before proceeding. Check the reference files listed above.

---

**Ready to start? Please confirm you've read the specification files and understand the schema is LOCKED.**
```

---

## How to Use This Template

### Step 1: Copy the Template
Copy everything from the markdown code block above

### Step 2: Customize for Your Task
Replace the bracketed sections:
- `[DESCRIBE YOUR SPECIFIC TASK HERE]`
- `[SPECIFIC DELIVERABLE 1/2/3]`

### Step 3: Start New LLM Session
- Open new Claude Code session, or
- Start conversation with another LLM (ChatGPT, etc.)

### Step 4: Paste Context
Paste your customized template as the first message

### Step 5: Verify Understanding
Check that the LLM:
- Confirms it read the specification files
- Acknowledges the schema is locked
- Understands it should use exact SQL from docs

### Step 6: Proceed with Task
If LLM shows understanding, proceed with your task

---

## Red Flags - Stop Immediately If You See These

❌ **"I'll create a users table with..."**
→ It's inventing, not reading your specs

❌ **"Here's an improved schema..."**
→ You didn't ask for improvements

❌ **Uses camelCase** (userId, analysisId)
→ Not following your snake_case convention

❌ **Shows only 8 tables**
→ Didn't read all specs

❌ **Modifies existing migrations**
→ Should create new migration (005+)

---

## Green Flags - Good Signs

✅ **"I've read both specification files. I see 12 tables..."**
→ Actually read your docs

✅ **"Using exact SQL from data-model-specification.md lines 72-98"**
→ Referencing source of truth

✅ **Asks before changing anything**
→ Respects frozen schema

✅ **Creates new migration (005) instead of modifying 001**
→ Follows migration best practices

---

## Example: Good Session Start

```
User: [Pastes customized template]

LLM: "I've read the specification files. I can confirm:
- 12 tables defined (7 user data + 5 state rules)
- Schema is LOCKED - I will use exact SQL from specs
- Users table is defined in data-model-specification.md lines 128-143
- I understand I should NOT modify table structures

I'm ready to help with [your task]. Should I proceed with reading the migration script at migrations/001_initial_schema.sql?"

User: "Yes, proceed"
```

---

## Example: Bad Session Start (STOP THIS)

```
User: [Pastes template]

LLM: "Great! I'll help you build the database. Let me create a users table with these fields:
- id (UUID)
- email (String)
- name (String)
..."

[STOP - LLM is inventing, not reading specs]
```

---

## Troubleshooting

### Problem: LLM invents schema instead of reading specs
**Solution:** Explicitly ask:
> "Before proceeding, please read `data-model-specification.md` and confirm the exact structure of the `users` table on lines 128-143."

### Problem: LLM uses camelCase column names
**Solution:** Point to specification:
> "Please use the exact column names from `data-model-specification.md` which uses snake_case (user_id, not userId)"

### Problem: LLM suggests schema improvements
**Solution:** Redirect:
> "The schema is frozen. Please use it exactly as documented. If changes are needed, I'll update the specification files first."

### Problem: LLM modifies existing migration
**Solution:** Correct:
> "Never modify existing migrations (001-004). Create a new migration script (005) instead."

---

## Quick Checklist Before Starting New Session

- [ ] Copy template from this file
- [ ] Customize task description
- [ ] Customize success criteria
- [ ] Paste into new LLM session
- [ ] Wait for LLM to confirm it read specs
- [ ] Verify LLM understands schema is locked
- [ ] Check for red flags before proceeding
- [ ] If red flags appear, stop and course-correct
- [ ] If green flags appear, proceed with confidence

---

**Last Updated:** 2025-11-02
**Purpose:** Prevent schema drift across multiple LLM sessions
**Status:** Ready to use
