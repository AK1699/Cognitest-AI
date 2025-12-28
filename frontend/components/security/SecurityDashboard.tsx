'use client'

import React, { useState, useEffect } from 'react'
import {
    Shield, ShieldAlert, ShieldCheck, AlertTriangle, Info,
    ArrowUpRight, ArrowDownRight, Activity, Target, Lock,
    FileSearch, Globe, GitBranch, ClipboardCheck, Server,
    RefreshCw, Plus, Play, ChevronRight, Clock, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface SecurityStats {
    project_id: string
    total_scans: number
    total_assets: number
    total_vulnerabilities: number
    open_vulnerabilities: number
    resolved_vulnerabilities: number
    overall_risk_score: number
    risk_grade: string
    risk_trend: string
    severity_breakdown: {
        critical: number
        high: number
        medium: number
        low: number
        info: number
    }
    top_categories: Array<{ category: string; count: number; percentage: number }>
    scans_last_7_days: number
    scans_last_30_days: number
    new_vulnerabilities_last_7_days: number
    resolved_last_7_days: number
    certificates_monitored: number
    certificates_expiring_soon: number
}

interface SecurityScan {
    id: string
    human_id: string
    name: string
    scan_type: string
    status: string
    progress_percentage: number
    total_vulnerabilities: number
    critical_count: number
    high_count: number
    risk_score: number
    risk_grade: string
    created_at: string
    completed_at: string | null
}

interface SecurityDashboardProps {
    projectId: string
    organisationId: string
}

const getRiskColor = (grade: string): string => {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'text-green-600 bg-green-100'
        case 'B':
            return 'text-blue-600 bg-blue-100'
        case 'C':
            return 'text-yellow-600 bg-yellow-100'
        case 'D':
            return 'text-orange-600 bg-orange-100'
        case 'F':
            return 'text-red-600 bg-red-100'
        default:
            return 'text-gray-600 bg-gray-100'
    }
}

const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
        case 'critical':
            return 'bg-red-500 text-white'
        case 'high':
            return 'bg-orange-500 text-white'
        case 'medium':
            return 'bg-yellow-500 text-white'
        case 'low':
            return 'bg-blue-500 text-white'
        case 'info':
            return 'bg-gray-400 text-white'
        default:
            return 'bg-gray-300 text-gray-700'
    }
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-700'
        case 'running':
            return 'bg-blue-100 text-blue-700'
        case 'failed':
            return 'bg-red-100 text-red-700'
        case 'pending':
        case 'queued':
            return 'bg-gray-100 text-gray-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

const getScanTypeIcon = (scanType: string) => {
    switch (scanType) {
        case 'url_security':
            return <Globe className="w-4 h-4" />
        case 'repo_security':
            return <GitBranch className="w-4 h-4" />
        case 'vapt':
            return <ShieldAlert className="w-4 h-4" />
        case 'compliance':
            return <ClipboardCheck className="w-4 h-4" />
        case 'api_security':
            return <Server className="w-4 h-4" />
        default:
            return <Shield className="w-4 h-4" />
    }
}

export function SecurityDashboard({ projectId, organisationId }: SecurityDashboardProps) {
    const [stats, setStats] = useState<SecurityStats | null>(null)
    const [recentScans, setRecentScans] = useState<SecurityScan[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchDashboardData()
    }, [projectId])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            // Fetch dashboard stats
            const statsResponse = await fetch(`/api/v1/security/dashboard/${projectId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (statsResponse.ok) {
                const statsData = await statsResponse.json()
                setStats(statsData)
            }

            // Fetch recent scans
            const scansResponse = await fetch(`/api/v1/security/scans?project_id=${projectId}&page_size=5`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (scansResponse.ok) {
                const scansData = await scansResponse.json()
                setRecentScans(scansData.items || [])
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        )
    }

    const mockStats: SecurityStats = stats || {
        project_id: projectId,
        total_scans: 0,
        total_assets: 0,
        total_vulnerabilities: 0,
        open_vulnerabilities: 0,
        resolved_vulnerabilities: 0,
        overall_risk_score: 0,
        risk_grade: 'A+',
        risk_trend: 'stable',
        severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        top_categories: [],
        scans_last_7_days: 0,
        scans_last_30_days: 0,
        new_vulnerabilities_last_7_days: 0,
        resolved_last_7_days: 0,
        certificates_monitored: 0,
        certificates_expiring_soon: 0
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Security Overview</h2>
                    <p className="text-gray-500 mt-1">Monitor and manage your security posture</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchDashboardData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Scan
                    </Button>
                </div>
            </div>

            {/* Risk Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1 bg-gradient-to-br from-teal-50 to-white border-teal-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-4xl font-bold px-3 py-1 rounded-lg ${getRiskColor(mockStats.risk_grade)}`}>
                                        {mockStats.risk_grade}
                                    </span>
                                    {mockStats.risk_trend === 'improving' && (
                                        <ArrowDownRight className="w-5 h-5 text-green-500" />
                                    )}
                                    {mockStats.risk_trend === 'declining' && (
                                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Score: {mockStats.overall_risk_score.toFixed(1)}/100
                                </p>
                            </div>
                            <Shield className="w-12 h-12 text-teal-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Open Vulnerabilities</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {mockStats.open_vulnerabilities}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {mockStats.resolved_vulnerabilities} resolved
                                </p>
                            </div>
                            <ShieldAlert className="w-10 h-10 text-orange-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">
                                    {mockStats.severity_breakdown.critical}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {mockStats.severity_breakdown.high} high severity
                                </p>
                            </div>
                            <AlertTriangle className="w-10 h-10 text-red-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    {mockStats.total_scans}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {mockStats.scans_last_7_days} in last 7 days
                                </p>
                            </div>
                            <Activity className="w-10 h-10 text-teal-500 opacity-70" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Severity Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Vulnerability Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-16 text-sm font-medium text-gray-600">Critical</span>
                            <div className="flex-1">
                                <Progress
                                    value={mockStats.total_vulnerabilities > 0
                                        ? (mockStats.severity_breakdown.critical / mockStats.total_vulnerabilities) * 100
                                        : 0}
                                    className="h-2 bg-gray-100"
                                />
                            </div>
                            <Badge className="bg-red-500 text-white min-w-[40px] justify-center">
                                {mockStats.severity_breakdown.critical}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-16 text-sm font-medium text-gray-600">High</span>
                            <div className="flex-1">
                                <Progress
                                    value={mockStats.total_vulnerabilities > 0
                                        ? (mockStats.severity_breakdown.high / mockStats.total_vulnerabilities) * 100
                                        : 0}
                                    className="h-2 bg-gray-100"
                                />
                            </div>
                            <Badge className="bg-orange-500 text-white min-w-[40px] justify-center">
                                {mockStats.severity_breakdown.high}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-16 text-sm font-medium text-gray-600">Medium</span>
                            <div className="flex-1">
                                <Progress
                                    value={mockStats.total_vulnerabilities > 0
                                        ? (mockStats.severity_breakdown.medium / mockStats.total_vulnerabilities) * 100
                                        : 0}
                                    className="h-2 bg-gray-100"
                                />
                            </div>
                            <Badge className="bg-yellow-500 text-white min-w-[40px] justify-center">
                                {mockStats.severity_breakdown.medium}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-16 text-sm font-medium text-gray-600">Low</span>
                            <div className="flex-1">
                                <Progress
                                    value={mockStats.total_vulnerabilities > 0
                                        ? (mockStats.severity_breakdown.low / mockStats.total_vulnerabilities) * 100
                                        : 0}
                                    className="h-2 bg-gray-100"
                                />
                            </div>
                            <Badge className="bg-blue-500 text-white min-w-[40px] justify-center">
                                {mockStats.severity_breakdown.low}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-16 text-sm font-medium text-gray-600">Info</span>
                            <div className="flex-1">
                                <Progress
                                    value={mockStats.total_vulnerabilities > 0
                                        ? (mockStats.severity_breakdown.info / mockStats.total_vulnerabilities) * 100
                                        : 0}
                                    className="h-2 bg-gray-100"
                                />
                            </div>
                            <Badge className="bg-gray-400 text-white min-w-[40px] justify-center">
                                {mockStats.severity_breakdown.info}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:border-teal-300 transition-colors">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">URL Security</h3>
                                <p className="text-sm text-gray-500">SSL, Headers, Ports</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-teal-300 transition-colors">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <GitBranch className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Repo Security</h3>
                                <p className="text-sm text-gray-500">Secrets, Dependencies</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-teal-300 transition-colors">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                <ShieldAlert className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">VAPT</h3>
                                <p className="text-sm text-gray-500">OWASP Top 10</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-teal-300 transition-colors">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <ClipboardCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Compliance</h3>
                                <p className="text-sm text-gray-500">ISO, SOC 2, GDPR</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Scans */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Recent Scans</CardTitle>
                        <Button variant="ghost" size="sm">
                            View All
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentScans.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No security scans yet</p>
                            <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                                <Play className="w-4 h-4 mr-2" />
                                Start First Scan
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentScans.map((scan) => (
                                <div
                                    key={scan.id}
                                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        {getScanTypeIcon(scan.scan_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-gray-900 truncate">{scan.name}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {scan.human_id}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Badge className={getStatusColor(scan.status)}>
                                        {scan.status}
                                    </Badge>
                                    {scan.status === 'running' && (
                                        <div className="w-20">
                                            <Progress value={scan.progress_percentage} className="h-1" />
                                        </div>
                                    )}
                                    {scan.status === 'completed' && (
                                        <div className="flex items-center gap-2">
                                            {scan.critical_count > 0 && (
                                                <Badge className="bg-red-500 text-white">{scan.critical_count} Critical</Badge>
                                            )}
                                            {scan.high_count > 0 && (
                                                <Badge className="bg-orange-500 text-white">{scan.high_count} High</Badge>
                                            )}
                                        </div>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default SecurityDashboard
