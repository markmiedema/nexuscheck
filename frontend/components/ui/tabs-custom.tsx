'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
}

export interface TabsCustomProps {
  items: TabItem[]
  /** Default active tab ID (uncontrolled mode) */
  defaultTab?: string
  /** Active tab ID (controlled mode) - when provided, component becomes controlled */
  activeTab?: string
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void
  /** Styling variant */
  variant?: 'default' | 'pills' | 'underline'
  /** Full width tabs */
  fullWidth?: boolean
  className?: string
}

/**
 * Custom Tabs component with flexible configuration
 *
 * Features:
 * - Multiple visual variants (default, pills, underline)
 * - Optional icons and badges
 * - Disabled state support
 * - Full width option
 * - Smooth animations
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <TabsCustom
 *   items={[
 *     { id: 'tab1', label: 'Overview', content: <div>Content 1</div> },
 *     { id: 'tab2', label: 'Details', content: <div>Content 2</div>, badge: <Badge>3</Badge> }
 *   ]}
 *   defaultTab="tab1"
 *   variant="underline"
 *   onTabChange={(id) => console.log('Changed to:', id)}
 * />
 * ```
 */
export function TabsCustom({
  items,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default',
  fullWidth = false,
  className
}: TabsCustomProps) {
  // Set initial active tab
  const initialTab = defaultTab || items[0]?.id || ''
  const [internalActiveTab, setInternalActiveTab] = useState(initialTab)

  // Support both controlled and uncontrolled modes
  const isControlled = controlledActiveTab !== undefined
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab

  const handleTabChange = (tabId: string) => {
    const tab = items.find(item => item.id === tabId)
    if (tab?.disabled) return

    if (!isControlled) {
      setInternalActiveTab(tabId)
    }
    onTabChange?.(tabId)
  }

  const getTabListStyles = () => {
    switch (variant) {
      case 'pills':
        return 'bg-muted p-1 rounded-lg'
      case 'underline':
        return 'border-b border-border'
      default:
        return 'border-b border-border'
    }
  }

  const getTabButtonStyles = (isActive: boolean, isDisabled?: boolean) => {
    const base = cn(
      'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      fullWidth && 'flex-1 justify-center'
    )

    if (isDisabled) {
      return cn(base, 'opacity-50 cursor-not-allowed text-muted-foreground')
    }

    switch (variant) {
      case 'pills':
        return cn(
          base,
          'rounded-md',
          isActive
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )
      case 'underline':
        return cn(
          base,
          'border-b-2 -mb-[1px]',
          isActive
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        )
      default:
        return cn(
          base,
          'border-b-2 -mb-[1px] rounded-t-lg',
          isActive
            ? 'border-primary bg-muted/50 text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
        )
    }
  }

  const activeContent = items.find(item => item.id === activeTab)?.content

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div
        className={cn(
          'flex',
          fullWidth ? 'w-full' : 'w-fit',
          getTabListStyles()
        )}
        role="tablist"
      >
        {items.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={getTabButtonStyles(isActive, item.disabled)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              disabled={item.disabled}
            >
              {item.icon && (
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.badge && (
                <span className="flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            id={`tabpanel-${item.id}`}
            role="tabpanel"
            aria-labelledby={item.id}
            hidden={activeTab !== item.id}
            className={cn(
              'focus:outline-none',
              activeTab === item.id ? 'block' : 'hidden'
            )}
          >
            {activeTab === item.id && item.content}
          </div>
        ))}
      </div>
    </div>
  )
}
