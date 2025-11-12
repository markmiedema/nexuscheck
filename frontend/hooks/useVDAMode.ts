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
    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      loadVDAStatus()
    }, 100)
    return () => clearTimeout(timer)
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
    } catch (error: any) {
      console.error('Failed to load VDA status:', error)
      // If not authenticated, fail silently - user will be redirected by ProtectedRoute
      if (error?.status !== 401) {
        console.error('VDA status load error details:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate VDA scenario
  const calculateVDA = async (states?: string[]) => {
    const statesToUse = states || selectedStates
    console.log('[VDA] calculateVDA called with:', { states, selectedStates, statesToUse })

    if (statesToUse.length === 0) {
      console.log('[VDA] No states selected, showing error')
      toast({
        title: 'No States Selected',
        description: 'Please select at least one state for VDA',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('[VDA] Starting calculation...')
      setCalculating(true)
      const response = await apiClient.post(`/api/v1/analyses/${analysisId}/vda`, {
        selected_states: statesToUse
      })
      console.log('[VDA] Response received:', response.data)
      setVdaResults(response.data)
      setVdaEnabled(true)

      toast({
        title: 'VDA Calculated',
        description: `Total savings: $${response.data.total_savings.toLocaleString()}`
      })
    } catch (error: any) {
      console.error('[VDA] Failed to calculate VDA:', error)
      console.error('[VDA] Error response:', error.response)
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
    console.log('[VDA] toggleState called with:', stateCode)
    setSelectedStates(prev => {
      const newSelection = prev.includes(stateCode)
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
      console.log('[VDA] New selected states:', newSelection)
      return newSelection
    })
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
