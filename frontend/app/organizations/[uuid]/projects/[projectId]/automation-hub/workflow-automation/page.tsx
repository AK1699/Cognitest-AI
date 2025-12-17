'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Plus,
    Search,
    Workflow,
    Play,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    ArrowLeft,
    Filter,
    RefreshCw,
    Trash2,
    Copy,
    Settings,
    ChevronRight,
    Zap,
    Calendar,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { workflowAPI, WorkflowSummary } from '@/lib/api/workflow'

export default function WorkflowAutomationPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const orgId = params.uuid as string

    const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    useEffect(() => {
        loadWorkflows()
    }, [projectId])

    const loadWorkflows = async () => {
        setIsLoading(true)
        try {
            const response = await workflowAPI.list({
                project_id: projectId,
                status_filter: statusFilter || undefined,
                search: searchQuery || undefined,
            })
            setWorkflows(response.items)
        } catch (error) {
            console.error('Failed to load workflows:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (workflowId: string) => {
        try {
            await workflowAPI.delete(workflowId)
            setWorkflows(prev => prev.filter(w => w.id !== workflowId))
        } catch (error) {
            console.error('Failed to delete workflow:', error)
        }
    }

    const handleDuplicate = async (workflowId: string) => {
        try {
            const duplicated = await workflowAPI.duplicate(workflowId)
            setWorkflows(prev => [duplicated, ...prev])
        } catch (error) {
            console.error('Failed to duplicate workflow:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
            active: {
                className: 'text-green-600 border-green-200 bg-green-50',
                icon: <CheckCircle2 className="h-3 w-3" />
            },
            draft: {
                className: 'text-amber-600 border-amber-200 bg-amber-50',
                icon: <Clock className="h-3 w-3" />
            },
            inactive: {
                className: 'text-gray-500 border-gray-200 bg-gray-50',
                icon: <XCircle className="h-3 w-3" />
            },
            archived: {
                className: 'text-gray-400 border-gray-200 bg-gray-100',
                icon: <XCircle className="h-3 w-3" />
            },
        }
        const config = statusConfig[status] || statusConfig.draft
        return (
            <Badge variant="outline" className={`gap-1 ${config.className}`}>
                {config.icon}
                {status}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub`)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Workflow className="h-6 w-6 text-purple-600" />
                                Workflow Automation
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Build and automate complex workflows with a visual node-based editor
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search workflows..."
                                    className="pl-9 bg-white border-gray-300"
                                    onKeyDown={(e) => e.key === 'Enter' && loadWorkflows()}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 border-gray-300">
                                        <Filter className="h-4 w-4" />
                                        {statusFilter || 'All Status'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                        All Status
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                                        Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                                        Draft
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                                        Inactive
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" onClick={loadWorkflows} className="text-gray-600">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation/new`)}
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="h-4 w-4" />
                            New Workflow
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="bg-white border-gray-200 p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-4" />
                                <Skeleton className="h-20 w-full" />
                            </Card>
                        ))}
                    </div>
                ) : workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="p-6 rounded-full bg-purple-100 mb-4">
                            <Workflow className="h-12 w-12 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No workflows yet</h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            Create your first workflow to automate testing, notifications, and integrations with a visual node-based editor.
                        </p>
                        <Button
                            onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation/new`)}
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Workflow
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workflows.map((workflow) => (
                            <Card
                                key={workflow.id}
                                className="bg-white border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation/${workflow.id}`)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="p-2 rounded-lg"
                                                style={{ backgroundColor: `${workflow.color || '#8b5cf6'}15` }}
                                            >
                                                <Zap
                                                    className="h-5 w-5"
                                                    style={{ color: workflow.color || '#8b5cf6' }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                                    {workflow.name}
                                                </h3>
                                                <p className="text-xs text-gray-400">{workflow.human_id}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-500">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDuplicate(workflow.id) }}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(workflow.id) }}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {workflow.description && (
                                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                            {workflow.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mb-3">
                                        {getStatusBadge(workflow.status)}
                                        <Badge variant="outline" className="text-gray-500 border-gray-200">
                                            {workflow.trigger_type === 'schedule' ? (
                                                <Calendar className="h-3 w-3 mr-1" />
                                            ) : workflow.trigger_type === 'webhook' ? (
                                                <Zap className="h-3 w-3 mr-1" />
                                            ) : (
                                                <Play className="h-3 w-3 mr-1" />
                                            )}
                                            {workflow.trigger_type}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1" title="Total executions">
                                                <Play className="h-3 w-3" />
                                                {workflow.total_executions}
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600" title="Successful">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {workflow.successful_executions}
                                            </div>
                                            <div className="flex items-center gap-1 text-red-500" title="Failed">
                                                <XCircle className="h-3 w-3" />
                                                {workflow.failed_executions}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
