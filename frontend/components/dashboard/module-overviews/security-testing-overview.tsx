'use client'

import { Shield } from 'lucide-react'

export function SecurityTestingOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Testing Overview</h3>
        <Shield className="w-6 h-6 text-red-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-red-500 dark:text-red-300">Vulnerabilities</p>
          <p className="text-2xl font-semibold text-red-700 dark:text-red-100">15</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-red-500 dark:text-red-300">Critical Issues</p>
          <p className="text-2xl font-semibold text-red-700 dark:text-red-100">3</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-red-500 dark:text-red-300">Scans Run</p>
          <p className="text-2xl font-semibold text-red-700 dark:text-red-100">28</p>
        </div>
      </div>
    </div>
  )
}
