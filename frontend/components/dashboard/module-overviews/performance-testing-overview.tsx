'use client'

import { BarChart3 } from 'lucide-react'

export function PerformanceTestingOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-orange-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Testing Overview</h3>
        <BarChart3 className="w-6 h-6 text-orange-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-orange-500 dark:text-orange-300">Load Tests</p>
          <p className="text-2xl font-semibold text-orange-700 dark:text-orange-100">7</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-orange-500 dark:text-orange-300">Avg. Response Time</p>
          <p className="text-2xl font-semibold text-orange-700 dark:text-orange-100">250ms</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-orange-500 dark:text-orange-300">Throughput</p>
          <p className="text-2xl font-semibold text-orange-700 dark:text-orange-100">1200 req/s</p>
        </div>
      </div>
    </div>
  )
}
