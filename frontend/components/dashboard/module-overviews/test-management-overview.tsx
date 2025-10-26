'use client'

import { FileText, TestTube, Play } from 'lucide-react'

export function TestManagementOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test Management Overview</h3>
        <FileText className="w-6 h-6 text-blue-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-blue-500 dark:text-blue-300">Test Plans</p>
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-100">12</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-500 dark:text-blue-300">Test Cases</p>
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-100">156</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-500 dark:text-blue-300">Test Suites</p>
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-100">34</p>
        </div>
      </div>
    </div>
  )
}
