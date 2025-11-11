'use client'

import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="7xl">
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-elevated border-2 border-gray-300 dark:border-slate-500 p-8">
          <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50 mb-4">
            Welcome to Nexus Check
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You're successfully logged in! This is your dashboard.
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <button
              onClick={() => router.push('/analysis/new')}
              className="group p-6 border-2 border-gray-300 dark:border-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-card hover:border-gray-400 dark:hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-elevated transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-6 h-6 text-slate-700 dark:text-slate-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                New Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new nexus analysis
              </p>
            </button>

            <div className="p-6 border-2 border-gray-300 dark:border-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-600 rounded-lg mb-4 shadow-soft">
                <FileText className="w-6 h-6 text-gray-700 dark:text-slate-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Recent Analyses
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View and manage your previous sales tax nexus analyses
              </p>
              <Button
                onClick={() => router.push('/analyses')}
                variant="outline"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                View All Analyses
              </Button>
            </div>

            <div className="p-6 border-2 border-gray-300 dark:border-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-600 rounded-lg mb-4 shadow-soft">
                <svg
                  className="w-6 h-6 text-gray-700 dark:text-slate-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your account settings (coming soon)
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
