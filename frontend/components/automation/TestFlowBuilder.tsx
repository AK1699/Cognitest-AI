'use client'

import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react'

// Test Action Types
const ACTION_TYPES = [
  { value: 'navigate', label: 'Navigate', icon: '🌐', category: 'Navigation' },
  { value: 'click', label: 'Click', icon: '👆', category: 'Interaction' },
  { value: 'type', label: 'Type Text', icon: '⌨️', category: 'Interaction' },
  { value: 'select', label: 'Select Dropdown', icon: '📋', category: 'Interaction' },
  { value: 'wait', label: 'Wait', icon: '⏳', category: 'Wait' },
  { value: 'assert', label: 'Assert', icon: '✓', category: 'Assertion' },
  { value: 'screenshot', label: 'Screenshot', icon: '📸', category: 'Media' },
  { value: 'scroll', label: 'Scroll', icon: '↕️', category: 'Interaction' },
  { value: 'hover', label: 'Hover', icon: '🖱️', category: 'Interaction' },
  { value: 'upload', label: 'Upload File', icon: '📁', category: 'Interaction' },
]

// Browser Types
const BROWSER_TYPES = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Edge' },
]

// Execution Modes
const EXECUTION_MODES = [
  { value: 'headed', label: 'Headed (Visible)' },
  { value: 'headless', label: 'Headless (Background)' },
]

interface TestFlowBuilderProps {
  projectId: string
  flowId?: string
  onSave?: (flowData: any) => void
}

export default function TestFlowBuilder({
  projectId,
  flowId,
  onSave,
}: TestFlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [flowName, setFlowName] = useState('Untitled Flow')
  const [baseUrl, setBaseUrl] = useState('https://example.com')
  const [defaultBrowser, setDefaultBrowser] = useState('chrome')
  const [defaultMode, setDefaultMode] = useState('headed')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<string>('')

  // Load existing flow if flowId is provided
  useEffect(() => {
    if (flowId) {
      // TODO: Load flow from API
      loadTestFlow(flowId)
    }
  }, [flowId])

  const loadTestFlow = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/web-automation/test-flows/${id}`, {
        credentials: 'include', // Use httpOnly cookies for auth
      })
      const data = await response.json()

      setFlowName(data.name)
      setBaseUrl(data.base_url)
      setDefaultBrowser(data.default_browser)
      setDefaultMode(data.default_mode)
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (error) {
      console.error('Failed to load test flow:', error)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addActionNode = (actionType: string) => {
    const action = ACTION_TYPES.find((a) => a.value === actionType)
    if (!action) return

    const newNode: Node = {
      id: `${actionType}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: (
          <div className="flex items-center gap-2">
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </div>
        ),
        actionType: action.value,
        selector: {
          primary: '',
          strategy: 'css',
          alternatives: [],
        },
        value: '',
        options: {
          timeout: 5000,
          retryCount: 3,
        },
      },
      style: {
        background: '#fff',
        border: '2px solid #1e40af',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
      },
    }

    setNodes((nds) => [...nds, newNode])
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const updateNodeData = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          }
        }
        return node
      })
    )
  }

  const saveTestFlow = async () => {
    const flowData = {
      name: flowName,
      base_url: baseUrl,
      default_browser: defaultBrowser,
      default_mode: defaultMode,
      nodes: nodes,
      edges: edges,
      flow_json: {
        nodes: nodes,
        edges: edges,
      },
    }

    try {
      const url = flowId
        ? `/api/v1/web-automation/test-flows/${flowId}`
        : `/api/v1/web-automation/test-flows?project_id=${projectId}`

      const method = flowId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use httpOnly cookies for auth
        body: JSON.stringify(flowData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Flow saved:', data)
        if (onSave) onSave(data)
      } else {
        console.error('Failed to save flow')
      }
    } catch (error) {
      console.error('Error saving flow:', error)
    }
  }

  const executeTestFlow = async () => {
    if (!flowId) {
      alert('Please save the flow before executing')
      return
    }

    setIsExecuting(true)
    setExecutionStatus('Starting execution...')

    try {
      const response = await fetch(
        `/api/v1/web-automation/test-flows/${flowId}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Use httpOnly cookies for auth
          body: JSON.stringify({
            browser_type: defaultBrowser,
            execution_mode: defaultMode,
          }),
        }
      )

      if (response.ok) {
        const executionRun = await response.json()
        setExecutionStatus(`Execution started: ${executionRun.id}`)

        // TODO: Connect to WebSocket for live updates
        connectToLivePreview(executionRun.id)
      } else {
        setExecutionStatus('Execution failed')
      }
    } catch (error) {
      console.error('Execution error:', error)
      setExecutionStatus('Execution error')
    } finally {
      setIsExecuting(false)
    }
  }

  const connectToLivePreview = (executionId: string) => {
    const ws = new WebSocket(
      `ws://localhost:8000/api/v1/web-automation/ws/live-preview/${executionId}`
    )

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      console.log('Live update:', update)

      // Update UI based on live updates
      if (update.type === 'stepStarted') {
        setExecutionStatus(`Executing: ${update.payload.step_name}`)
      } else if (update.type === 'stepCompleted') {
        setExecutionStatus(`Completed: ${update.payload.step_id}`)
      } else if (update.type === 'executionCompleted') {
        setExecutionStatus('Execution completed!')
        ws.close()
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      ws.close()
    }
  }

  return (
    <div className="flex h-screen w-full">
      {/* Action Library Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Test Actions</h3>

        {/* Flow Settings */}
        <Card className="p-3 mb-4">
          <Label className="text-xs">Flow Name</Label>
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="mb-2"
          />

          <Label className="text-xs">Base URL</Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mb-2"
          />

          <Label className="text-xs">Browser</Label>
          <select
            value={defaultBrowser}
            onChange={(e) => setDefaultBrowser(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          >
            {BROWSER_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          <Label className="text-xs">Mode</Label>
          <select
            value={defaultMode}
            onChange={(e) => setDefaultMode(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {EXECUTION_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Card>

        {/* Action Categories */}
        <div className="space-y-2">
          {ACTION_TYPES.map((action) => (
            <Button
              key={action.value}
              onClick={() => addActionNode(action.value)}
              variant="outline"
              className="w-full justify-start"
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Flow Canvas - Extended */}
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />

          <Panel position="top-right" className="flex gap-2">
            <Button onClick={saveTestFlow} size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button
              onClick={executeTestFlow}
              disabled={isExecuting}
              size="sm"
              variant="default"
            >
              {isExecuting ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Execute
                </>
              )}
            </Button>
          </Panel>
        </ReactFlow>

        {/* Execution Status */}
        {executionStatus && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg">
            <p className="text-sm">{executionStatus}</p>
          </div>
        )}
      </div>

      {/* Right Panel - Always Visible & Extended */}
      <div className="w-96 border-l bg-gray-50 p-4 overflow-y-auto">
        {selectedNode ? (
          <>
            {/* Node Properties Panel */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Step Properties</h3>
              <Button
                onClick={() => deleteNode(selectedNode.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Action Type</Label>
                <p className="text-sm text-gray-600">
                  {selectedNode.data.actionType}
                </p>
              </div>

              {/* Selector Configuration */}
              {['click', 'type', 'select', 'assert'].includes(
                selectedNode.data.actionType
              ) && (
                  <div>
                    <Label>Selector</Label>
                    <Input
                      value={selectedNode.data.selector?.primary || ''}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          selector: {
                            ...selectedNode.data.selector,
                            primary: e.target.value,
                          },
                        })
                      }
                      placeholder="CSS selector or XPath"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., #submit-button or button[data-testid="login"]
                    </p>
                  </div>
                )}

              {/* Value Input */}
              {['type', 'navigate'].includes(selectedNode.data.actionType) && (
                <div>
                  <Label>Value</Label>
                  <Input
                    value={selectedNode.data.value || ''}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        value: e.target.value,
                      })
                    }
                    placeholder={
                      selectedNode.data.actionType === 'navigate'
                        ? 'URL'
                        : 'Text to type'
                    }
                  />
                </div>
              )}

              {/* Retry Count */}
              <div>
                <Label>Retry Count</Label>
                <Input
                  type="number"
                  value={selectedNode.data.options?.retryCount || 3}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      options: {
                        ...selectedNode.data.options,
                        retryCount: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Flow Overview - When no node is selected */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Flow Overview</h3>
              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Total Steps</Label>
                    <p className="text-2xl font-bold">{nodes.length}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Connections</Label>
                    <p className="text-2xl font-bold">{edges.length}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Flow Status</Label>
                    <p className="text-sm font-medium">
                      {nodes.length > 0 ? 'Ready to Execute' : 'Add steps to begin'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={saveTestFlow}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Flow
                </Button>
                <Button
                  onClick={executeTestFlow}
                  disabled={isExecuting || !flowId}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute Flow
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const data = JSON.stringify({ nodes, edges }, null, 2)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${flowName}.json`
                    a.click()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Flow
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
              <Card className="p-4">
                {executionStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Latest Execution</p>
                        <p className="text-xs text-gray-500">{executionStatus}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </Card>
            </div>

            {/* Flow Details */}
            <div>
              <h3 className="font-bold text-lg mb-4">Flow Details</h3>
              <Card className="p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <p className="font-medium">{flowName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Base URL</Label>
                    <p className="font-medium truncate">{baseUrl}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Browser</Label>
                    <p className="font-medium capitalize">{defaultBrowser}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Mode</Label>
                    <p className="font-medium capitalize">{defaultMode}</p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
