'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    Panel,
    BackgroundVariant,
    MarkerType,
    NodeChange,
    EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Play,
    Save,
    Settings,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Grid3X3,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    ChevronLeft,
    MoreVertical,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
} from 'lucide-react'

import { workflowAPI, WorkflowDetail, WorkflowNode, WorkflowEdge } from '@/lib/api/workflow'
import { NodePalette } from './NodePalette'
import { NodePropertiesModal } from './NodePropertiesModal'
import { ExecutionMonitor } from './ExecutionMonitor'

// Import custom node types
import { TriggerNode } from './nodes/TriggerNode'
import { ActionNode } from './nodes/ActionNode'
import { ConditionNode } from './nodes/ConditionNode'
import { IntegrationNode } from './nodes/IntegrationNode'

// Define custom node types
const nodeTypes = {
    'trigger': TriggerNode,
    'action': ActionNode,
    'condition': ConditionNode,
    'integration': IntegrationNode,
}

interface WorkflowBuilderProps {
    workflowId?: string
    projectId: string
    orgId: string
    onBack?: () => void
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
    workflowId,
    projectId,
    orgId,
    onBack,
}) => {
    // State
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null)
    const [workflowName, setWorkflowName] = useState('New Workflow')
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [showNodeModal, setShowNodeModal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [executionId, setExecutionId] = useState<string | null>(null)
    const [showMiniMap, setShowMiniMap] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const reactFlowWrapper = useRef<HTMLDivElement>(null)

    // Load workflow if editing
    useEffect(() => {
        if (workflowId) {
            loadWorkflow(workflowId)
        } else {
            // Initialize with a manual trigger node (positioned for horizontal flow)
            const triggerId = `trigger-${Date.now()}`
            setNodes([
                {
                    id: triggerId,
                    type: 'trigger',
                    position: { x: 100, y: 200 },
                    data: {
                        label: 'Execute',
                        type: 'manual-trigger',
                        description: 'Run test to execute',
                        config: {},
                    },
                },
            ])
        }
    }, [workflowId])

    const loadWorkflow = async (id: string) => {
        try {
            const data = await workflowAPI.get(id)
            setWorkflow(data)
            setWorkflowName(data.name)

            // Convert workflow nodes to React Flow format
            const rfNodes: Node[] = (data.nodes || []).map((n: WorkflowNode) => ({
                id: n.id,
                type: getNodeCategory(n.data.type),
                position: n.position,
                data: n.data,
                width: n.width,
                height: n.height,
            }))

            // Convert workflow edges to React Flow format
            const rfEdges: Edge[] = (data.edges || []).map((e: WorkflowEdge) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                label: e.label,
                type: 'bezier',
                animated: e.animated,
                style: { stroke: '#64748b', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            }))

            setNodes(rfNodes)
            setEdges(rfEdges)
        } catch (err) {
            console.error('Failed to load workflow:', err)
            setError('Failed to load workflow')
        }
    }

    const getNodeCategory = (nodeType: string): string => {
        if (nodeType.includes('trigger')) return 'trigger'
        if (nodeType.includes('condition') || nodeType.includes('if') || nodeType.includes('switch')) return 'condition'
        if (['slack', 'jira', 'github', 'postgresql', 'email'].some(t => nodeType.includes(t))) return 'integration'
        return 'action'
    }

    // Handle node connection
    const onConnect = useCallback(
        (connection: Connection) => {
            const newEdge = {
                ...connection,
                id: `edge-${Date.now()}`,
                type: 'bezier',
                animated: false,
                style: { stroke: '#64748b', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            }
            setEdges((eds) => addEdge(newEdge, eds))
        },
        [setEdges]
    )

    // Handle node selection - open modal on double click
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
    }, [])

    // Handle node double click - open properties modal
    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
        setShowNodeModal(true)
    }, [])

    // Handle node deselection
    const onPaneClick = useCallback(() => {
        setSelectedNode(null)
    }, [])

    // Handle node update from properties panel
    const onNodeUpdate = useCallback((nodeId: string, data: any) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
            )
        )
        if (selectedNode?.id === nodeId) {
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null)
        }
    }, [setNodes, selectedNode])

    // Handle node deletion
    const onNodeDelete = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId))
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null)
        }
    }, [setNodes, setEdges, selectedNode])

    // Handle drag and drop from palette
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
            const nodeData = event.dataTransfer.getData('application/reactflow')

            if (!nodeData || !reactFlowBounds) return

            const { type, label, nodeType } = JSON.parse(nodeData)

            const position = {
                x: event.clientX - reactFlowBounds.left - 100,
                y: event.clientY - reactFlowBounds.top - 25,
            }

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type: getNodeCategory(type),
                position,
                data: {
                    label,
                    type,
                    config: {},
                },
            }

            setNodes((nds) => [...nds, newNode])
        },
        [setNodes]
    )

    // Save workflow
    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            const workflowData = {
                name: workflowName,
                description: workflow?.description || '',
                project_id: projectId,
                trigger_type: 'manual' as const,
                nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.type || 'action',
                    position: n.position,
                    data: n.data,
                    width: n.width,
                    height: n.height,
                })),
                edges: edges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || undefined,
                    targetHandle: e.targetHandle || undefined,
                    label: e.label as string | undefined,
                    type: e.type,
                    animated: e.animated,
                })),
                viewport: { x: 0, y: 0, zoom: 1 },
                tags: workflow?.tags || [],
                category: workflow?.category,
            }

            if (workflow?.id) {
                const updated = await workflowAPI.update(workflow.id, workflowData)
                setWorkflow(updated)
                setSuccess('Workflow saved successfully')
            } else {
                const created = await workflowAPI.create(workflowData)
                setWorkflow(created)
                setSuccess('Workflow created successfully')
            }
        } catch (err: any) {
            console.error('Failed to save workflow:', err)
            setError(err.message || 'Failed to save workflow')
        } finally {
            setIsSaving(false)
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    // Execute workflow
    const handleExecute = async () => {
        if (!workflow?.id) {
            setError('Please save the workflow first')
            return
        }

        setIsExecuting(true)
        setError(null)

        try {
            const execution = await workflowAPI.execute(workflow.id, {
                input_data: {},
                trigger_source: 'manual',
            })
            setExecutionId(execution.id)
            setSuccess('Workflow execution started')
        } catch (err: any) {
            console.error('Failed to execute workflow:', err)
            setError(err.message || 'Failed to execute workflow')
        } finally {
            setIsExecuting(false)
            setTimeout(() => setSuccess(null), 3000)
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <Input
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="w-64 bg-white border-gray-300 text-gray-900"
                        placeholder="Workflow name"
                    />
                    {workflow?.human_id && (
                        <Badge variant="outline" className="text-gray-500">
                            {workflow.human_id}
                        </Badge>
                    )}
                    {workflow?.status && (
                        <Badge
                            variant="outline"
                            className={
                                workflow.status === 'active' ? 'text-green-600 border-green-300' :
                                    workflow.status === 'draft' ? 'text-amber-600 border-amber-300' :
                                        'text-gray-500 border-gray-300'
                            }
                        >
                            {workflow.status}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm mr-4">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 text-green-400 text-sm mr-4">
                            <CheckCircle2 className="h-4 w-4" />
                            {success}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMiniMap(!showMiniMap)}
                        className="text-zinc-400 border-zinc-700"
                    >
                        {showMiniMap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className="text-zinc-400 border-zinc-700"
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>

                    <Button
                        onClick={handleExecute}
                        disabled={isExecuting || !workflow?.id}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {isExecuting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Execute
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Node Palette */}
                <NodePalette />

                {/* Center - Canvas (now takes full remaining width) */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onNodeDoubleClick={onNodeDoubleClick}
                        onPaneClick={onPaneClick}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-100"
                        defaultEdgeOptions={{
                            type: 'bezier',
                            style: { stroke: '#64748b', strokeWidth: 2 },
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                        }}
                    >
                        <Controls
                            className="bg-white border-gray-200 [&>button]:bg-gray-50 [&>button]:border-gray-200 [&>button]:text-gray-600 [&>button:hover]:bg-gray-100"
                        />
                        {showGrid && (
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={20}
                                size={1}
                                color="#e5e7eb"
                            />
                        )}
                        {showMiniMap && (
                            <MiniMap
                                nodeColor="#d1d5db"
                                maskColor="rgba(255, 255, 255, 0.8)"
                                className="bg-white border-gray-200"
                            />
                        )}

                        {/* Stats Panel */}
                        <Panel position="bottom-left" className="m-4">
                            <Card className="bg-white/90 border-gray-200 p-3 shadow-sm">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div>Nodes: <span className="text-gray-900 font-medium">{nodes.length}</span></div>
                                    <div>Edges: <span className="text-gray-900 font-medium">{edges.length}</span></div>
                                    {workflow?.total_executions !== undefined && (
                                        <div>Executions: <span className="text-gray-900 font-medium">{workflow.total_executions}</span></div>
                                    )}
                                </div>
                            </Card>
                        </Panel>

                        {/* Hint Panel */}
                        <Panel position="bottom-right" className="m-4">
                            <div className="text-xs text-gray-400 bg-white/80 px-3 py-2 rounded-md shadow-sm">
                                Double-click a node to edit properties
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
            </div>

            {/* Node Properties Modal */}
            <NodePropertiesModal
                open={showNodeModal}
                onOpenChange={setShowNodeModal}
                selectedNode={selectedNode}
                onUpdate={onNodeUpdate}
                onDelete={onNodeDelete}
            />

            {/* Bottom - Execution Monitor */}
            {executionId && (
                <ExecutionMonitor
                    executionId={executionId}
                    onClose={() => setExecutionId(null)}
                />
            )}
        </div>
    )
}

export default WorkflowBuilder

