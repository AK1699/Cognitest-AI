'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react'
import { issuesAPI, IssueMetrics } from '@/lib/api/issues'

interface DefectDashboardProps {
  projectId: string
  onClose: () => void
}

export default function DefectDashboard({ projectId, onClose }: DefectDashboardProps) {
  const [metrics, setMetrics] = useState<IssueMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await issuesAPI.getMetrics(projectId)
      setMetrics(result)
    } catch (err: any) {
      setError('Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      assigned: 'bg-yellow-500',
      in_progress: 'bg-purple-500',
      fixed: 'bg-green-500',
      retested: 'bg-teal-500',
      closed: 'bg-gray-500',
      reopened: 'bg-red-500',
      wont_fix: 'bg-gray-400',
      duplicate: 'bg-gray-400',
      deferred: 'bg-yellow-600',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    }
    return colors[severity] || 'bg-gray-500'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      trivial: 'bg-gray-400',
      low: 'bg-green-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
      blocker: 'bg-red-700',
    }
    return colors[priority] || 'bg-gray-500'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">Defect Analytics Dashboard</h2>
              <p className="text-blue-100 text-sm">Comprehensive defect metrics and insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading metrics...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          ) : metrics ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                {/* Total Issues */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{metrics.total_issues}</div>
                  <div className="text-sm text-blue-700 font-medium">Total Issues</div>
                </div>

                {/* Open Issues */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-orange-900">{metrics.open_issues}</div>
                  <div className="text-sm text-orange-700 font-medium">Open Issues</div>
                  <div className="text-xs text-orange-600 mt-1">
                    {calculatePercentage(metrics.open_issues, metrics.total_issues)}% of total
                  </div>
                </div>

                {/* Closed Issues */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-900">{metrics.closed_issues}</div>
                  <div className="text-sm text-green-700 font-medium">Closed Issues</div>
                  <div className="text-xs text-green-600 mt-1">
                    {calculatePercentage(metrics.closed_issues, metrics.total_issues)}% of total
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">{metrics.in_progress_issues}</div>
                  <div className="text-sm text-purple-700 font-medium">In Progress</div>
                  <div className="text-xs text-purple-600 mt-1">
                    {calculatePercentage(metrics.in_progress_issues, metrics.total_issues)}% of total
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-3 gap-6">
                {/* By Severity */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">By Severity</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(metrics.by_severity).map(([severity, count]) => (
                      <div key={severity}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize text-gray-700">{severity}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getSeverityColor(severity)}`}
                            style={{ width: `${calculatePercentage(count, metrics.total_issues)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Priority */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">By Priority</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(metrics.by_priority).map(([priority, count]) => (
                      <div key={priority}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize text-gray-700">{priority}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                            style={{ width: `${calculatePercentage(count, metrics.total_issues)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Status */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">By Status</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(metrics.by_status).slice(0, 6).map(([status, count]) => (
                      <div key={status}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize text-gray-700">{status.replace('_', ' ')}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(status)}`}
                            style={{ width: `${calculatePercentage(count, metrics.total_issues)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-6">
                {/* Resolution Time */}
                {metrics.avg_resolution_time_hours !== undefined && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Average Resolution Time</h3>
                    </div>
                    <div className="text-4xl font-bold text-blue-600">
                      {metrics.avg_resolution_time_hours.toFixed(1)}
                      <span className="text-2xl text-gray-500 ml-2">hours</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Average time from creation to resolution
                    </p>
                  </div>
                )}

                {/* Defect Density */}
                {metrics.defect_density !== undefined && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Defect Density</h3>
                    </div>
                    <div className="text-4xl font-bold text-orange-600">
                      {metrics.defect_density.toFixed(2)}
                      <span className="text-2xl text-gray-500 ml-2">%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Ratio of defects to total test cases
                    </p>
                  </div>
                )}
              </div>

              {/* Health Summary */}
              <div className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-gray-50 to-blue-50">
                <h3 className="font-semibold text-gray-900 mb-4">Project Health Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {calculatePercentage(metrics.closed_issues, metrics.total_issues)}%
                    </div>
                    <div className="text-sm text-gray-600">Resolution Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.total_issues - metrics.closed_issues}
                    </div>
                    <div className="text-sm text-gray-600">Active Issues</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      metrics.by_severity.critical > 5 ? 'text-red-600' :
                      metrics.by_severity.high > 10 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {metrics.by_severity.critical || 0 + metrics.by_severity.high || 0}
                    </div>
                    <div className="text-sm text-gray-600">High Priority Issues</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Understanding the Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Total Issues:</strong> All defects reported in this project
                  </div>
                  <div>
                    <strong>Open Issues:</strong> New, assigned, and in-progress issues
                  </div>
                  <div>
                    <strong>Closed Issues:</strong> Fixed, retested, and closed issues
                  </div>
                  <div>
                    <strong>Resolution Rate:</strong> Percentage of issues that have been resolved
                  </div>
                  <div>
                    <strong>Avg Resolution Time:</strong> Average time from creation to closure
                  </div>
                  <div>
                    <strong>Defect Density:</strong> Number of defects relative to test cases
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-sm text-gray-500">
                Create some issues to see analytics and insights
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
