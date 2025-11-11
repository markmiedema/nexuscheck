'use client'

import { ReactNode } from 'react'
import AppNav from './AppNav'
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs'

interface AppLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl' | 'full'
  breadcrumbs?: BreadcrumbItem[]
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export default function AppLayout({ children, maxWidth = '7xl', breadcrumbs }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <AppNav />
      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {children}
      </main>
    </div>
  )
}
