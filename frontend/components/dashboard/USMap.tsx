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
  nexus_type?: 'physical' | 'economic' | 'both' | 'none'
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

  // Get color based on nexus status and type
  const getStateColor = (geoName: string) => {
    const stateCode = getStateCode(geoName)
    if (!stateCode) return 'hsl(215 20.2% 75%)' // Darker gray for unknown states (visible in light mode)

    const state = stateDataMap[stateCode]
    if (!state) return 'hsl(215 20.2% 75%)' // Darker gray for no data (visible in light mode)

    // If has nexus, differentiate by type (using professional, muted tones)
    if (state.nexus_status === 'has_nexus') {
      switch (state.nexus_type) {
        case 'physical':
          return 'hsl(217 32.6% 45%)' // Muted blue-slate - physical nexus only (darker, professional)
        case 'economic':
          return 'hsl(0 60% 45%)' // Darker muted red - economic nexus only (professional tone)
        case 'both':
          return 'hsl(289 46% 45%)' // Blended purple - mathematical blend of blue and red
        default:
          return 'hsl(0 60% 45%)' // Default darker muted red for unknown type
      }
    }

    // Other statuses
    switch (state.nexus_status) {
      case 'approaching':
        return 'hsl(38 92% 50%)' // Amber - approaching threshold (matches warning)
      case 'none':
        return 'hsl(142 71% 40%)' // Darker muted green - no nexus (professional)
      default:
        return 'hsl(var(--muted))' // Muted gray
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

    // Get nexus type label
    const getNexusTypeLabel = () => {
      if (state.nexus_status !== 'has_nexus') return null
      switch (state.nexus_type) {
        case 'physical':
          return 'Physical Nexus'
        case 'economic':
          return 'Economic Nexus'
        case 'both':
          return 'Physical & Economic'
        default:
          return 'Has Nexus'
      }
    }

    return (
      <div className="bg-popover text-popover-foreground border border-border px-3 py-2 rounded shadow-lg text-sm">
        <div className="font-semibold">{state.state_name}</div>
        <div className="text-xs mt-1">
          Status:{' '}
          {state.nexus_status === 'has_nexus'
            ? getNexusTypeLabel()
            : state.nexus_status === 'approaching'
            ? 'Approaching Threshold'
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
    <div className="relative rounded-lg border border-border bg-muted/50 p-4">
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
                    default: {
                      outline: 'none',
                      filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15))',
                    },
                    hover: {
                      outline: 'none',
                      fill: getStateColor(stateName),
                      opacity: 0.8,
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 3px 5px rgba(0, 0, 0, 0.2))',
                    },
                    pressed: {
                      outline: 'none',
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                    },
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
