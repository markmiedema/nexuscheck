'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface AccordionItemProps {
  id: string
  trigger: ReactNode
  content: ReactNode
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info'
}

export interface AccordionProps {
  items: AccordionItemProps[]
  defaultOpen?: string[]
  type?: 'single' | 'multiple'
  className?: string
  onOpenChange?: (openItems: string[]) => void
}

/**
 * Reusable Accordion component with support for single or multiple open items.
 *
 * Features:
 * - Single mode: Only one item can be open at a time
 * - Multiple mode: Many items can be open simultaneously
 * - Variant styling: default, danger, warning, success, info
 * - Animated chevron indicators
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * <Accordion
 *   items={[
 *     {
 *       id: 'item1',
 *       trigger: <div>Item 1 Title</div>,
 *       content: <div>Item 1 Content</div>,
 *       variant: 'danger'
 *     }
 *   ]}
 *   type="multiple"
 *   defaultOpen={['item1']}
 * />
 * ```
 */
export function Accordion({
  items,
  defaultOpen = [],
  type = 'multiple',
  className = '',
  onOpenChange
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen))

  const toggle = (id: string) => {
    let newSet: Set<string>

    if (type === 'single') {
      // Single mode: only one item can be open
      newSet = new Set(openItems.has(id) ? [] : [id])
    } else {
      // Multiple mode: toggle individual items
      newSet = new Set(openItems)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
    }

    setOpenItems(newSet)
    onOpenChange?.(Array.from(newSet))
  }

  const getVariantStyles = (variant: AccordionItemProps['variant'] = 'default') => {
    const styles = {
      default: {
        container: 'border-border',
        background: 'bg-muted/50',
        trigger: 'text-slate-900 hover:bg-muted/70',
        content: 'bg-card'
      },
      danger: {
        container: 'border-red-200',
        background: 'bg-red-50',
        trigger: 'text-red-900 hover:bg-red-100/70',
        content: 'bg-white'
      },
      warning: {
        container: 'border-yellow-200',
        background: 'bg-yellow-50',
        trigger: 'text-yellow-900 hover:bg-yellow-100/70',
        content: 'bg-white'
      },
      success: {
        container: 'border-green-200',
        background: 'bg-green-50',
        trigger: 'text-green-900 hover:bg-green-100/70',
        content: 'bg-white'
      },
      info: {
        container: 'border-blue-200',
        background: 'bg-blue-50',
        trigger: 'text-blue-900 hover:bg-blue-100/70',
        content: 'bg-white'
      }
    }
    return styles[variant]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id)
        const variantStyle = getVariantStyles(item.variant)

        return (
          <div
            key={item.id}
            className={`border rounded-lg overflow-hidden transition-all ${variantStyle.container}`}
          >
            <button
              onClick={() => toggle(item.id)}
              className={`w-full p-4 flex justify-between items-center cursor-pointer transition-colors ${variantStyle.background} ${variantStyle.trigger}`}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <div className="flex-1 text-left">{item.trigger}</div>
              <div className="flex-shrink-0 ml-4 transition-transform duration-200">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>
            {isOpen && (
              <div
                id={`accordion-content-${item.id}`}
                className={`p-4 border-t ${variantStyle.container} ${variantStyle.content} animate-in slide-in-from-top-2 duration-200`}
              >
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
