'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
    Search,
    Filter,
    Download,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronRight,
    FileText,
    Terminal,
    Image,
    Video,
    Activity,
    ArrowUpRight,
    RotateCcw,
    Loader2,
    Play,
    RefreshCw
} from 'lucide-react'
import { webAutomationApi, ExecutionRun, ExecutionRunDetail, StepResult } from '@/lib/api/webAutomation'

interface LogsTabProps {
    projectId: string
}

export default function LogsTab({ projectId }: LogsTabProps) {
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all')
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

    // Data states
    const [executions, setExecutions] = useState<ExecutionRun[]>([])
    const [selectedExecution, setSelectedExecution] = useState<ExecutionRunDetail | null>(null)

    // Loading states
    const [isLoadingList, setIsLoadingList] = useState(true)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch executions list
    const fetchExecutions = useCallback(async () => {
        if (!projectId) return

        setIsLoadingList(true)
        setError(null)

        try {
            const data = await webAutomationApi.listProjectExecutions(projectId, {
                limit: 50
            })
            setExecutions(data)
        } catch (err: any) {
            console.error('Failed to fetch executions:', err)
            setError(err.message || 'Failed to load executions')
        } finally {
            setIsLoadingList(false)
        }
    }, [projectId])

    // Fetch execution details when selected
    const fetchExecutionDetails = useCallback(async (runId: string) => {
        setIsLoadingDetails(true)

        try {
            const data = await webAutomationApi.getExecutionRun(runId)
            setSelectedExecution(data)
        } catch (err: any) {
            console.error('Failed to fetch execution details:', err)
        } finally {
            setIsLoadingDetails(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchExecutions()
    }, [fetchExecutions])

    // Load details when selection changes
    useEffect(() => {
        if (selectedLogId) {
            fetchExecutionDetails(selectedLogId)
        } else {
            setSelectedExecution(null)
        }
    }, [selectedLogId, fetchExecutionDetails])

    // Filter executions
    const filteredExecutions = executions.filter(exe => {
        // Status filter
        if (statusFilter === 'completed' && exe.status !== 'completed') return false
        if (statusFilter === 'failed' && exe.status !== 'failed') return false
        if (statusFilter === 'running' && exe.status !== 'running') return false

        // Search filter
        if (searchQuery) {
            const testName = exe.test_flow_name || ''
            if (!testName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !exe.id.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
        }

        return true
    })

    // Helper functions
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Passed</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Failed</Badge>
            case 'running':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Running</Badge>
            case 'pending':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200">Pending</Badge>
            case 'stopped':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Stopped</Badge>
            case 'error':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Error</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'running': return <Play className="w-4 h-4 text-blue-600" />
            case 'pending': return <Clock className="w-4 h-4 text-gray-400" />
            case 'stopped': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
            case 'error': return <XCircle className="w-4 h-4 text-red-600" />
            default: return null
        }
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return '0s'
        if (ms < 1000) return `${ms}ms`
        const seconds = Math.floor(ms / 1000)
        if (seconds < 60) return `${seconds}s`
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
    }

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return 'Unknown'
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

        if (diffDays === 0) return `Today, ${timeStr}`
        if (diffDays === 1) return `Yesterday, ${timeStr}`
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`
    }

    const getStepStatusIcon = (status: string) => {
        switch (status) {
            case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'skipped': return <AlertTriangle className="w-4 h-4 text-gray-400" />
            case 'healed': return <RefreshCw className="w-4 h-4 text-blue-600" />
            case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            default: return <Clock className="w-4 h-4 text-gray-400" />
        }
    }

    const getStepStatusBadge = (status: string) => {
        switch (status) {
            case 'passed':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Passed</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
            case 'skipped':
                return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Skipped</Badge>
            case 'healed':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Healed</Badge>
            case 'running':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Running</Badge>
            case 'pending':
                return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Pending</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const toggleStepExpanded = (stepId: string) => {
        setExpandedSteps(prev => {
            const newSet = new Set(prev)
            if (newSet.has(stepId)) {
                newSet.delete(stepId)
            } else {
                newSet.add(stepId)
            }
            return newSet
        })
    }

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Execution List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
                        <Button variant="ghost" size="icon" onClick={fetchExecutions} disabled={isLoadingList}>
                            <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-8 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <Filter className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Badge
                            variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Badge>
                        <Badge
                            variant={statusFilter === 'completed' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('completed')}
                        >
                            Passed
                        </Badge>
                        <Badge
                            variant={statusFilter === 'failed' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('failed')}
                        >
                            Failed
                        </Badge>
                        <Badge
                            variant={statusFilter === 'running' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('running')}
                        >
                            Running
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoadingList ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            <p className="text-sm">{error}</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={fetchExecutions}>
                                Retry
                            </Button>
                        </div>
                    ) : filteredExecutions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No executions found</p>
                            {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
                        </div>
                    ) : (
                        filteredExecutions.map((exe) => (
                            <div
                                key={exe.id}
                                onClick={() => setSelectedLogId(exe.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedLogId === exe.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900 truncate flex-1 pr-2">
                                        {exe.test_flow_name || 'Unknown Test'}
                                    </span>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {formatTime(exe.created_at).split(',')[1]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    {getStatusIcon(exe.status)}
                                    <span className={`text-xs font-medium capitalize ${exe.status === 'completed' ? 'text-green-700' :
                                        exe.status === 'failed' ? 'text-red-700' :
                                            exe.status === 'running' ? 'text-blue-700' : 'text-gray-700'
                                        }`}>
                                        {exe.status === 'completed' ? 'Passed' : exe.status}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{exe.id.split('-')[0]}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDuration(exe.duration_ms)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        {exe.total_steps} steps
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Log Details */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {isLoadingDetails ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : selectedExecution ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {selectedExecution.test_flow_name || 'Unknown Test'}
                                    </h1>
                                    {getStatusBadge(selectedExecution.status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Terminal className="w-4 h-4" />
                                        {selectedExecution.id.split('-')[0]}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {formatTime(selectedExecution.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {formatDuration(selectedExecution.duration_ms)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Logs
                                </Button>
                                <Button size="sm">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Rerun Test
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                <Card className="p-4 bg-gray-50 border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Total Steps</div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedExecution.total_steps}</div>
                                </Card>
                                <Card className="p-4 bg-green-50 border-green-200">
                                    <div className="text-xs font-medium text-green-600 mb-1">Passed</div>
                                    <div className="text-2xl font-bold text-green-700">{selectedExecution.passed_steps}</div>
                                </Card>
                                <Card className="p-4 bg-red-50 border-red-200">
                                    <div className="text-xs font-medium text-red-600 mb-1">Failed</div>
                                    <div className="text-2xl font-bold text-red-700">{selectedExecution.failed_steps}</div>
                                </Card>
                                <Card className="p-4 bg-blue-50 border-blue-200">
                                    <div className="text-xs font-medium text-blue-600 mb-1">Healed</div>
                                    <div className="text-2xl font-bold text-blue-700">{selectedExecution.healed_steps}</div>
                                </Card>
                            </div>

                            {/* Error Message */}
                            {selectedExecution.error_message && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h3 className="text-sm font-semibold text-red-800 mb-2">Execution Error</h3>
                                    <p className="text-sm text-red-700 font-mono">{selectedExecution.error_message}</p>
                                </div>
                            )}

                            {/* Step Logs */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-900">Step Execution Details</h3>
                                    <span className="text-sm text-gray-500">
                                        {selectedExecution.step_results.length} steps
                                    </span>
                                </div>
                                {selectedExecution.step_results.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                                        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p>No step results available</p>
                                        <p className="text-xs mt-1">Steps will appear here after execution</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedExecution.step_results.map((step, index) => {
                                            const isExpanded = expandedSteps.has(step.id)
                                            return (
                                                <div
                                                    key={step.id}
                                                    className={`border rounded-lg overflow-hidden transition-all ${step.status === 'passed' ? 'border-green-200 bg-green-50/30' :
                                                        step.status === 'failed' ? 'border-red-200 bg-red-50/30' :
                                                            step.status === 'healed' ? 'border-blue-200 bg-blue-50/30' :
                                                                step.status === 'skipped' ? 'border-gray-200 bg-gray-50/30' :
                                                                    'border-gray-200 bg-white'
                                                        }`}
                                                >
                                                    {/* Step Header - Always Visible */}
                                                    <div
                                                        onClick={() => toggleStepExpanded(step.id)}
                                                        className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Step Number & Icon */}
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'passed' ? 'bg-green-100' :
                                                                step.status === 'failed' ? 'bg-red-100' :
                                                                    step.status === 'healed' ? 'bg-blue-100' :
                                                                        'bg-gray-100'
                                                                }`}>
                                                                {getStepStatusIcon(step.status)}
                                                            </div>

                                                            {/* Step Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-gray-900 truncate">
                                                                        Step {step.step_order + 1}: {step.step_name || step.step_type}
                                                                    </span>
                                                                    {getStepStatusBadge(step.status)}
                                                                    {step.was_healed && (
                                                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                                            Auto-Healed
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                    <span className="capitalize">{step.step_type}</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {formatDuration(step.duration_ms)}
                                                                    </span>
                                                                    {step.retry_count > 0 && (
                                                                        <span className="text-orange-600">
                                                                            {step.retry_count} {step.retry_count === 1 ? 'retry' : 'retries'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Chevron */}
                                                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-white/70">
                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                {/* Duration */}
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="text-xs font-medium text-gray-500 mb-1">Duration</div>
                                                                    <div className="text-lg font-semibold text-gray-900">
                                                                        {formatDuration(step.duration_ms)}
                                                                    </div>
                                                                </div>

                                                                {/* Status */}
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
                                                                    <div className="text-lg font-semibold capitalize">
                                                                        {step.status}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Selector Used */}
                                                            {step.selector_used && (
                                                                <div className="mt-4">
                                                                    <div className="text-xs font-medium text-gray-500 mb-2">Selector</div>
                                                                    <code className="block text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-800 break-all">
                                                                        {typeof step.selector_used === 'string'
                                                                            ? step.selector_used
                                                                            : step.selector_used.css || step.selector_used.xpath || JSON.stringify(step.selector_used)}
                                                                    </code>
                                                                </div>
                                                            )}

                                                            {/* Action Details */}
                                                            {step.action_details && Object.keys(step.action_details).length > 0 && (
                                                                <div className="mt-4">
                                                                    <div className="text-xs font-medium text-gray-500 mb-2">Action Details</div>
                                                                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                                                        {Object.entries(step.action_details).map(([key, value]) => (
                                                                            <div key={key} className="flex justify-between text-sm">
                                                                                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                                                                <span className="text-gray-900 font-mono text-xs">
                                                                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Expected vs Actual Result */}
                                                            {(step.expected_result || step.actual_result) && (
                                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                                    {step.expected_result && (
                                                                        <div className="bg-blue-50 rounded-lg p-3">
                                                                            <div className="text-xs font-medium text-blue-600 mb-1">Expected</div>
                                                                            <div className="text-sm text-blue-800">{step.expected_result}</div>
                                                                        </div>
                                                                    )}
                                                                    {step.actual_result && (
                                                                        <div className={`rounded-lg p-3 ${step.status === 'passed' ? 'bg-green-50' : 'bg-red-50'
                                                                            }`}>
                                                                            <div className={`text-xs font-medium mb-1 ${step.status === 'passed' ? 'text-green-600' : 'text-red-600'
                                                                                }`}>Actual</div>
                                                                            <div className={`text-sm ${step.status === 'passed' ? 'text-green-800' : 'text-red-800'
                                                                                }`}>{step.actual_result}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Error Message */}
                                                            {step.error_message && (
                                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                    <div className="text-xs font-medium text-red-600 mb-1">Error</div>
                                                                    <div className="text-sm text-red-700 font-mono">{step.error_message}</div>
                                                                    {step.error_stack && (
                                                                        <details className="mt-2">
                                                                            <summary className="text-xs text-red-500 cursor-pointer hover:text-red-600">
                                                                                Show Stack Trace
                                                                            </summary>
                                                                            <pre className="mt-2 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                                                                                {step.error_stack}
                                                                            </pre>
                                                                        </details>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Healing Applied */}
                                                            {step.healing_applied && (
                                                                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                                    <div className="text-xs font-medium text-purple-600 mb-2">Healing Applied</div>
                                                                    <pre className="text-xs text-purple-800 font-mono overflow-x-auto">
                                                                        {JSON.stringify(step.healing_applied, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            {/* Timestamps */}
                                                            {(step.started_at || step.ended_at) && (
                                                                <div className="mt-4 flex gap-4 text-xs text-gray-500">
                                                                    {step.started_at && (
                                                                        <span>Started: {new Date(step.started_at).toLocaleTimeString()}</span>
                                                                    )}
                                                                    {step.ended_at && (
                                                                        <span>Ended: {new Date(step.ended_at).toLocaleTimeString()}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Attachments */}
                                                            <div className="flex gap-2 mt-4">
                                                                {step.screenshot_url && (
                                                                    <Button variant="outline" size="sm" className="text-xs">
                                                                        <Image className="w-3 h-3 mr-1.5" />
                                                                        View Screenshot
                                                                    </Button>
                                                                )}
                                                                {step.console_logs?.length > 0 && (
                                                                    <Button variant="outline" size="sm" className="text-xs">
                                                                        <Terminal className="w-3 h-3 mr-1.5" />
                                                                        Console Logs ({step.console_logs.length})
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Execution Selected</h3>
                        <p className="max-w-sm mx-auto text-center">Select an execution from the list to view detailed logs, screenshots, and error reports.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
