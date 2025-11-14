'use client'

import React from 'react'

export interface Tab {
  id: string
  label: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

/**
 * Reusable Tabs component for consistent tab navigation across the application.
 *
 * Features:
 * - Active state with underline indicator
 * - Optional count badges
 * - Optional icons
 * - Fully accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'all', label: 'All', count: 10 },
 *     { id: 'active', label: 'Active', count: 5 }
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */
export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b border-border ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-sm font-semibold transition-all -mb-px ${
              isActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t'
            }`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
          >
            <span className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-muted-foreground">({tab.count})</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
