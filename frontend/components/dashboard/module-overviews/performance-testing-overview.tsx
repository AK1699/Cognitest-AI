'use client'

import { Zap, Gauge, TrendingUp, CheckCircle } from 'lucide-react'

interface PerformanceTestingOverviewProps {
  stats?: {
    totalTests?: number
    avgPerformanceScore?: number | null
    passRate?: number
    avgLatencyP95?: number | null
  }
}

export function PerformanceTestingOverview({ stats }: PerformanceTestingOverviewProps) {
  const data = {
    totalTests: stats?.totalTests ?? 0,
    avgPerformanceScore: stats?.avgPerformanceScore ?? null,
    passRate: stats?.passRate ?? 0,
    avgLatencyP95: stats?.avgLatencyP95 ?? null
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-teal-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Testing</h3>
        <Zap className="w-6 h-6 text-teal-600" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Gauge className="w-4 h-4 text-teal-500 mr-1" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</p>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(data.avgPerformanceScore)}`}>
            {data.avgPerformanceScore !== null ? data.avgPerformanceScore : '—'}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-teal-500 mr-1" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tests</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalTests}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-4 h-4 text-teal-500 mr-1" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pass Rate</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{data.passRate}%</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-teal-500 mr-1" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">P95 Latency</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.avgLatencyP95 !== null ? `${data.avgLatencyP95}ms` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
