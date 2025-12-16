'use client'

import React, { useState } from 'react'
import { Copy, Trash2, AlertCircle, ChevronDown, ChevronRight, FunctionSquare, Edit3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TestStep, ActionConfig } from './types'
import { getActionConfig } from './action-configs'
import { snippetApi } from '@/lib/api/webAutomation'
import { toast } from 'sonner'

interface StepCardProps {
    step: TestStep
    index: number
    isSelected: boolean
    isLast: boolean
    onSelect: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
    onDelete: () => void
    onUpdateStep?: (field: keyof TestStep, value: any) => void
}

/**
 * Helper function to generate step details display based on action type
 */
function getStepDetails(step: TestStep): React.ReactNode {
    const formatSelector = (selector?: string) => selector ? (
        <span className="text-blue-600">{selector}</span>
    ) : null

    const formatValue = (value?: string) => value ? (
        <span className="text-green-600">"{value}"</span>
    ) : null

    const formatUrl = (url?: string) => url ? (
        <span className="text-purple-600">{url}</span>
    ) : null

    switch (step.action) {
        // Navigation actions
        case 'navigate':
        case 'new_tab':
        case 'wait_url':
            return step.url ? formatUrl(step.url) : formatUrl(step.value)

        // Assert title
        case 'assert_title':
            return step.expected_title ? (
                <>
                    <span className="text-gray-400">Title {step.comparison || 'equals'} </span>
                    <span className="text-green-600">"{step.expected_title}"</span>
                </>
            ) : null

        // Assert URL
        case 'assert_url':
            return step.expected_url ? (
                <>
                    <span className="text-gray-400">URL {step.comparison || 'equals'} </span>
                    <span className="text-purple-600">{step.expected_url}</span>
                </>
            ) : null

        // Type/Input actions
        case 'type':
        case 'fill':
            return (
                <>
                    {formatSelector(step.selector)}
                    {step.selector && step.value && <span className="mx-1">→</span>}
                    {formatValue(step.value)}
                </>
            )

        // Click actions
        case 'click':
        case 'double_click':
        case 'right_click':
        case 'hover':
        case 'focus':
            return formatSelector(step.selector)

        // Log action
        case 'log':
            return step.message ? (
                <>
                    <span className="text-gray-400">[{step.level || 'info'}] </span>
                    <span className="text-amber-600">"{step.message}"</span>
                </>
            ) : null

        // Wait action
        case 'wait':
            return step.amount ? (
                <span className="text-gray-600">{step.amount}ms</span>
            ) : null

        // Screenshot action
        case 'screenshot':
            return step.path ? (
                <span className="text-gray-600">{step.path}</span>
            ) : <span className="text-gray-400">Auto-named</span>

        // Set variable
        case 'set_variable':
            return (
                <>
                    <span className="text-orange-600">${'{' + (step.variable_name || 'var') + '}'}</span>
                    {step.value && <span className="mx-1">=</span>}
                    {formatValue(step.value)}
                </>
            )

        // Execute script
        case 'execute_script':
            return step.script ? (
                <span className="text-gray-600 truncate">{step.script.slice(0, 40)}{step.script.length > 40 ? '...' : ''}</span>
            ) : null

        // Assert with selector/value
        case 'assert':
        case 'soft_assert':
            if (step.selector) {
                return (
                    <>
                        {formatSelector(step.selector)}
                        {step.value && <span className="mx-1">→</span>}
                        {formatValue(step.value)}
                    </>
                )
            }
            return null

        // Default case for actions with selector and/or value
        default:
            if (step.selector || step.value) {
                return (
                    <>
                        {formatSelector(step.selector)}
                        {step.selector && step.value && <span className="mx-1">→</span>}
                        {formatValue(step.value)}
                    </>
                )
            }
            return null
    }
}

/**
 * Individual step card component for the test builder
 */
export function StepCard({
    step,
    index,
    isSelected,
    isLast,
    onSelect,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
    onUpdateStep,
}: StepCardProps) {
    const actionConfig = getActionConfig(step.action)
    const Icon = actionConfig?.icon || AlertCircle

    // State for expandable snippet editing
    const [isExpanded, setIsExpanded] = useState(false)
    const [editingSnippetStepIndex, setEditingSnippetStepIndex] = useState<number | null>(null)
    const [editedSnippetSteps, setEditedSnippetSteps] = useState<any[]>(step.snippet_steps || [])
    const [isSavingSnippet, setIsSavingSnippet] = useState(false)
    const [snippetName, setSnippetName] = useState(step.snippet_name || '')
    const [isLoadingSnippet, setIsLoadingSnippet] = useState(false)
    const [snippetError, setSnippetError] = useState<string | null>(null)

    // Fetch snippet steps if not embedded in step data
    React.useEffect(() => {
        const fetchSnippetSteps = async () => {
            // Only fetch if this is a call_snippet with snippet_id but no snippet_steps
            if (step.action === 'call_snippet' && step.snippet_id && (!step.snippet_steps || step.snippet_steps.length === 0)) {
                setIsLoadingSnippet(true)
                setSnippetError(null)
                try {
                    const snippet = await snippetApi.getSnippet(step.snippet_id)
                    if (snippet) {
                        setEditedSnippetSteps(snippet.steps || [])
                        setSnippetName(snippet.name || '')
                        // Also update the step data if callback is available
                        if (onUpdateStep) {
                            onUpdateStep('snippet_steps', snippet.steps || [])
                            onUpdateStep('snippet_name', snippet.name || '')
                        }
                    } else {
                        // Snippet was deleted (getSnippet returned null)
                        setSnippetError('Snippet was deleted. Please select a new snippet or remove this step.')
                    }
                } catch (error: any) {
                    console.error('Failed to fetch snippet:', error)
                    // Check if it's a 404 (snippet deleted)
                    if (error?.response?.status === 404 || error?.message?.includes('404')) {
                        setSnippetError('Snippet was deleted. Please select a new snippet or remove this step.')
                    } else {
                        setSnippetError('Failed to load snippet')
                    }
                } finally {
                    setIsLoadingSnippet(false)
                }
            }
        }
        fetchSnippetSteps()
    }, [step.action, step.snippet_id, step.snippet_steps?.length])

    // Handler to update a snippet step field
    const handleSnippetStepChange = (stepIdx: number, field: string, value: any) => {
        setEditedSnippetSteps(prev => {
            const updated = [...prev]
            updated[stepIdx] = { ...updated[stepIdx], [field]: value }
            return updated
        })
    }

    // Save snippet steps
    const handleSaveSnippetSteps = async () => {
        if (!step.snippet_id) return

        setIsSavingSnippet(true)
        try {
            console.log('[SNIPPET SAVE DEBUG] Saving steps:', JSON.stringify(editedSnippetSteps, null, 2))
            await snippetApi.updateSnippet(step.snippet_id, { steps: editedSnippetSteps })

            // Update local state
            if (onUpdateStep) {
                onUpdateStep('snippet_steps', editedSnippetSteps)
            }

            toast.success('Snippet steps updated!')
            setEditingSnippetStepIndex(null)
        } catch (error) {
            console.error('Failed to save snippet:', error)
            toast.error('Failed to save snippet steps')
        } finally {
            setIsSavingSnippet(false)
        }
    }

    return (
        <div className="relative group">
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute left-8 top-full h-3 w-0.5 bg-gray-300 z-0" />
            )}

            <Card
                className={`relative z-10 transition-all cursor-pointer border-2 ${isSelected
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20'
                    : 'border-transparent hover:border-gray-300'
                    }`}
                onClick={onSelect}
            >
                <div className="p-3 flex items-center gap-3">
                    {/* Step number */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                        {index + 1}
                    </div>

                    {/* Action icon */}
                    <div className={`${actionConfig?.color} p-2 rounded-lg text-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                                {actionConfig?.name}
                            </span>
                            {step.description && (
                                <span className="text-xs text-gray-500 truncate">
                                    - {step.description}
                                </span>
                            )}
                        </div>
                        {/* Display relevant details based on action type */}
                        {getStepDetails(step) && (
                            <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                                {getStepDetails(step)}
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveUp()
                            }}
                            disabled={index === 0}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                        >
                            ↑
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveDown()
                            }}
                            disabled={isLast}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                        >
                            ↓
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDuplicate()
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="p-1.5 hover:bg-red-50 rounded text-red-600"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Expandable Snippet Steps Section - Only for call_snippet */}
                {step.action === 'call_snippet' && (
                    <div className="border-t border-gray-100">
                        {/* Expand/Collapse Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsExpanded(!isExpanded)
                            }}
                            className={`w-full px-3 py-2 flex items-center gap-2 text-xs transition-colors ${!step.snippet_id && !snippetError
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : snippetError
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-violet-600 hover:bg-violet-50'
                                }`}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                            <FunctionSquare className="w-3 h-3" />
                            <span className="font-medium">{snippetName || step.snippet_name || 'Snippet'}()</span>
                            {isLoadingSnippet ? (
                                <span className="text-violet-400 ml-auto">Loading...</span>
                            ) : snippetError ? (
                                <span className="text-red-500 ml-auto text-[10px]">⚠️ Error</span>
                            ) : !step.snippet_id ? (
                                <span className="text-amber-500 ml-auto text-[10px]">⚠️ Not configured</span>
                            ) : (
                                <span className="text-violet-400 ml-auto">{editedSnippetSteps.length} steps</span>
                            )}
                            <Edit3 className="w-3 h-3 text-violet-400" />
                        </button>

                        {/* Warning message when no snippet is selected */}
                        {!step.snippet_id && !snippetError && (
                            <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
                                <div className="flex items-center gap-2 text-xs text-amber-600">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>No snippet selected</span>
                                </div>
                                <p className="text-[10px] text-amber-500 mt-1 ml-5">
                                    Click this step and select a snippet from the Properties panel on the right.
                                </p>
                            </div>
                        )}

                        {/* Error message for deleted/missing snippet */}
                        {snippetError && (
                            <div className="px-3 py-2 bg-red-50 border-t border-red-100">
                                <div className="flex items-center gap-2 text-xs text-red-600">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{snippetError}</span>
                                </div>
                                <p className="text-[10px] text-red-500 mt-1 ml-5">
                                    Click this step and select a new snippet from the properties panel.
                                </p>
                            </div>
                        )}

                        {/* Expanded Steps */}
                        {isExpanded && !snippetError && (
                            <div className="px-3 pb-3 space-y-2">
                                {/* Save/Cancel buttons */}
                                {editingSnippetStepIndex !== null && (
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditedSnippetSteps(step.snippet_steps || [])
                                                setEditingSnippetStepIndex(null)
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-6 text-xs bg-violet-600 hover:bg-violet-700"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSaveSnippetSteps()
                                            }}
                                            disabled={isSavingSnippet}
                                        >
                                            {isSavingSnippet ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                )}

                                {/* Steps List */}
                                <div className="space-y-1.5 bg-gray-50 rounded-lg p-2">
                                    {editedSnippetSteps.map((subStep, subIdx) => (
                                        <div key={subIdx}>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingSnippetStepIndex(editingSnippetStepIndex === subIdx ? null : subIdx)
                                                }}
                                                className={`flex items-center gap-2 p-1.5 bg-white rounded border cursor-pointer text-xs transition-all ${editingSnippetStepIndex === subIdx
                                                    ? 'border-violet-400 ring-1 ring-violet-200'
                                                    : 'border-gray-100 hover:border-violet-200'
                                                    }`}
                                            >
                                                <span className="text-gray-400 w-4 text-right text-[10px]">{subIdx + 1}.</span>
                                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                                    {subStep.action || subStep.type}
                                                </Badge>
                                                {subStep.url && (
                                                    <code className="text-blue-500 truncate max-w-[100px] text-[10px]">{subStep.url}</code>
                                                )}
                                                {subStep.selector && (
                                                    <code className="text-purple-500 truncate max-w-[80px] text-[10px]">{subStep.selector}</code>
                                                )}
                                                {subStep.value && (
                                                    <code className="text-amber-500 truncate max-w-[60px] text-[10px]">"{subStep.value}"</code>
                                                )}
                                                {subStep.amount && (
                                                    <span className="text-gray-400 text-[10px]">{subStep.amount}ms</span>
                                                )}
                                                <span className="ml-auto text-gray-400 text-[10px]">
                                                    {editingSnippetStepIndex === subIdx ? '▼' : '✎'}
                                                </span>
                                            </div>

                                            {/* Inline Edit Form */}
                                            {editingSnippetStepIndex === subIdx && (
                                                <div
                                                    className="mt-1 p-2 bg-white border border-violet-200 rounded space-y-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* URL field */}
                                                    {(subStep.action === 'navigate' || subStep.action === 'wait_url' || subStep.action === 'new_tab') && (
                                                        <div>
                                                            <Label className="text-[10px] text-gray-500">URL</Label>
                                                            <Input
                                                                value={subStep.url || ''}
                                                                onChange={(e) => handleSnippetStepChange(subIdx, 'url', e.target.value)}
                                                                placeholder="https://..."
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Selector field */}
                                                    {(subStep.action === 'click' || subStep.action === 'type' || subStep.action === 'fill' ||
                                                        subStep.action === 'hover' || subStep.action === 'focus') && (
                                                            <div>
                                                                <Label className="text-[10px] text-gray-500">Selector</Label>
                                                                <Input
                                                                    value={subStep.selector || ''}
                                                                    onChange={(e) => handleSnippetStepChange(subIdx, 'selector', e.target.value)}
                                                                    placeholder="#id or .class"
                                                                    className="h-7 text-xs font-mono"
                                                                />
                                                            </div>
                                                        )}

                                                    {/* Value field */}
                                                    {(subStep.action === 'type' || subStep.action === 'fill') && (
                                                        <div>
                                                            <Label className="text-[10px] text-gray-500">Value</Label>
                                                            <Input
                                                                value={subStep.value || ''}
                                                                onChange={(e) => handleSnippetStepChange(subIdx, 'value', e.target.value)}
                                                                placeholder="Text to type"
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Wait duration */}
                                                    {subStep.action === 'wait' && (
                                                        <div>
                                                            <Label className="text-[10px] text-gray-500">Duration (ms)</Label>
                                                            <Input
                                                                type="number"
                                                                value={subStep.amount || subStep.timeout || 1000}
                                                                onChange={(e) => handleSnippetStepChange(subIdx, 'amount', parseInt(e.target.value))}
                                                                className="h-7 text-xs"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Assert URL */}
                                                    {subStep.action === 'assert_url' && (
                                                        <>
                                                            <div>
                                                                <Label className="text-[10px] text-gray-500">Comparison</Label>
                                                                <select
                                                                    value={subStep.comparison || 'contains'}
                                                                    onChange={(e) => handleSnippetStepChange(subIdx, 'comparison', e.target.value)}
                                                                    className="w-full h-7 text-xs border rounded px-2"
                                                                >
                                                                    <option value="equals">Equals</option>
                                                                    <option value="contains">Contains</option>
                                                                    <option value="starts_with">Starts With</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] text-gray-500">Expected URL</Label>
                                                                <Input
                                                                    value={subStep.expected_url || ''}
                                                                    onChange={(e) => handleSnippetStepChange(subIdx, 'expected_url', e.target.value)}
                                                                    placeholder="Expected URL"
                                                                    className="h-7 text-xs"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 italic">Click a step to edit</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}
