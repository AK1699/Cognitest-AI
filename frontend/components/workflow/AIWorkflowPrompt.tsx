'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Node, Edge, MarkerType } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Sparkles,
    Wand2,
    Send,
    Loader2,
    ChevronUp,
    ChevronDown,
    History,
    Bookmark,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Lightbulb,
    Zap,
    Clock,
    Play,
    Mail,
    GitBranch,
    X,
} from 'lucide-react'
import { workflowAPI } from '@/lib/api/workflow'

interface AIWorkflowPromptProps {
    projectId: string
    onWorkflowGenerated: (nodes: Node[], edges: Edge[], metadata: WorkflowMetadata) => void
    isCollapsed?: boolean
    onToggleCollapse?: () => void
}

interface WorkflowMetadata {
    name: string
    description: string
    variables?: Record<string, any>
}

interface Template {
    id: string
    name: string
    description: string
    category: string
    node_count: number
}

interface PromptHistoryItem {
    id: string
    prompt: string
    timestamp: Date
    success: boolean
}

const EXAMPLE_PROMPTS = [
    {
        icon: <Zap className="h-4 w-4" />,
        title: "Smoke Test Pipeline",
        prompt: "Create a workflow that runs smoke tests every day at 9am, and if any test fails, create a Jira ticket and notify the QA team on Slack",
    },
    {
        icon: <Clock className="h-4 w-4" />,
        title: "API Health Monitor",
        prompt: "Build a workflow that checks our API health endpoint every 5 minutes. If the response is not 200, wait 30 seconds and retry. If it still fails, send an urgent email to the on-call team",
    },
    {
        icon: <Mail className="h-4 w-4" />,
        title: "Regression Report",
        prompt: "When triggered manually, run the full regression suite and email a summary report to stakeholders with pass/fail counts",
    },
    {
        icon: <GitBranch className="h-4 w-4" />,
        title: "PR Test Runner",
        prompt: "On webhook trigger from GitHub, run the critical path tests. If successful, post a comment on the PR. If failed, create a GitHub issue linking to the test results",
    },
]

export const AIWorkflowPrompt: React.FC<AIWorkflowPromptProps> = ({
    projectId,
    onWorkflowGenerated,
    isCollapsed = false,
    onToggleCollapse,
}) => {
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])
    const [success, setSuccess] = useState(false)
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTab, setSelectedTab] = useState('generate')
    const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Load templates on mount
    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const data = await workflowAPI.getTemplates()
            setTemplates(data)
        } catch (err) {
            console.error('Failed to load templates:', err)
        }
    }

    const handleGenerate = async () => {
        if (!prompt.trim() || prompt.length < 10) {
            setError('Please provide a more detailed description (at least 10 characters)')
            return
        }

        setIsGenerating(true)
        setError(null)
        setWarnings([])
        setSuccess(false)

        try {
            const response = await workflowAPI.generate({
                prompt: prompt.trim(),
                project_id: projectId,
            })

            if (!response.success || !response.workflow) {
                throw new Error(response.error || 'Failed to generate workflow')
            }

            // Add to history
            const historyItem: PromptHistoryItem = {
                id: `history-${Date.now()}`,
                prompt: prompt.trim(),
                timestamp: new Date(),
                success: true,
            }
            setPromptHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10

            // Convert AI response to React Flow format
            const { nodes, edges, metadata } = convertToReactFlowFormat(response.workflow)

            // Set warnings if any
            if (response.warnings && response.warnings.length > 0) {
                setWarnings(response.warnings)
            }

            setSuccess(true)
            onWorkflowGenerated(nodes, edges, metadata)

            // Clear prompt after successful generation
            setTimeout(() => {
                setPrompt('')
                setSuccess(false)
            }, 2000)

        } catch (err: any) {
            console.error('Failed to generate workflow:', err)
            setError(err.message || 'Failed to generate workflow')

            // Add failure to history
            const historyItem: PromptHistoryItem = {
                id: `history-${Date.now()}`,
                prompt: prompt.trim(),
                timestamp: new Date(),
                success: false,
            }
            setPromptHistory(prev => [historyItem, ...prev.slice(0, 9)])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTemplateSelect = async (templateId: string) => {
        try {
            const template = await workflowAPI.getTemplate(templateId)
            if (template) {
                const { nodes, edges, metadata } = convertToReactFlowFormat(template)
                onWorkflowGenerated(nodes, edges, metadata)
            }
        } catch (err) {
            console.error('Failed to load template:', err)
            setError('Failed to load template')
        }
    }

    const handleExampleClick = (examplePrompt: string) => {
        setPrompt(examplePrompt)
        textareaRef.current?.focus()
    }

    const handleHistoryClick = (historyPrompt: string) => {
        setPrompt(historyPrompt)
        textareaRef.current?.focus()
    }

    const convertToReactFlowFormat = (workflow: any): { nodes: Node[], edges: Edge[], metadata: WorkflowMetadata } => {
        const getNodeCategory = (nodeType: string): string => {
            if (nodeType?.includes('trigger')) return 'trigger'
            if (nodeType?.includes('condition') || nodeType?.includes('if') || nodeType?.includes('switch')) return 'condition'
            if (['slack', 'jira', 'github', 'postgresql', 'email', 'http'].some(t => nodeType?.includes(t))) return 'integration'
            return 'action'
        }

        const nodes: Node[] = (workflow.nodes || []).map((n: any) => ({
            id: n.id,
            type: getNodeCategory(n.data?.type || n.type),
            position: n.position || { x: 100, y: 100 },
            data: n.data || { label: n.id, type: n.type, config: {} },
        }))

        const edges: Edge[] = (workflow.edges || []).map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            label: e.label,
            type: 'bezier',
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        }))

        const metadata: WorkflowMetadata = {
            name: workflow.name || 'AI Generated Workflow',
            description: workflow.description || '',
            variables: workflow.variables,
        }

        return { nodes, edges, metadata }
    }

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'testing': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'monitoring': return 'bg-green-100 text-green-700 border-green-200'
            case 'integration': return 'bg-purple-100 text-purple-700 border-purple-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    if (isCollapsed) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button
                    onClick={onToggleCollapse}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg"
                >
                    <Sparkles className="h-4 w-4" />
                    AI Generate
                    <ChevronUp className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="border-t border-gray-200 bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-4 py-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500">
                            <Wand2 className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">AI Workflow Generator</h3>
                        <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                            Powered by Gemini
                        </Badge>
                    </div>
                    {onToggleCollapse && (
                        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-3">
                        <TabsTrigger value="generate" className="gap-1.5 text-xs">
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-1.5 text-xs">
                            <Bookmark className="h-3.5 w-3.5" />
                            Templates
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-1.5 text-xs">
                            <History className="h-3.5 w-3.5" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="generate" className="mt-0 space-y-3">
                        {/* Prompt Input */}
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your workflow in plain English... e.g., 'When a new PR is opened, run smoke tests and post results to Slack'"
                                className="min-h-[80px] pr-24 resize-none bg-gray-50 border-gray-200 focus:border-teal-400 focus:ring-teal-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.metaKey) {
                                        handleGenerate()
                                    }
                                }}
                            />
                            <div className="absolute right-2 bottom-2 flex items-center gap-1">
                                <span className="text-xs text-gray-400">⌘ Enter</span>
                                <Button
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || prompt.length < 10}
                                    className="gap-1.5 bg-teal-600 hover:bg-teal-700"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                    Generate
                                </Button>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-200">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setError(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {warnings.length > 0 && !error && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in duration-200">
                                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-700">Generated with warnings:</p>
                                    <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in duration-200">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <p className="text-sm text-green-700">Workflow generated successfully!</p>
                            </div>
                        )}

                        {/* Example Prompts */}
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                <Lightbulb className="h-3.5 w-3.5" />
                                Try an example:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {EXAMPLE_PROMPTS.map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleExampleClick(example.prompt)}
                                        className="flex items-start gap-2 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        <div className="p-1 bg-white rounded text-gray-500">
                                            {example.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-700">{example.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{example.prompt}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0">
                        <ScrollArea className="h-[200px]">
                            <div className="grid grid-cols-2 gap-2 pr-2">
                                {templates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className="cursor-pointer hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                                        onClick={() => handleTemplateSelect(template.id)}
                                    >
                                        <CardHeader className="p-3 pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">{template.name}</CardTitle>
                                                <Badge variant="outline" className={`text-xs ${getCategoryColor(template.category)}`}>
                                                    {template.category}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-0">
                                            <CardDescription className="text-xs line-clamp-2">
                                                {template.description}
                                            </CardDescription>
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                                <Play className="h-3 w-3" />
                                                {template.node_count} nodes
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {templates.length === 0 && (
                                    <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                                        No templates available
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-2">
                                {promptHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleHistoryClick(item.prompt)}
                                    >
                                        {item.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-700 line-clamp-2">{item.prompt}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {item.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleHistoryClick(item.prompt)
                                            }}
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {promptHistory.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No generation history yet
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default AIWorkflowPrompt
