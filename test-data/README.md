# Test Data

**Last Updated:** 2025-11-11
**Purpose:** Test fixtures and data files for automated and manual testing

This folder contains all test data used throughout the project, organized by purpose.

---

## Folder Structure

### [config/](./config/)
**Purpose:** Configuration files used by backend scripts and tests

**Files:**
- `state_sales_tax_nexus.json` - State nexus rules, thresholds, and lookback periods

**Usage:**
- Referenced by `backend/scripts/import_state_nexus_rules.py`
- Run after database migration to populate state-specific rules

---

### [integration/](./integration/)
**Purpose:** Integration test data for Phase 2 interest/penalty calculations

**Files:**
- `TEST_DATA_PHASE2_GUIDE.md` - Guide for using Phase 2 test data
- `test_data_phase2.csv` - 120 transactions across 5 states (2022-2024)
- `test-nexus-threshold-data.csv` - Nexus threshold testing
- `sample-sales-data.csv` - General sample data
- `phase_1a_test_data.csv` - Phase 1A integration test data
- `sample-sales-data-accurate.csv` - Accurate sample data for testing
- `sample-sales-data-with-nexus.csv` - Sample data with nexus scenarios

**Test Coverage:**
- Simple interest (CA, FL, IL)
- Compound monthly interest (TX)
- Compound daily interest (NY)
- Multi-year nexus scenarios
- Marketplace exclusion rules
- Phase 1A chronological processing

---

### [manual-testing/](./manual-testing/)
**Purpose:** CSV files for manual testing of column mapping feature

**Files:**
- `test-exact-match.csv` - Exact column name matches
- `test-common-variants.csv` - Common column name variations
- `test-mixed-variants.csv` - Mix of exact and variant names
- `test-no-match.csv` - No automatic matches (requires manual mapping)
- `test-partial-match.csv` - Some columns auto-detected, some manual

**Usage:**
- Used with manual test plan: `docs/testing/smart-column-mapping-test-plan.md`
- Upload through frontend to test column detection and mapping

---

## Usage Guidelines

### For Developers:
- **Adding new test data?** Place it in the appropriate subfolder
- **CSV test files?** Use `manual-testing/` for UI tests, `integration/` for backend tests
- **Configuration files?** Add to `config/`

### For Testers:
- **Manual testing:** Use files from `manual-testing/`
- **Integration testing:** Use files from `integration/` with backend test suite
- **Test plans:** See `docs/testing/` for detailed test procedures

### Important Notes:
- **Do not commit sensitive data** - All test data should be synthetic/anonymized
- **Keep files small** - Test data should be minimal to test specific scenarios
- **Document expectations** - Include expected results in test plan docs

---

## Related Documentation

- Test Plans: `docs/testing/`
- Phase 2 Implementation: `docs/plans/completed-features/phase-summaries/PHASE_2_IMPLEMENTATION_SUMMARY.md`
- Reference Materials: `docs/reference/`

---

## Quick File Reference

| File | Purpose | Used By |
|------|---------|---------|
| `config/state_sales_tax_nexus.json` | State rules | Backend import script |
| `integration/test_data_phase2.csv` | Interest/penalty tests | Backend tests |
| `manual-testing/test-exact-match.csv` | Column mapping test | Manual testing |
| `manual-testing/test-common-variants.csv` | Column mapping test | Manual testing |
| `manual-testing/test-no-match.csv` | Column mapping test | Manual testing |
