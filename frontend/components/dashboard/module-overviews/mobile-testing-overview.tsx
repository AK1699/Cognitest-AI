'use client'

import { Smartphone } from 'lucide-react'

export function MobileTestingOverview() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-indigo-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Testing Overview</h3>
        <Smartphone className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300">Devices Tested</p>
          <p className="text-2xl font-semibold text-indigo-700 dark:text-indigo-100">10</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300">Test Runs</p>
          <p className="text-2xl font-semibold text-indigo-700 dark:text-indigo-100">45</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300">Bugs Found</p>
          <p className="text-2xl font-semibold text-indigo-700 dark:text-indigo-100">7</p>
        </div>
      </div>
    </div>
  )
}
