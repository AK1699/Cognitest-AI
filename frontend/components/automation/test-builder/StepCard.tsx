'use client'

import React from 'react'
import { Copy, Trash2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { TestStep, ActionConfig } from './types'
import { getActionConfig } from './action-configs'

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
}: StepCardProps) {
    const actionConfig = getActionConfig(step.action)
    const Icon = actionConfig?.icon || AlertCircle

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
            </Card>
        </div>
    )
}
