# Phase 2: VDA Mode (Days 3-5)

**Goal:** Implement Voluntary Disclosure Agreement (VDA) scenario modeling with state selection and savings calculation.

**Why This Matters:** This was your favorite feature from the pre-MVP! VDA mode is a HUGE competitive advantage - it shows clients potential savings from voluntary disclosure, making your tool invaluable for tax planning and negotiations.

---

## What is VDA?

**Voluntary Disclosure Agreements** allow businesses to voluntarily report uncollected taxes in exchange for:
- ✅ **Reduced or waived penalties** (most states)
- ✅ **Limited lookback period** (3-4 years vs. unlimited audit)
- ✅ **No criminal liability**
- ✅ **Reduced interest** (some states)

**Business Value:** Clients can model "what if we do VDA with these 5 states?" and see immediate savings potential.

---

## Day 3: Backend VDA Calculator

### Database Migration

**File:** `backend/migrations/add_vda_columns.sql` (NEW)

```sql
-- Add VDA columns to analyses table
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS vda_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vda_selected_states TEXT[];

-- Add VDA calculations to state_results
ALTER TABLE state_results
  ADD COLUMN IF NOT EXISTS vda_penalty_waived DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vda_interest_waived DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vda_total_savings DECIMAL(12,2) DEFAULT 0;

-- Add helpful comments
COMMENT ON COLUMN analyses.vda_enabled IS 'Whether VDA scenario is active for this analysis';
COMMENT ON COLUMN analyses.vda_selected_states IS 'Array of state codes included in VDA';
COMMENT ON COLUMN state_results.vda_penalty_waived IS 'Amount of penalties waived under VDA';
COMMENT ON COLUMN state_results.vda_interest_waived IS 'Amount of interest waived under VDA (rare)';
COMMENT ON COLUMN state_results.vda_total_savings IS 'Total savings from VDA for this state';
```

**Run Migration:**
```bash
# Connect to Supabase and run
psql $SUPABASE_DB_URL < backend/migrations/add_vda_columns.sql
```

---

### Create VDA Calculator Service

**File:** `backend/app/services/vda_calculator.py` (NEW)

```python
"""
VDA (Voluntary Disclosure Agreement) Calculator

Calculates savings from VDA scenarios where states waive penalties
and sometimes reduce interest rates.
"""

import logging
from typing import Dict, List
from decimal import Decimal

logger = logging.getLogger(__name__)


class VDACalculator:
    """
    Calculate VDA scenarios with penalty/interest waivers.
    """

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def calculate_vda_scenario(
        self,
        analysis_id: str,
        selected_states: List[str]
    ) -> Dict:
        """
        Calculate VDA scenario with selected states.

        Args:
            analysis_id: Analysis to calculate VDA for
            selected_states: List of state codes to include in VDA

        Returns:
            Dict with:
            - total_savings: Total amount saved across all states
            - before_vda: Total liability before VDA
            - with_vda: Total liability with VDA
            - state_breakdown: Per-state savings details
        """
        logger.info(f"Calculating VDA for analysis {analysis_id} with {len(selected_states)} states")

        # Get current state results
        state_results = self._get_state_results(analysis_id)

        if not state_results:
            raise ValueError("No state results found for analysis")

        # Calculate VDA for each state
        total_savings = Decimal('0.00')
        before_vda_total = Decimal('0.00')
        state_breakdown = []

        for result in state_results:
            state_code = result['state_code']
            base_tax = Decimal(str(result.get('base_tax', 0)))
            interest = Decimal(str(result.get('interest', 0)))
            penalties = Decimal(str(result.get('penalties', 0)))

            before_total = base_tax + interest + penalties
            before_vda_total += before_total

            # Check if state is in VDA
            if state_code in selected_states:
                # Get VDA rules for state
                vda_rules = self._get_vda_rules(state_code)

                # Calculate waivers
                penalty_waived = penalties if vda_rules.get('penalties_waived', True) else Decimal('0.00')
                interest_waived = interest if vda_rules.get('interest_waived', False) else Decimal('0.00')

                savings = penalty_waived + interest_waived
                total_savings += savings

                after_total = base_tax + (interest - interest_waived) + (penalties - penalty_waived)

                # Update state_results with VDA calculations
                self._update_vda_calculation(analysis_id, state_code, {
                    'vda_penalty_waived': float(penalty_waived),
                    'vda_interest_waived': float(interest_waived),
                    'vda_total_savings': float(savings)
                })

                state_breakdown.append({
                    'state_code': state_code,
                    'state_name': self._get_state_name(state_code),
                    'before_vda': float(before_total),
                    'with_vda': float(after_total),
                    'savings': float(savings),
                    'penalty_waived': float(penalty_waived),
                    'interest_waived': float(interest_waived),
                    'base_tax': float(base_tax),
                    'interest': float(interest),
                    'penalties': float(penalties)
                })
            else:
                # Not in VDA, no savings
                state_breakdown.append({
                    'state_code': state_code,
                    'state_name': self._get_state_name(state_code),
                    'before_vda': float(before_total),
                    'with_vda': float(before_total),
                    'savings': 0,
                    'penalty_waived': 0,
                    'interest_waived': 0,
                    'base_tax': float(base_tax),
                    'interest': float(interest),
                    'penalties': float(penalties)
                })

        with_vda_total = before_vda_total - total_savings

        # Update analyses table
        self._update_analysis_vda(analysis_id, selected_states)

        return {
            'total_savings': float(total_savings),
            'before_vda': float(before_vda_total),
            'with_vda': float(with_vda_total),
            'savings_percentage': float((total_savings / before_vda_total * 100)) if before_vda_total > 0 else 0,
            'state_breakdown': sorted(state_breakdown, key=lambda x: x['savings'], reverse=True)
        }

    def _get_state_results(self, analysis_id: str) -> List[Dict]:
        """Get state results for analysis."""
        response = self.supabase.table('state_results')\
            .select('*')\
            .eq('analysis_id', analysis_id)\
            .execute()

        return response.data

    def _get_vda_rules(self, state_code: str) -> Dict:
        """
        Get VDA rules for a state from vda_programs table.

        Returns:
            Dict with:
            - penalties_waived: Whether penalties are waived (default True)
            - interest_waived: Whether interest is waived (default False)
            - lookback_months: Lookback period in months
        """
        response = self.supabase.table('vda_programs')\
            .select('*')\
            .eq('state_code', state_code)\
            .execute()

        if response.data:
            return {
                'penalties_waived': response.data[0].get('penalties_waived', True),
                'interest_waived': response.data[0].get('interest_waived', False),
                'lookback_months': response.data[0].get('lookback_period_months', 48)
            }

        # Default VDA rules (most common scenario)
        logger.info(f"No VDA rules found for {state_code}, using defaults")
        return {
            'penalties_waived': True,    # Most states waive penalties
            'interest_waived': False,    # Most states do NOT waive interest
            'lookback_months': 48        # 4 years is common
        }

    def _get_state_name(self, state_code: str) -> str:
        """Get full state name from code."""
        state_names = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        }
        return state_names.get(state_code, state_code)

    def _update_vda_calculation(self, analysis_id: str, state_code: str, vda_data: Dict):
        """Update state_results with VDA calculations."""
        self.supabase.table('state_results')\
            .update(vda_data)\
            .eq('analysis_id', analysis_id)\
            .eq('state_code', state_code)\
            .execute()

    def _update_analysis_vda(self, analysis_id: str, selected_states: List[str]):
        """Update analyses table with VDA info."""
        self.supabase.table('analyses')\
            .update({
                'vda_enabled': True,
                'vda_selected_states': selected_states
            })\
            .eq('analysis_id', analysis_id)\
            .execute()

    def disable_vda(self, analysis_id: str):
        """Disable VDA mode and clear calculations."""
        # Clear VDA settings in analyses
        self.supabase.table('analyses')\
            .update({
                'vda_enabled': False,
                'vda_selected_states': []
            })\
            .eq('analysis_id', analysis_id)\
            .execute()

        # Clear VDA calculations from state_results
        self.supabase.table('state_results')\
            .update({
                'vda_penalty_waived': 0,
                'vda_interest_waived': 0,
                'vda_total_savings': 0
            })\
            .eq('analysis_id', analysis_id)\
            .execute()

        logger.info(f"VDA disabled for analysis {analysis_id}")
```

---

### Create VDA API Endpoints

**File:** `backend/app/api/v1/vda.py` (NEW)

```python
"""VDA Scenario API"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.supabase import supabase
from app.services.vda_calculator import VDACalculator

router = APIRouter()


class VDARequest(BaseModel):
    """Request to calculate VDA scenario."""
    selected_states: List[str]


class StateVDABreakdown(BaseModel):
    """Per-state VDA breakdown."""
    state_code: str
    state_name: str
    before_vda: float
    with_vda: float
    savings: float
    penalty_waived: float
    interest_waived: float
    base_tax: float
    interest: float
    penalties: float


class VDAResponse(BaseModel):
    """VDA calculation response."""
    total_savings: float
    before_vda: float
    with_vda: float
    savings_percentage: float
    state_breakdown: List[StateVDABreakdown]


@router.post("/{analysis_id}/vda", response_model=VDAResponse)
async def calculate_vda_scenario(
    analysis_id: str,
    request: VDARequest,
    user_id: str = Depends(get_current_user)
):
    """
    Calculate VDA scenario with selected states.

    VDA (Voluntary Disclosure Agreement) allows businesses to voluntarily
    report uncollected taxes with reduced penalties and limited lookback.

    **Benefits:**
    - Penalties typically waived (most states)
    - Limited lookback (3-4 years vs unlimited)
    - No criminal liability
    - Interest sometimes reduced

    **This endpoint:**
    - Calculates savings for selected states
    - Shows before/after comparison
    - Updates state_results with VDA calculations
    - Marks analysis as VDA-enabled
    """
    # Validate analysis ownership
    analysis_response = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Validate at least one state selected
    if not request.selected_states:
        raise HTTPException(
            status_code=400,
            detail="At least one state must be selected for VDA"
        )

    # Calculate VDA
    calculator = VDACalculator(supabase)
    try:
        results = calculator.calculate_vda_scenario(
            analysis_id,
            request.selected_states
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return VDAResponse(**results)


@router.delete("/{analysis_id}/vda")
async def disable_vda(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Disable VDA mode for analysis.

    Clears:
    - VDA enabled flag
    - Selected states list
    - VDA calculations from state_results
    """
    # Validate ownership
    analysis_response = supabase.table('analyses')\
        .select('*')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Disable VDA
    calculator = VDACalculator(supabase)
    calculator.disable_vda(analysis_id)

    return {"message": "VDA disabled successfully"}


@router.get("/{analysis_id}/vda/status")
async def get_vda_status(
    analysis_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get current VDA status for analysis.

    Returns:
    - vda_enabled: Boolean
    - vda_selected_states: List of state codes
    - total_savings: Current savings amount
    """
    # Validate ownership
    analysis_response = supabase.table('analyses')\
        .select('vda_enabled', 'vda_selected_states')\
        .eq('analysis_id', analysis_id)\
        .eq('user_id', user_id)\
        .execute()

    if not analysis_response.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = analysis_response.data[0]

    # If VDA enabled, get total savings
    total_savings = 0
    if analysis['vda_enabled']:
        savings_response = supabase.table('state_results')\
            .select('vda_total_savings')\
            .eq('analysis_id', analysis_id)\
            .execute()

        total_savings = sum(
            row.get('vda_total_savings', 0)
            for row in savings_response.data
        )

    return {
        'vda_enabled': analysis['vda_enabled'],
        'vda_selected_states': analysis['vda_selected_states'] or [],
        'total_savings': total_savings
    }
```

---

### Register VDA Router

**File:** `backend/app/main.py` (UPDATE)

```python
# Add import
from app.api.v1 import vda

# Add router
app.include_router(
    vda.router,
    prefix="/api/v1/analyses",
    tags=["vda"]
)
```

---

### Day 3 Tasks Checklist

- [ ] Run database migration (add VDA columns)
- [ ] Create `backend/app/services/vda_calculator.py`
- [ ] Create `backend/app/api/v1/vda.py`
- [ ] Update `backend/app/main.py` to register VDA router
- [ ] Test endpoints with Postman/Thunder Client:
  - [ ] POST calculate VDA scenario
  - [ ] GET VDA status
  - [ ] DELETE disable VDA
- [ ] Test VDA calculations:
  - [ ] Select all states → verify savings
  - [ ] Select top 3 → verify partial savings
  - [ ] Select none → verify no savings
  - [ ] Disable VDA → verify calculations cleared
- [ ] Verify VDA rules query from database works
- [ ] Test with states that have/don't have VDA programs

---

## Days 4-5: Frontend VDA UI

### Create VDA Hook

**File:** `frontend/hooks/useVDAMode.ts` (NEW)

```typescript
import { useState, useMemo, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { toast } from '@/hooks/use-toast'

export interface StateResult {
  state_code: string
  state_name: string
  estimated_liability: number
  base_tax: number
  interest: number
  penalties: number
  nexus_status?: string
}

export interface VDAStateBreakdown {
  state_code: string
  state_name: string
  before_vda: number
  with_vda: number
  savings: number
  penalty_waived: number
  interest_waived: number
  base_tax: number
  interest: number
  penalties: number
}

export interface VDAResults {
  total_savings: number
  before_vda: number
  with_vda: number
  savings_percentage: number
  state_breakdown: VDAStateBreakdown[]
}

export function useVDAMode(analysisId: string, stateResults: StateResult[]) {
  const [vdaEnabled, setVdaEnabled] = useState(false)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [vdaResults, setVdaResults] = useState<VDAResults | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(true)

  // ENHANCEMENT: Interactive UI state (from reference implementation)
  const [vdaScopeOpen, setVdaScopeOpen] = useState(false)  // State selector panel open/closed
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())  // Hidden pie chart slices
  const [hover, setHover] = useState<any>(null)  // Pie chart hover state
  const [openTopKey, setOpenTopKey] = useState<string | null>(null)  // Expanded section in breakdown

  // Load VDA status on mount
  useEffect(() => {
    loadVDAStatus()
  }, [analysisId])

  const loadVDAStatus = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/analyses/${analysisId}/vda/status`)
      setVdaEnabled(response.data.vda_enabled)
      setSelectedStates(response.data.vda_selected_states)

      // If VDA is enabled, recalculate to get results
      if (response.data.vda_enabled && response.data.vda_selected_states.length > 0) {
        await calculateVDA(response.data.vda_selected_states)
      }
    } catch (error) {
      console.error('Failed to load VDA status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate VDA scenario
  const calculateVDA = async (states?: string[]) => {
    const statesToUse = states || selectedStates

    if (statesToUse.length === 0) {
      toast({
        title: 'No States Selected',
        description: 'Please select at least one state for VDA',
        variant: 'destructive'
      })
      return
    }

    try {
      setCalculating(true)
      const response = await apiClient.post(`/api/v1/analyses/${analysisId}/vda`, {
        selected_states: statesToUse
      })
      setVdaResults(response.data)
      setVdaEnabled(true)

      toast({
        title: 'VDA Calculated',
        description: `Total savings: $${response.data.total_savings.toLocaleString()}`
      })
    } catch (error: any) {
      console.error('Failed to calculate VDA:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to calculate VDA',
        variant: 'destructive'
      })
      throw error
    } finally {
      setCalculating(false)
    }
  }

  // Disable VDA
  const disableVDA = async () => {
    try {
      await apiClient.delete(`/api/v1/analyses/${analysisId}/vda`)
      setVdaEnabled(false)
      setSelectedStates([])
      setVdaResults(null)

      toast({
        title: 'VDA Disabled',
        description: 'VDA mode has been disabled'
      })
    } catch (error: any) {
      console.error('Failed to disable VDA:', error)
      toast({
        title: 'Error',
        description: 'Failed to disable VDA',
        variant: 'destructive'
      })
      throw error
    }
  }

  // Preset selections
  const selectAll = () => {
    const allStates = stateResults
      .filter(s => s.estimated_liability > 0)
      .map(s => s.state_code)
    setSelectedStates(allStates)
  }

  const selectNone = () => {
    setSelectedStates([])
  }

  const selectTopN = (n: number) => {
    const topStates = [...stateResults]
      .sort((a, b) => b.estimated_liability - a.estimated_liability)
      .slice(0, n)
      .map(s => s.state_code)
    setSelectedStates(topStates)
  }

  const toggleState = (stateCode: string) => {
    setSelectedStates(prev =>
      prev.includes(stateCode)
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
    )
  }

  // ENHANCEMENT: Interactive legend helpers
  const toggleLegendKey = (key: string) => {
    setHiddenKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isLegendKeyHidden = (key: string) => hiddenKeys.has(key)

  // ENHANCEMENT: Top section expander
  const toggleTopKey = (key: string) => {
    setOpenTopKey(prev => prev === key ? null : key)
  }

  // Pie chart data for exposure breakdown
  const pieData = useMemo(() => {
    if (!vdaResults) return null

    return [
      {
        name: 'Base Tax',
        value: vdaResults.state_breakdown.reduce((sum, s) => sum + s.base_tax, 0),
        color: '#3b82f6',  // blue
        percentage: 0
      },
      {
        name: 'Interest',
        value: vdaResults.state_breakdown.reduce((sum, s) => sum + s.interest, 0) -
               vdaResults.state_breakdown.reduce((sum, s) => sum + s.interest_waived, 0),
        color: '#f59e0b',  // amber
        percentage: 0
      },
      {
        name: 'Penalties',
        value: vdaResults.state_breakdown.reduce((sum, s) => sum + s.penalties, 0) -
               vdaResults.state_breakdown.reduce((sum, s) => sum + s.penalty_waived, 0),
        color: '#ef4444',  // red
        percentage: 0
      }
    ]
      .filter(item => item.value > 0)
      .filter(item => !hiddenKeys.has(item.name))  // ENHANCEMENT: Filter by hidden keys
      .map(item => ({
        ...item,
        percentage: (item.value / vdaResults.with_vda) * 100
      }))
  }, [vdaResults, hiddenKeys])  // ENHANCEMENT: Include hiddenKeys dependency

  // Top states by liability
  const topStatesByLiability = useMemo(() => {
    return [...stateResults]
      .filter(s => s.estimated_liability > 0)
      .sort((a, b) => b.estimated_liability - a.estimated_liability)
      .slice(0, 10)
  }, [stateResults])

  // States with nexus (eligible for VDA)
  const statesWithNexus = useMemo(() => {
    return stateResults.filter(s =>
      s.nexus_status === 'has_nexus' || s.estimated_liability > 0
    )
  }, [stateResults])

  return {
    // Core VDA state
    vdaEnabled,
    setVdaEnabled,
    selectedStates,
    setSelectedStates,
    vdaResults,
    calculating,
    loading,

    // VDA actions
    calculateVDA,
    disableVDA,
    selectAll,
    selectNone,
    selectTopN,
    toggleState,

    // Computed data
    pieData,
    topStatesByLiability,
    statesWithNexus,

    // ENHANCEMENT: Interactive UI state (from reference - 21 total return values)
    vdaScopeOpen,
    setVdaScopeOpen,
    hiddenKeys,
    setHiddenKeys,
    toggleLegendKey,
    isLegendKeyHidden,
    hover,
    setHover,
    openTopKey,
    toggleTopKey
  }
}
```

---

### ENHANCEMENT: Interactive Features Usage

**Using the enhanced hook in components:**

```tsx
// In VDAModePanel.tsx
const {
  vdaEnabled,
  calculateVDA,
  vdaScopeOpen,
  setVdaScopeOpen,
  pieData,
  hiddenKeys,
  toggleLegendKey,
  hover,
  setHover,
  openTopKey,
  toggleTopKey
} = useVDAMode(analysisId, stateResults)

// State selector panel toggle
<Button onClick={() => setVdaScopeOpen(!vdaScopeOpen)}>
  {vdaScopeOpen ? 'Hide' : 'Show'} State Selector
</Button>

// Interactive legend (click to hide/show pie slices)
<div className="flex gap-2">
  {['Base Tax', 'Interest', 'Penalties'].map(key => (
    <button
      key={key}
      onClick={() => toggleLegendKey(key)}
      className={cn(
        "flex items-center gap-2",
        hiddenKeys.has(key) && "opacity-50 line-through"
      )}
    >
      <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(key) }} />
      <span>{key}</span>
    </button>
  ))}
</div>

// Interactive pie chart with hover
<PieChart>
  <Pie
    data={pieData}
    onMouseEnter={(data) => setHover(data)}
    onMouseLeave={() => setHover(null)}
  />
</PieChart>

// Expandable state breakdown sections
<div>
  {vdaResults?.state_breakdown.slice(0, 5).map(state => (
    <div key={state.state_code}>
      <button onClick={() => toggleTopKey(state.state_code)}>
        {state.state_name}
        {openTopKey === state.state_code ? '▼' : '▶'}
      </button>
      {openTopKey === state.state_code && (
        <div className="pl-4">
          {/* Expanded details */}
        </div>
      )}
    </div>
  ))}
</div>
```

**Benefits of these enhancements:**
1. **Legend hiding** - Users can focus on specific liability components
2. **Hover states** - Better data exploration on pie chart
3. **Expandable sections** - Cleaner UI for top states breakdown
4. **Panel toggles** - More flexible layout control

---

### Day 4-5 Tasks Preview

The frontend implementation continues with:
- **VDAModePanel** component (main UI container)
- **VDAStateSelector** component (state selection UI with collapsible panel)
- **VDASavingsComparison** component (before/after display)
- **VDAExposurePieChart** component (Recharts visualization with interactive legend)
- **ExpandableStateBreakdown** component (top states with expand/collapse)
- Integration with results page
- Testing checklist

**ENHANCEMENT NOTE:** The interactive features (legend hiding, hover states, expandable sections) are optional but significantly improve UX. Implement basic functionality first, then add enhancements during testing/polish phase if time permits.

---

**Next:** Proceed to **03-column-detection-exempt-sales.md** for Days 6-8 implementation.
