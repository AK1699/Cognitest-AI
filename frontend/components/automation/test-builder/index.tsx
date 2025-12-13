'use client'

import React, { useEffect, useRef } from 'react'
import { Play, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { webAutomationApi } from '@/lib/api/webAutomation'

// Types
import { TestStep, TestBuilderTabProps, BuilderMethod } from './types'

// Hooks
import { useTestBuilder } from './hooks/use-test-builder'
import { useRecording } from './hooks/use-recording'
import { useAIGenerator } from './hooks/use-ai-generator'

// Components
import { ActionPalette, ActionPaletteHeader } from './ActionPalette'
import { RecordingPanel } from './RecordingPanel'
import { AIGeneratorPanel } from './AIGeneratorPanel'
import { StepList } from './StepList'
import { StepPropertiesPanel } from './StepPropertiesPanel'

/**
 * TestBuilderTab - Main component for building test flows
 * 
 * Refactored from a 2392-line monolith into focused sub-components.
 */
export default function TestBuilderTab({ selectedEnvironment, flowId, projectId }: TestBuilderTabProps) {
    // Builder method state
    const [builderMethod, setBuilderMethod] = React.useState<BuilderMethod>('visual')

    // WebSocket ref for cleanup
    const wsRef = useRef<WebSocket | null>(null)

    // Core test builder state and actions
    const {
        steps,
        setSteps,
        selectedStepId,
        setSelectedStepId,
        testName,
        setTestName,
        isSaving,
        isFlowLoading,
        setIsFlowLoading,
        selectedStep,
        addStep,
        updateStep,
        deleteStep,
        duplicateStep,
        moveStep,
        handleSaveFlow,
        handleRunFlow,
    } = useTestBuilder({ flowId, selectedEnvironment })

    // Recording functionality
    const {
        isRecording,
        recordingUrl,
        setRecordingUrl,
        handleStartRecording,
        handleStopRecording,
    } = useRecording({
        projectId,
        onStepRecorded: (step) => setSteps(prev => [...prev, step]),
    })

    // AI generation functionality
    const {
        aiPrompt,
        setAiPrompt,
        isGenerating,
        generatedSteps,
        generateError,
        handleGenerateSteps,
        handleAddGeneratedSteps,
    } = useAIGenerator({
        existingSteps: steps,
        onAddSteps: (newSteps) => setSteps(prev => [...prev, ...newSteps]),
    })

    // Fetch test flow details on mount
    useEffect(() => {
        const fetchTestDetails = async () => {
            if (flowId) {
                try {
                    setIsFlowLoading(true)
                    const flow = await webAutomationApi.getTestFlow(flowId)
                    setTestName(flow.name)
                    console.log('=== LOADING TEST FLOW ===')
                    console.log('flow.nodes:', flow.nodes)
                    console.log('flow.nodes length:', flow.nodes?.length)

                    if (flow.nodes && Array.isArray(flow.nodes) && flow.nodes.length > 0) {
                        // Transform from node format to flat step format
                        const transformedSteps: TestStep[] = flow.nodes.map((node: any, idx: number) => {
                            console.log(`Node ${idx}:`, JSON.stringify(node).substring(0, 300))

                            // Handle both flat step format and nested node format
                            const nodeData = node.data || {}

                            // Extract action from multiple possible locations
                            let extractedAction =
                                node.action ||                    // Direct action field
                                nodeData.actionType ||            // data.actionType (from save format)
                                nodeData.action ||                // data.action  
                                (node.type !== 'action' ? node.type : null) // type if not generic "action"

                            // Infer action type from step properties if not found
                            if (!extractedAction || extractedAction === 'unknown') {
                                const url = node.url || nodeData.url
                                const selector = node.selector || nodeData.selector
                                const value = node.value || nodeData.value
                                const expectedTitle = node.expected_title || nodeData.expected_title
                                const expectedUrl = node.expected_url || nodeData.expected_url

                                if (expectedTitle) {
                                    extractedAction = 'assert_title'
                                } else if (expectedUrl) {
                                    extractedAction = 'assert_url'
                                } else if (url && !selector) {
                                    extractedAction = 'navigate'
                                } else if (selector && value) {
                                    extractedAction = 'type'
                                } else if (selector) {
                                    extractedAction = 'click'
                                } else {
                                    extractedAction = 'unknown'
                                }
                            }

                            console.log(`Node ${idx} extracted action:`, extractedAction)

                            // Spread nodeData first so explicit fields take precedence
                            return {
                                ...nodeData,
                                // Then set explicit fields to ensure they're not overridden
                                id: node.id || nodeData.id || `step-${Date.now()}-${Math.random()}`,
                                action: extractedAction,
                                selector: node.selector || nodeData.selector || '',
                                value: node.value || nodeData.value || '',
                                timeout: node.timeout || nodeData.timeout || 5000,
                                description: node.description || nodeData.description || nodeData.label || '',
                                variable_name: node.variable_name || nodeData.variable_name,
                                attribute_name: node.attribute_name || nodeData.attribute_name,
                                url: node.url || nodeData.url || '',
                                data_type: node.data_type || nodeData.data_type,
                                // Assertion specific fields
                                expected_title: node.expected_title || nodeData.expected_title || '',
                                expected_url: node.expected_url || nodeData.expected_url || '',
                                comparison: node.comparison || nodeData.comparison || 'equals',
                            }
                        })
                        console.log('Transformed steps:', transformedSteps)
                        setSteps(transformedSteps)
                    } else {
                        console.log('flow.nodes is empty or not an array')
                    }
                } catch (error) {
                    console.error('Failed to fetch test flow:', error)
                } finally {
                    setIsFlowLoading(false)
                }
            } else {
                setTestName('Test Flow')
            }
        }

        fetchTestDetails()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [flowId, setIsFlowLoading, setTestName, setSteps])

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Actions Library */}
            <div className="w-72 min-w-[288px] bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                {/* Method Selector */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setBuilderMethod('visual')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'visual'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => setBuilderMethod('recorder')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'recorder'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Recorder
                        </button>
                        <button
                            onClick={() => setBuilderMethod('ai')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'ai'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            AI
                        </button>
                    </div>

                    {builderMethod === 'visual' && <ActionPaletteHeader />}
                </div>

                {/* Conditional Content */}
                {builderMethod === 'visual' ? (
                    <ActionPalette onAddStep={addStep} />
                ) : builderMethod === 'recorder' ? (
                    <RecordingPanel
                        isRecording={isRecording}
                        recordingUrl={recordingUrl}
                        onUrlChange={setRecordingUrl}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                    />
                ) : (
                    <AIGeneratorPanel
                        aiPrompt={aiPrompt}
                        onPromptChange={setAiPrompt}
                        isGenerating={isGenerating}
                        generatedSteps={generatedSteps}
                        generateError={generateError}
                        onGenerateSteps={handleGenerateSteps}
                        onAddGeneratedSteps={handleAddGeneratedSteps}
                    />
                )}
            </div>

            {/* Center Panel - Test Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50/50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isFlowLoading ? 'Loading...' : testName}
                        </h2>
                        <p className="text-xs text-gray-500">Sequence of steps executed in order</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {selectedEnvironment && (
                            <div className="flex items-center gap-2 mr-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Active Environment: <b>{selectedEnvironment.name}</b>
                            </div>
                        )}

                        <Button variant="outline" size="sm" onClick={handleSaveFlow} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" onClick={handleRunFlow}>
                            <Play className="w-4 h-4 mr-2" />
                            Run Flow
                        </Button>
                    </div>
                </div>

                {/* Step List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <StepList
                        steps={steps}
                        selectedStepId={selectedStepId}
                        onSelectStep={setSelectedStepId}
                        onMoveStep={moveStep}
                        onDuplicateStep={duplicateStep}
                        onDeleteStep={deleteStep}
                        onAddStepClick={() => setSelectedStepId(null)}
                    />
                </div>
            </div>

            {/* Right Panel - Properties */}
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900">Properties</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <StepPropertiesPanel
                        selectedStep={selectedStep}
                        onUpdateStep={updateStep}
                    />
                </div>
            </div>
        </div>
    )
}

// Re-export types for consumers
export * from './types'
