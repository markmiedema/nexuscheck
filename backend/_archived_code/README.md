# Archived Backend Code

**Created:** 2025-11-11
**Purpose:** Preserve obsolete code versions for historical reference and learning

This folder contains backend code that has been superseded by newer implementations but is preserved for:
- Understanding evolution of features
- Extracting useful patterns or logic
- Reference during debugging
- Learning what worked vs what was improved

---

## Files Archived

### nexus_calculator_v1_2025-11-04.py
**Original Location:** `backend/app/services/nexus_calculator.py`
**Date Created:** 2025-11-04
**Date Archived:** 2025-11-11
**File Size:** ~17K

**What This Was:**
- Original nexus calculation engine (Version 1)
- Implemented basic economic nexus determination
- Aggregated transactions by state
- Compared against state thresholds
- Calculated tax liability estimates

**Why It Was Superseded:**
The original calculator had limitations that required a complete rewrite:

1. **No Chronological Processing**
   - V1 aggregated all transactions first, losing temporal information
   - Couldn't determine exact nexus establishment dates
   - Problem: "When did nexus begin?" couldn't be answered accurately

2. **No Multi-Year Tracking**
   - Processed all years together without tracking nexus status across years
   - Couldn't implement "sticky nexus" (once established, remains)
   - Problem: Inaccurate for 3-4 year lookback analyses

3. **Calendar Year Only**
   - No support for rolling 12-month or trailing quarter calculations
   - Limited to single calculation method
   - Problem: Some states/situations require different lookback periods

4. **Simple Date Handling**
   - Basic date logic without proper period boundaries
   - Couldn't handle mid-year nexus establishment correctly
   - Problem: Obligation start dates were approximate, not precise

**What Replaced It:**
- **nexus_calculator_v2.py** (Nov 7, 2025) - Complete rewrite with:
  - Chronological transaction processing
  - Multi-year nexus tracking with sticky logic
  - Exact nexus date determination
  - Proper obligation period calculations
  - Integration with InterestCalculator for multi-year interest
  - Support for multiple calculation methods (Phase 1A: calendar year)

**Key Differences:**

| Feature | V1 (This File) | V2 (Current) |
|---------|----------------|--------------|
| Transaction processing | Aggregated upfront | Chronological order |
| Nexus date | Not tracked | Exact date found |
| Multi-year | Single pass | Year-by-year with memory |
| Sticky nexus | No | Yes |
| Obligation periods | Approximate | Precise |
| Interest calculation | Basic | Multi-year with compounding |

**Useful Patterns from V1:**
Despite being superseded, V1 contains useful patterns:
- Clean separation of aggregation, threshold checking, liability calculation
- Good error handling and logging
- Decimal precision for financial calculations
- State-by-state processing structure

**When to Reference:**
- Understanding the evolution of calculation logic
- Comparing simple vs complex implementations
- Extracting pattern-matching or threshold logic
- Learning what requirements drove the V2 rewrite

**When NOT to Reference:**
- Building new features (use V2 as the pattern)
- Debugging current calculations (V2 is active)
- Understanding current behavior (V2 is deployed)

**Replaced By:** `backend/app/services/nexus_calculator_v2.py` (41K, Nov 7, 2025)

**Import Evidence:**
```python
# analyses.py uses V2, not V1:
from app.services.nexus_calculator_v2 import NexusCalculatorV2

# V1 was never imported in production code
```

---

### test_nexus_calculator_v1_2025-11-04.py
**Original Location:** `backend/tests/test_nexus_calculator.py`
**Date Created:** 2025-11-04
**Date Archived:** 2025-11-11
**File Size:** ~3.5K

**What This Was:**
- Unit tests for nexus_calculator.py (V1)
- Tested tax rate calculation bug fix
- Verified threshold logic
- Mocked Supabase dependencies

**Why It Was Archived:**
- Tests the V1 calculator which has been superseded by V2
- V1 calculator archived on same date
- Test imports `from app.services.nexus_calculator import NexusCalculator` (V1 class)
- No longer runs since V1 code is archived

**Key Test Case:**
```python
def test_tax_rate_not_divided_by_100(calculator, mock_supabase):
    """
    Bug: Code was dividing 0.0825 by 100 = 0.000825,
    making liability 100x too low.
    """
```

This test documented an important bug fix: tax rates were stored as decimals (0.0825 for 8.25%) but being divided by 100 again, causing 100x underestimation of liability.

**Current Tests:**
- **test_nexus_calculator_v2_phase1a.py** - Tests V2 calendar year logic
- **test_nexus_calculator_v2_phase1b.py** - Tests V2 multi-year sticky nexus
- **test_interest_calculator_phase2.py** - Tests interest calculations

**When to Reference:**
- Understanding the tax rate calculation bug and fix
- Learning about the testing approach for V1
- Historical record of issues discovered and resolved

**When NOT to Reference:**
- Writing new tests (use V2 test files as pattern)
- Debugging current calculations (V2 tests are active)

---

## Archive Principles

**We archive code (not delete) when:**
1. Superseded by a better implementation
2. No longer imported or used
3. Contains potentially useful patterns or logic
4. Historical value for understanding evolution

**We do NOT archive:**
1. Temporary debugging code (delete it)
2. Commented-out code (clean it up)
3. Dead imports (remove them)
4. Duplicate code with no historical value (delete it)

---

## How to Use This Archive

### For Learning:
1. Compare V1 vs V2 to understand what improved
2. See evolution from simple to complex
3. Extract useful patterns that remain relevant

### For Debugging:
1. Check if behavior changed between versions
2. Understand why certain approaches were abandoned
3. Verify logic was preserved during rewrites

### For Future Development:
1. Don't copy from archived code without understanding why it was replaced
2. If you need similar functionality, use the current version as the pattern
3. Consider whether the problem that required V2 applies to your use case

---

## Next File to Archive?

As the project evolves, additional files may be archived here:
- Superseded service implementations
- Old API endpoint versions
- Replaced utility functions
- Obsolete data processing logic

**Naming Convention:** `{original_name}_v{version}_{date}.py`

**Always include:**
- What it was
- Why it was superseded
- What replaced it
- Key differences
- When to reference it

---

**Last Updated:** 2025-11-11
**Files Archived:** 2 (1 service file, 1 test file)
