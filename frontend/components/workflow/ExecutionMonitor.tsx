'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
    X,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
    Play,
    Pause,
    RotateCcw,
    Maximize2,
    Minimize2,
} from 'lucide-react'
import { workflowAPI, ExecutionDetail, ExecutionStepSummary } from '@/lib/api/workflow'

interface ExecutionMonitorProps {
    executionId: string
    onClose: () => void
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
    executionId,
    onClose,
}) => {
    const [execution, setExecution] = useState<ExecutionDetail | null>(null)
    const [isExpanded, setIsExpanded] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [ws, setWs] = useState<WebSocket | null>(null)

    // Fetch initial execution state
    useEffect(() => {
        loadExecution()
        connectWebSocket()

        return () => {
            ws?.close()
        }
    }, [executionId])

    const loadExecution = async () => {
        try {
            const data = await workflowAPI.getExecution(executionId)
            setExecution(data)
        } catch (error) {
            console.error('Failed to load execution:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const connectWebSocket = () => {
        try {
            const socket = workflowAPI.connectExecutionWebSocket(executionId)

            socket.onopen = () => {
                console.log('WebSocket connected for execution:', executionId)
            }

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    handleWebSocketMessage(data)
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error)
                }
            }

            socket.onerror = (error) => {
                console.error('WebSocket error:', error)
            }

            socket.onclose = () => {
                console.log('WebSocket closed')
            }

            setWs(socket)
        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
        }
    }

    const handleWebSocketMessage = (data: any) => {
        switch (data.type) {
            case 'status_change':
                setExecution(prev => prev ? { ...prev, status: data.status } : null)
                if (['completed', 'failed', 'stopped'].includes(data.status)) {
                    loadExecution() // Refresh full data on completion
                }
                break
            case 'step_started':
                setExecution(prev => prev ? {
                    ...prev,
                    current_node_id: data.node_id,
                    steps: prev.steps ? [...prev.steps, data.step] : [data.step]
                } : null)
                break
            case 'step_completed':
            case 'step_failed':
                setExecution(prev => {
                    if (!prev) return null
                    const updatedSteps = prev.steps.map(step =>
                        step.node_id === data.node_id ? { ...step, ...data.step } : step
                    )
                    return {
                        ...prev,
                        completed_nodes: prev.completed_nodes + (data.type === 'step_completed' ? 1 : 0),
                        failed_nodes: prev.failed_nodes + (data.type === 'step_failed' ? 1 : 0),
                        steps: updatedSteps
                    }
                })
                break
            case 'log':
                // Handle log messages
                break
        }
    }

    const handleStop = async () => {
        try {
            const updated = await workflowAPI.stopExecution(executionId)
            setExecution(prev => prev ? { ...prev, status: updated.status } : null)
        } catch (error) {
            console.error('Failed to stop execution:', error)
        }
    }

    const handleRetry = async () => {
        try {
            const newExecution = await workflowAPI.retryExecution(executionId)
            // Could navigate to new execution or update state
        } catch (error) {
            console.error('Failed to retry execution:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-400" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-400" />
            case 'running':
                return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            case 'stopped':
                return <Pause className="h-4 w-4 text-yellow-400" />
            case 'pending':
            case 'queued':
                return <Clock className="h-4 w-4 text-zinc-400" />
            default:
                return <AlertCircle className="h-4 w-4 text-zinc-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400 bg-green-400/10 border-green-400/30'
            case 'failed':
                return 'text-red-400 bg-red-400/10 border-red-400/30'
            case 'running':
                return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
            case 'stopped':
                return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
            default:
                return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30'
        }
    }

    const progress = execution
        ? (execution.total_nodes > 0
            ? ((execution.completed_nodes + execution.failed_nodes) / execution.total_nodes) * 100
            : 0)
        : 0

    return (
        <div className={`border-t border-zinc-800 bg-zinc-900 transition-all ${isExpanded ? 'h-64' : 'h-12'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                    </Button>

                    <span className="text-sm font-medium text-white">Execution Monitor</span>

                    {execution && (
                        <>
                            <Badge variant="outline" className="text-xs">
                                {execution.human_id}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(execution.status)}>
                                {getStatusIcon(execution.status)}
                                <span className="ml-1">{execution.status}</span>
                            </Badge>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {execution?.status === 'running' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStop}
                            className="h-7 text-xs text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                            <Pause className="h-3 w-3 mr-1" />
                            Stop
                        </Button>
                    )}

                    {['failed', 'stopped'].includes(execution?.status || '') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            className="h-7 text-xs"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="flex h-[calc(100%-48px)]">
                    {/* Progress Section */}
                    <div className="w-64 p-4 border-r border-zinc-800">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                            </div>
                        ) : execution ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <div className="text-zinc-500">Total</div>
                                        <div className="text-white font-medium">{execution.total_nodes}</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <div className="text-zinc-500">Completed</div>
                                        <div className="text-green-400 font-medium">{execution.completed_nodes}</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <div className="text-zinc-500">Failed</div>
                                        <div className="text-red-400 font-medium">{execution.failed_nodes}</div>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <div className="text-zinc-500">Duration</div>
                                        <div className="text-white font-medium">
                                            {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(1)}s` : '-'}
                                        </div>
                                    </div>
                                </div>

                                {execution.error_message && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                        <p className="text-xs text-red-400">{execution.error_message}</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Steps Timeline */}
                    <ScrollArea className="flex-1 p-4">
                        {execution?.steps && execution.steps.length > 0 ? (
                            <div className="space-y-2">
                                {execution.steps.map((step, index) => (
                                    <StepCard key={step.id} step={step} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                                {isLoading ? 'Loading...' : 'No steps executed yet'}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}

interface StepCardProps {
    step: ExecutionStepSummary
    index: number
}

const StepCard: React.FC<StepCardProps> = ({ step, index }) => {
    const getStepStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-400" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-400" />
            case 'running':
                return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            case 'skipped':
                return <AlertCircle className="h-4 w-4 text-yellow-400" />
            default:
                return <Clock className="h-4 w-4 text-zinc-400" />
        }
    }

    return (
        <div className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 text-xs text-zinc-300">
                {index + 1}
            </div>
            {getStepStatusIcon(step.status)}
            <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{step.node_name || step.node_id}</div>
                <div className="text-xs text-zinc-500">{step.node_type}</div>
            </div>
            <div className="text-xs text-zinc-400">
                {step.duration_ms ? `${step.duration_ms}ms` : '-'}
            </div>
            {step.error_message && (
                <div className="max-w-[200px] text-xs text-red-400 truncate" title={step.error_message}>
                    {step.error_message}
                </div>
            )}
        </div>
    )
}

export default ExecutionMonitor
