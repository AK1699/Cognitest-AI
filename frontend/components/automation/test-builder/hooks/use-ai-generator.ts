'use client'

import { useState, useCallback } from 'react'
import { TestStep } from '../types'
import { webAutomationApi } from '@/lib/api/webAutomation'

interface UseAIGeneratorProps {
    existingSteps: TestStep[]
    onAddSteps: (steps: TestStep[]) => void
}

interface UseAIGeneratorReturn {
    aiPrompt: string
    setAiPrompt: React.Dispatch<React.SetStateAction<string>>
    isGenerating: boolean
    generatedSteps: TestStep[]
    generateError: string | null
    handleGenerateSteps: () => Promise<void>
    handleAddGeneratedSteps: () => void
    clearGeneratedSteps: () => void
}

/**
 * Hook for managing AI step generation functionality
 */
export function useAIGenerator({ existingSteps, onAddSteps }: UseAIGeneratorProps): UseAIGeneratorReturn {
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedSteps, setGeneratedSteps] = useState<TestStep[]>([])
    const [generateError, setGenerateError] = useState<string | null>(null)

    const handleGenerateSteps = useCallback(async () => {
        if (!aiPrompt.trim()) return

        setIsGenerating(true)
        setGenerateError(null)
        setGeneratedSteps([])

        try {
            const result = await webAutomationApi.generateStepsFromPrompt(aiPrompt, {
                existingSteps: existingSteps
            })

            if (result.success && result.steps.length > 0) {
                setGeneratedSteps(result.steps)
            } else {
                setGenerateError(result.error || 'No steps were generated. Try a more detailed description.')
            }
        } catch (error: any) {
            setGenerateError(error.message || 'Failed to generate steps')
        } finally {
            setIsGenerating(false)
        }
    }, [aiPrompt, existingSteps])

    const handleAddGeneratedSteps = useCallback(() => {
        const newSteps = generatedSteps.map((step, index) => ({
            ...step,
            id: `step-${Date.now()}-${index}`,
        }))
        onAddSteps(newSteps)
        setGeneratedSteps([])
        setAiPrompt('')
    }, [generatedSteps, onAddSteps])

    const clearGeneratedSteps = useCallback(() => {
        setGeneratedSteps([])
        setGenerateError(null)
    }, [])

    return {
        aiPrompt,
        setAiPrompt,
        isGenerating,
        generatedSteps,
        generateError,
        handleGenerateSteps,
        handleAddGeneratedSteps,
        clearGeneratedSteps,
    }
}
