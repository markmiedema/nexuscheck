'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ChevronDown, ChevronUp, Calculator, X } from 'lucide-react'
import { useVDAMode, StateResult } from '@/hooks/useVDAMode'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
    setHover,
    openTopKey,
    toggleTopKey
  } = useVDAMode(analysisId, stateResults)

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
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
          // Initial state - prompt to enable VDA
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                What is VDA?
              </h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
                  <span><strong>Reduced/Waived Penalties</strong> - Most states waive penalties entirely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
                  <span><strong>Limited Lookback</strong> - 3-4 years vs. unlimited audit period</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
                  <span><strong>No Criminal Liability</strong> - Protection from fraud prosecution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'hsl(142 71% 40%)' }}>✓</span>
                  <span><strong>Reduced Interest</strong> - Some states offer interest reductions</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setVdaScopeOpen(true)}
              className="w-full bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_17.5%)]/90 dark:bg-[hsl(217.2_32.6%_17.5%)] dark:text-[hsl(210_40%_98%)] border border-border/40"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Enable VDA Mode
            </Button>
          </div>
        ) : (
          // VDA enabled - show results
          <div className="space-y-6">
            {/* Savings Summary */}
            {vdaResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-destructive-foreground mb-1">
                    Before VDA
                  </div>
                  <div className="text-2xl font-bold text-destructive-foreground">
                    {formatCurrency(vdaResults.before_vda)}
                  </div>
                </div>

                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-success-foreground mb-1">
                    With VDA
                  </div>
                  <div className="text-2xl font-bold text-success-foreground">
                    {formatCurrency(vdaResults.with_vda)}
                  </div>
                </div>

                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-info-foreground mb-1">
                    Total Savings
                  </div>
                  <div className="text-2xl font-bold text-info-foreground">
                    {formatCurrency(vdaResults.total_savings)}
                  </div>
                  <div className="text-xs text-info-foreground mt-1">
                    {vdaResults.savings_percentage.toFixed(1)}% reduction
                  </div>
                </div>
              </div>
            )}

            {/* Pie Chart - Exposure Breakdown */}
            {vdaResults && pieData && pieData.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-card-foreground mb-4">
                  Liability Breakdown (With VDA)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={(data) => setHover(data)}
                      onMouseLeave={() => setHover(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Interactive Legend */}
                <div className="flex gap-4 justify-center mt-4">
                  {['Base Tax', 'Interest', 'Penalties'].map(key => {
                    const isHidden = isLegendKeyHidden(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleLegendKey(key)}
                        className={`flex items-center gap-2 text-sm transition-opacity ${
                          isHidden ? 'opacity-50 line-through' : 'opacity-100'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor:
                              key === 'Base Tax' ? '#3b82f6' :
                              key === 'Interest' ? '#f59e0b' : '#ef4444'
                          }}
                        />
                        <span>{key}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top States Breakdown */}
            {vdaResults && vdaResults.state_breakdown.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h3 className="font-semibold text-card-foreground mb-4">
                  Top States by Savings
                </h3>
                <div className="space-y-2">
                  {vdaResults.state_breakdown.slice(0, 5).map((state) => (
                    <div
                      key={state.state_code}
                      className="border border-border rounded-lg p-4 hover:bg-card transition-colors"
                    >
                      <button
                        onClick={() => toggleTopKey(state.state_code)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-card-foreground">
                            {state.state_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({state.state_code})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-info-foreground">
                            {formatCurrency(state.savings)}
                          </span>
                          {openTopKey === state.state_code ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {openTopKey === state.state_code && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Before VDA:</span>
                            <span className="font-medium">{formatCurrency(state.before_vda)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">With VDA:</span>
                            <span className="font-medium">{formatCurrency(state.with_vda)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Penalties Waived:</span>
                            <span className="font-medium text-success-foreground">
                              {formatCurrency(state.penalty_waived)}
                            </span>
                          </div>
                          {state.interest_waived > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Interest Waived:</span>
                              <span className="font-medium text-success-foreground">
                                {formatCurrency(state.interest_waived)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setVdaScopeOpen(true)}
                className="flex-1"
              >
                Change States
              </Button>
              <Button
                variant="destructive"
                onClick={disableVDA}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Disable VDA
              </Button>
            </div>
          </div>
        )}

        {/* State Selector Modal/Panel */}
        {vdaScopeOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Select States for VDA
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which states to include in voluntary disclosure
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Quick Select Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectNone}>
                    Clear All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => selectTopN(3)}>
                    Top 3
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => selectTopN(5)}>
                    Top 5
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => selectTopN(10)}>
                    Top 10
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedStates.length} state{selectedStates.length !== 1 ? 's' : ''} selected
                </div>

                {/* State List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {statesWithNexus.map((state) => (
                    <div
                      key={state.state_code}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleState(state.state_code)}
                    >
                      <Checkbox
                        checked={selectedStates.includes(state.state_code)}
                        onCheckedChange={() => toggleState(state.state_code)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground">
                          {state.state_name} ({state.state_code})
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Liability: {formatCurrency(state.estimated_liability)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setVdaScopeOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await calculateVDA()
                    setVdaScopeOpen(false)
                  }}
                  disabled={calculating || selectedStates.length === 0}
                  className="flex-1 bg-info hover:opacity-90"
                >
                  {calculating ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate VDA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
