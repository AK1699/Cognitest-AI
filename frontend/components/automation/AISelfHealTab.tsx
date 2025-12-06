'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Settings,
    History,
    ArrowRight,
    Search,
    Eye,
    Wand2,
    ShieldCheck,
    AlertCircle,
    XCircle,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { webAutomationApi, SelfHealDashboard, SelfHealIssue, RepairHistoryItem } from '@/lib/api/webAutomation'
import { toast } from 'sonner'

interface AISelfHealTabProps {
    projectId: string
}

export default function AISelfHealTab({ projectId }: AISelfHealTabProps) {
    const [autoHealEnabled, setAutoHealEnabled] = useState(true)
    const [autoApplyLowRisk, setAutoApplyLowRisk] = useState(true)
    const [notifyOnIssues, setNotifyOnIssues] = useState(true)
    const [visualMatching, setVisualMatching] = useState(true)
    const [confidenceThreshold, setConfidenceThreshold] = useState(90)

    // Data states
    const [dashboard, setDashboard] = useState<SelfHealDashboard | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [applyingFix, setApplyingFix] = useState<string | null>(null)

    // Fetch dashboard data
    const fetchDashboard = useCallback(async () => {
        if (!projectId) return

        setIsLoading(true)
        setError(null)

        try {
            const data = await webAutomationApi.getSelfHealDashboard(projectId)
            setDashboard(data)
            // Sync config from server
            setAutoApplyLowRisk(data.config.auto_apply_low_risk)
            setNotifyOnIssues(data.config.notify_on_issues)
            setVisualMatching(data.config.visual_matching)
            setConfidenceThreshold(data.config.confidence_threshold)
        } catch (err: any) {
            console.error('Failed to fetch self-heal dashboard:', err)
            setError(err.message || 'Failed to load dashboard')
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    const handleApplyFix = async (issue: SelfHealIssue) => {
        if (!issue.suggestions.length) return

        setApplyingFix(issue.id)
        try {
            await webAutomationApi.applyHealingFix(issue.id, {
                value: issue.suggestions[0].value,
                type: issue.suggestions[0].type
            })
            toast.success('Fix applied successfully')
            fetchDashboard()
        } catch (err: any) {
            toast.error('Failed to apply fix: ' + (err.message || 'Unknown error'))
        } finally {
            setApplyingFix(null)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Unknown'
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

        if (diffDays === 0) return `Today, ${timeStr}`
        if (diffDays === 1) return `Yesterday, ${timeStr}`
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`
    }

    const getHealthBadge = (score: number) => {
        if (score >= 95) return { text: 'Excellent', className: 'bg-green-100 text-green-700' }
        if (score >= 80) return { text: 'Good', className: 'bg-blue-100 text-blue-700' }
        if (score >= 60) return { text: 'Fair', className: 'bg-yellow-100 text-yellow-700' }
        return { text: 'Needs Attention', className: 'bg-red-100 text-red-700' }
    }

    // Use mock data when no real data is available
    const detectedIssues: SelfHealIssue[] = dashboard?.detected_issues || []
    const repairHistory: RepairHistoryItem[] = dashboard?.repair_history || []
    const healthScore = dashboard?.health_score ?? 100
    const totalTests = dashboard?.total_tests ?? 0
    const issuesDetected = dashboard?.issues_detected ?? 0
    const autoHealedThisWeek = dashboard?.auto_healed_this_week ?? 0
    const healthBadge = getHealthBadge(healthScore)

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center w-full bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading AI Self-Heal Dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Main Content - Dashboard & Issues */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Self-Heal Dashboard</h1>
                        <p className="text-gray-500">Intelligent test maintenance and automatic repair system</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={fetchDashboard}>
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${autoHealEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                <span className="text-sm font-medium text-gray-700">Auto-Heal System</span>
                            </div>
                            <Switch checked={autoHealEnabled} onCheckedChange={setAutoHealEnabled} />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <Badge variant="secondary" className={healthBadge.className}>{healthBadge.text}</Badge>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{healthScore}%</div>
                        <div className="text-sm text-gray-500">Health Score</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Search className="w-6 h-6 text-purple-600" />
                            </div>
                            <span className="text-xs text-gray-500">{totalTests} Total</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{totalTests}</div>
                        <div className="text-sm text-gray-500">Tests Monitored</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            {issuesDetected > 0 ? (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Action Needed</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">All Clear</Badge>
                            )}
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{issuesDetected}</div>
                        <div className="text-sm text-gray-500">Issues Detected</div>
                    </Card>

                    <Card className="p-6 border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Zap className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-xs text-gray-500">This Week</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{autoHealedThisWeek}</div>
                        <div className="text-sm text-gray-500">Auto-Healed</div>
                    </Card>
                </div>

                {/* Detected Issues Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Detected Issues & Suggestions
                    </h2>

                    <div className="space-y-4">
                        {detectedIssues.length === 0 ? (
                            <Card className="p-8 text-center border-gray-200">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Tests Healthy</h3>
                                <p className="text-gray-500">No issues detected. Your test suite is running smoothly.</p>
                            </Card>
                        ) : (
                            detectedIssues.map((issue) => (
                                <Card key={issue.id} className="border-gray-200 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                                        {issue.status}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">in</span>
                                                    <span className="font-semibold text-gray-900">{issue.test}</span>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">{issue.type}</h3>
                                                <p className="text-sm text-gray-500">Step: {issue.step}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900 mb-1">Confidence Score</div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{ width: `${issue.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-green-600">{issue.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Original Locator</div>
                                                    <div className="font-mono text-sm bg-white border border-gray-200 p-2 rounded text-red-600 line-through">
                                                        {issue.old_locator || 'N/A'}
                                                    </div>
                                                    <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" />
                                                        {issue.error_message || 'Element not found on page'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Suggestion</div>
                                                    {issue.suggestions.length > 0 ? (
                                                        <>
                                                            <div className="font-mono text-sm bg-white border border-green-200 p-2 rounded text-green-600 flex items-center justify-between">
                                                                {issue.suggestions[0].value}
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                                                                    {issue.suggestions[0].confidence}% Match
                                                                </Badge>
                                                            </div>
                                                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Verified by {issue.suggestions[0].type.toLowerCase()}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="font-mono text-sm bg-gray-100 border border-gray-200 p-2 rounded text-gray-500">
                                                            No suggestions available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button variant="outline" className="text-gray-600">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Preview
                                            </Button>
                                            <Button variant="outline" className="text-gray-600">
                                                <Wand2 className="w-4 h-4 mr-2" />
                                                Suggest More
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApplyFix(issue)}
                                                disabled={applyingFix === issue.id || !issue.suggestions.length}
                                            >
                                                {applyingFix === issue.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                )}
                                                Apply Fix
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - History & Config */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                {/* Repair History */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" />
                        Repair History
                    </h2>
                    {repairHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No repair history yet</p>
                    ) : (
                        <div className="space-y-4">
                            {repairHistory.map((item) => (
                                <div key={item.id} className="relative pl-4 border-l-2 border-gray-100 pb-4 last:pb-0">
                                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${item.success ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <div className="text-xs text-gray-500 mb-1">{formatDate(item.date)}</div>
                                    <div className="text-sm font-medium text-gray-900 mb-0.5">{item.type}</div>
                                    <div className="text-xs text-gray-600 mb-1">in {item.test}</div>
                                    <Badge variant="outline" className={`text-[10px] ${item.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                        {item.action}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button variant="ghost" className="w-full mt-4 text-xs text-blue-600 hover:text-blue-700">
                        View Full History
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>

                {/* Configuration */}
                <div className="p-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        Configuration
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Auto-Apply Low Risk</span>
                                <Switch checked={autoApplyLowRisk} onCheckedChange={setAutoApplyLowRisk} />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Notify on Issues</span>
                                <Switch checked={notifyOnIssues} onCheckedChange={setNotifyOnIssues} />
                            </label>
                            <label className="flex items-center justify-between text-sm text-gray-700">
                                <span>Visual Matching</span>
                                <Switch checked={visualMatching} onCheckedChange={setVisualMatching} />
                            </label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Confidence Threshold</span>
                                <span className="text-xs font-bold text-blue-600">{confidenceThreshold}%</span>
                            </div>
                            <Progress value={confidenceThreshold} className="h-2" />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Fixes with confidence score above {confidenceThreshold}% will be applied automatically if enabled.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button variant="outline" className="w-full">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Advanced Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
