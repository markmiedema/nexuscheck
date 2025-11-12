# Phase 1: Physical Nexus UI (Days 1-2) ✅ COMPLETE

**Goal:** Enable users to manually add, edit, and delete physical nexus states with import/export functionality.

**Why This Matters:** Current project has the database table and backend infrastructure, but NO frontend UI. This is a critical gap - users can't specify physical presence (offices, warehouses, employees) which affects nexus determination dates.

**Status:** ✅ Both backend and frontend implementation complete!

---

## Current Status

- ✅ Database table exists (`physical_nexus`)
- ✅ Backend has Supabase integration
- ✅ **API endpoints created (7 total)** ✅
- ✅ **Frontend UI complete** ✅

**Completion Reports:**
- See **DAY-1-COMPLETE.md** for backend details
- See **DAY-2-COMPLETE.md** for frontend details

---

## Day 1: Backend Implementation

### Create API Router

**File:** `backend/app/api/v1/physical_nexus.py` (NEW)

```python
"""
Physical Nexus Management API
Allows users to manually specify physical presence in states.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.schemas.physical_nexus import (
    PhysicalNexusCreate,
    PhysicalNexusUpdate,
    PhysicalNexusResponse
)

router = APIRouter()


@router.post("/{analysis_id}/physical-nexus", response_model=PhysicalNexusResponse)
async def create_physical_nexus(
    analysis_id: str,
    data: PhysicalNexusCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Add physical nexus for a state.

    - Validates state code exists
    - Validates dates are valid
    - Prevents duplicates
    """
    # Validate analysis ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Check for duplicate
    existing = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', data.state_code)\
        .execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail=f"Physical nexus already exists for {data.state_code}"
        )

    # Insert
    result = supabase.table('physical_nexus').insert({
        'analysis_id': analysis_id,
        'state_code': data.state_code.upper(),
        'nexus_date': data.nexus_date.isoformat(),
        'reason': data.reason,
        'registration_date': data.registration_date.isoformat() if data.registration_date else None,
        'permit_number': data.permit_number,
        'notes': data.notes,
        'created_at': datetime.utcnow().isoformat()
    }).execute()

    return PhysicalNexusResponse(**result.data[0])


@router.get("/{analysis_id}/physical-nexus", response_model=List[PhysicalNexusResponse])
async def list_physical_nexus(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get all physical nexus entries for an analysis."""
    # Validate ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .order('state_code')\
        .execute()

    return [PhysicalNexusResponse(**row) for row in result.data]


@router.patch("/{analysis_id}/physical-nexus/{state_code}", response_model=PhysicalNexusResponse)
async def update_physical_nexus(
    analysis_id: str,
    state_code: str,
    data: PhysicalNexusUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update physical nexus for a state."""
    # Validate ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Build update dict (only include non-None values)
    update_data = {}
    if data.nexus_date is not None:
        update_data['nexus_date'] = data.nexus_date.isoformat()
    if data.reason is not None:
        update_data['reason'] = data.reason
    if data.registration_date is not None:
        update_data['registration_date'] = data.registration_date.isoformat()
    if data.permit_number is not None:
        update_data['permit_number'] = data.permit_number
    if data.notes is not None:
        update_data['notes'] = data.notes

    # Update
    result = supabase.table('physical_nexus')\
        .update(update_data)\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"Physical nexus not found for {state_code}"
        )

    return PhysicalNexusResponse(**result.data[0])


@router.delete("/{analysis_id}/physical-nexus/{state_code}")
async def delete_physical_nexus(
    analysis_id: str,
    state_code: str,
    user_id: str = Depends(get_current_user)
):
    """Delete physical nexus for a state."""
    # Validate ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = supabase.table('physical_nexus')\
        .delete()\
        .eq('analysis_id', analysis_id)\
        .eq('state_code', state_code.upper())\
        .execute()

    return {"message": f"Physical nexus deleted for {state_code}"}


@router.post("/{analysis_id}/physical-nexus/import")
async def import_physical_nexus(
    analysis_id: str,
    config: dict,
    user_id: str = Depends(get_current_user)
):
    """
    Import physical nexus configuration from JSON.

    Expected format:
    {
        "CA": {
            "nexus_date": "2020-06-01",
            "reason": "office",
            "registration_date": "2020-06-15",
            "permit_number": "SR-CA-123456",
            "notes": "San Francisco office"
        },
        "NY": { ... }
    }
    """
    # Validate ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    imported_count = 0
    updated_count = 0
    errors = []

    for state_code, data in config.items():
        try:
            state_code = state_code.upper()

            # Check if exists
            existing = supabase.table('physical_nexus')\
                .select('*')\
                .eq('analysis_id', analysis_id)\
                .eq('state_code', state_code)\
                .execute()

            if existing.data:
                # Update existing
                supabase.table('physical_nexus')\
                    .update(data)\
                    .eq('analysis_id', analysis_id)\
                    .eq('state_code', state_code)\
                    .execute()
                updated_count += 1
            else:
                # Insert new
                supabase.table('physical_nexus').insert({
                    'analysis_id': analysis_id,
                    'state_code': state_code,
                    **data
                }).execute()
                imported_count += 1

        except Exception as e:
            errors.append(f"{state_code}: {str(e)}")

    return {
        "imported_count": imported_count,
        "updated_count": updated_count,
        "errors": errors
    }


@router.get("/{analysis_id}/physical-nexus/export")
async def export_physical_nexus(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """Export physical nexus configuration as JSON."""
    # Validate ownership
    analysis = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = supabase.table('physical_nexus')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .execute()

    # Format as {state_code: {data}}
    config = {}
    for row in result.data:
        state_code = row.pop('state_code')
        # Remove internal fields
        row.pop('analysis_id', None)
        row.pop('created_at', None)
        config[state_code] = row

    return config
```

---

### Create Pydantic Schemas

**File:** `backend/app/schemas/physical_nexus.py` (NEW)

```python
"""Pydantic schemas for Physical Nexus API"""
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional


class PhysicalNexusCreate(BaseModel):
    state_code: str = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Two-letter state code (e.g., CA, NY)"
    )
    nexus_date: date = Field(
        ...,
        description="Date physical nexus was established"
    )
    reason: str = Field(
        ...,
        description="Reason for physical nexus"
    )
    registration_date: Optional[date] = Field(
        None,
        description="Date registered with state (if applicable)"
    )
    permit_number: Optional[str] = Field(
        None,
        max_length=50,
        description="State tax permit/registration number"
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Additional notes"
    )

    @field_validator('state_code')
    @classmethod
    def validate_state_code(cls, v: str) -> str:
        """Ensure state code is uppercase and valid."""
        v = v.upper().strip()

        # Valid US state codes
        valid_states = {
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
        }

        if v not in valid_states:
            raise ValueError(f"Invalid state code: {v}")

        return v

    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v: str) -> str:
        """Ensure reason is one of valid options."""
        valid_reasons = {
            'office', 'warehouse', 'employees', 'inventory',
            'trade_show', 'sales_rep', 'affiliate', 'other'
        }

        if v.lower() not in valid_reasons:
            raise ValueError(
                f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"
            )

        return v.lower()


class PhysicalNexusUpdate(BaseModel):
    """Update schema - all fields optional."""
    nexus_date: Optional[date] = None
    reason: Optional[str] = None
    registration_date: Optional[date] = None
    permit_number: Optional[str] = None
    notes: Optional[str] = None


class PhysicalNexusResponse(BaseModel):
    """Response schema with all fields."""
    analysis_id: str
    state_code: str
    nexus_date: date
    reason: str
    registration_date: Optional[date]
    permit_number: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
```

---

### ENHANCEMENT: Add Recalculation Endpoint (Optional)

**File:** `backend/app/api/v1/analyses.py` (UPDATE)

Add endpoint to trigger analysis recalculation when physical nexus changes:

```python
from app.services.nexus_calculator_v2 import NexusCalculatorV2

@router.post("/{analysis_id}/recalculate")
async def recalculate_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Recalculate analysis results after physical nexus changes.

    This endpoint:
    1. Re-runs nexus calculator with updated physical nexus data
    2. Updates state_results table
    3. Returns summary of changes

    ENHANCEMENT from reference implementation: Physical nexus changes
    should immediately update results without requiring page refresh.
    """
    # Validate ownership
    analysis_response = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = analysis_response.data[0]

    try:
        # Get transaction data
        transactions_response = supabase.table('transactions')\
            .select('*')\
            .eq('analysis_id', analysis_id)\
            .execute()

        if not transactions_response.data:
            raise HTTPException(
                status_code=400,
                detail="No transaction data found for recalculation"
            )

        # Re-run calculator
        calculator = NexusCalculatorV2(supabase)
        results = calculator.calculate_nexus_multi_year(
            transactions=transactions_response.data,
            analysis_id=analysis_id,
            method=analysis.get('calculation_method', 'calendar_year')
        )

        return {
            "message": "Analysis recalculated successfully",
            "states_updated": len(results),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Recalculation failed for {analysis_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Recalculation failed: {str(e)}"
        )
```

**Alternative Approach (Simpler):**

Instead of a dedicated endpoint, modify physical nexus endpoints to automatically trigger recalculation:

```python
# In POST /physical-nexus endpoint, after creating:
await recalculate_analysis_internal(analysis_id)

# In PATCH /physical-nexus/{state_code}, after updating:
await recalculate_analysis_internal(analysis_id)

# In DELETE /physical-nexus/{state_code}, after deleting:
await recalculate_analysis_internal(analysis_id)
```

**Implementation Priority:**
- **Low** - Works fine with manual refresh for MVP
- **Medium** - Nice UX improvement for Sprint 1
- **High** - Critical if users expect real-time updates

---

### Register Router

**File:** `backend/app/main.py` (UPDATE)

```python
# Add import
from app.api.v1 import analyses, physical_nexus

# Add router (after analyses router)
app.include_router(
    physical_nexus.router,
    prefix="/api/v1/analyses",
    tags=["physical_nexus"]
)
```

---

### Day 1 Tasks Checklist ✅ COMPLETE

- [x] Create `backend/app/api/v1/physical_nexus.py` ✅
- [x] Create `backend/app/schemas/physical_nexus.py` ✅
- [x] Update `backend/app/main.py` to register router ✅
- [x] Test endpoints with Postman/Thunder Client: ✅
  - [x] POST create physical nexus ✅
  - [x] GET list physical nexus ✅
  - [x] PATCH update physical nexus ✅
  - [x] DELETE delete physical nexus ✅
  - [x] POST import configuration ✅
  - [x] GET export configuration ✅
- [x] Add recalculation endpoint (enhancement) ✅
- [x] Verify RLS policies enforce user ownership ✅
- [x] Test error cases (duplicate states, invalid state codes, etc.) ✅

**See DAY-1-COMPLETE.md for detailed backend implementation report.**

---

## Day 2: Frontend Implementation ✅ COMPLETE

### Create Custom Hook ✅

**File:** `frontend/hooks/usePhysicalNexusConfig.ts` (NEW)

```typescript
import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'

export interface PhysicalNexusConfig {
  state_code: string
  nexus_date: string
  reason: string
  registration_date?: string
  permit_number?: string
  notes?: string
}

export interface PhysicalNexusFormData {
  state_code: string
  nexus_date: Date
  reason: string
  registration_date?: Date
  permit_number?: string
  notes?: string
}

export function usePhysicalNexusConfig(analysisId: string) {
  const [configs, setConfigs] = useState<PhysicalNexusConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingState, setEditingState] = useState<string | null>(null)
  const [formData, setFormData] = useState<PhysicalNexusFormData | null>(null)

  // Load configs on mount
  useEffect(() => {
    loadConfigs()
  }, [analysisId])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(
        `/api/v1/analyses/${analysisId}/physical-nexus`
      )
      setConfigs(response.data)
    } catch (error: any) {
      console.error('Failed to load physical nexus configs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load physical nexus configurations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addOrUpdateNexus = async (data: PhysicalNexusFormData) => {
    try {
      const payload = {
        state_code: data.state_code,
        nexus_date: data.nexus_date.toISOString().split('T')[0],
        reason: data.reason,
        registration_date: data.registration_date
          ? data.registration_date.toISOString().split('T')[0]
          : null,
        permit_number: data.permit_number || null,
        notes: data.notes || null
      }

      if (editingState) {
        // Update existing
        await apiClient.patch(
          `/api/v1/analyses/${analysisId}/physical-nexus/${editingState}`,
          payload
        )
        toast({
          title: 'Success',
          description: `Physical nexus updated for ${editingState}`
        })
      } else {
        // Create new
        await apiClient.post(
          `/api/v1/analyses/${analysisId}/physical-nexus`,
          payload
        )
        toast({
          title: 'Success',
          description: `Physical nexus added for ${data.state_code}`
        })
      }

      await loadConfigs()
      cancelForm()

      // ENHANCEMENT: Trigger analysis recalculation (from reference implementation)
      // Physical nexus changes should update state results immediately
      await triggerRecalculation()
    } catch (error: any) {
      console.error('Failed to save physical nexus:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save physical nexus',
        variant: 'destructive'
      })
      throw error
    }
  }

  const editNexus = (stateCode: string) => {
    const config = configs.find(c => c.state_code === stateCode)
    if (config) {
      setFormData({
        state_code: config.state_code,
        nexus_date: new Date(config.nexus_date),
        reason: config.reason,
        registration_date: config.registration_date
          ? new Date(config.registration_date)
          : undefined,
        permit_number: config.permit_number,
        notes: config.notes
      })
      setEditingState(stateCode)
      setShowForm(true)
    }
  }

  const deleteNexus = async (stateCode: string) => {
    if (!confirm(`Delete physical nexus for ${stateCode}?`)) return

    try {
      await apiClient.delete(
        `/api/v1/analyses/${analysisId}/physical-nexus/${stateCode}`
      )
      toast({
        title: 'Success',
        description: `Physical nexus deleted for ${stateCode}`
      })
      await loadConfigs()

      // ENHANCEMENT: Trigger recalculation after deletion
      await triggerRecalculation()
    } catch (error: any) {
      console.error('Failed to delete physical nexus:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete physical nexus',
        variant: 'destructive'
      })
      throw error
    }
  }

  const exportConfig = async () => {
    try {
      const response = await apiClient.get(
        `/api/v1/analyses/${analysisId}/physical-nexus/export`
      )

      // Download as JSON file
      const blob = new Blob(
        [JSON.stringify(response.data, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `physical-nexus-${analysisId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Configuration exported successfully'
      })
    } catch (error: any) {
      console.error('Failed to export config:', error)
      toast({
        title: 'Error',
        description: 'Failed to export configuration',
        variant: 'destructive'
      })
      throw error
    }
  }

  const importConfig = async (file: File) => {
    try {
      const text = await file.text()
      const config = JSON.parse(text)

      const response = await apiClient.post(
        `/api/v1/analyses/${analysisId}/physical-nexus/import`,
        config
      )

      await loadConfigs()

      toast({
        title: 'Success',
        description: `Imported ${response.data.imported_count} states, updated ${response.data.updated_count} states`
      })

      // ENHANCEMENT: Trigger recalculation after import
      await triggerRecalculation()

      if (response.data.errors.length > 0) {
        console.error('Import errors:', response.data.errors)
        toast({
          title: 'Warning',
          description: `${response.data.errors.length} states had errors`,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Failed to import config:', error)
      toast({
        title: 'Error',
        description: 'Failed to import configuration. Check file format.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingState(null)
    setFormData(null)
  }

  // ENHANCEMENT: Trigger analysis recalculation (from reference implementation)
  const triggerRecalculation = async () => {
    try {
      // Option 1: Dedicated recalculation endpoint
      await apiClient.post(`/api/v1/analyses/${analysisId}/recalculate`)

      // Option 2: Simple flag update (backend recalculates on next fetch)
      // await apiClient.patch(`/api/v1/analyses/${analysisId}`, { needs_recalculation: true })

      // Option 3: Full re-run of nexus calculator
      // await apiClient.post(`/api/v1/analyses/${analysisId}/calculate-nexus`)

      console.log('Analysis recalculation triggered')
    } catch (error: any) {
      // Non-critical - log but don't fail the operation
      console.warn('Failed to trigger recalculation:', error)
      // Optionally show toast notification
      // toast({
      //   title: 'Note',
      //   description: 'Physical nexus saved. Refresh page to see updated results.',
      //   variant: 'default'
      // })
    }
  }

  return {
    configs,
    loading,
    showForm,
    setShowForm,
    editingState,
    formData,
    addOrUpdateNexus,
    editNexus,
    deleteNexus,
    exportConfig,
    importConfig,
    cancelForm,
    triggerRecalculation  // ENHANCEMENT: Expose for manual use if needed
  }
}
```

[Continued in next file due to length...]

---

### Day 2 Tasks Checklist ✅ COMPLETE

- [x] Create `frontend/hooks/usePhysicalNexusConfig.ts` ✅
- [x] Create `frontend/components/analysis/PhysicalNexusManager.tsx` ✅
- [x] Create `frontend/components/analysis/PhysicalNexusForm.tsx` ✅
- [x] Integrate with results page ✅
- [x] Test end-to-end flow ✅

**Components Created:**
- **usePhysicalNexusConfig** (262 lines) - Custom React hook with all CRUD operations
- **PhysicalNexusManager** (183 lines) - Table display with action buttons
- **PhysicalNexusForm** (331 lines) - Modal form with validation
- **Total:** 780 lines of frontend code

**See DAY-2-COMPLETE.md for detailed frontend implementation report.**

---

## 🎉 Days 1-2 Complete!

**What Was Built:**
- ✅ Backend: 604 lines (7 endpoints, schemas, validation)
- ✅ Frontend: 780 lines (3 components, full UI)
- ✅ **Total: 1,384 lines of production code**

**Features Delivered:**
- Full CRUD operations for physical nexus
- Import/Export JSON configuration
- Auto-recalculation after changes (enhancement)
- Type-safe TypeScript throughout
- Comprehensive error handling

**Documentation Created:**
- DAY-1-COMPLETE.md - Backend summary with API docs
- DAY-2-COMPLETE.md - Frontend summary with testing guide

---

**Next:** Proceed to **02-vda-mode.md** for Days 3-5 (VDA Mode implementation)
