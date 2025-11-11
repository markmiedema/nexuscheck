'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-50 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-gray-950 dark:text-gray-50' : 'text-gray-600 dark:text-gray-400'}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
