'use client'

import React from 'react'
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
    ChevronRight,
} from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

interface NodePropertiesPanelProps {
    selectedNode: Node | null
    onUpdate: (nodeId: string, data: any) => void
    onDelete: (nodeId: string) => void
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
    selectedNode,
    onUpdate,
    onDelete,
}) => {
    if (!selectedNode) {
        return (
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-medium text-white">Node Properties</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <Settings className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">
                            Select a node to view and edit its properties
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const nodeData = selectedNode.data
    const nodeType = nodeData.type || selectedNode.type

    const handleUpdate = (updates: Record<string, any>) => {
        onUpdate(selectedNode.id, updates)
    }

    const handleConfigUpdate = (key: string, value: any) => {
        const newConfig = { ...nodeData.config, [key]: value }
        handleUpdate({ config: newConfig })
    }

    return (
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">Node Properties</h3>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                            onClick={() => {/* TODO: Duplicate node */ }}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onDelete(selectedNode.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getNodeColor(nodeType) }}
                    />
                    <span className="text-sm text-zinc-400">{nodeType}</span>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-zinc-400 text-xs">Label</Label>
                            <Input
                                value={nodeData.label || ''}
                                onChange={(e) => handleUpdate({ label: e.target.value })}
                                className="mt-1 bg-zinc-800 border-zinc-700"
                                placeholder="Node label"
                            />
                        </div>
                        <div>
                            <Label className="text-zinc-400 text-xs">Description</Label>
                            <Textarea
                                value={nodeData.description || ''}
                                onChange={(e) => handleUpdate({ description: e.target.value })}
                                className="mt-1 bg-zinc-800 border-zinc-700 h-20 resize-none"
                                placeholder="Optional description"
                            />
                        </div>
                    </div>

                    {/* Type-specific configuration */}
                    <Accordion type="single" collapsible defaultValue="config" className="space-y-2">
                        <AccordionItem value="config" className="border-zinc-800">
                            <AccordionTrigger className="text-sm text-zinc-300 hover:no-underline py-2">
                                Configuration
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pt-2">
                                    {renderNodeConfig(nodeType, nodeData.config, handleConfigUpdate)}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="advanced" className="border-zinc-800">
                            <AccordionTrigger className="text-sm text-zinc-300 hover:no-underline py-2">
                                Advanced
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-400 text-xs">Disabled</Label>
                                        <Switch
                                            checked={nodeData.disabled || false}
                                            onCheckedChange={(checked) => handleUpdate({ disabled: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-400 text-xs">Continue on error</Label>
                                        <Switch
                                            checked={nodeData.continueOnError || false}
                                            onCheckedChange={(checked) => handleUpdate({ continueOnError: checked })}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="debug" className="border-zinc-800">
                            <AccordionTrigger className="text-sm text-zinc-300 hover:no-underline py-2">
                                Debug Info
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <p className="text-xs text-zinc-500">Node ID</p>
                                        <p className="text-xs text-zinc-300 font-mono">{selectedNode.id}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded p-2">
                                        <p className="text-xs text-zinc-500">Position</p>
                                        <p className="text-xs text-zinc-300 font-mono">
                                            x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}
                                        </p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </ScrollArea>
        </div>
    )
}

// Helper to get node color based on type
function getNodeColor(nodeType: string): string {
    if (nodeType.includes('trigger')) return '#10b981'
    if (nodeType.includes('condition') || nodeType.includes('if') || nodeType.includes('switch')) return '#8b5cf6'
    if (nodeType.includes('loop') || nodeType.includes('wait')) return '#8b5cf6'
    if (nodeType.includes('variable') || nodeType.includes('transform') || nodeType.includes('filter')) return '#f59e0b'
    if (['slack', 'jira', 'github', 'postgresql', 'email'].some(t => nodeType.includes(t))) return '#ec4899'
    return '#3b82f6'
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
                <div>
                    <Label className="text-zinc-400 text-xs">Method</Label>
                    <select
                        value={config.method || 'GET'}
                        onChange={(e) => onUpdate('method', e.target.value)}
                        className="w-full mt-1 bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div>
                    <Label className="text-zinc-400 text-xs">URL</Label>
                    <Input
                        value={config.url || ''}
                        onChange={(e) => onUpdate('url', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700"
                        placeholder="https://api.example.com/endpoint"
                    />
                </div>
                <div>
                    <Label className="text-zinc-400 text-xs">Headers (JSON)</Label>
                    <Textarea
                        value={config.headers ? JSON.stringify(config.headers, null, 2) : ''}
                        onChange={(e) => {
                            try {
                                onUpdate('headers', JSON.parse(e.target.value))
                            } catch { }
                        }}
                        className="mt-1 bg-zinc-800 border-zinc-700 h-20 font-mono text-xs resize-none"
                        placeholder='{"Content-Type": "application/json"}'
                    />
                </div>
                <div>
                    <Label className="text-zinc-400 text-xs">Body</Label>
                    <Textarea
                        value={config.body || ''}
                        onChange={(e) => onUpdate('body', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700 h-24 font-mono text-xs resize-none"
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
                    <Label className="text-zinc-400 text-xs">Cron Expression</Label>
                    <Input
                        value={config.cron || ''}
                        onChange={(e) => onUpdate('cron', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700 font-mono"
                        placeholder="0 9 * * 1-5"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                        e.g., "0 9 * * 1-5" = 9 AM weekdays
                    </p>
                </div>
                <div>
                    <Label className="text-zinc-400 text-xs">Timezone</Label>
                    <Input
                        value={config.timezone || 'UTC'}
                        onChange={(e) => onUpdate('timezone', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700"
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
                <Label className="text-zinc-400 text-xs">Duration (seconds)</Label>
                <Input
                    type="number"
                    value={config.duration || 0}
                    onChange={(e) => onUpdate('duration', parseInt(e.target.value) || 0)}
                    className="mt-1 bg-zinc-800 border-zinc-700"
                    placeholder="10"
                />
            </div>
        )
    }

    // IF condition configuration
    if (nodeType === 'if-condition') {
        return (
            <div>
                <Label className="text-zinc-400 text-xs">Condition Expression</Label>
                <Textarea
                    value={config.condition || ''}
                    onChange={(e) => onUpdate('condition', e.target.value)}
                    className="mt-1 bg-zinc-800 border-zinc-700 h-20 font-mono text-xs resize-none"
                    placeholder="data.status === 'success'"
                />
                <p className="text-xs text-zinc-500 mt-1">
                    JavaScript expression that evaluates to true/false
                </p>
            </div>
        )
    }

    // Slack configuration
    if (nodeType === 'slack') {
        return (
            <>
                <div>
                    <Label className="text-zinc-400 text-xs">Channel</Label>
                    <Input
                        value={config.channel || ''}
                        onChange={(e) => onUpdate('channel', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700"
                        placeholder="#general"
                    />
                </div>
                <div>
                    <Label className="text-zinc-400 text-xs">Message</Label>
                    <Textarea
                        value={config.message || ''}
                        onChange={(e) => onUpdate('message', e.target.value)}
                        className="mt-1 bg-zinc-800 border-zinc-700 h-24 resize-none"
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
                <Label className="text-zinc-400 text-xs">Test Flow ID</Label>
                <Input
                    value={config.test_flow_id || ''}
                    onChange={(e) => onUpdate('test_flow_id', e.target.value)}
                    className="mt-1 bg-zinc-800 border-zinc-700"
                    placeholder="Enter test flow ID"
                />
            </div>
        )
    }

    // Default: Show JSON editor
    return (
        <div>
            <Label className="text-zinc-400 text-xs">Configuration (JSON)</Label>
            <Textarea
                value={JSON.stringify(config || {}, null, 2)}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        Object.keys(parsed).forEach(key => onUpdate(key, parsed[key]))
                    } catch { }
                }}
                className="mt-1 bg-zinc-800 border-zinc-700 h-32 font-mono text-xs resize-none"
                placeholder="{}"
            />
        </div>
    )
}

export default NodePropertiesPanel
