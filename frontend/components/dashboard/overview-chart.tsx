'use client'

import { TrendingUp } from 'lucide-react'

interface OverviewChartProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative'
}

export function OverviewChart({
  title,
  value,
  change,
  changeType = 'positive',
}: OverviewChartProps) {
  // Simple mock chart data - can be replaced with real chart library later
  const chartPoints = [40, 50, 35, 55, 45, 60, 50, 70, 55, 75, 80]
  const maxValue = Math.max(...chartPoints)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {title}
        </p>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <span
              className={`inline-flex items-center gap-1 text-sm font-medium ${
                changeType === 'positive'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {change}
            </span>
          )}
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="relative h-32">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <span>100</span>
          <span>80</span>
          <span>60</span>
          <span>40</span>
        </div>

        {/* Chart Area */}
        <div className="ml-8 h-full flex items-end gap-2">
          {chartPoints.map((point, index) => {
            const height = (point / maxValue) * 100
            return (
              <div
                key={index}
                className="flex-1 relative group"
              >
                <div
                  className="w-full bg-gradient-to-t from-primary to-accent-400 rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {point}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
