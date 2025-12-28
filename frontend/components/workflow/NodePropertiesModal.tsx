'use client'

import React from 'react'
import { Node } from 'reactflow'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Trash2,
    Copy,
    Settings,
    Code,
    Zap,
    Globe,
    GitBranch,
    Play,
    MessageSquare,
} from 'lucide-react'

interface NodePropertiesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedNode: Node | null
    onUpdate: (nodeId: string, data: any) => void
    onDelete: (nodeId: string) => void
}

export const NodePropertiesModal: React.FC<NodePropertiesModalProps> = ({
    open,
    onOpenChange,
    selectedNode,
    onUpdate,
    onDelete,
}) => {
    if (!selectedNode) return null

    const nodeData = selectedNode.data
    const nodeType = nodeData.type || selectedNode.type

    const handleUpdate = (updates: Record<string, any>) => {
        onUpdate(selectedNode.id, updates)
    }

    const handleConfigUpdate = (key: string, value: any) => {
        const newConfig = { ...nodeData.config, [key]: value }
        handleUpdate({ config: newConfig })
    }

    const handleDelete = () => {
        onDelete(selectedNode.id)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${getNodeColor(nodeType)}15` }}
                            >
                                {getNodeIcon(nodeType)}
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-gray-900">
                                    {nodeData.label || getNodeTitle(nodeType)}
                                </DialogTitle>
                                <p className="text-sm text-gray-500">{nodeType}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-600"
                                onClick={() => {/* TODO: Duplicate */ }}
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Duplicate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="settings" className="flex-1">
                    <div className="px-6 border-b border-gray-200">
                        <TabsList className="bg-transparent h-12 p-0 gap-6">
                            <TabsTrigger
                                value="settings"
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-0"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger
                                value="advanced"
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-0"
                            >
                                <Code className="h-4 w-4 mr-2" />
                                Advanced
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="h-[400px]">
                        <TabsContent value="settings" className="p-6 space-y-6 m-0">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-700 text-sm font-medium">Label</Label>
                                    <Input
                                        value={nodeData.label || ''}
                                        onChange={(e) => handleUpdate({ label: e.target.value })}
                                        className="mt-1.5"
                                        placeholder="Node label"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 text-sm font-medium">Node ID</Label>
                                    <Input
                                        value={selectedNode.id}
                                        readOnly
                                        className="mt-1.5 bg-gray-50 text-gray-500 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-700 text-sm font-medium">Description</Label>
                                <Textarea
                                    value={nodeData.description || ''}
                                    onChange={(e) => handleUpdate({ description: e.target.value })}
                                    className="mt-1.5 h-20 resize-none"
                                    placeholder="Optional description for this node"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Configuration</h3>
                                <div className="space-y-4">
                                    {renderNodeConfig(nodeType, nodeData.config || {}, handleConfigUpdate)}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="p-6 space-y-6 m-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label className="text-gray-700 text-sm font-medium">Disabled</Label>
                                        <p className="text-xs text-gray-500 mt-0.5">Skip this node during execution</p>
                                    </div>
                                    <Switch
                                        checked={nodeData.disabled || false}
                                        onCheckedChange={(checked) => handleUpdate({ disabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label className="text-gray-700 text-sm font-medium">Continue on Error</Label>
                                        <p className="text-xs text-gray-500 mt-0.5">Continue workflow even if this node fails</p>
                                    </div>
                                    <Switch
                                        checked={nodeData.continueOnError || false}
                                        onCheckedChange={(checked) => handleUpdate({ continueOnError: checked })}
                                    />
                                </div>
                            </div>

                            {/* Debug Info */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Debug Information</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Position X:</span>
                                        <span className="font-mono text-gray-900">{Math.round(selectedNode.position.x)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Position Y:</span>
                                        <span className="font-mono text-gray-900">{Math.round(selectedNode.position.y)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Type:</span>
                                        <span className="font-mono text-gray-900">{selectedNode.type}</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => onOpenChange(false)}
                    >
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helper functions
function getNodeColor(nodeType: string): string {
    if (nodeType.includes('trigger')) return '#10b981'
    if (nodeType.includes('condition') || nodeType.includes('if') || nodeType.includes('switch')) return '#8b5cf6'
    if (nodeType.includes('loop') || nodeType.includes('wait')) return '#8b5cf6'
    if (['slack', 'jira', 'github', 'postgresql', 'email'].some(t => nodeType.includes(t))) return '#ec4899'
    return '#3b82f6'
}

function getNodeIcon(nodeType: string): React.ReactNode {
    const color = getNodeColor(nodeType)
    const className = "h-5 w-5"
    const style = { color }

    if (nodeType.includes('trigger')) return <Zap className={className} style={style} />
    if (nodeType.includes('condition') || nodeType.includes('if')) return <GitBranch className={className} style={style} />
    if (nodeType.includes('http') || nodeType.includes('webhook')) return <Globe className={className} style={style} />
    if (nodeType.includes('slack')) return <MessageSquare className={className} style={style} />
    return <Play className={className} style={style} />
}

function getNodeTitle(nodeType: string): string {
    const titles: Record<string, string> = {
        'manual-trigger': 'Manual Trigger',
        'schedule-trigger': 'Schedule Trigger',
        'webhook-trigger': 'Webhook Trigger',
        'http-request': 'HTTP Request',
        'if-condition': 'IF Condition',
        'switch': 'Switch',
        'loop': 'Loop',
        'wait': 'Wait',
        'slack': 'Slack',
        'email': 'Email',
        'run-test': 'Run Test',
    }
    return titles[nodeType] || nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/-/g, ' ')
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
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <Label className="text-gray-700 text-sm">Method</Label>
                        <select
                            value={config.method || 'GET'}
                            onChange={(e) => onUpdate('method', e.target.value)}
                            className="w-full mt-1.5 bg-white border-gray-300 border rounded-md px-3 py-2 text-sm"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <Label className="text-gray-700 text-sm">URL</Label>
                        <Input
                            value={config.url || ''}
                            onChange={(e) => onUpdate('url', e.target.value)}
                            className="mt-1.5"
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-gray-700 text-sm">Headers (JSON)</Label>
                    <Textarea
                        value={config.headers ? JSON.stringify(config.headers, null, 2) : ''}
                        onChange={(e) => {
                            try {
                                onUpdate('headers', JSON.parse(e.target.value))
                            } catch { }
                        }}
                        className="mt-1.5 h-24 font-mono text-sm resize-none"
                        placeholder='{"Content-Type": "application/json"}'
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-sm">Body</Label>
                    <Textarea
                        value={config.body || ''}
                        onChange={(e) => onUpdate('body', e.target.value)}
                        className="mt-1.5 h-24 font-mono text-sm resize-none"
                        placeholder="Request body..."
                    />
                </div>
            </>
        )
    }

    // Schedule trigger configuration
    if (nodeType === 'schedule-trigger') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-sm">Cron Expression</Label>
                    <Input
                        value={config.cron || ''}
                        onChange={(e) => onUpdate('cron', e.target.value)}
                        className="mt-1.5 font-mono"
                        placeholder="0 9 * * 1-5"
                    />
                    <p className="text-xs text-gray-500 mt-1">e.g., "0 9 * * 1-5" = 9 AM weekdays</p>
                </div>
                <div>
                    <Label className="text-gray-700 text-sm">Timezone</Label>
                    <Input
                        value={config.timezone || 'UTC'}
                        onChange={(e) => onUpdate('timezone', e.target.value)}
                        className="mt-1.5"
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
                <Label className="text-gray-700 text-sm">Duration (seconds)</Label>
                <Input
                    type="number"
                    value={config.duration || 0}
                    onChange={(e) => onUpdate('duration', parseInt(e.target.value) || 0)}
                    className="mt-1.5"
                    placeholder="10"
                />
            </div>
        )
    }

    // IF condition configuration
    if (nodeType === 'if-condition') {
        return (
            <div>
                <Label className="text-gray-700 text-sm">Condition Expression</Label>
                <Textarea
                    value={config.condition || ''}
                    onChange={(e) => onUpdate('condition', e.target.value)}
                    className="mt-1.5 h-24 font-mono text-sm resize-none"
                    placeholder="data.status === 'success'"
                />
                <p className="text-xs text-gray-500 mt-1">JavaScript expression that evaluates to true/false</p>
            </div>
        )
    }

    // Slack configuration
    if (nodeType === 'slack') {
        return (
            <>
                <div>
                    <Label className="text-gray-700 text-sm">Channel</Label>
                    <Input
                        value={config.channel || ''}
                        onChange={(e) => onUpdate('channel', e.target.value)}
                        className="mt-1.5"
                        placeholder="#general"
                    />
                </div>
                <div>
                    <Label className="text-gray-700 text-sm">Message</Label>
                    <Textarea
                        value={config.message || ''}
                        onChange={(e) => onUpdate('message', e.target.value)}
                        className="mt-1.5 h-24 resize-none"
                        placeholder="Workflow completed successfully!"
                    />
                </div>
            </>
        )
    }

    // Run Test configuration
    if (nodeType === 'run-test') {
        return (
            <div>
                <Label className="text-gray-700 text-sm">Test Flow ID</Label>
                <Input
                    value={config.test_flow_id || ''}
                    onChange={(e) => onUpdate('test_flow_id', e.target.value)}
                    className="mt-1.5"
                    placeholder="Enter test flow ID"
                />
            </div>
        )
    }

    // Manual trigger - minimal config
    if (nodeType === 'manual-trigger') {
        return (
            <div className="text-center py-8 text-gray-500">
                <Zap className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">This trigger has no additional configuration.</p>
                <p className="text-xs text-gray-400 mt-1">Start the workflow manually using the Execute button.</p>
            </div>
        )
    }

    // Default: Show JSON editor
    return (
        <div>
            <Label className="text-gray-700 text-sm">Configuration (JSON)</Label>
            <Textarea
                value={JSON.stringify(config || {}, null, 2)}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        Object.keys(parsed).forEach(key => onUpdate(key, parsed[key]))
                    } catch { }
                }}
                className="mt-1.5 h-40 font-mono text-sm resize-none"
                placeholder="{}"
            />
        </div>
    )
}

export default NodePropertiesModal
