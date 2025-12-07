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
                        {(step.selector || step.value) && (
                            <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                                {step.selector && (
                                    <span className="text-blue-600">{step.selector}</span>
                                )}
                                {step.selector && step.value && <span className="mx-1">→</span>}
                                {step.value && (
                                    <span className="text-green-600">"{step.value}"</span>
                                )}
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
