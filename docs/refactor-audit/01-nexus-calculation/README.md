# Nexus Calculation Subsystem Audit

**File**: `backend/app/services/nexus_calculator_v2.py`
**Size**: 1,168 lines
**Complexity**: 🔴 High
**Last Updated**: 2025-01-14

---

## Overview

The nexus calculation engine is the **core business logic** of the SALT Tax Tool. It determines:
1. Whether a business has sales tax nexus in each state
2. When nexus was established (nexus date)
3. When tax obligation begins (obligation start date)
4. How much tax liability exists (estimated liability)

This is implemented as a single class (`NexusCalculatorV2`) with 19 methods.

---

## File Structure

### Methods Inventory (19 total)

**Main Entry Point** (1):
- `calculate_nexus_for_analysis()` - Orchestrates entire calculation

**Core Calculation Logic** (8):
- `_calculate_state_nexus_multi_year()` - Routes to appropriate lookback handler
- `_calculate_calendar_year_lookback()` - Handles "Previous Calendar Year" and "Current or Previous Calendar Year" (Phase 1A)
- `_calculate_rolling_12_month_lookback()` - Handles "Rolling 12 Months" (Phase 1B)
- `_find_threshold_crossing()` - Finds exact date when threshold was crossed
- `_calculate_obligation_start_date()` - Determines when tax obligation begins
- `_calculate_liability_for_year()` - Calculates tax + interest + penalties
- `_create_no_nexus_result()` - Creates result object for no-nexus states
- `_create_zero_sales_results()` - Creates results for states with no transactions

**Data Retrieval** (6):
- `_get_all_transactions()` - Fetches transactions from database
- `_get_economic_nexus_thresholds()` - Gets threshold configs for all states
- `_get_tax_rates()` - Gets tax rate configs
- `_get_marketplace_facilitator_rules()` - Gets MF rules
- `_get_interest_penalty_config()` - Gets interest/penalty configs
- `_get_all_state_codes()` - Lists all 51 states (50 + DC)
- `_get_physical_nexus()` - Gets user-defined physical nexus dates

**Database Persistence** (2):
- `_save_results_to_database()` - Saves calculated results to state_results table
- `_update_analysis_summary()` - Updates analyses table with summary stats

**Dependencies**:
- `InterestCalculator` - Imported from `interest_calculator.py`

---

## Calculation Flow

```
1. calculate_nexus_for_analysis(analysis_id)
   ↓
2. Load all transactions (chronological order is CRITICAL)
   ↓
3. Load reference data (thresholds, tax rates, MF rules, etc.)
   ↓
4. Get physical nexus dates (user-provided)
   ↓
5. Group transactions by state
   ↓
6. FOR EACH STATE (all 51 states):
   ↓
   6a. _calculate_state_nexus_multi_year()
       ↓
       Route to lookback handler:
       ↓
   6b. _calculate_calendar_year_lookback() OR
       _calculate_rolling_12_month_lookback()
       ↓
       FOR EACH YEAR in dataset:
       ↓
       6c. _find_threshold_crossing() - Find exact nexus date
       ↓
       6d. _calculate_obligation_start_date() - Determine when obligation starts
       ↓
       6e. _calculate_liability_for_year() - Calculate tax liability
           ↓
           Calls InterestCalculator for interest/penalties
       ↓
   6f. Create result object for each year
   ↓
7. _save_results_to_database() - Persist all results
   ↓
8. _update_analysis_summary() - Update analysis totals
   ↓
9. Return summary statistics
```

---

## Business Logic Implemented

### 1. Lookback Period Types

The calculator supports 3 lookback period types:

**Phase 1A - Calendar Year Lookback** (implemented ✅):
- `"Previous Calendar Year"` - Check if prior year crossed threshold
- `"Current or Previous Calendar Year"` - Check current OR prior year

**Phase 1B - Rolling 12 Months** (implemented ✅):
- `"Rolling 12 Months"` - Check trailing 12-month window

**Phase 1C/1D - Future** (not implemented ⚠️):
- Other lookback types fall back to "Current or Previous Calendar Year"

### 2. Nexus Types

**Physical Nexus**:
- User manually provides nexus date
- Overrides economic nexus if earlier

**Economic Nexus**:
- Determined by threshold crossing
- Separate logic per lookback period type

**Both**:
- If state has BOTH physical and economic nexus

**None**:
- No nexus established

### 3. Sticky Nexus

**Concept**: Once nexus is established, it "sticks" for future years even if sales drop below threshold.

**Implementation**:
- Tracks `first_nexus_year` and `first_nexus_date`
- If nexus existed in prior year, current year has nexus from Jan 1
- Full year obligation (not month-after-crossing)

**Code Location**: Lines 220-240 in `_calculate_calendar_year_lookback()`

### 4. Marketplace Facilitator Rules

**States have different rules**:
- Some include marketplace sales in threshold calculation
- Most exclude marketplace sales from liability calculation
- Rules stored in `marketplace_facilitator_rules` table

**Key Field**: `exclude_from_liability`
- `TRUE` → Marketplace sales DON'T count toward tax liability
- `FALSE` → Marketplace sales DO count

**Code Location**: Lines 690-760 in `_calculate_liability_for_year()`

### 5. Obligation Start Date

**Rule**: Tax obligation begins the month AFTER threshold is crossed.

**Example**:
- Threshold crossed on June 15, 2024
- Obligation starts July 1, 2024
- Only sales from July onwards create liability

**Exception**: Sticky nexus → obligation starts Jan 1 of current year

**Code Location**: `_calculate_obligation_start_date()` at line 635

### 6. Interest & Penalties

**Calculation**:
- Base tax = taxable sales × tax rate
- Interest = calculated by `InterestCalculator` (separate service)
- Penalties = late registration, late filing, late payment

**Note**: This is delegated to `interest_calculator.py` (not audited yet)

---

## Data Flow

### Inputs (from Database)

**Transactions**: `sales_transactions` table
```sql
SELECT
  transaction_date,
  customer_state,
  sales_amount,
  sales_channel, -- 'direct' or 'marketplace'
  taxable_amount,
  exempt_amount,
  is_taxable
FROM sales_transactions
WHERE analysis_id = ?
ORDER BY transaction_date ASC  -- ⚠️ ORDER IS CRITICAL
```

**Reference Data**: Multiple tables
- `economic_nexus_thresholds` - Revenue/transaction thresholds per state
- `tax_rates` - State + local tax rates
- `marketplace_facilitator_rules` - How marketplace sales are treated
- `interest_penalty_rates` - Interest/penalty configs
- `states` - State metadata (lookback period, etc.)
- `physical_nexus` - User-provided physical nexus dates

### Outputs (to Database)

**Results**: `state_results` table (one row per state per year)
```python
{
  'analysis_id': UUID,
  'state': 'CA',
  'year': 2024,
  'nexus_type': 'economic',  # or 'physical', 'both', 'none'
  'nexus_date': '2024-06-15',
  'obligation_start_date': '2024-07-01',
  'first_nexus_year': 2024,
  'total_sales': Decimal,
  'direct_sales': Decimal,
  'marketplace_sales': Decimal,
  'taxable_sales': Decimal,
  'exposure_sales': Decimal,  # Sales during obligation period
  'exempt_sales': Decimal,
  'estimated_liability': Decimal,
  'base_tax': Decimal,
  'interest': Decimal,
  'penalties': Decimal,
  # ... more fields
}
```

**Summary**: Updates `analyses` table
```python
{
  'total_liability': sum of all state liabilities,
  'states_with_nexus': count of states with nexus
}
```

---

## Known Issues & Technical Debt

### 🔴 Critical

1. **Single Responsibility Violation**
   - This class does EVERYTHING: fetches data, calculates nexus, calculates liability, saves to DB
   - Should be split into: DataRepository, NexusEngine, LiabilityCalculator, ResultsPersistence

2. **No Unit Tests**
   - Core business logic has NO automated tests
   - Nexus determination is complex and error-prone
   - Impossible to refactor safely without tests

3. **Hard to Test**
   - All methods depend on database (Supabase client)
   - Can't test nexus logic without full database setup
   - Should separate pure business logic from data access

### 🟡 Important

4. **Magic Numbers & Hard-Coded Logic**
   - Line 836: `'approaching_threshold': False,  # TODO: Calculate`
   - Threshold crossing logic is scattered
   - No clear configuration for "approaching" threshold (e.g., 80%)

5. **Complex Conditional Logic**
   - `_calculate_calendar_year_lookback()` is 180+ lines with deep nesting
   - Hard to follow, easy to introduce bugs
   - Should extract helper methods

6. **Debug Logging Left In**
   - Lines 693, 746, 749, 756: `[MARKETPLACE DEBUG]` logs still present
   - Should be removed or controlled by log level

7. **Error Handling is Minimal**
   - What if threshold_config is missing?
   - What if tax_rate_config is None?
   - Silent failures possible

### 🟢 Nice to Have

8. **No Type Hints on Return Values**
   - Methods return `List[Dict]` but Dict structure is not typed
   - Should use Pydantic models or TypedDict

9. **No Documentation on Edge Cases**
   - What happens if there are 0 transactions?
   - What if analysis spans 10 years?
   - What if threshold changes mid-year?

10. **Performance Concerns**
    - Loading ALL transactions into memory
    - What if there are 1 million transactions?
    - Should consider streaming or batching

---

## Recommendations

### Phase 1: Make Testable (2-3 days)

1. **Extract Pure Business Logic**
   ```python
   # NEW: Pure function with no DB dependencies
   def determine_nexus_for_state(
       transactions: List[Transaction],
       threshold: ThresholdConfig,
       mf_rule: MarketplaceFacilitatorRule,
       physical_nexus_date: Optional[date] = None
   ) -> NexusResult:
       """Pure function - easy to test"""
       # All the nexus determination logic here
       pass
   ```

2. **Create Repository Pattern**
   ```python
   class NexusDataRepository:
       def get_transactions(self, analysis_id: str) -> List[Transaction]:
           pass

       def get_thresholds(self) -> Dict[str, ThresholdConfig]:
           pass

       # etc.
   ```

3. **Write Unit Tests**
   - Test threshold crossing scenarios
   - Test sticky nexus logic
   - Test marketplace facilitator rules
   - Test lookback period variations

### Phase 2: Refactor Structure (3-4 days)

4. **Split into Multiple Classes**
   ```python
   NexusDataRepository  # Data access only
   ThresholdEngine      # Finds threshold crossings
   NexusEngine          # Determines nexus status
   LiabilityCalculator  # Calculates tax liability
   ResultsPersistence   # Saves to database
   NexusCalculatorV3    # Orchestrates the above
   ```

5. **Use Pydantic Models**
   - Define clear types for all data structures
   - Replace `Dict` with typed models
   - Get auto-validation for free

### Phase 3: Improve Maintainability (2-3 days)

6. **Document Edge Cases**
   - Create decision tree diagrams
   - Document all business rule variations
   - Add examples for each lookback period type

7. **Add Configuration**
   - Extract magic numbers to config
   - Make "approaching threshold" configurable
   - Support A/B testing of calculation methods

8. **Performance Optimization**
   - Add caching for reference data
   - Consider pagination for very large datasets
   - Profile and optimize hot paths

### Phase 4: Future Enhancements (ongoing)

9. **Support Historical Threshold Changes**
   - Currently assumes one threshold per state
   - Should support threshold changes over time

10. **Better Error Recovery**
    - Graceful degradation if data is missing
    - Clear error messages for users
    - Retry logic for transient failures

---

## Testing Strategy

### Critical Scenarios to Test

1. **Basic Threshold Crossing**
   - Sales below threshold → No nexus
   - Sales above threshold → Nexus established
   - Exact date of crossing is correct

2. **Sticky Nexus**
   - Year 1: Cross threshold → Nexus established
   - Year 2: Below threshold → STILL has nexus (sticky)
   - Year 3: Still below → STILL has nexus

3. **Physical vs Economic**
   - Physical nexus date before economic → Use physical
   - Economic crossing before physical → Use economic
   - Both exist → Type = "both"

4. **Marketplace Facilitator**
   - MF sales included in threshold calculation
   - MF sales excluded from liability calculation
   - State-by-state variations

5. **Lookback Periods**
   - Previous Calendar Year only
   - Current OR Previous Calendar Year
   - Rolling 12 months

6. **Edge Cases**
   - No transactions for state
   - Threshold crossed on Jan 1 (first day of year)
   - Threshold crossed on Dec 31 (last day of year)
   - Multiple years of data
   - Gap years (sales in 2022, 2024 but not 2023)

---

## Dependencies

### Internal
- `interest_calculator.py` - Interest and penalty calculations
- `supabase_client` - Database access

### External
- `datetime` - Date arithmetic
- `decimal.Decimal` - Precise financial calculations
- `dateutil.relativedelta` - Month arithmetic

### Database Tables Read
- `sales_transactions`
- `economic_nexus_thresholds`
- `tax_rates`
- `marketplace_facilitator_rules`
- `interest_penalty_rates`
- `states`
- `physical_nexus`

### Database Tables Written
- `state_results`
- `analyses` (summary update)

---

## Metrics

- **Lines of Code**: 1,168
- **Methods**: 19
- **Complexity**: Very High
- **Test Coverage**: 0% ⚠️
- **TODO Count**: 1 (line 836)
- **Debug Logs**: 4 (lines 693, 746, 749, 756)
- **Longest Method**: `_calculate_calendar_year_lookback()` (180+ lines)
- **Database Queries**: ~10 queries per calculation

---

## Next Steps

1. ✅ Complete this audit
2. ⏸️ Audit `interest_calculator.py` (dependency)
3. ⏸️ Create refactoring plan for nexus calculator
4. ⏸️ Write initial unit tests (TDD approach)
5. ⏸️ Implement Phase 1 refactoring (make testable)

---

*Continue to: `02-api-contracts/` audit*
