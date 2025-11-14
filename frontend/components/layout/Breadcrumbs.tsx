'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  rightContent?: React.ReactNode
}

export default function Breadcrumbs({ items, rightContent }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="mb-4 flex items-center justify-between" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {rightContent && <div className="text-sm text-muted-foreground">{rightContent}</div>}
    </nav>
  )
}
