'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
}

export interface AccordionCustomProps {
  items: AccordionItem[]
  /** Allow multiple items to be open at once */
  allowMultiple?: boolean
  /** Styling variant */
  variant?: 'default' | 'bordered' | 'filled'
  className?: string
}

/**
 * Custom Accordion component with flexible configuration
 *
 * Features:
 * - Single or multiple open items
 * - Optional icons
 * - Multiple visual variants
 * - Smooth animations
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <AccordionCustom
 *   items={[
 *     { id: '1', title: 'Section 1', content: <div>Content</div> },
 *     { id: '2', title: 'Section 2', content: <div>Content</div>, defaultOpen: true }
 *   ]}
 *   allowMultiple={true}
 *   variant="bordered"
 * />
 * ```
 */
export function AccordionCustom({
  items,
  allowMultiple = false,
  variant = 'default',
  className
}: AccordionCustomProps) {
  // Initialize open items based on defaultOpen
  const initialOpenItems = items
    .filter(item => item.defaultOpen)
    .map(item => item.id)

  const [openItems, setOpenItems] = useState<string[]>(initialOpenItems)

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems(prev =>
        prev.includes(id)
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      )
    } else {
      setOpenItems(prev =>
        prev.includes(id) ? [] : [id]
      )
    }
  }

  const isOpen = (id: string) => openItems.includes(id)

  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-border rounded-lg'
      case 'filled':
        return 'bg-muted/50 rounded-lg'
      default:
        return ''
    }
  }

  const getItemStyles = (index: number) => {
    const isLast = index === items.length - 1

    switch (variant) {
      case 'bordered':
        return cn(
          'border-b border-border',
          isLast && 'border-b-0'
        )
      case 'filled':
        return cn(
          'border-b border-border/50',
          isLast && 'border-b-0'
        )
      default:
        return cn(
          'border-b border-border',
          isLast && 'border-b-0'
        )
    }
  }

  return (
    <div className={cn('space-y-0', getVariantStyles(), className)}>
      {items.map((item, index) => {
        const itemOpen = isOpen(item.id)

        return (
          <div key={item.id} className={getItemStyles(index)}>
            {/* Accordion Header */}
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 text-left',
                'hover:bg-muted/50 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                variant === 'bordered' && index === 0 && 'rounded-t-lg',
                variant === 'bordered' && index === items.length - 1 && !itemOpen && 'rounded-b-lg'
              )}
              aria-expanded={itemOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="text-muted-foreground flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                <span className="font-semibold text-foreground">
                  {item.title}
                </span>
              </div>

              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0',
                  itemOpen && 'transform rotate-180'
                )}
              />
            </button>

            {/* Accordion Content */}
            <div
              id={`accordion-content-${item.id}`}
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                itemOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              )}
              aria-hidden={!itemOpen}
            >
              <div className="p-4 pt-0">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
