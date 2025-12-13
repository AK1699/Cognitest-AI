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
    RefreshCw,
    FileJson,
    FileSpreadsheet,
    FileCode,
    Copy,
    Check
} from 'lucide-react'
import { webAutomationApi, ExecutionRun, ExecutionRunDetail, StepResult } from '@/lib/api/webAutomation'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LogsTabProps {
    projectId: string
}

export default function LogsTab({ projectId }: LogsTabProps) {
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all')
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

    // Data states
    const [executions, setExecutions] = useState<ExecutionRun[]>([])
    const [selectedExecution, setSelectedExecution] = useState<ExecutionRunDetail | null>(null)

    // Loading states
    const [isLoadingList, setIsLoadingList] = useState(true)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(false)
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

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            fetchExecutions()
        }, 10000) // Refresh every 10 seconds

        return () => clearInterval(interval)
    }, [autoRefresh, fetchExecutions])

    // Calculate pass rate
    const passRate = executions.length > 0
        ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
        : 0

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

        // Date filter
        if (dateFilter !== 'all' && exe.created_at) {
            const exeDate = new Date(exe.created_at)
            const now = new Date()
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            if (dateFilter === 'today') {
                if (exeDate < startOfToday) return false
            } else if (dateFilter === '7days') {
                const sevenDaysAgo = new Date(startOfToday)
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                if (exeDate < sevenDaysAgo) return false
            } else if (dateFilter === '30days') {
                const thirtyDaysAgo = new Date(startOfToday)
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                if (exeDate < thirtyDaysAgo) return false
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

    // Export logs as JSON file
    const handleExportJSON = () => {
        if (!selectedExecution) return

        const exportData = {
            execution_id: selectedExecution.id,
            test_name: selectedExecution.test_flow_name,
            status: selectedExecution.status,
            started_at: selectedExecution.created_at,
            ended_at: selectedExecution.ended_at,
            duration_ms: selectedExecution.duration_ms,
            browser_type: selectedExecution.browser_type,
            total_steps: selectedExecution.total_steps,
            passed_steps: selectedExecution.passed_steps,
            failed_steps: selectedExecution.failed_steps,
            healed_steps: selectedExecution.healed_steps,
            error_message: selectedExecution.error_message,
            steps: selectedExecution.step_results.map((step, index) => ({
                step_number: index + 1,
                step_name: step.step_name || step.step_type,
                step_type: step.step_type,
                status: step.status,
                duration_ms: step.duration_ms,
                selector: step.selector_used,
                error_message: step.error_message,
                was_healed: step.was_healed
            }))
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `execution-log-${selectedExecution.id.split('-')[0]}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Execution logs exported as JSON')
    }

    // Export logs as CSV file
    const handleExportCSV = () => {
        if (!selectedExecution) return

        const headers = ['Step #', 'Step Name', 'Type', 'Status', 'Duration (ms)', 'Selector', 'Error Message', 'Was Healed']
        const rows = selectedExecution.step_results.map((step, index) => [
            index + 1,
            step.step_name || step.step_type,
            step.step_type,
            step.status,
            step.duration_ms || 0,
            typeof step.selector_used === 'string' ? step.selector_used : JSON.stringify(step.selector_used || ''),
            step.error_message || '',
            step.was_healed ? 'Yes' : 'No'
        ])

        // Add summary row
        const summaryRows = [
            [],
            ['Test Summary'],
            ['Test Name', selectedExecution.test_flow_name || 'Unknown'],
            ['Status', selectedExecution.status],
            ['Total Steps', selectedExecution.total_steps],
            ['Passed', selectedExecution.passed_steps],
            ['Failed', selectedExecution.failed_steps],
            ['Duration', formatDuration(selectedExecution.duration_ms)],
            ['Executed At', selectedExecution.created_at]
        ]

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ...summaryRows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `execution-log-${selectedExecution.id.split('-')[0]}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Execution logs exported as CSV')
    }

    // Export logs as HTML report
    const handleExportHTML = () => {
        if (!selectedExecution) return

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${selectedExecution.test_flow_name || 'Unknown Test'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; padding: 2rem; }
        .header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .header .meta { opacity: 0.9; font-size: 0.875rem; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .status-passed { background: #dcfce7; color: #166534; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .status-running { background: #dbeafe; color: #1e40af; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1.5rem; background: #f8fafc; }
        .summary-card { background: white; padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
        .summary-card .value { font-size: 1.5rem; font-weight: 700; }
        .summary-card .label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .steps { padding: 1.5rem; }
        .steps h2 { font-size: 1.125rem; margin-bottom: 1rem; color: #1e293b; }
        .step { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden; }
        .step-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #f8fafc; }
        .step-number { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; }
        .step-passed .step-number { background: #dcfce7; color: #166534; }
        .step-failed .step-number { background: #fee2e2; color: #991b1b; }
        .step-info { flex: 1; }
        .step-name { font-weight: 600; color: #1e293b; }
        .step-type { font-size: 0.75rem; color: #64748b; }
        .step-details { padding: 1rem; font-size: 0.875rem; }
        .detail-row { display: flex; margin-bottom: 0.5rem; }
        .detail-label { width: 120px; color: #64748b; }
        .detail-value { flex: 1; color: #1e293b; }
        .error-box { background: #fee2e2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.75rem; margin-top: 0.5rem; color: #991b1b; font-family: monospace; font-size: 0.8rem; }
        .footer { padding: 1.5rem; background: #f8fafc; text-align: center; color: #64748b; font-size: 0.75rem; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${selectedExecution.test_flow_name || 'Unknown Test'}</h1>
            <div class="meta">
                <span class="status-badge status-${selectedExecution.status}">${selectedExecution.status === 'completed' ? 'Passed' : selectedExecution.status}</span>
                &nbsp;&nbsp;•&nbsp;&nbsp;
                Executed: ${new Date(selectedExecution.created_at).toLocaleString()}
                &nbsp;&nbsp;•&nbsp;&nbsp;
                Duration: ${formatDuration(selectedExecution.duration_ms)}
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="value">${selectedExecution.total_steps}</div>
                <div class="label">Total Steps</div>
            </div>
            <div class="summary-card">
                <div class="value" style="color: #16a34a">${selectedExecution.passed_steps}</div>
                <div class="label">Passed</div>
            </div>
            <div class="summary-card">
                <div class="value" style="color: #dc2626">${selectedExecution.failed_steps}</div>
                <div class="label">Failed</div>
            </div>
            <div class="summary-card">
                <div class="value" style="color: #2563eb">${selectedExecution.healed_steps}</div>
                <div class="label">Healed</div>
            </div>
        </div>
        
        <div class="steps">
            <h2>Step Details</h2>
            ${selectedExecution.step_results.map((step, index) => `
                <div class="step step-${step.status}">
                    <div class="step-header">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-info">
                            <div class="step-name">${step.step_name || step.step_type}</div>
                            <div class="step-type">${step.step_type} • ${formatDuration(step.duration_ms)}</div>
                        </div>
                        <span class="status-badge status-${step.status}">${step.status}</span>
                    </div>
                    ${step.selector_used || step.error_message ? `
                        <div class="step-details">
                            ${step.selector_used ? `
                                <div class="detail-row">
                                    <span class="detail-label">Selector:</span>
                                    <code class="detail-value">${typeof step.selector_used === 'string' ? step.selector_used : JSON.stringify(step.selector_used)}</code>
                                </div>
                            ` : ''}
                            ${step.error_message ? `
                                <div class="error-box">${step.error_message}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            Generated by Cognitest AI • ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `execution-report-${selectedExecution.id.split('-')[0]}-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('Execution report exported as HTML')
    }

    // Rerun the test
    const handleRerunTest = async () => {
        if (!selectedExecution?.test_flow_id) return

        setIsRerunning(true)

        try {
            // Execute the test flow using the API
            await webAutomationApi.executeTestFlow(selectedExecution.test_flow_id, {
                execution_mode: 'headless',
                browser_type: selectedExecution.browser_type || 'chromium'
            })

            toast.success('Test rerun started! Check the execution list for the new run.')

            // Refresh the executions list to show the new run
            await fetchExecutions()
        } catch (err: any) {
            console.error('Failed to rerun test:', err)
            toast.error(`Failed to rerun test: ${err.message || 'Unknown error'}`)
        } finally {
            setIsRerunning(false)
        }
    }

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Execution List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
                        <div className="flex items-center gap-1">
                            <Button
                                variant={autoRefresh ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className="text-xs h-8 px-2"
                                title={autoRefresh ? 'Auto-refresh ON (10s)' : 'Enable auto-refresh'}
                            >
                                {autoRefresh && <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />}
                                Auto
                            </Button>
                            <Button variant="ghost" size="icon" onClick={fetchExecutions} disabled={isLoadingList}>
                                <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Pass Rate Bar */}
                    {executions.length > 0 && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Pass Rate</span>
                                <span className={`font-semibold ${passRate >= 80 ? 'text-green-600' : passRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {passRate}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${passRate >= 80 ? 'bg-green-500' : passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${passRate}%` }}
                                />
                            </div>
                        </div>
                    )}
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <Filter className={`w-4 h-4 ${dateFilter !== 'all' ? 'text-blue-600' : 'text-gray-500'}`} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    onClick={() => setDateFilter('all')}
                                    className={`cursor-pointer ${dateFilter === 'all' ? 'bg-blue-50' : ''}`}
                                >
                                    All Time
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDateFilter('today')}
                                    className={`cursor-pointer ${dateFilter === 'today' ? 'bg-blue-50' : ''}`}
                                >
                                    Today
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDateFilter('7days')}
                                    className={`cursor-pointer ${dateFilter === '7days' ? 'bg-blue-50' : ''}`}
                                >
                                    Last 7 Days
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDateFilter('30days')}
                                    className={`cursor-pointer ${dateFilter === '30days' ? 'bg-blue-50' : ''}`}
                                >
                                    Last 30 Days
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Badge
                            variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setStatusFilter('all')}
                        >
                            All ({executions.length})
                        </Badge>
                        <Badge
                            variant={statusFilter === 'completed' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('completed')}
                        >
                            Passed ({executions.filter(e => e.status === 'completed').length})
                        </Badge>
                        <Badge
                            variant={statusFilter === 'failed' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('failed')}
                        >
                            Failed ({executions.filter(e => e.status === 'failed').length})
                        </Badge>
                        <Badge
                            variant={statusFilter === 'running' ? 'secondary' : 'outline'}
                            className="cursor-pointer whitespace-nowrap hover:bg-gray-50"
                            onClick={() => setStatusFilter('running')}
                        >
                            Running ({executions.filter(e => e.status === 'running').length})
                        </Badge>
                        {/* Clear filters button */}
                        {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                            <Badge
                                variant="outline"
                                className="cursor-pointer whitespace-nowrap hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                onClick={() => {
                                    setSearchQuery('')
                                    setStatusFilter('all')
                                    setDateFilter('all')
                                }}
                            >
                                ✕ Clear
                            </Badge>
                        )}
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export Logs
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer">
                                            <FileJson className="w-4 h-4 mr-2" />
                                            <span>Export as JSON</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            <span>Export as CSV</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportHTML} className="cursor-pointer">
                                            <FileCode className="w-4 h-4 mr-2" />
                                            <span>Export as HTML Report</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button size="sm" onClick={handleRerunTest} disabled={isRerunning}>
                                    {isRerunning ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                    )}
                                    {isRerunning ? 'Rerunning...' : 'Rerun Test'}
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
                                <Card
                                    className={`p-4 bg-red-50 border-red-200 ${selectedExecution.failed_steps > 0 ? 'cursor-pointer hover:bg-red-100 transition-colors' : ''}`}
                                    onClick={() => {
                                        if (selectedExecution.failed_steps > 0) {
                                            const firstFailedStep = selectedExecution.step_results.find(s => s.status === 'failed')
                                            if (firstFailedStep) {
                                                setExpandedSteps(new Set([firstFailedStep.id]))
                                                // Scroll to the step after a short delay
                                                setTimeout(() => {
                                                    const stepElement = document.getElementById(`step-${firstFailedStep.id}`)
                                                    stepElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                }, 100)
                                            }
                                        }
                                    }}
                                >
                                    <div className="text-xs font-medium text-red-600 mb-1">
                                        Failed {selectedExecution.failed_steps > 0 && <span className="text-red-400">(click to view)</span>}
                                    </div>
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
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                const allIds = new Set(selectedExecution.step_results.map(s => s.id))
                                                setExpandedSteps(allIds)
                                            }}
                                        >
                                            Expand All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setExpandedSteps(new Set())}
                                        >
                                            Collapse All
                                        </Button>
                                        <span className="text-sm text-gray-500">
                                            {selectedExecution.step_results.length} steps
                                        </span>
                                    </div>
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
                                                    id={`step-${step.id}`}
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
                                                                        Step {step.step_order + 1}: {(step.step_name || step.step_type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
                                                                    <span className="capitalize">{step.step_type.replace(/_/g, ' ')}</span>
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

                                                                {/* Action-specific details */}
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {/* Navigate - show URL */}
                                                                    {step.step_type === 'navigate' && step.action_details?.url && (
                                                                        <code className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-mono border border-blue-200">
                                                                            🔗 {step.action_details.url}
                                                                        </code>
                                                                    )}

                                                                    {/* Assert Title - show expected title */}
                                                                    {step.step_type === 'assert_title' && (
                                                                        <code className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md font-mono border border-emerald-200">
                                                                            🏷️ "{step.action_details?.expected_title || step.action_details?.value || step.expected_result || ''}"
                                                                        </code>
                                                                    )}

                                                                    {/* Assert URL - show expected URL */}
                                                                    {step.step_type === 'assert_url' && (
                                                                        <code className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-mono border border-purple-200">
                                                                            🔗 {step.action_details?.expected_url || step.action_details?.value || step.expected_result || ''}
                                                                        </code>
                                                                    )}

                                                                    {/* Type/Fill - show value being typed */}
                                                                    {(step.step_type === 'type' || step.step_type === 'fill') && step.action_details?.value && (
                                                                        <code className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md font-mono border border-amber-200">
                                                                            ⌨️ "{step.action_details.value}"
                                                                        </code>
                                                                    )}

                                                                    {/* Click/Type - show selector */}
                                                                    {(step.step_type === 'click' || step.step_type === 'type' || step.step_type === 'fill' || step.step_type === 'hover') && step.selector_used && (
                                                                        <code className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-mono border border-gray-200">
                                                                            🎯 {typeof step.selector_used === 'string' ? step.selector_used : (step.selector_used.css || step.selector_used.xpath || '')}
                                                                        </code>
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
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-medium text-gray-500">Selector</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 px-2 text-xs"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                const selectorText = typeof step.selector_used === 'string'
                                                                                    ? step.selector_used
                                                                                    : step.selector_used.css || step.selector_used.xpath || JSON.stringify(step.selector_used)
                                                                                navigator.clipboard.writeText(selectorText)
                                                                                toast.success('Selector copied to clipboard')
                                                                            }}
                                                                        >
                                                                            <Copy className="w-3 h-3 mr-1" />
                                                                            Copy
                                                                        </Button>
                                                                    </div>
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
