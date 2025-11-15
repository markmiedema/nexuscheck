# Schema Synchronization Guide

## The Problem

Our system has 3 layers that must stay in sync:
- Database (PostgreSQL schemas)
- Backend (Python Pydantic models)
- Frontend (TypeScript interfaces)

When they drift, we get runtime errors.

## The Solution

1. **Database is authoritative** - Schema changes start in migrations
2. **Backend validates everything** - All endpoints use `response_model=`
3. **Frontend types match backend** - 1:1 correspondence with Pydantic
4. **Tests catch drift** - Automated validation tests

## Making Schema Changes

### Step 1: Database Migration

```sql
-- Add new column
ALTER TABLE state_results ADD COLUMN new_field FLOAT DEFAULT 0;
```

### Step 2: Update Backend Pydantic Schema

```python
class StateDetailResponse(BaseModel):
    # ... existing fields ...
    new_field: float  # Add new field
```

### Step 3: Update Backend Endpoint

```python
return StateDetailResponse(
    # ... existing fields ...
    new_field=calculated_value  # Return new field
)
```

### Step 4: Update Frontend TypeScript

```typescript
export interface StateDetailResponse {
  // ... existing fields ...
  new_field: number  // Add new field (Python float = TS number)
}
```

### Step 5: Test

```bash
# Backend
cd backend
pytest tests/test_api_contracts.py

# Frontend
cd frontend
npm run type-check
```

### Step 6: Commit

One atomic commit with all 3 layers updated.

## Red Flags

🚩 **Endpoint returns dict instead of Pydantic model** → Schema drift waiting to happen
🚩 **Frontend has .reduce() on backend data** → Duplicate aggregation, remove it
🚩 **TypeScript type has `?` but backend always returns it** → Wrong nullability
🚩 **Backend try/except with fallback aggregation** → Just use the database view
🚩 **Migration adds column but backend not updated** → Incomplete change

## Checklist for Every Schema Change

- [ ] Database migration created
- [ ] Backend Pydantic schema updated
- [ ] Backend endpoint returns Pydantic instance (not dict!)
- [ ] Frontend TypeScript types updated
- [ ] Tests pass (backend + frontend)
- [ ] All 3 layers committed together
