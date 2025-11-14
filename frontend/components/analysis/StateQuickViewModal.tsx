'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getStateDetail, StateDetailResponse } from '@/lib/api'
import apiClient from '@/lib/api/client'
import { ExternalLink, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react'

interface PhysicalNexusConfig {
  state_code: string
  nexus_date: string
  reason: string
  registration_date?: string
  permit_number?: string
}

interface StateQuickViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string
  stateCode: string
  stateName: string
}

export function StateQuickViewModal({
  open,
  onOpenChange,
  analysisId,
  stateCode,
  stateName
}: StateQuickViewModalProps) {
  const router = useRouter()
  const [data, setData] = useState<StateDetailResponse | null>(null)
  const [physicalNexus, setPhysicalNexus] = useState<PhysicalNexusConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && stateCode) {
      loadStateData()
    }
  }, [open, stateCode, analysisId])

  const loadStateData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load state detail
      const response = await getStateDetail(analysisId, stateCode)
      setData(response)

      // If state has physical nexus, load physical nexus config
      if (response.nexus_type === 'physical' || response.nexus_type === 'both') {
        try {
          const physicalResponse = await apiClient.get(`/api/v1/analyses/${analysisId}/physical-nexus`)
          const configs = physicalResponse.data as PhysicalNexusConfig[]
          const stateConfig = configs.find(config => config.state_code === stateCode)
          if (stateConfig) {
            setPhysicalNexus(stateConfig)
          }
        } catch (err) {
          // Physical nexus config might not exist, that's okay
          console.log('No physical nexus config found for state:', stateCode)
        }
      }
    } catch (err) {
      console.error('Error fetching state detail:', err)
      setError('Failed to load state details')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate when economic nexus was triggered by finding when threshold was crossed
  const calculateEconomicNexusDate = (data: StateDetailResponse): string | null => {
    // Find the first year where nexus was established
    const nexusYear = data.year_data.find(yr => yr.nexus_status === 'has_nexus')
    if (!nexusYear || !nexusYear.threshold_info.revenue_threshold) {
      return null
    }

    // Go through monthly sales to find when threshold was crossed
    let runningTotal = 0
    for (const monthData of nexusYear.monthly_sales) {
      runningTotal += monthData.sales
      if (runningTotal >= nexusYear.threshold_info.revenue_threshold) {
        // Threshold crossed in this month - use the 15th as a reasonable estimate
        const [year, month] = monthData.month.split('-')
        return `${year}-${month}-15`
      }
    }

    return null
  }

  const generateNexusSummaryFacts = (data: StateDetailResponse): {
    title: string
    bullets: string[]
  } => {
    const hasNexus = data.nexus_type && data.nexus_type !== 'none'
    const totalSales = data.total_sales || 0
    const directSales = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
    const marketplaceSales = data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
    const taxableSales = data.taxable_sales || 0
    const exemptSales = data.exempt_sales || 0
    const exposureSales = data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0)
    const threshold = data.year_data[0]?.threshold_info?.revenue_threshold || 0
    const thresholdPercent = threshold > 0 ? ((totalSales / threshold) * 100).toFixed(0) : '0'

    const facts: string[] = []

    // Always show sales breakdown
    facts.push(`Total Sales: $${totalSales.toLocaleString()} (${thresholdPercent}% of $${threshold.toLocaleString()} threshold)`)

    if (directSales > 0 || marketplaceSales > 0) {
      facts.push(`  • Direct: $${directSales.toLocaleString()} | Marketplace: $${marketplaceSales.toLocaleString()}`)
    }

    if (exemptSales > 0) {
      facts.push(`  • Taxable: $${taxableSales.toLocaleString()} | Exempt: $${exemptSales.toLocaleString()}`)
    }

    // Show nexus determination
    if (hasNexus) {
      const nexusTypeLabel = data.nexus_type === 'both' ? 'Physical + Economic Nexus'
        : data.nexus_type === 'physical' ? 'Physical Nexus'
        : data.nexus_type === 'economic' ? 'Economic Nexus'
        : 'Nexus Established'

      facts.push(`Nexus: ${nexusTypeLabel}`)

      // Show exposure sales if different from total
      if (exposureSales > 0 && exposureSales !== totalSales) {
        facts.push(`Exposure Sales: $${exposureSales.toLocaleString()} (sales during obligation period)`)
      }

      // Show liability
      if (data.estimated_liability && data.estimated_liability > 0) {
        facts.push(`Estimated Liability: $${data.estimated_liability.toLocaleString()}`)
      } else if (taxableSales === 0 && exemptSales > 0) {
        facts.push(`Liability: $0 (all sales are exempt)`)
      }
    } else {
      facts.push(`Nexus: Not Established`)

      if (threshold > 0 && totalSales < threshold) {
        const shortfall = threshold - totalSales
        facts.push(`  • Below threshold by $${shortfall.toLocaleString()}`)
      }
    }

    return {
      title: 'Nexus Summary',
      bullets: facts
    }
  }

  const handleViewFullDetails = () => {
    onOpenChange(false)
    router.push(`/analysis/${analysisId}/states/${stateCode}`)
  }

  const getNexusStatusColor = (nexusType?: string) => {
    switch (nexusType) {
      case 'both':
        return 'hsl(289 46% 45%)'
      case 'physical':
        return 'hsl(217 32.6% 45%)'
      case 'economic':
        return 'hsl(0 60% 45%)'
      default:
        return 'hsl(142 71% 40%)'
    }
  }

  const getNexusStatusLabel = (nexusType?: string) => {
    switch (nexusType) {
      case 'both':
        return 'Physical + Economic Nexus'
      case 'physical':
        return 'Physical Nexus'
      case 'economic':
        return 'Economic Nexus'
      default:
        return 'No Nexus'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {stateName}
            <span className="text-muted-foreground">({stateCode})</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive-foreground">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-4 py-4">
            {/* Nexus Status Header */}
            {data.nexus_type && data.nexus_type !== 'none' && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getNexusStatusColor(data.nexus_type) }}
                    />
                    Nexus Status
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold"
                    style={{
                      backgroundColor: `${getNexusStatusColor(data.nexus_type)}15`,
                      color: getNexusStatusColor(data.nexus_type),
                      borderColor: `${getNexusStatusColor(data.nexus_type)}30`,
                    }}
                  >
                    NEXUS TRIGGERED
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Nexus Type</div>
                    <div className="font-medium text-foreground">{getNexusStatusLabel(data.nexus_type)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Total Liability</div>
                    <div className="font-bold text-foreground">{formatCurrency(data.estimated_liability || 0)}</div>
                  </div>
                  {(() => {
                    // Determine the correct nexus date to display
                    let nexusDate: string | null = null
                    let physicalDate: Date | null = null
                    let economicDate: Date | null = null

                    // Get physical nexus date if available
                    if ((data.nexus_type === 'physical' || data.nexus_type === 'both') && physicalNexus?.nexus_date) {
                      physicalDate = new Date(physicalNexus.nexus_date)
                    }

                    // Get or calculate economic nexus date
                    if (data.nexus_type === 'economic' || data.nexus_type === 'both') {
                      // First try to get from API
                      const yearWithNexus = data.year_data.find(yr => yr.nexus_date)
                      if (yearWithNexus?.nexus_date) {
                        economicDate = new Date(yearWithNexus.nexus_date)
                      } else {
                        // Calculate from monthly sales data
                        const calculatedDate = calculateEconomicNexusDate(data)
                        if (calculatedDate) {
                          economicDate = new Date(calculatedDate)
                        }
                      }
                    }

                    // Determine which date to use
                    if (data.nexus_type === 'physical' && physicalDate) {
                      nexusDate = physicalNexus!.nexus_date
                    } else if (data.nexus_type === 'economic' && economicDate) {
                      nexusDate = economicDate.toISOString().split('T')[0]
                    } else if (data.nexus_type === 'both') {
                      // Use the earliest date
                      if (physicalDate && economicDate) {
                        nexusDate = physicalDate <= economicDate ? physicalNexus!.nexus_date : economicDate.toISOString().split('T')[0]
                      } else if (physicalDate) {
                        nexusDate = physicalNexus!.nexus_date
                      } else if (economicDate) {
                        nexusDate = economicDate.toISOString().split('T')[0]
                      }
                    }

                    return nexusDate ? (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Nexus Triggered On</div>
                        <div className="font-medium text-foreground">{formatDate(nexusDate)}</div>
                      </div>
                    ) : data.first_nexus_year ? (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">First Nexus Year</div>
                        <div className="font-medium text-foreground">{data.first_nexus_year}</div>
                      </div>
                    ) : null
                  })()}
                  {(() => {
                    // Find registration deadline from year_data
                    const yearWithObligation = data.year_data.find(yr => yr.obligation_start_date)
                    return yearWithObligation?.obligation_start_date ? (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Register By</div>
                        <div className="font-medium text-warning">{formatDate(yearWithObligation.obligation_start_date)}</div>
                      </div>
                    ) : data.compliance_info.registration_info?.registration_required ? (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Registration</div>
                        <div className="font-medium text-warning">Required</div>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            )}

            {/* Nexus Summary - WITH DARK MODE SUPPORT */}
            {data && (() => {
              const summary = generateNexusSummaryFacts(data)
              return (
                <div className="bg-accent/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    {summary.title}
                  </h4>
                  <div className="bg-background border border-border rounded p-3">
                    <ul className="space-y-1.5 text-sm text-foreground font-mono">
                      {summary.bullets.map((bullet, idx) => (
                        <li key={idx}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })()}

            {/* Key Metrics Grid */}
            {data.has_transactions && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Gross Revenue</div>
                  <div className="font-bold text-lg text-foreground">
                    {formatCurrency(data.total_sales || 0)}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Taxable Revenue</div>
                  <div className="font-bold text-lg text-foreground">
                    {formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.taxable_sales || 0), 0))}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Total Transactions</div>
                  <div className="font-bold text-lg text-foreground">
                    {data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Tax Rate</div>
                  <div className="font-bold text-lg text-foreground">
                    {data.compliance_info.tax_rates.combined_rate.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Direct Sales</div>
                  <div className="font-bold text-lg text-foreground">
                    {formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.total_sales && data.total_sales > 0
                      ? `${((data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0) / data.total_sales) * 100).toFixed(0)}% of total`
                      : '0% of total'}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="text-muted-foreground text-xs mb-1">Marketplace Sales</div>
                  <div className="font-bold text-lg text-foreground">
                    {formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.total_sales && data.total_sales > 0
                      ? `${((data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0) / data.total_sales) * 100).toFixed(0)}% of total`
                      : '0% of total'}
                  </div>
                </div>
              </div>
            )}

            {/* Tax Exposure Details */}
            {data.nexus_type && data.nexus_type !== 'none' && data.estimated_liability > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">Tax Exposure Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exposure Sales</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.exposure_sales || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uncollected Tax</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.base_tax || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.interest || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penalties</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(data.year_data.reduce((sum, yr) => sum + (yr.summary.penalties || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span className="text-foreground">Total Exposure</span>
                    <span className="text-foreground">
                      {formatCurrency(data.estimated_liability || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Year-by-Year Breakdown */}
            {data.year_data.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">Year-by-Year Breakdown</h4>
                <div className="space-y-2">
                  {data.year_data.map((yearItem) => (
                    <div key={yearItem.year} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium text-foreground">{yearItem.year}</span>
                        <span className="text-muted-foreground ml-2">
                          ({yearItem.summary.transaction_count.toLocaleString()} transactions)
                        </span>
                      </div>
                      <div className="font-medium text-foreground">
                        {formatCurrency(yearItem.summary.total_sales)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleViewFullDetails}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Full Details
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
