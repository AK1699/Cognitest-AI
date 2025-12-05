'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Plus,
    Trash2,
    GripVertical,
    Play,
    Save,
    Copy,
    MousePointerClick,
    Type,
    Eye,
    Clock,
    CheckCircle2,
    Navigation,
    Upload,
    Download,
    Keyboard,
    Search,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    Settings,
    Target,
    Repeat,
    Variable,
    Wand2,
    Database,
    Zap,
    Mic,
    Sparkles
} from 'lucide-react'
import { Environment } from './EnvironmentManager'
import { webAutomationApi } from '@/lib/api/webAutomation'

interface TestStep {
    id: string
    action: string
    selector?: string
    value?: string
    timeout?: number
    description?: string
}

interface TestBuilderTabProps {
    selectedEnvironment?: Environment
    flowId?: string | null
}

export default function TestBuilderTab({ selectedEnvironment, flowId }: TestBuilderTabProps) {
    const [testName, setTestName] = useState<string>('Test Flow')
    const [isFlowLoading, setIsFlowLoading] = useState(false)

    useEffect(() => {
        const fetchTestDetails = async () => {
            if (flowId) {
                try {
                    setIsFlowLoading(true)
                    const flow = await webAutomationApi.getTestFlow(flowId)
                    setTestName(flow.name)
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
    }, [flowId])

    const [steps, setSteps] = useState<TestStep[]>([])
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const [builderMethod, setBuilderMethod] = useState<'visual' | 'recorder' | 'ai'>('visual')

    // Action Definitions
    const actionTypes = [
        { id: 'navigate', name: 'Navigate', icon: Navigation, color: 'bg-blue-500', description: 'Navigate to URL' },
        { id: 'click', name: 'Click', icon: MousePointerClick, color: 'bg-green-500', description: 'Click element' },
        { id: 'type', name: 'Type', icon: Type, color: 'bg-purple-500', description: 'Type text' },
        { id: 'wait', name: 'Wait', icon: Clock, color: 'bg-yellow-500', description: 'Wait for element' },
        { id: 'assert', name: 'Assert', icon: CheckCircle2, color: 'bg-emerald-500', description: 'Assert condition' },
        { id: 'hover', name: 'Hover', icon: Eye, color: 'bg-cyan-500', description: 'Hover over element' },
        { id: 'select', name: 'Select', icon: ChevronDown, color: 'bg-indigo-500', description: 'Select dropdown' },
        { id: 'upload', name: 'Upload', icon: Upload, color: 'bg-orange-500', description: 'Upload file' },
        { id: 'press', name: 'Press Key', icon: Keyboard, color: 'bg-pink-500', description: 'Press keyboard key' },
        { id: 'screenshot', name: 'Screenshot', icon: Download, color: 'bg-teal-500', description: 'Take screenshot' },
    ]

    const testActions = [
        { id: 'for-loop', name: 'For Loop', icon: Repeat, color: 'bg-purple-600', description: 'Repeat steps' },
        { id: 'while-loop', name: 'While Loop', icon: Repeat, color: 'bg-blue-600', description: 'Repeat while true' },
        { id: 'try-catch', name: 'Try/Catch', icon: AlertCircle, color: 'bg-orange-600', description: 'Error handling' },
    ]

    const variableActions = [
        { id: 'set-variable', name: 'Set Variable', icon: Variable, color: 'bg-teal-600', description: 'Create variable' },
        { id: 'extract-variable', name: 'Extract', icon: Database, color: 'bg-cyan-600', description: 'Extract to variable' },
        { id: 'random-data', name: 'Random Data', icon: Wand2, color: 'bg-green-600', description: 'Generate data' },
    ]

    const addStep = (actionType: string) => {
        const newStep: TestStep = {
            id: `step-${Date.now()}`,
            action: actionType,
            selector: '',
            value: '',
            timeout: 5000,
            description: '',
        }
        setSteps([...steps, newStep])
        setSelectedStepId(newStep.id)
    }

    const updateStep = (stepId: string, field: keyof TestStep, value: any) => {
        setSteps(steps.map(s => s.id === stepId ? { ...s, [field]: value } : s))
    }

    const deleteStep = (stepId: string) => {
        setSteps(steps.filter(s => s.id !== stepId))
        if (selectedStepId === stepId) setSelectedStepId(null)
    }

    const duplicateStep = (stepId: string) => {
        const step = steps.find(s => s.id === stepId)
        if (step) {
            const newStep = { ...step, id: `step-${Date.now()}` }
            const index = steps.findIndex(s => s.id === stepId)
            const newSteps = [...steps]
            newSteps.splice(index + 1, 0, newStep)
            setSteps(newSteps)
        }
    }

    const moveStep = (stepId: string, direction: 'up' | 'down') => {
        const index = steps.findIndex(s => s.id === stepId)
        if (index === -1) return

        if (direction === 'up' && index > 0) {
            const newSteps = [...steps]
                ;[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
            setSteps(newSteps)
        } else if (direction === 'down' && index < steps.length - 1) {
            const newSteps = [...steps]
                ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
            setSteps(newSteps)
        }
    }

    const getActionConfig = (actionType: string) => {
        return [...actionTypes, ...testActions, ...variableActions].find(a => a.id === actionType)
    }

    const selectedStep = steps.find(s => s.id === selectedStepId)

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden w-full">
            {/* Left Panel - Actions Library */}
            <div className="w-72 min-w-[288px] bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                {/* Method Selector */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button
                            onClick={() => setBuilderMethod('visual')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'visual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => setBuilderMethod('recorder')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'recorder' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Recorder
                        </button>
                        <button
                            onClick={() => setBuilderMethod('ai')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${builderMethod === 'ai' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            AI
                        </button>
                    </div>

                    {builderMethod === 'visual' && (
                        <>
                            <h2 className="text-sm font-bold text-gray-900 mb-2">Action Library</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <Input placeholder="Search actions..." className="pl-8 h-8 text-xs" />
                            </div>
                        </>
                    )}
                </div>

                {/* Action Lists */}
                {builderMethod === 'visual' ? (
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Browser Actions</h3>
                            <div className="space-y-1.5">
                                {actionTypes.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Control Flow</h3>
                            <div className="space-y-1.5">
                                {testActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Data & Variables</h3>
                            <div className="space-y-1.5">
                                {variableActions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => addStep(action.id)}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
                                        >
                                            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : builderMethod === 'recorder' ? (
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Mic className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Test Recorder</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Record your interactions with the application to automatically generate test steps.
                        </p>
                        <Button className="w-full bg-red-600 hover:bg-red-700">
                            Start Recording
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">AI Generator</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Describe your test scenario in plain English and let AI generate the steps for you.
                        </p>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            Generate Test
                        </Button>
                    </div>
                )}
            </div>

            {/* Center Panel - Test Canvas */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50/50">
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

                        <Button variant="outline" size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button size="sm">
                            <Play className="w-4 h-4 mr-2" />
                            Run Flow
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {steps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Target className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No steps added yet</p>
                            <p className="text-xs mt-1">Drag actions from the left or click to add</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {steps.map((step, index) => {
                                const actionConfig = getActionConfig(step.action)
                                const Icon = actionConfig?.icon || AlertCircle
                                const isSelected = selectedStepId === step.id

                                return (
                                    <div key={step.id} className="relative group">
                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div className="absolute left-8 top-full h-3 w-0.5 bg-gray-300 z-0" />
                                        )}

                                        <Card
                                            className={`relative z-10 transition-all cursor-pointer border-2 ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-transparent hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedStepId(step.id)}
                                        >
                                            <div className="p-3 flex items-center gap-3">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                                                    {index + 1}
                                                </div>

                                                <div className={`${actionConfig?.color} p-2 rounded-lg text-white shadow-sm`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900">{actionConfig?.name}</span>
                                                        {step.description && (
                                                            <span className="text-xs text-gray-500 truncate">- {step.description}</span>
                                                        )}
                                                    </div>
                                                    {(step.selector || step.value) && (
                                                        <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">
                                                            {step.selector && <span className="text-blue-600">{step.selector}</span>}
                                                            {step.selector && step.value && <span className="mx-1">→</span>}
                                                            {step.value && <span className="text-green-600">"{step.value}"</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveStep(step.id, 'up')
                                                        }}
                                                        disabled={index === 0}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveStep(step.id, 'down')
                                                        }}
                                                        disabled={index === steps.length - 1}
                                                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                                    >
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            duplicateStep(step.id)
                                                        }}
                                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteStep(step.id)
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
                            })}

                            <button
                                onClick={() => setSelectedStepId(null)}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Step
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Properties */}
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-sm font-bold text-gray-900">Properties</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {selectedStep ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Action Type</label>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    {(() => {
                                        const config = getActionConfig(selectedStep.action)
                                        const Icon = config?.icon || AlertCircle
                                        return (
                                            <>
                                                <div className={`${config?.color} p-1.5 rounded text-white`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-sm font-medium">{config?.name}</span>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
                                <Input
                                    value={selectedStep.description || ''}
                                    onChange={(e) => updateStep(selectedStep.id, 'description', e.target.value)}
                                    placeholder="Describe this step"
                                    className="text-sm"
                                />
                            </div>

                            {selectedStep.action !== 'navigate' && selectedStep.action !== 'wait' && (
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Target Element <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={selectedStep.selector || ''}
                                            onChange={(e) => updateStep(selectedStep.id, 'selector', e.target.value)}
                                            placeholder="CSS Selector / XPath"
                                            className="text-sm font-mono"
                                        />
                                        <Button variant="outline" size="icon" className="flex-shrink-0" title="Pick Element">
                                            <Target className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {(selectedStep.action === 'type' || selectedStep.action === 'navigate' || selectedStep.action === 'assert') && (
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        {selectedStep.action === 'navigate' ? 'URL' : 'Value'}
                                    </label>
                                    <Input
                                        value={selectedStep.value || ''}
                                        onChange={(e) => updateStep(selectedStep.id, 'value', e.target.value)}
                                        placeholder="Enter value"
                                        className="text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Timeout (ms)</label>
                                <Input
                                    type="number"
                                    value={selectedStep.timeout || 5000}
                                    onChange={(e) => updateStep(selectedStep.id, 'timeout', parseInt(e.target.value))}
                                    className="text-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-900 mb-3">Advanced Options</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                        Continue on error
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                        Take screenshot after
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 mt-10">
                            <Settings className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Select a step to configure properties</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
