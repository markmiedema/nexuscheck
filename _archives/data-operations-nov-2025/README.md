# Data Operations - November 2025

**Created:** 2025-11-11
**Purpose:** Archive documentation from one-time data operations during initial database setup and testing (November 2025)

---

## Overview

This folder contains documentation for data-related operations that were completed during the initial setup and testing phase. These files document:
- Database data import procedures
- Data quality fixes applied to source files
- Sample data characteristics and expected results
- One-time data preparation tasks

**Note:** These are historical records of completed operations, not active procedures.

---

## Files

### DATA_FIXES_LOG.md
**Date:** November 7, 2025
**Purpose:** Log of data quality fixes applied to research JSON files before database import
**Content:**
- Documented missing or invalid data fields in source files
- Corrections made to ensure database compatibility
- Preserved data integrity while fixing import issues

**Fixes documented:**
- Arkansas: Missing `effective_date` field
- Other state data compatibility fixes

**When to reference:** Understanding what data issues were encountered during initial import

---

### IMPORT_INSTRUCTIONS.md
**Date:** November 2025
**Purpose:** Quick start guide for importing research data into Supabase
**Content:**
- Prerequisites for data import
- Environment variable setup
- Step-by-step import procedure
- Troubleshooting common issues

**⚠️ Security Note:** This file contains hardcoded credentials (service role key) and should NEVER be used as-is. Archived for historical reference only.

**When to reference:**
- Understanding the original import process (historical reference only)
- **DO NOT use for actual imports** - use environment variables instead
- See `backend/scripts/import_state_nexus_rules.py` for current import script

---

### SAMPLE_DATA_SUMMARY.md
**Date:** November 2025
**Purpose:** Documentation for `sample-sales-data-with-nexus.csv` test file
**Content:**
- Expected nexus calculation results
- States that should trigger nexus (4 states over $100K threshold)
- States that should NOT trigger nexus (4 states under threshold)

**Test data characteristics:**
- California: ~$150,000 in sales → HAS NEXUS
- Texas: ~$120,000 in sales → HAS NEXUS
- Florida: ~$110,000 in sales → HAS NEXUS
- New York: ~$105,000 in sales → HAS NEXUS

**When to reference:** Understanding the initial test data design (note: may not reflect actual state thresholds)

---

### SAMPLE_DATA_ACCURATE_SUMMARY.md
**Date:** November 2025
**Purpose:** Documentation for `sample-sales-data-accurate.csv` - test file with CORRECT state thresholds
**Content:**
- Actual state-specific economic nexus thresholds from database
- Expected results using accurate thresholds
- Corrected test data based on real state rules

**Key difference from SAMPLE_DATA_SUMMARY.md:**
- Uses actual thresholds ($100K for FL/CO, $500K for CA/TX)
- More realistic test scenarios
- Accurate nexus determination

**Test data characteristics:**
- California: $500K threshold (high bar)
- Texas: $500K threshold (high bar)
- Florida: $100K threshold (standard)
- Colorado: $100K threshold (standard)

**When to reference:** Understanding how test data evolved to match real state thresholds

---

## Why These Files Are Archived

### Completed Operations:
1. **Initial data import** - Research data for 21 states loaded into Supabase (November 2025)
2. **Data quality fixes** - Source JSON files corrected and imported
3. **Test data creation** - Sample CSV files created and validated

### No Longer Actively Used:
- Data import was a one-time operation (completed)
- Sample data files served their purpose during testing
- Import instructions contain security issues (hardcoded credentials)

### Historical Value:
- Documents the data import process
- Shows evolution of test data quality
- Records data quality issues encountered
- Provides context for future data operations

---

## Current Data Operations

For current data operations, see:

**State Rules Updates:**
- Script: `backend/scripts/import_state_nexus_rules.py`
- Documentation: `backend/scripts/README.md`
- When to run: When state tax laws change

**Test Data:**
- Location: `test-data/` folder in project root (if exists)
- Automated tests: `backend/tests/`
- Manual tests: `backend/tests/manual/`

**Database Schema:**
- Current schema: `_04-technical-specs/data-model-specification.md`
- State rules schema: `_04-technical-specs/state-rules-schema.md`
- Migration history: `backend/migrations/MIGRATIONS_LOG.md`

---

## Security Warning

**IMPORT_INSTRUCTIONS.md contains hardcoded credentials (service role key).**

This file is archived for historical reference only. Never use hardcoded credentials in:
- Active scripts
- Documentation that might be shared
- Version-controlled files

Always use:
- Environment variables (`.env` files)
- Secret management systems
- Proper credential rotation

---

## Related Documentation

- **Migration History:** `backend/migrations/MIGRATIONS_LOG.md` - All database schema changes
- **Database Deployment:** `_archives/phase-2a-database/` - Initial deployment documentation
- **Backend Scripts:** `backend/scripts/README.md` - Current data import scripts
- **Data Model:** `_04-technical-specs/data-model-specification.md` - Current database schema

---

**Last Updated:** 2025-11-11
