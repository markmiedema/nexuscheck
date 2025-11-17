'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator } from 'lucide-react'
import { useVDAMode, StateResult } from '@/hooks/useVDAMode'
import { VDAInitialState } from './VDAInitialState'
import { VDAResults } from './VDAResults'
import { VDAStateSelector } from './VDAStateSelector'

interface VDAModePanelProps {
  analysisId: string
  stateResults: StateResult[]
}

export function VDAModePanel({ analysisId, stateResults }: VDAModePanelProps) {
  const {
    vdaEnabled,
    selectedStates,
    vdaResults,
    calculating,
    loading,
    calculateVDA,
    disableVDA,
    selectAll,
    selectNone,
    selectTopN,
    toggleState,
    pieData,
    topStatesByLiability,
    statesWithNexus,
    vdaScopeOpen,
    setVdaScopeOpen,
    toggleLegendKey,
    isLegendKeyHidden,
    hover,
    setHover
  } = useVDAMode(analysisId, stateResults)

  // Callbacks for child components
  const handleEnableVDA = useCallback(() => {
    setVdaScopeOpen(true)
  }, [setVdaScopeOpen])

  const handleChangeStates = useCallback(() => {
    setVdaScopeOpen(true)
  }, [setVdaScopeOpen])

  const handleCalculateVDA = useCallback(async () => {
    await calculateVDA()
    setVdaScopeOpen(false)
  }, [calculateVDA, setVdaScopeOpen])

  const handleCancelSelector = useCallback(() => {
    setVdaScopeOpen(false)
  }, [setVdaScopeOpen])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-4 text-muted-foreground">Loading VDA status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              VDA Mode - Voluntary Disclosure Agreement
            </CardTitle>
            <CardDescription className="mt-2">
              Model potential savings from voluntary disclosure. VDA typically waives penalties
              and limits lookback period to 3-4 years.
            </CardDescription>
          </div>
          {vdaEnabled && (
            <Badge variant="outline" className="bg-info/10 text-info-foreground border-info/20">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!vdaEnabled ? (
          <VDAInitialState onEnable={handleEnableVDA} />
        ) : (
          <VDAResults
            vdaResults={vdaResults}
            onChangeStates={handleChangeStates}
            onDisable={disableVDA}
          />
        )}

        {vdaScopeOpen && (
          <VDAStateSelector
            states={statesWithNexus}
            selectedStates={selectedStates}
            calculating={calculating}
            onToggleState={toggleState}
            onSelectAll={selectAll}
            onSelectNone={selectNone}
            onSelectTopN={selectTopN}
            onCalculate={handleCalculateVDA}
            onCancel={handleCancelSelector}
          />
        )}
      </CardContent>
    </Card>
  )
}
