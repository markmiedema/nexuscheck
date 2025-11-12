# State Rules Schema - Addendum (Error Handling Integration)

**Date:** 2025-11-02  
**Purpose:** Cross-reference error handling for state rules queries  
**Related:** See `data-model-specification-UPDATED.md` Section 8 for full error handling spec

---

## Integration with Error Handling System

The state rules database queries can fail for various reasons. This addendum documents how state rules errors are tracked and handled.

---

## Error Scenarios for State Rules

### 1. Missing State Rules
```python
# Query for state that isn't in database yet
try:
    rules = get_state_rules('WY')  # Wyoming not in MVP top 10
except StateRulesNotFound:
    # Log error
    log_error(
        error_type='processing',
        error_message=f'State rules not available for WY',
        context={'state': 'WY', 'available_states': TOP_10_STATES}
    )
    
    # Handle gracefully
    return {
        'state': 'WY',
        'rules_available': False,
        'message': 'Manual analysis required for this state'
    }
```

### 2. Database Query Failure
```python
# Supabase connection timeout
try:
    rules = supabase.table('economic_nexus_thresholds') \
        .select('*') \
        .eq('state', 'CA') \
        .execute()
except Exception as e:
    # Log infrastructure error
    log_error(
        error_type='infrastructure',
        error_message='State rules query failed',
        stack_trace=str(e),
        context={'state': 'CA', 'table': 'economic_nexus_thresholds'}
    )
    
    # Retry with backoff (see data model Section 8.5)
    rules = await retry_with_backoff(
        lambda: get_state_rules('CA'),
        max_retries=3
    )
```

### 3. Incomplete Rules Data
```python
# State has threshold but missing tax rate
rules = get_complete_state_rules('TX')

if rules.tax_rate is None:
    # Log warning
    log_error(
        error_type='processing',
        error_message='Tax rate missing for state',
        context={'state': 'TX', 'has_threshold': True, 'has_rate': False}
    )
    
    # Use graceful degradation
    rules.tax_rate = 0.0825  # Use national average, flag it
    rules.notes = 'Tax rate unavailable - used national average'
```

---

## State Rules Error Types

Add these to `error_logs.error_type` enum:

```sql
-- In addition to validation/processing/pdf_generation/infrastructure
'state_rules_missing'       -- State not in database
'state_rules_incomplete'    -- State has partial data
'state_rules_query_failed'  -- Database query error
```

---

## Graceful Degradation Strategy

### Priority Levels for State Rules:

**Critical (Must Have):**
- Economic nexus threshold
- Marketplace facilitator law status

**Important (Should Have):**
- Tax rates (can use defaults if missing)
- Interest/penalty rates (can estimate)

**Nice to Have (Can Skip):**
- VDA information
- Historical thresholds

### Fallback Values:

```python
FALLBACK_VALUES = {
    'tax_rate': 0.0825,  # National average combined rate
    'interest_rate': 0.05,  # 5% annual (conservative)
    'penalty_rate': 0.10,  # 10% (common estimate)
}

def get_state_rules_with_fallback(state: str) -> StateRules:
    """Get state rules with fallback values if incomplete"""
    
    rules = get_state_rules(state)
    flags = []
    
    if rules.tax_rate is None:
        rules.tax_rate = FALLBACK_VALUES['tax_rate']
        flags.append(f'{state}: Using default tax rate')
    
    if rules.interest_rate is None:
        rules.interest_rate = FALLBACK_VALUES['interest_rate']
        flags.append(f'{state}: Using default interest rate')
    
    # Add flags to report
    rules.warnings = flags
    
    return rules
```

---

## State Rules Query Logging

### Success Logging (optional, for analytics):
```python
log_audit_event(
    action='state_rules_queried',
    resource_type='state_rules',
    notes=f'Successfully retrieved rules for {state}'
)
```

### Failure Logging (required):
```python
log_error(
    error_type='state_rules_query_failed',
    error_message=f'Could not retrieve rules for {state}',
    context={
        'state': state,
        'available_in_db': state in IMPLEMENTED_STATES,
        'retry_attempted': True
    }
)
```

---

## Report Warnings Section

When state rules are incomplete or unavailable, include in report:

```markdown
## Warnings & Limitations

âš ï¸ **State Rules Limitations:**

- **Wyoming (WY):** State rules not available in system. Manual analysis required.
- **California (CA):** Interest rate unavailable. Used default 5% estimate.
- **Texas (TX):** Average local rate estimated. Exact rates may vary by jurisdiction.

**Recommendation:** Verify these states manually before filing.
```

---

## Monitoring & Alerts

### Dashboard Metrics:
- State rules query success rate (per state)
- Most common missing rules
- Fallback usage frequency

### Alerts:
- Email if same state fails 5+ times in 1 hour
- Alert if critical rules missing for top 10 states
- Weekly report of fallback usage

---

## Cross-References

**Full error handling specification:**  
â†’ See `data-model-specification-UPDATED.md` Section 8

**State rules database schema:**  
â†’ See `state-rules-schema.md` (original document)

**Error logging table:**  
â†’ See `data-model-specification-UPDATED.md` Section 8.2

**Retry logic:**  
â†’ See `data-model-specification-UPDATED.md` Section 8.5

---

## Implementation Checklist

When implementing state rules queries:

- [ ] Wrap all queries in try/catch
- [ ] Log failures to error_logs table
- [ ] Implement retry with exponential backoff
- [ ] Use fallback values for non-critical data
- [ ] Flag missing/incomplete rules in report
- [ ] Track which states cause most errors
- [ ] Set up monitoring dashboard

---

**Status:** Ready for implementation  
**Priority:** Implement alongside error handling system  
**Blockers:** None
