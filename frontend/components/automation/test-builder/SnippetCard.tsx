'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    FunctionSquare,
    ChevronDown,
    ChevronRight,
    Globe,
    AlertCircle,
    Settings2,
} from 'lucide-react'
import { Snippet, SnippetParameter } from '@/lib/api/webAutomation'
import { snippetApi } from '@/lib/api/webAutomation'

interface SnippetCardProps {
    step: {
        id: string
        action: string
        snippet_id?: string
        parameters?: Record<string, string | number | boolean>
    }
    stepIndex: number
    projectId: string
    isExpanded?: boolean
    onToggleExpand?: () => void
    onParameterChange?: (stepId: string, paramName: string, value: string) => void
}

export function SnippetCard({
    step,
    stepIndex,
    projectId,
    isExpanded = false,
    onToggleExpand,
    onParameterChange,
}: SnippetCardProps) {
    const [snippet, setSnippet] = useState<Snippet | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [paramValues, setParamValues] = useState<Record<string, string>>(
        (step.parameters as Record<string, string>) || {}
    )

    useEffect(() => {
        if (step.snippet_id) {
            loadSnippet()
        }
    }, [step.snippet_id])

    const loadSnippet = async () => {
        if (!step.snippet_id) return
        try {
            setLoading(true)
            setError(null)
            const data = await snippetApi.getSnippet(step.snippet_id)
            if (!data) {
                setError('Snippet not found')
                return
            }
            setSnippet(data)

            // Initialize parameter values from snippet defaults
            const defaultParams: Record<string, string> = {}
            data.parameters?.forEach((p) => {
                if (p.default && !paramValues[p.name]) {
                    defaultParams[p.name] = p.default
                }
            })
            if (Object.keys(defaultParams).length > 0) {
                setParamValues({ ...defaultParams, ...paramValues })
            }
        } catch (err) {
            console.error('Failed to load snippet:', err)
            setError('Snippet not found')
        } finally {
            setLoading(false)
        }
    }

    const handleParamChange = (paramName: string, value: string) => {
        setParamValues((prev) => ({ ...prev, [paramName]: value }))
        onParameterChange?.(step.id, paramName, value)
    }

    if (loading) {
        return (
            <Card className="p-4 border-dashed border-violet-300 bg-violet-50/50">
                <div className="flex items-center gap-3">
                    <div className="bg-violet-500 p-2 rounded-lg">
                        <FunctionSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm text-gray-500">Loading snippet...</div>
                </div>
            </Card>
        )
    }

    if (error || !snippet) {
        return (
            <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-center gap-3">
                    <div className="bg-red-500 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-red-700">Snippet Not Found</div>
                        <div className="text-xs text-red-500">ID: {step.snippet_id}</div>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-white overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-violet-50/50 transition-colors"
                onClick={onToggleExpand}
            >
                <button className="p-1 hover:bg-violet-100 rounded">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-lg shadow-sm">
                    <FunctionSquare className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">STEP {stepIndex + 1}</span>
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                            Snippet
                        </Badge>
                        {snippet.is_global && (
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                        )}
                    </div>
                    <div className="font-medium text-gray-900 truncate">{snippet.name}</div>
                    {snippet.description && (
                        <p className="text-xs text-gray-500 truncate">{snippet.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{snippet.steps?.length || 0} steps</span>
                    {snippet.parameters && snippet.parameters.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                            <Settings2 className="w-3 h-3 mr-1" />
                            {snippet.parameters.length} params
                        </Badge>
                    )}
                </div>
            </div>

            {/* Expanded Content: Parameter Inputs */}
            {isExpanded && snippet.parameters && snippet.parameters.length > 0 && (
                <div className="px-4 pb-4 pt-0 ml-12 border-t border-violet-100">
                    <div className="pt-3 space-y-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Parameters</div>
                        <div className="grid gap-3">
                            {snippet.parameters.map((param) => (
                                <div key={param.name} className="space-y-1">
                                    <Label className="text-xs flex items-center gap-2">
                                        <code className="text-violet-600 font-mono">
                                            {'{{'}{param.name}{'}}'}
                                        </code>
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                            {param.type}
                                        </Badge>
                                        {param.description && (
                                            <span className="text-gray-400 font-normal">{param.description}</span>
                                        )}
                                    </Label>
                                    <Input
                                        value={paramValues[param.name] || ''}
                                        onChange={(e) => handleParamChange(param.name, e.target.value)}
                                        placeholder={param.default || `Enter ${param.name}`}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Steps Preview (when expanded and has steps) */}
            {isExpanded && snippet.steps && snippet.steps.length > 0 && (
                <div className="px-4 pb-4 ml-12 border-t border-violet-100">
                    <div className="pt-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Expanded Steps
                        </div>
                        <div className="space-y-1 bg-gray-50 rounded-lg p-2">
                            {snippet.steps.map((s, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-xs text-gray-600 p-1.5 bg-white rounded border border-gray-100"
                                >
                                    <span className="text-gray-400 w-5 text-right">{idx + 1}.</span>
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                        {s.action || s.type}
                                    </Badge>
                                    {s.selector && (
                                        <code className="text-gray-500 truncate max-w-[200px] font-mono text-xs">
                                            {s.selector}
                                        </code>
                                    )}
                                    {s.value && (
                                        <span className="text-gray-400 truncate max-w-[150px]">"{s.value}"</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}
