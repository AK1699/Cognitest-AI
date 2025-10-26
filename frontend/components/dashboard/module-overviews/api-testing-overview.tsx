'use client'

import { Code } from 'lucide-react'

export function ApiTestingOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Testing Overview</h3>
        <Code className="w-6 h-6 text-green-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-green-500 dark:text-green-300">API Collections</p>
          <p className="text-2xl font-semibold text-green-700 dark:text-green-100">5</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-green-500 dark:text-green-300">API Endpoints</p>
          <p className="text-2xl font-semibold text-green-700 dark:text-green-100">78</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-green-500 dark:text-green-300">Assertions</p>
          <p className="text-2xl font-semibold text-green-700 dark:text-green-100">213</p>
        </div>
      </div>
    </div>
  )
}
