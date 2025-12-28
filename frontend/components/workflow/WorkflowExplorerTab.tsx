'use client'

import React, { useState, useEffect } from 'react'
import {
    Search,
    ChevronRight,
    ChevronDown,
    Folder,
    FolderPlus,
    Plus,
    Trash2,
    MoreVertical,
    Workflow,
    Zap,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Copy,
    Settings,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { workflowAPI, WorkflowSummary } from '@/lib/api/workflow'
import { useParams, useRouter } from 'next/navigation'

interface WorkflowExplorerTabProps {
    onEditWorkflow?: (workflowId: string) => void
    onSelectWorkflow?: (workflow: WorkflowSummary | null) => void
}

export default function WorkflowExplorerTab({ onEditWorkflow, onSelectWorkflow }: WorkflowExplorerTabProps) {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const orgId = params.uuid as string

    const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

    useEffect(() => {
        loadWorkflows()
    }, [projectId])

    const loadWorkflows = async () => {
        if (!projectId) return
        setIsLoading(true)
        try {
            const response = await workflowAPI.list({
                project_id: projectId,
                search: searchQuery || undefined,
            })
            setWorkflows(response.items)
        } catch (error) {
            console.error('Failed to load workflows:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectWorkflow = (workflow: WorkflowSummary) => {
        setSelectedWorkflowId(workflow.id)
        onSelectWorkflow?.(workflow)
    }

    const handleCreateWorkflow = () => {
        router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation/new`)
    }

    const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await workflowAPI.delete(workflowId)
            setWorkflows(prev => prev.filter(w => w.id !== workflowId))
            if (selectedWorkflowId === workflowId) {
                setSelectedWorkflowId(null)
                onSelectWorkflow?.(null)
            }
        } catch (error) {
            console.error('Failed to delete workflow:', error)
        }
    }

    const handleDuplicate = async (workflowId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const duplicated = await workflowAPI.duplicate(workflowId)
            setWorkflows(prev => [duplicated, ...prev])
        } catch (error) {
            console.error('Failed to duplicate workflow:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle2 className="h-3 w-3 text-green-500" />
            case 'draft':
                return <Clock className="h-3 w-3 text-amber-500" />
            case 'inactive':
            case 'archived':
                return <XCircle className="h-3 w-3 text-gray-400" />
            default:
                return <Clock className="h-3 w-3 text-gray-400" />
        }
    }

    const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId)

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            {/* Left Sidebar - Workflow Explorer */}
            <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
                {/* Search and Actions */}
                <div className="p-3 border-b border-gray-200">
                    <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadWorkflows()}
                            placeholder="Search..."
                            className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-600 hover:text-gray-900"
                            onClick={handleCreateWorkflow}
                        >
                            <FolderPlus className="h-4 w-4 mr-1" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-600 hover:text-gray-900"
                            onClick={handleCreateWorkflow}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                        </Button>
                        <span className="text-xs text-gray-500">{workflows.length} workflows</span>
                    </div>
                </div>

                {/* Workflow List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No workflows yet
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {workflows.map((workflow) => (
                                <div
                                    key={workflow.id}
                                    onClick={() => handleSelectWorkflow(workflow)}
                                    className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${selectedWorkflowId === workflow.id
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Zap
                                        className="h-4 w-4 flex-shrink-0"
                                        style={{ color: workflow.color || '#8b5cf6' }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {workflow.name}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            {getStatusIcon(workflow.status)}
                                            <span>{workflow.status}</span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                onEditWorkflow?.(workflow.id)
                                            }}>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleDuplicate(workflow.id, e as unknown as React.MouseEvent)}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={(e) => handleDelete(workflow.id, e as unknown as React.MouseEvent)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
                {selectedWorkflow ? (
                    <div className="max-w-md text-center p-8">
                        <div
                            className="p-4 rounded-full inline-block mb-4"
                            style={{ backgroundColor: `${selectedWorkflow.color || '#8b5cf6'}15` }}
                        >
                            <Zap
                                className="h-10 w-10"
                                style={{ color: selectedWorkflow.color || '#8b5cf6' }}
                            />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {selectedWorkflow.name}
                        </h2>
                        {selectedWorkflow.description && (
                            <p className="text-gray-500 mb-4">{selectedWorkflow.description}</p>
                        )}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <Badge variant="outline" className="gap-1">
                                {getStatusIcon(selectedWorkflow.status)}
                                {selectedWorkflow.status}
                            </Badge>
                            <Badge variant="outline" className="text-gray-500">
                                <Play className="h-3 w-3 mr-1" />
                                {selectedWorkflow.total_executions} runs
                            </Badge>
                        </div>
                        <Button
                            onClick={() => onEditWorkflow?.(selectedWorkflow.id)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Open in Builder
                        </Button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="p-4 rounded-full bg-gray-200 inline-block mb-4">
                            <Workflow className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Workflow Selected
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Select a workflow from the explorer or create a new<br />
                            one to get started.
                        </p>
                        <Button
                            onClick={handleCreateWorkflow}
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Workflow
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
