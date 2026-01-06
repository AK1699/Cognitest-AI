'use client'

import React, { useState } from 'react'
import { Node } from 'reactflow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Trash2,
    Copy,
    Settings,
    Code,
    X,
    Globe,
    PlayCircle,
    Clock,
    Webhook,
    GitBranch,
    GitMerge,
    Repeat,
    Timer,
    Variable,
    Shuffle,
    Filter,
    Mail,
    MessageSquare,
    Play,
    Database,
    FileText,
    CheckCircle,
} from 'lucide-react'
import { ExpressionPreview } from './ExpressionPreview'

interface NodePropertiesPanelProps {
    selectedNode: Node | null
    onUpdate: (nodeId: string, data: any) => void
    onDelete: (nodeId: string) => void
    onDuplicate?: (nodeId: string) => void
    onClose?: () => void
}

// Node icon and color mapping
const nodeIconMap: Record<string, { icon: any, color: string, bgColor: string }> = {
    'manual-trigger': { icon: PlayCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'schedule-trigger': { icon: Clock, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'webhook-trigger': { icon: Webhook, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'test-completion': { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'if-condition': { icon: GitBranch, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    'switch': { icon: GitMerge, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    'loop': { icon: Repeat, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    'wait': { icon: Timer, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    'set-variable': { icon: Variable, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    'transform': { icon: Shuffle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    'filter': { icon: Filter, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    'http-request': { icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'run-test': { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'send-email': { icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'slack': { icon: MessageSquare, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    'jira': { icon: FileText, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    'github': { icon: GitBranch, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    'postgresql': { icon: Database, color: 'text-pink-600', bgColor: 'bg-pink-50' },
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
    selectedNode,
    onUpdate,
    onDelete,
    onDuplicate,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'advanced'>('settings')
    const [hasChanges, setHasChanges] = useState(false)

    if (!selectedNode) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Node Properties</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                            Select a node to view and edit its properties
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const nodeData = selectedNode.data
    const nodeType = nodeData.type || selectedNode.type
    const nodeInfo = nodeIconMap[nodeType] || { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' }
    const NodeIcon = nodeInfo.icon

    const handleUpdate = (updates: Record<string, any>) => {
        setHasChanges(true)
        onUpdate(selectedNode.id, updates)
    }

    const handleConfigUpdate = (key: string, value: any) => {
        const newConfig = { ...nodeData.config, [key]: value }
        handleUpdate({ config: newConfig })
    }

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Enhanced Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${nodeInfo.bgColor}`}>
                            <NodeIcon className={`h-5 w-5 ${nodeInfo.color}`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                {nodeData.label || getNodeDisplayName(nodeType)}
                            </h3>
                            <p className="text-xs text-gray-500">{nodeType}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {onDuplicate && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                                onClick={() => onDuplicate(selectedNode.id)}
                            >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Duplicate
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(selectedNode.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Enhanced Tabs */}
                <div className="flex gap-4 mt-4 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings'
                            ? 'border-teal-500 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'advanced'
                            ? 'border-teal-500 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Code className="h-3.5 w-3.5" />
                        Advanced
                    </button>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {activeTab === 'settings' ? (
                        <>
                            {/* Basic Info - Grid Layout */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-gray-700 text-xs font-medium">Label</Label>
                                    <Input
                                        value={nodeData.label || ''}
                                        onChange={(e) => handleUpdate({ label: e.target.value })}
                                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                                        placeholder="Node label"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 text-xs font-medium">Node ID</Label>
                                    <Input
                                        value={selectedNode.id}
                                        className="mt-1.5 bg-gray-100 border-gray-200 text-gray-500"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-gray-700 text-xs font-medium">Description</Label>
                                <Textarea
                                    value={nodeData.description || ''}
                                    onChange={(e) => handleUpdate({ description: e.target.value })}
                                    className="mt-1.5 bg-gray-50 border-gray-200 h-20 resize-none focus:border-teal-500 focus:ring-teal-500"
                                    placeholder="Optional description for this node"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Configuration Section */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h4>
                                <div className="space-y-3">
                                    {renderNodeConfig(nodeType, nodeData.config || {}, handleConfigUpdate)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Advanced Settings */}
                            <div className="space-y-4">
                                {/* Disabled Toggle */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label className="text-gray-700 text-xs font-medium">Disabled</Label>
                                        <p className="text-xs text-gray-500 mt-0.5">Skip this node during execution</p>
                                    </div>
                                    <Switch
                                        checked={nodeData.disabled || false}
                                        onCheckedChange={(checked) => handleUpdate({ disabled: checked })}
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Error Handling Section */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Error Handling</h4>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-gray-700 text-xs font-medium">On Error Action</Label>
                                        <select
                                            value={nodeData.onError || 'stop_workflow'}
                                            onChange={(e) => handleUpdate({ onError: e.target.value })}
                                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                                        >
                                            <option value="stop_workflow">Stop Workflow</option>
                                            <option value="continue">Continue to Next Node</option>
                                            <option value="retry_then_fail">Retry Then Fail</option>
                                            <option value="retry_then_continue">Retry Then Continue</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {nodeData.onError === 'continue' && 'Workflow continues even if this node fails'}
                                            {nodeData.onError === 'retry_then_fail' && 'Retry according to policy, then fail if still unsuccessful'}
                                            {nodeData.onError === 'retry_then_continue' && 'Retry, then continue workflow regardless of result'}
                                            {(!nodeData.onError || nodeData.onError === 'stop_workflow') && 'Workflow stops immediately on error'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Retry Policy Section */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Retry Policy</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <Label className="text-gray-700 text-xs font-medium">Enable Retries</Label>
                                            <p className="text-xs text-gray-500 mt-0.5">Automatically retry on failure</p>
                                        </div>
                                        <Switch
                                            checked={nodeData.retryEnabled || false}
                                            onCheckedChange={(checked) => handleUpdate({ retryEnabled: checked })}
                                        />
                                    </div>

                                    {nodeData.retryEnabled && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-gray-700 text-xs font-medium">Max Retries</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={10}
                                                        value={nodeData.maxRetries || 3}
                                                        onChange={(e) => handleUpdate({ maxRetries: parseInt(e.target.value) || 3 })}
                                                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-gray-700 text-xs font-medium">Delay (seconds)</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={300}
                                                        value={nodeData.retryDelay || 5}
                                                        onChange={(e) => handleUpdate({ retryDelay: parseInt(e.target.value) || 5 })}
                                                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-gray-700 text-xs font-medium">Backoff Strategy</Label>
                                                <select
                                                    value={nodeData.backoffStrategy || 'exponential'}
                                                    onChange={(e) => handleUpdate({ backoffStrategy: e.target.value })}
                                                    className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                                                >
                                                    <option value="fixed">Fixed Delay</option>
                                                    <option value="linear">Linear (delay × attempt)</option>
                                                    <option value="exponential">Exponential (delay × 2^attempt)</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Variable Reference Helper */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Variable References</h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Use <code className="bg-gray-100 px-1 py-0.5 rounded text-teal-600">{'{{variable}}'}</code> syntax to reference data
                                </p>
                                <div className="space-y-2">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Trigger Data</p>
                                        <code className="text-xs text-teal-600 block">{'{{trigger.data.fieldName}}'}</code>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Previous Node Output</p>
                                        <code className="text-xs text-teal-600 block">{'{{nodes.node_id.response}}'}</code>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Workflow Variables</p>
                                        <code className="text-xs text-teal-600 block">{'{{variables.myVar}}'}</code>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Debug Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Debug Info</h4>
                                <div className="space-y-2">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Node ID</p>
                                        <p className="text-xs text-gray-700 font-mono">{selectedNode.id}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Position</p>
                                        <p className="text-xs text-gray-700 font-mono">
                                            x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Type</p>
                                        <p className="text-xs text-gray-700 font-mono">{nodeType}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Footer with action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-2">
                    {onClose && (
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => setHasChanges(false)}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Get display name for node type
function getNodeDisplayName(nodeType: string): string {
    const nameMap: Record<string, string> = {
        'manual-trigger': 'Manual Trigger',
        'schedule-trigger': 'Schedule',
        'webhook-trigger': 'Webhook',
        'test-completion': 'Test Completed',
        'if-condition': 'IF Condition',
        'switch': 'Switch',
        'loop': 'Loop',
        'wait': 'Wait',
        'set-variable': 'Set Variable',
        'transform': 'Transform',
        'filter': 'Filter',
        'http-request': 'HTTP Request',
        'run-test': 'Run Test',
        'send-email': 'Send Email',
        'slack': 'Slack',
        'jira': 'Jira',
        'github': 'GitHub',
        'postgresql': 'PostgreSQL',
    }
    return nameMap[nodeType] || nodeType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Render configuration fields based on node type
function renderNodeConfig(
    nodeType: string,
    config: Record<string, any>,
    onUpdate: (key: string, value: any) => void
): React.ReactNode {
    // HTTP Request configuration
    if (nodeType === 'http-request') {
        return (
            <>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label className="text-gray-700 text-xs font-medium">Method</Label>
                        <select
                            value={config.method || 'GET'}
                            onChange={(e) => onUpdate('method', e.target.value)}
                            className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <Label className="text-gray-700 text-xs font-medium">URL</Label>
                        <Input
                            value={config.url || ''}
                            onChange={(e) => onUpdate('url', e.target.value)}
                            className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Headers (JSON)</Label>
                    <Textarea
                        value={config.headers ? JSON.stringify(config.headers, null, 2) : ''}
                        onChange={(e) => {
                            try {
                                onUpdate('headers', JSON.parse(e.target.value))
                            } catch { }
                        }}
                        className="mt-1.5 bg-gray-50 border-gray-200 h-20 font-mono text-xs resize-none focus:border-teal-500 focus:ring-teal-500"
                        placeholder='{"Content-Type": "application/json"}'
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Body</Label>
                    <Textarea
                        value={config.body || ''}
                        onChange={(e) => onUpdate('body', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 h-24 font-mono text-xs resize-none focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Request body... Use {{variable}} for interpolation"
                    />
                    <ExpressionPreview expression={config.body || ''} />
                </div>
            </>
        )
    }

    // Schedule trigger configuration
    if (nodeType === 'schedule-trigger') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Cron Expression</Label>
                    <Input
                        value={config.cron || ''}
                        onChange={(e) => onUpdate('cron', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 font-mono focus:border-teal-500 focus:ring-teal-500"
                        placeholder="0 9 * * 1-5"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                        e.g., "0 9 * * 1-5" = 9 AM weekdays
                    </p>
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Timezone</Label>
                    <Input
                        value={config.timezone || 'UTC'}
                        onChange={(e) => onUpdate('timezone', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="UTC"
                    />
                </div>
            </>
        )
    }

    // Wait node configuration
    if (nodeType === 'wait') {
        return (
            <div>
                <Label className="text-gray-700 text-xs font-medium">Duration (seconds)</Label>
                <Input
                    type="number"
                    value={config.duration || 0}
                    onChange={(e) => onUpdate('duration', parseInt(e.target.value) || 0)}
                    className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="10"
                />
            </div>
        )
    }

    // IF condition configuration
    if (nodeType === 'if-condition') {
        return (
            <div>
                <Label className="text-gray-700 text-xs font-medium">Condition Expression</Label>
                <Textarea
                    value={config.condition || ''}
                    onChange={(e) => onUpdate('condition', e.target.value)}
                    className="mt-1.5 bg-gray-50 border-gray-200 h-20 font-mono text-xs resize-none focus:border-teal-500 focus:ring-teal-500"
                    placeholder="{{nodes.http-request-1.statusCode}} === 200"
                />
                <ExpressionPreview expression={config.condition || ''} />
                <p className="text-xs text-gray-500 mt-1.5">
                    Expression that evaluates to true/false. Use {`{{variable}}`} syntax.
                </p>
            </div>
        )
    }

    // Slack configuration
    if (nodeType === 'slack') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Channel</Label>
                    <Input
                        value={config.channel || ''}
                        onChange={(e) => onUpdate('channel', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="#general"
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Message</Label>
                    <Textarea
                        value={config.message || ''}
                        onChange={(e) => onUpdate('message', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 h-24 resize-none focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Use {{variables.testResult}} for dynamic content"
                    />
                    <ExpressionPreview expression={config.message || ''} />
                </div>
            </>
        )
    }

    // Send Email configuration
    if (nodeType === 'send-email') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">To</Label>
                    <Input
                        value={config.to || ''}
                        onChange={(e) => onUpdate('to', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="recipient@example.com"
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Subject</Label>
                    <Input
                        value={config.subject || ''}
                        onChange={(e) => onUpdate('subject', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Test results for {{trigger.data.testName}}"
                    />
                    <ExpressionPreview expression={config.subject || ''} />
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Body</Label>
                    <Textarea
                        value={config.body || ''}
                        onChange={(e) => onUpdate('body', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 h-24 resize-none focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Use {{variables}} for dynamic content..."
                    />
                    <ExpressionPreview expression={config.body || ''} />
                </div>
            </>
        )
    }

    // Run Test configuration
    if (nodeType === 'run-test') {
        return (
            <div>
                <Label className="text-gray-700 text-xs font-medium">Test Flow ID</Label>
                <Input
                    value={config.test_flow_id || ''}
                    onChange={(e) => onUpdate('test_flow_id', e.target.value)}
                    className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Enter test flow ID"
                />
            </div>
        )
    }

    // Set Variable configuration
    if (nodeType === 'set-variable') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Variable Name</Label>
                    <Input
                        value={config.variableName || ''}
                        onChange={(e) => onUpdate('variableName', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="myVariable"
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-xs font-medium">Value</Label>
                    <Textarea
                        value={config.value || ''}
                        onChange={(e) => onUpdate('value', e.target.value)}
                        className="mt-1.5 bg-gray-50 border-gray-200 h-20 resize-none focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Variable value..."
                    />
                </div>
            </>
        )
    }

    // Default: Show JSON editor
    return (
        <div>
            <Label className="text-gray-700 text-xs font-medium">Configuration (JSON)</Label>
            <Textarea
                value={JSON.stringify(config || {}, null, 2)}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        Object.keys(parsed).forEach(key => onUpdate(key, parsed[key]))
                    } catch { }
                }}
                className="mt-1.5 bg-gray-50 border-gray-200 h-32 font-mono text-xs resize-none focus:border-teal-500 focus:ring-teal-500"
                placeholder="{}"
            />
        </div>
    )
}

export default NodePropertiesPanel
