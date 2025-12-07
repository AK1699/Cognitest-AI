'use client'

import React from 'react'
import { Target, Plus } from 'lucide-react'
import { TestStep } from './types'
import { StepCard } from './StepCard'

interface StepListProps {
    steps: TestStep[]
    selectedStepId: string | null
    onSelectStep: (stepId: string) => void
    onMoveStep: (stepId: string, direction: 'up' | 'down') => void
    onDuplicateStep: (stepId: string) => void
    onDeleteStep: (stepId: string) => void
    onAddStepClick: () => void
}

/**
 * Center panel step list component
 */
export function StepList({
    steps,
    selectedStepId,
    onSelectStep,
    onMoveStep,
    onDuplicateStep,
    onDeleteStep,
    onAddStepClick,
}: StepListProps) {
    if (steps.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Target className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">No steps added yet</p>
                <p className="text-xs mt-1">Drag actions from the left or click to add</p>
            </div>
        )
    }

    return (
        <div className="space-y-3 max-w-3xl mx-auto">
            {steps.map((step, index) => (
                <StepCard
                    key={step.id}
                    step={step}
                    index={index}
                    isSelected={selectedStepId === step.id}
                    isLast={index === steps.length - 1}
                    onSelect={() => onSelectStep(step.id)}
                    onMoveUp={() => onMoveStep(step.id, 'up')}
                    onMoveDown={() => onMoveStep(step.id, 'down')}
                    onDuplicate={() => onDuplicateStep(step.id)}
                    onDelete={() => onDeleteStep(step.id)}
                />
            ))}

            <button
                onClick={onAddStepClick}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm font-medium"
            >
                <Plus className="w-4 h-4" />
                Add Step
            </button>
        </div>
    )
}
