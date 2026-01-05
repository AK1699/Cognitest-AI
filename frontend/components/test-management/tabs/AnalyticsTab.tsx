'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Bug, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { issuesAPI, Issue } from '@/lib/api/issues'

interface AnalyticsTabProps {
    projectId: string
}

interface AnalyticsData {
    total: number
    bySeverity: Record<string, number>
    byStatus: Record<string, number>
    byPriority: Record<string, number>
}

export default function AnalyticsTab({ projectId }: AnalyticsTabProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData>({
        total: 0,
        bySeverity: {},
        byStatus: {},
        byPriority: {},
    })

    useEffect(() => {
        loadAnalytics()
    }, [projectId])

    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const issues = await issuesAPI.list(projectId, {})

            const bySeverity: Record<string, number> = {}
            const byStatus: Record<string, number> = {}
            const byPriority: Record<string, number> = {}

            issues.forEach((issue: Issue) => {
                bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1
                byStatus[issue.status] = (byStatus[issue.status] || 0) + 1
                byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1
            })

            setData({
                total: issues.length,
                bySeverity,
                byStatus,
                byPriority,
            })
        } catch (err) {
            console.error('Failed to load analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    const openIssues = (data.byStatus.new || 0) + (data.byStatus.assigned || 0) + (data.byStatus.in_progress || 0)
    const closedIssues = (data.byStatus.closed || 0) + (data.byStatus.fixed || 0)
    const criticalIssues = (data.bySeverity.critical || 0) + (data.bySeverity.high || 0)

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bug className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-500">Total Issues</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{data.total}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-sm text-gray-500">Open Issues</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{openIssues}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-500">Closed Issues</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{closedIssues}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-sm text-gray-500">Critical/High</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{criticalIssues}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* By Severity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
                    <div className="space-y-3">
                        {Object.entries(data.bySeverity).map(([severity, count]) => (
                            <div key={severity} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-gray-600 capitalize">{severity}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-4">
                                    <div
                                        className={`h-4 rounded-full ${severity === 'critical' ? 'bg-red-500' :
                                                severity === 'high' ? 'bg-orange-500' :
                                                    severity === 'medium' ? 'bg-blue-500' :
                                                        'bg-gray-400'
                                            }`}
                                        style={{ width: `${data.total ? (count / data.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="w-8 text-sm font-medium text-gray-900 text-right">{count}</div>
                            </div>
                        ))}
                        {Object.keys(data.bySeverity).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>

                {/* By Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Status</h3>
                    <div className="space-y-3">
                        {Object.entries(data.byStatus).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-4">
                                    <div
                                        className={`h-4 rounded-full ${status === 'closed' || status === 'fixed' ? 'bg-green-500' :
                                                status === 'in_progress' ? 'bg-purple-500' :
                                                    status === 'new' ? 'bg-blue-500' :
                                                        'bg-gray-400'
                                            }`}
                                        style={{ width: `${data.total ? (count / data.total) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="w-8 text-sm font-medium text-gray-900 text-right">{count}</div>
                            </div>
                        ))}
                        {Object.keys(data.byStatus).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
