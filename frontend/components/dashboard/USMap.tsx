'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// Map state names to their codes
const STATE_NAME_TO_CODE: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC', 'Puerto Rico': 'PR'
}

interface StateData {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'none'
  total_sales: number
  estimated_liability?: number
}

interface USMapProps {
  stateData: StateData[]
  analysisId: string
  onStateClick?: (stateCode: string) => void
}

export default function USMap({ stateData, analysisId, onStateClick }: USMapProps) {
  const router = useRouter()
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  // Create a map of state codes to their data for quick lookup
  const stateDataMap = stateData.reduce((acc, state) => {
    acc[state.state_code] = state
    return acc
  }, {} as Record<string, StateData>)

  // Get state code from geography name
  const getStateCode = (geoName: string): string | null => {
    return STATE_NAME_TO_CODE[geoName] || null
  }

  // Get color based on nexus status
  const getStateColor = (geoName: string) => {
    const stateCode = getStateCode(geoName)
    if (!stateCode) return 'var(--muted)' // Muted for unknown states

    const state = stateDataMap[stateCode]
    if (!state) return 'var(--muted)' // Muted for no data

    switch (state.nexus_status) {
      case 'has_nexus':
        return 'hsl(var(--destructive))' // Red - has nexus (HSL format)
      case 'approaching':
        return 'var(--warning)' // Amber - approaching threshold (OKLCH)
      case 'none':
        return 'var(--success)' // Green - no nexus (OKLCH)
      default:
        return 'var(--muted)' // Muted gray (OKLCH)
    }
  }

  // Handle state click
  const handleStateClick = (geo: any) => {
    const stateName = geo.properties.name
    const stateCode = getStateCode(stateName)

    if (stateCode && stateDataMap[stateCode]) {
      if (onStateClick) {
        onStateClick(stateCode)
      } else {
        router.push(`/analysis/${analysisId}/states/${stateCode}`)
      }
    }
  }

  // Get tooltip content
  const getTooltipContent = (geoName: string) => {
    const stateCode = getStateCode(geoName)
    if (!stateCode) return null

    const state = stateDataMap[stateCode]
    if (!state) return null

    return (
      <div className="bg-popover text-popover-foreground border border-border px-3 py-2 rounded shadow-lg text-sm">
        <div className="font-semibold">{state.state_name}</div>
        <div className="text-xs mt-1">
          Status:{' '}
          {state.nexus_status === 'has_nexus'
            ? 'Has Nexus'
            : state.nexus_status === 'approaching'
            ? 'Approaching'
            : 'No Nexus'}
        </div>
        <div className="text-xs">
          Sales: ${state.total_sales.toLocaleString()}
        </div>
        {state.estimated_liability !== undefined && state.estimated_liability > 0 && (
          <div className="text-xs">
            Liability: ${state.estimated_liability.toLocaleString()}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">Click for details</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name
              const isHovered = hoveredState === stateName

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateName)}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      outline: 'none',
                      fill: getStateColor(stateName),
                      opacity: 0.8,
                      cursor: 'pointer',
                    },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={() => setHoveredState(stateName)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(geo)}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {hoveredState && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {getTooltipContent(hoveredState)}
        </div>
      )}
    </div>
  )
}
