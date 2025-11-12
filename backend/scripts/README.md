# Backend Utility Scripts

**Created:** 2025-11-11
**Purpose:** Documentation for utility scripts used in database management and maintenance

---

## Overview

This folder contains utility scripts for database operations that are run manually when needed (not part of the regular application flow).

---

## Scripts

### import_state_nexus_rules.py

**Purpose:** Import or update state nexus rules from JSON configuration into the database

**What it does:**
- Reads state rules from `test-data/config/state_sales_tax_nexus.json`
- Updates `economic_nexus_thresholds` table with:
  - Lookback periods (e.g., "Current or Previous Calendar Year")
  - Revenue thresholds (e.g., $100,000)
  - Transaction thresholds (e.g., 200 transactions)
  - Threshold operators (AND/OR logic)
- Updates `marketplace_facilitator_rules` table with:
  - Marketplace transaction exclusion rules

**When to run:**
- After migration 010 (initial population)
- When state tax laws change
- When adding new states or territories
- When threshold amounts are updated by states

**Prerequisites:**
- Migration 010 (`010_phase_1a_multi_year_chronological.sql`) must be applied
- JSON file must exist at `test-data/config/state_sales_tax_nexus.json`
- Environment variables configured (uses `app.core.supabase.get_supabase()`)

**How to run:**

```bash
# From backend folder:
cd /path/to/backend
python scripts/import_state_nexus_rules.py
```

**Expected output:**
```
INFO:__main__:Loading state nexus rules from: .../state_sales_tax_nexus.json
INFO:__main__:Found 50 states in JSON
INFO:__main__:Processing AL (Alabama)
INFO:__main__:  Lookback: Current or Previous Calendar Year
INFO:__main__:  Revenue threshold: $250,000
INFO:__main__:  Operator: OR
INFO:__main__:  ✓ Updated existing threshold record
...
INFO:__main__:============================================================
INFO:__main__:Import complete!
INFO:__main__:Updated: 50 states
INFO:__main__:Skipped: 0 states
INFO:__main__:============================================================
```

**What it updates:**

| Table | Columns Updated | Purpose |
|-------|----------------|---------|
| `economic_nexus_thresholds` | `lookback_period`, `revenue_threshold`, `transaction_threshold`, `threshold_operator` | Defines how each state calculates nexus |
| `marketplace_facilitator_rules` | `exclude_from_liability` | Defines marketplace transaction handling |

**Key features:**
- **Idempotent:** Safe to run multiple times (updates existing records)
- **Smart parsing:** Handles threshold strings like "$100,000 OR 200 transactions"
- **State name mapping:** Converts full state names to 2-letter codes
- **Logging:** Detailed progress output for verification
- **Error handling:** Continues processing if individual state fails

**Common use cases:**

1. **State changes threshold amount:**
   - Update JSON file with new threshold
   - Run script to update database
   - No code changes needed

2. **State changes lookback period:**
   - Update JSON with new lookback period
   - Run script
   - Test calculations to verify correct implementation

3. **New state adds economic nexus law:**
   - Add state to JSON file
   - Run script
   - Verify in Supabase dashboard

**Verification after running:**

```sql
-- Check that lookback periods are populated
SELECT state, lookback_period, revenue_threshold, transaction_threshold
FROM economic_nexus_thresholds
WHERE effective_to IS NULL
ORDER BY state;

-- Should show all 50+ states with lookback periods
```

**Related documentation:**
- Migration 010: `../migrations/010_phase_1a_multi_year_chronological.sql`
- JSON schema: `../../test-data/config/state_sales_tax_nexus.json`
- Database schema: `../../_04-technical-specs/state-rules-schema.md`

---

## Adding New Scripts

When adding utility scripts to this folder:

1. **Add clear docstring** explaining purpose
2. **Document prerequisites** (migrations, dependencies)
3. **Update this README** with usage instructions
4. **Make idempotent** if possible (safe to run multiple times)
5. **Add logging** for verification
6. **Handle errors gracefully** (don't fail entire batch for one error)

**Script naming convention:**
- Use descriptive names: `import_*`, `update_*`, `verify_*`
- Use underscores, not hyphens
- Include clear verb describing action

---

## Security Notes

**Never commit scripts with:**
- ❌ Hardcoded credentials (API keys, database passwords)
- ❌ Service role keys
- ❌ Production URLs with credentials
- ❌ User data or PII

**Always:**
- ✅ Use environment variables for credentials
- ✅ Import from `app.core.supabase` or `app.config`
- ✅ Keep credentials in `.env` files (gitignored)
- ✅ Document required environment variables

---

## Scripts Removed (Historical Record)

### commit_tests.bat (Removed Nov 11, 2025)
- **Why removed:** Single-use script with hardcoded commit message
- **When used:** Nov 4, 2025 for specific test commit
- **Why obsolete:** Commit already made, no future value

### test_supabase_connection.py (Removed Nov 11, 2025)
- **Why removed:** Security risk - contained hardcoded service role key
- **When used:** Nov 3, 2025 during initial setup
- **Why obsolete:** App deployed, connection testing done through production code
- **Security issue:** Hardcoded `SUPABASE_SERVICE_ROLE_KEY` in source code

---

**Last Updated:** 2025-11-11
**Maintained By:** Development team
