'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { Workflow } from 'lucide-react'

export default function AutomationHubPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="w-full px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4 lg:ml-0 ml-12">
                <h1 className="text-2xl font-semibold text-primary">CogniTest</h1>
              </div>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8">
          <div className="max-w-5xl mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Workflow className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
              Automation Hub
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-normal mb-8">
              n8n-style visual workflow builder connecting tests, notifications, and integrations
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 font-normal">
                Coming Soon - Visual workflow automation builder
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
