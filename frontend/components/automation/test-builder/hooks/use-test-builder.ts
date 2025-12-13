'use client'

import { useState, useCallback } from 'react'
import { TestStep, Environment } from '../types'
import { webAutomationApi } from '@/lib/api/webAutomation'
import { useToast } from '@/hooks/use-toast'

interface UseTestBuilderProps {
    flowId?: string | null
    selectedEnvironment?: Environment
}

interface UseTestBuilderReturn {
    // State
    steps: TestStep[]
    setSteps: React.Dispatch<React.SetStateAction<TestStep[]>>
    selectedStepId: string | null
    setSelectedStepId: React.Dispatch<React.SetStateAction<string | null>>
    testName: string
    setTestName: React.Dispatch<React.SetStateAction<string>>
    isSaving: boolean
    isFlowLoading: boolean
    setIsFlowLoading: React.Dispatch<React.SetStateAction<boolean>>

    // Computed
    selectedStep: TestStep | undefined

    // Actions
    addStep: (actionType: string) => void
    updateStep: (stepId: string, field: keyof TestStep, value: any) => void
    deleteStep: (stepId: string) => void
    duplicateStep: (stepId: string) => void
    moveStep: (stepId: string, direction: 'up' | 'down') => void
    handleSaveFlow: () => Promise<void>
    handleRunFlow: (executionMode: 'headed' | 'headless') => Promise<void>
}

/**
 * Hook for managing test builder state and actions
 */
export function useTestBuilder({ flowId, selectedEnvironment }: UseTestBuilderProps): UseTestBuilderReturn {
    const { toast } = useToast()

    // Core state
    const [steps, setSteps] = useState<TestStep[]>([])
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const [testName, setTestName] = useState<string>('Test Flow')
    const [isSaving, setIsSaving] = useState(false)
    const [isFlowLoading, setIsFlowLoading] = useState(false)

    // Computed values
    const selectedStep = steps.find(s => s.id === selectedStepId)

    // Step manipulation actions
    const addStep = useCallback((actionType: string) => {
        const newStep: TestStep = {
            id: `step-${Date.now()}`,
            action: actionType,
            selector: '',
            value: '',
            timeout: 5000,
            description: '',
        }
        setSteps(prev => [...prev, newStep])
        setSelectedStepId(newStep.id)
    }, [])

    const updateStep = useCallback((stepId: string, field: keyof TestStep, value: any) => {
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, [field]: value } : s))
    }, [])

    const deleteStep = useCallback((stepId: string) => {
        setSteps(prev => prev.filter(s => s.id !== stepId))
        setSelectedStepId(prev => prev === stepId ? null : prev)
    }, [])

    const duplicateStep = useCallback((stepId: string) => {
        setSteps(prev => {
            const step = prev.find(s => s.id === stepId)
            if (!step) return prev

            const newStep = { ...step, id: `step-${Date.now()}` }
            const index = prev.findIndex(s => s.id === stepId)
            const newSteps = [...prev]
            newSteps.splice(index + 1, 0, newStep)
            return newSteps
        })
    }, [])

    const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
        setSteps(prev => {
            const index = prev.findIndex(s => s.id === stepId)
            if (index === -1) return prev

            if (direction === 'up' && index > 0) {
                const newSteps = [...prev]
                    ;[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
                return newSteps
            } else if (direction === 'down' && index < prev.length - 1) {
                const newSteps = [...prev]
                    ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
                return newSteps
            }
            return prev
        })
    }, [])

    // Flow actions
    const handleSaveFlow = useCallback(async () => {
        if (!flowId) {
            toast.error('Cannot save: No test flow selected. Please create a new test flow first.')
            return
        }

        setIsSaving(true)
        try {
            // Transform steps to nodes format expected by backend
            const nodes = steps.map((step, index) => ({
                id: step.id,
                type: 'action',
                position: { x: 100, y: 100 + (index * 80) },
                data: {
                    actionType: step.action,
                    label: step.description || step.action,
                    // Include ALL step properties in data for backend execution
                    ...step
                }
            }))

            await webAutomationApi.updateTestFlow(flowId, {
                name: testName,
                nodes: nodes
            })
            toast.success('Test flow saved successfully!')
        } catch (error: any) {
            console.error('Failed to save test flow:', error)
            toast.error(`Failed to save: ${error.message || 'Unknown error'}`)
        } finally {
            setIsSaving(false)
        }
    }, [flowId, testName, steps, toast])

    const handleRunFlow = useCallback(async (executionMode: 'headed' | 'headless') => {
        if (!flowId) {
            toast.error('Cannot run: Please save the flow first')
            return
        }

        if (steps.length === 0) {
            toast.error('Cannot run: Add at least one step before running')
            return
        }

        try {
            const variables = selectedEnvironment?.variables || {}
            console.log('Running flow with variables:', variables, 'mode:', executionMode)

            toast.loading(`Running "${testName}" in ${executionMode} mode...`)

            await webAutomationApi.executeTestFlow(flowId, {
                execution_mode: executionMode,
                variables: variables
            })

            toast.success('Test execution started! Check the Logs tab for results.')
        } catch (error: any) {
            console.error('Failed to execute flow:', error)
            toast.error(`Execution failed: ${error.message || 'Unknown error'}`)
        }
    }, [flowId, selectedEnvironment, steps, testName, toast])

    return {
        // State
        steps,
        setSteps,
        selectedStepId,
        setSelectedStepId,
        testName,
        setTestName,
        isSaving,
        isFlowLoading,
        setIsFlowLoading,

        // Computed
        selectedStep,

        // Actions
        addStep,
        updateStep,
        deleteStep,
        duplicateStep,
        moveStep,
        handleSaveFlow,
        handleRunFlow,
    }
}
