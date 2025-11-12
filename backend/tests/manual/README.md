# Manual Test Scripts

**Last Updated:** 2025-11-11
**Purpose:** Manual testing scripts for debugging and verification during development

These scripts are NOT part of the automated test suite (`pytest`). They are used for:
- Manual API testing
- Direct testing of specific components
- Debugging specific issues
- Syntax verification

---

## Available Scripts

### test_calculation.py
**Purpose:** Manual test of nexus calculation API endpoints
**Usage:**
```bash
python tests/manual/test_calculation.py
```
**Requirements:**
- Backend server running on localhost:8000
- Valid JWT token for authentication
- Existing analysis ID in database

**What it tests:**
- POST `/api/v1/analyses/{id}/calculate` endpoint
- GET `/api/v1/analyses/{id}/results/summary` endpoint

---

### test_calculator_direct.py
**Purpose:** Direct test of NexusCalculator logic without API layer
**Usage:**
```bash
python tests/manual/test_calculator_direct.py
```
**Requirements:**
- Supabase connection configured in .env
- Test analysis ID in database

**What it tests:**
- NexusCalculator class directly
- Bypasses API layer for faster debugging
- Database queries and results storage

---

### test_endpoint_syntax.py
**Purpose:** Quick syntax verification for API endpoints
**Usage:**
```bash
python tests/manual/test_endpoint_syntax.py
```
**What it checks:**
- Python syntax errors in `app/api/v1/analyses.py`
- Presence of expected endpoint functions
- Quick validation before running full test suite

---

### test_interest_manual.py
**Purpose:** Manual testing of interest calculation logic
**Usage:**
```bash
python tests/manual/test_interest_manual.py
```
**Requirements:**
- Supabase connection configured

**What it tests:**
- Interest rate calculations
- Compound vs. simple interest
- Date-based interest accumulation

---

### test_rolling_manual.py
**Purpose:** Manual testing of rolling 12-month lookback calculation
**Usage:**
```bash
python tests/manual/test_rolling_manual.py
```
**Requirements:**
- Supabase connection configured
- Test data with multi-year transactions

**What it tests:**
- Rolling 12-month window logic
- Year-over-year threshold comparison
- Multi-year nexus tracking

---

## When to Use Manual Tests

**Use these scripts when:**
- Debugging specific calculation issues
- Testing API endpoints manually
- Need quick feedback without full test suite
- Investigating database queries
- Verifying specific edge cases

**Do NOT use these for:**
- Automated CI/CD testing (use `pytest` suite in `/tests/` instead)
- Production verification (use integration tests)
- Regression testing (write proper unit tests)

---

## Adding New Manual Tests

If you need to add a new manual test script:

1. Create script in `tests/manual/` directory
2. Name it `test_*.py` for consistency
3. Add docstring explaining purpose
4. Document requirements and usage in this README
5. Keep it simple and focused on specific debugging

---

## Related Documentation

- **Automated Tests:** See `/tests/` for pytest test suite
- **Test Data:** See `/test-data/` for test fixtures
- **Integration Tests:** See `/tests/test_analyses_integration.py`

---

**Last Updated:** 2025-11-11
