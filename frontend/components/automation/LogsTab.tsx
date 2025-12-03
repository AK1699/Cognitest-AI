'use client'

import React, { useState } from 'react'
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
    RotateCcw
} from 'lucide-react'

interface ExecutionLog {
    id: string
    testName: string
    status: 'passed' | 'failed' | 'skipped' | 'warning'
    duration: string
    startTime: string
    browser: string
    steps: number
}

export default function LogsTab() {
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const executions: ExecutionLog[] = [
        { id: 'EXE-12847', testName: 'Complete Purchase Flow', status: 'passed', duration: '2m 15s', startTime: 'Today, 1:39 PM', browser: 'Chrome 120', steps: 12 },
        { id: 'EXE-12846', testName: 'Login Validation', status: 'failed', duration: '1m 45s', startTime: 'Today, 1:15 PM', browser: 'Firefox 118', steps: 5 },
        { id: 'EXE-12845', testName: 'User Registration', status: 'passed', duration: '2m 10s', startTime: 'Today, 11:30 AM', browser: 'Chrome 120', steps: 8 },
        { id: 'EXE-12844', testName: 'Password Reset', status: 'skipped', duration: '0s', startTime: 'Today, 10:00 AM', browser: 'Safari 17', steps: 0 },
        { id: 'EXE-12843', testName: 'Search Functionality', status: 'warning', duration: '3m 20s', startTime: 'Yesterday, 4:45 PM', browser: 'Edge 119', steps: 15 },
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'passed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Passed</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Failed</Badge>
            case 'skipped':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200">Skipped</Badge>
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Warning</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'skipped': return <AlertTriangle className="w-4 h-4 text-gray-400" />
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
            default: return null
        }
    }

    const selectedExecution = executions.find(e => e.id === selectedLogId)

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Execution List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Execution History</h2>
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
                        <Badge variant="secondary" className="cursor-pointer whitespace-nowrap">All</Badge>
                        <Badge variant="outline" className="cursor-pointer whitespace-nowrap hover:bg-gray-50">Passed</Badge>
                        <Badge variant="outline" className="cursor-pointer whitespace-nowrap hover:bg-gray-50">Failed</Badge>
                        <Badge variant="outline" className="cursor-pointer whitespace-nowrap hover:bg-gray-50">Last 24h</Badge>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {executions.map((exe) => (
                        <div
                            key={exe.id}
                            onClick={() => setSelectedLogId(exe.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedLogId === exe.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-900 truncate flex-1 pr-2">{exe.testName}</span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{exe.startTime.split(',')[1]}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(exe.status)}
                                <span className={`text-xs font-medium capitalize ${exe.status === 'passed' ? 'text-green-700' :
                                    exe.status === 'failed' ? 'text-red-700' :
                                        exe.status === 'warning' ? 'text-yellow-700' : 'text-gray-700'
                                    }`}>
                                    {exe.status}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{exe.id}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {exe.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {exe.steps} steps
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel - Log Details */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {selectedExecution ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-xl font-bold text-gray-900">{selectedExecution.testName}</h1>
                                    {getStatusBadge(selectedExecution.status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Terminal className="w-4 h-4" />
                                        {selectedExecution.id}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {selectedExecution.startTime}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {selectedExecution.duration}
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
                                    <div className="text-2xl font-bold text-gray-900">{selectedExecution.steps}</div>
                                </Card>
                                <Card className="p-4 bg-gray-50 border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Browser</div>
                                    <div className="text-2xl font-bold text-gray-900 truncate" title={selectedExecution.browser}>
                                        {selectedExecution.browser.split(' ')[0]}
                                    </div>
                                </Card>
                                <Card className="p-4 bg-gray-50 border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Platform</div>
                                    <div className="text-2xl font-bold text-gray-900">Mac</div>
                                </Card>
                                <Card className="p-4 bg-gray-50 border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Environment</div>
                                    <div className="text-2xl font-bold text-gray-900">Prod</div>
                                </Card>
                            </div>

                            {/* Step Logs */}
                            <div className="space-y-6">
                                <h3 className="text-base font-semibold text-gray-900">Step Execution Details</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <div key={step} className="border-b border-gray-200 last:border-0">
                                            <div className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${selectedExecution.status === 'failed' && step === 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {selectedExecution.status === 'failed' && step === 5 ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-gray-900">Step {step}: {
                                                            step === 1 ? 'Navigate to URL' :
                                                                step === 2 ? 'Click Login Button' :
                                                                    step === 3 ? 'Type Email' :
                                                                        step === 4 ? 'Type Password' : 'Assert Dashboard'
                                                        }</span>
                                                        <span className="text-xs text-gray-500">0.5s</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {step === 1 ? 'Navigated to https://shop.example.com' : 'Selector: #element-id'}
                                                    </div>

                                                    {/* Attachments */}
                                                    <div className="flex gap-2">
                                                        <Badge variant="secondary" className="text-xs font-normal bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                                            <Image className="w-3 h-3 mr-1 text-gray-500" />
                                                            Screenshot
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs font-normal bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                                            <FileText className="w-3 h-3 mr-1 text-gray-500" />
                                                            Console Log
                                                        </Badge>
                                                    </div>

                                                    {/* Error Message if failed */}
                                                    {selectedExecution.status === 'failed' && step === 5 && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-700 font-mono">
                                                            Error: Assertion failed. Expected element '#dashboard' to be visible, but it was not found.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
