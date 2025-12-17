'use client'

import * as React from 'react'
import { X, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface RightDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: React.ReactNode
  /** URL for "Open full page" link */
  fullPageUrl?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Width variant */
  size?: 'default' | 'wide' | 'full'
  /** Footer actions */
  footer?: React.ReactNode
  /** Main content */
  children: React.ReactNode
}

const sizeClasses = {
  default: 'w-full sm:max-w-md',
  wide: 'w-full sm:max-w-lg md:max-w-xl',
  full: 'w-full sm:max-w-2xl',
}

/**
 * RightDrawerShell - Standardized right drawer for editing/viewing entities
 *
 * Use for: State actions, data items, tasks, quick edits
 * Don't use for: Heavy reads like analysis results (use full pages)
 */
export function RightDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  fullPageUrl,
  isLoading = false,
  error = null,
  size = 'wide',
  footer,
  children,
}: RightDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className={cn(
          sizeClasses[size],
          'flex flex-col h-full p-0 gap-0'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-semibold truncate">
                  {title}
                </SheetTitle>
                {badge}
              </div>
              {subtitle && (
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </SheetDescription>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {fullPageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => window.open(fullPageUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open full page</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
              <p className="text-red-600">{error}</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer */}
        {footer && !isLoading && !error && (
          <>
            <Separator />
            <div className="flex-shrink-0 px-6 py-4 bg-muted/30">
              {footer}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/**
 * RightDrawerSection - Section within a drawer with optional title
 */
interface RightDrawerSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function RightDrawerSection({
  title,
  children,
  className,
}: RightDrawerSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

/**
 * RightDrawerFooter - Standard footer layout for drawer actions
 */
interface RightDrawerFooterProps {
  children: React.ReactNode
  className?: string
}

export function RightDrawerFooter({
  children,
  className,
}: RightDrawerFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  )
}

export default RightDrawer
