'use client'

import React, { useState } from 'react'
import {
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
    Globe,
    Mail,
    MessageSquare,
    Play,
    Database,
    FileText,
    CheckCircle,
    Search,
    ChevronDown,
    ChevronRight,
    Zap,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

// Node definitions organized by category
const nodeCategories = [
    {
        name: 'Triggers',
        icon: Zap,
        color: '#10b981',
        nodes: [
            { type: 'manual-trigger', label: 'Manual Trigger', icon: PlayCircle, description: 'Start workflow manually' },
            { type: 'schedule-trigger', label: 'Schedule', icon: Clock, description: 'Start on a schedule' },
            { type: 'webhook-trigger', label: 'Webhook', icon: Webhook, description: 'Start via HTTP webhook' },
            { type: 'test-completion', label: 'Test Completed', icon: CheckCircle, description: 'When a test finishes' },
        ],
    },
    {
        name: 'Logic',
        icon: GitBranch,
        color: '#8b5cf6',
        nodes: [
            { type: 'if-condition', label: 'IF', icon: GitBranch, description: 'Conditional branching' },
            { type: 'switch', label: 'Switch', icon: GitMerge, description: 'Multi-way branching' },
            { type: 'loop', label: 'Loop', icon: Repeat, description: 'Iterate over items' },
            { type: 'wait', label: 'Wait', icon: Timer, description: 'Pause execution' },
        ],
    },
    {
        name: 'Data',
        icon: Variable,
        color: '#f59e0b',
        nodes: [
            { type: 'set-variable', label: 'Set Variable', icon: Variable, description: 'Set a workflow variable' },
            { type: 'transform', label: 'Transform', icon: Shuffle, description: 'Transform data' },
            { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter items' },
        ],
    },
    {
        name: 'Actions',
        icon: Play,
        color: '#3b82f6',
        nodes: [
            { type: 'http-request', label: 'HTTP Request', icon: Globe, description: 'Make API calls' },
            { type: 'run-test', label: 'Run Test', icon: Play, description: 'Execute a test flow' },
            { type: 'send-email', label: 'Send Email', icon: Mail, description: 'Send an email' },
        ],
    },
    {
        name: 'Integrations',
        icon: MessageSquare,
        color: '#ec4899',
        nodes: [
            { type: 'slack', label: 'Slack', icon: MessageSquare, description: 'Send Slack messages' },
            { type: 'jira', label: 'Jira', icon: FileText, description: 'Create/update Jira issues' },
            { type: 'github', label: 'GitHub', icon: GitBranch, description: 'GitHub API actions' },
            { type: 'postgresql', label: 'PostgreSQL', icon: Database, description: 'Execute SQL queries' },
        ],
    },
]

export const NodePalette: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Triggers': true,
        'Logic': true,
        'Data': false,
        'Actions': false,
        'Integrations': false,
    })

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }))
    }

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData(
            'application/reactflow',
            JSON.stringify({ type: nodeType, label, nodeType })
        )
        event.dataTransfer.effectAllowed = 'move'
    }

    // Filter nodes based on search
    const filteredCategories = nodeCategories.map(category => ({
        ...category,
        nodes: category.nodes.filter(
            node =>
                node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(category => category.nodes.length > 0)

    // Collapsed view - icons only
    if (isCollapsed) {
        return (
            <div className="w-14 bg-white border-r border-gray-200 flex flex-col">
                {/* Toggle Button */}
                <div className="p-2 border-b border-gray-200">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(false)}
                        className="w-full h-8"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </div>

                {/* Collapsed Categories */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {nodeCategories.map((category) => (
                            <div key={category.name} className="space-y-1">
                                {category.nodes.map((node) => (
                                    <div
                                        key={node.type}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, node.type, node.label)}
                                        title={`${node.label}: ${node.description}`}
                                        className="p-2 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 flex items-center justify-center"
                                        style={{ backgroundColor: `${category.color}08` }}
                                    >
                                        <node.icon
                                            className="h-4 w-4"
                                            style={{ color: category.color }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        )
    }

    // Expanded view
    return (
        <div className="w-52 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-2 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-900">Node Palette</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(true)}
                        className="h-6 w-6"
                    >
                        <PanelLeftClose className="h-3 w-3" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="pl-7 h-7 bg-gray-50 border-gray-300 text-xs"
                    />
                </div>
            </div>

            {/* Categories */}
            <ScrollArea className="flex-1">
                <div className="p-1.5">
                    {filteredCategories.map((category) => (
                        <div key={category.name} className="mb-1">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.name)}
                                className="w-full flex items-center gap-1.5 px-1.5 py-1 text-left hover:bg-gray-100 rounded transition-colors"
                            >
                                {expandedCategories[category.name] ? (
                                    <ChevronDown className="h-3 w-3 text-gray-400" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-gray-400" />
                                )}
                                <category.icon
                                    className="h-3 w-3"
                                    style={{ color: category.color }}
                                />
                                <span className="text-xs font-medium text-gray-700">
                                    {category.name}
                                </span>
                                <span className="ml-auto text-[10px] text-gray-400">
                                    {category.nodes.length}
                                </span>
                            </button>

                            {/* Category Nodes */}
                            {expandedCategories[category.name] && (
                                <div className="ml-1 mt-1 space-y-1">
                                    {category.nodes.map((node) => (
                                        <div
                                            key={node.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, node.type, node.label)}
                                            className="flex items-center gap-2.5 px-2 py-2 bg-white hover:bg-gray-50 rounded-lg cursor-grab active:cursor-grabbing transition-all border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                        >
                                            <div
                                                className="p-2 rounded-lg shrink-0"
                                                style={{ backgroundColor: `${category.color}15` }}
                                            >
                                                <node.icon
                                                    className="h-4 w-4"
                                                    style={{ color: category.color }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-800 truncate">
                                                    {node.label}
                                                </div>
                                                <div className="text-[10px] text-gray-500 truncate">
                                                    {node.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export default NodePalette

