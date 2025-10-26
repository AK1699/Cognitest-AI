'use client'

import { Zap } from 'lucide-react'

export function AutomationHubOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-purple-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Hub Overview</h3>
        <Zap className="w-6 h-6 text-purple-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-purple-500 dark:text-purple-300">Workflows</p>
          <p className="text-2xl font-semibold text-purple-700 dark:text-purple-100">8</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-purple-500 dark:text-purple-300">Total Runs</p>
          <p className="text-2xl font-semibold text-purple-700 dark:text-purple-100">124</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-purple-500 dark:text-purple-300">Success Rate</p>
          <p className="text-2xl font-semibold text-purple-700 dark:text-purple-100">92%</p>
        </div>
      </div>
    </div>
  )
}
