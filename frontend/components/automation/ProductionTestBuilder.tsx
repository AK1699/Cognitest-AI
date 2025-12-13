'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { projectsApi, ProjectSettings } from '@/lib/api/projects'
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
} from 'lucide-react'

import { Environment, EnvironmentManager } from './EnvironmentManager'

interface TestStep {
  id: string
  action: string
  selector?: string
  value?: string
  timeout?: number
  description?: string
}

interface ProductionTestBuilderProps {
  testId?: string
  onSave?: (steps: TestStep[]) => void
}

export default function ProductionTestBuilder({ testId, onSave }: ProductionTestBuilderProps) {
  const params = useParams()
  const projectId = params?.projectId as string

  const [testName, setTestName] = useState('Untitled Test')
  const [baseUrl, setBaseUrl] = useState('https://')
  const [steps, setSteps] = useState<TestStep[]>([])
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showEnvManager, setShowEnvManager] = useState(false)

  const [environments, setEnvironments] = useState<Environment[]>([])
  const [loadingVars, setLoadingVars] = useState(false)

  useEffect(() => {
    const fetchProjectSettings = async () => {
      if (!projectId) return
      try {
        setLoadingVars(true)
        const project = await projectsApi.getProject(projectId)
        if (project.settings?.environments) {
          setEnvironments(project.settings.environments)
        }
      } catch (error) {
        console.error('Failed to fetch project settings:', error)
      } finally {
        setLoadingVars(false)
      }
    }
    fetchProjectSettings()
  }, [projectId])
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('dev')

  const selectedEnvironment = environments.find(e => e.id === selectedEnvironmentId) || environments[0]
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({})

  const toggleStepCollapse = (stepId: string) => {
    setCollapsedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }

  // Categorized action types
  const testActions = [
    { id: 'for-loop', name: 'For Loop', icon: Repeat, color: 'bg-purple-600', description: 'Repeat steps a specific number of...' },
    { id: 'while-loop', name: 'While Loop', icon: Repeat, color: 'bg-blue-600', description: 'Repeat steps while condition is true' },
    { id: 'try-catch', name: 'Try/Catch', icon: AlertCircle, color: 'bg-orange-600', description: 'Error handling for test steps' },
    { id: 'group-section', name: 'Group/Section', icon: Settings, color: 'bg-gray-600', description: 'Group steps into collapsible sec...' },
  ]

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

  const variableActions = [
    { id: 'set_variable', name: 'Set Variable', icon: Variable, color: 'bg-teal-600', description: 'Create or update a variable' },
    { id: 'extract_text', name: 'Extract to Variable', icon: Database, color: 'bg-cyan-600', description: 'Extract text/value element to variable' },
    { id: 'random-data', name: 'Generate Random Data', icon: Wand2, color: 'bg-green-600', description: 'Generate random test data (emai...' },
  ]

  const utilityActions = [
    { id: 'use-snippet', name: 'Use Utility Snippet', icon: Zap, color: 'bg-pink-600', description: 'Execute a reusable test from priv...' },
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
    setShowActionMenu(false)
  }

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId))
  }

  const updateStep = (stepId: string, field: keyof TestStep, value: any) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, [field]: value } : s))
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
    return [...actionTypes, ...testActions, ...variableActions, ...utilityActions].find(a => a.id === actionType)
  }

  React.useEffect(() => {
    if (selectedEnvironment?.baseUrl) {
      setBaseUrl(selectedEnvironment.baseUrl)
    }
  }, [selectedEnvironment])

  const handleSave = () => {
    if (onSave) {
      onSave(steps)
    }
    // TODO: Save to backend
    console.log('Saving test:', { testName, baseUrl, steps, environment: selectedEnvironment })
  }

  const handleRun = () => {
    // TODO: Execute test
    console.log('Running test:', { testName, baseUrl, steps, environment: selectedEnvironment })
  }


  const handleSaveEnvironments = async (newEnvironments: Environment[]) => {
    setEnvironments(newEnvironments)
    if (!projectId) return

    try {
      // Get existing project settings first to preserve other settings
      const project = await projectsApi.getProject(projectId)
      const updatedSettings: ProjectSettings = {
        ...project.settings,
        environments: newEnvironments
      }

      await projectsApi.updateProject(projectId, { settings: updatedSettings })
      // Optional: Show success toast
    } catch (error) {
      console.error('Failed to save environments:', error)
      // Optional: Show error toast
    }
  }

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Actions Panel */}
      <div className="w-72 min-w-[288px] bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-2">Test Actions</h2>
          <p className="text-xs text-gray-500">Drag or click actions to build your test</p>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search actions..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Scrollable Actions */}
        <div className="flex-1 overflow-y-auto">
          {/* Test Actions Section */}
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Test Actions</h3>
            <div className="space-y-1.5">
              {testActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => addStep(action.id)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
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

          {/* Variables Section */}
          <div className="p-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Variables</h3>
            <div className="space-y-1.5">
              {variableActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => addStep(action.id)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
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

          {/* Utilities Section */}
          <div className="p-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Utilities</h3>
            <div className="space-y-1.5">
              {utilityActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => addStep(action.id)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
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
      </div>

      {/* Center Panel - Dynamic Test Builder */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">Dynamic Test Builder</h2>
              <p className="text-sm text-gray-500 mt-0.5">Drag or click actions from the left panel to build your test flow</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <span className="text-xs font-medium text-gray-500 ml-2">Env:</span>
                <select
                  value={selectedEnvironmentId}
                  onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowEnvManager(true)}
                  title="Manage Environments"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Run All Steps
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-8">
              {/* Empty State */}
              <div className="text-center mb-16 w-full">
                {/* Target Icon */}
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 mb-8">
                  <Target className="w-14 h-14 text-blue-600" />
                </div>

                <h3 className="text-3xl font-bold text-gray-900 mb-4">Start Building Your Test</h3>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-12">
                  Create powerful automated test flows by dragging or clicking actions from the sidebar. Build, customize, and execute your tests with ease.
                </p>

                {/* Action Cards */}
                <div className="grid grid-cols-3 gap-8 w-full max-w-6xl mx-auto mb-16">
                  <Card className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-300">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Drag or Click</h4>
                      <p className="text-sm text-gray-500 text-center">
                        Add actions by dragging or clicking from the sidebar
                      </p>
                    </div>
                  </Card>

                  <Card className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-green-300">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                        <Play className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Execute Tests</h4>
                      <p className="text-sm text-gray-500 text-center">
                        Run your tests or entire test flows
                      </p>
                    </div>
                  </Card>

                  <Card className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-purple-300">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                        <Settings className="w-8 h-8 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">Customize</h4>
                      <p className="text-sm text-gray-500 text-center">
                        Configure parameters and execute your test
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Quick Start */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 w-full max-w-6xl mx-auto">
                  <h4 className="text-base font-bold text-gray-900 mb-6">Quick Start</h4>
                  <div className="grid grid-cols-3 gap-8 text-left">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h5 className="text-base font-semibold text-gray-900 mb-1">Select Action</h5>
                        <p className="text-sm text-gray-600">Choose from interactive actions or AI hints</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h5 className="text-base font-semibold text-gray-900 mb-1">Drag or Click</h5>
                        <p className="text-sm text-gray-600">Drag to drop or click to add instantly</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h5 className="text-base font-semibold text-gray-900 mb-1">Configure & Run</h5>
                        <p className="text-sm text-gray-600">Set parameters and execute your test</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {steps.map((step, index) => {
                const actionConfig = getActionConfig(step.action)
                const Icon = actionConfig?.icon || AlertCircle

                return (
                  <Card
                    key={step.id}
                    className="transition-all hover:shadow-md w-full"
                  >
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStepCollapse(step.id)
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {collapsedSteps[step.id] ? (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <div className={`${actionConfig?.color} p-2 rounded-lg text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500">STEP {index + 1}</span>
                            <Badge className="text-xs">{actionConfig?.name}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveStep(step.id, 'up')
                            }}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveStep(step.id, 'down')
                            }}
                            disabled={index === steps.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateStep(step.id)
                            }}
                            className="p-1 hover:bg-blue-50 rounded"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteStep(step.id)
                            }}
                            className="p-1 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content - Inline Editable Fields */}
                      {!collapsedSteps[step.id] && (
                        <div className="mt-4 ml-12 space-y-3">
                          {/* Selector Field */}
                          {step.action !== 'navigate' && step.action !== 'screenshot' && (
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                Selector <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={step.selector || ''}
                                onChange={(e) => updateStep(step.id, 'selector', e.target.value)}
                                placeholder="CSS selector or XPath"
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <p className="text-xs text-gray-500 mt-1">Example: #submit-button, .login-form</p>
                            </div>
                          )}

                          {/* Value/URL Field */}
                          {(step.action === 'type' || step.action === 'navigate' || step.action === 'assert') && (
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">
                                {step.action === 'navigate' ? 'URL' : 'Value'}
                                {step.action === 'navigate' && <span className="text-red-500">*</span>}
                              </label>
                              <Input
                                value={step.value || ''}
                                onChange={(e) => updateStep(step.id, 'value', e.target.value)}
                                placeholder={
                                  step.action === 'navigate'
                                    ? 'https://example.com/page'
                                    : step.action === 'type'
                                      ? 'Text to type'
                                      : 'Expected value'
                                }
                                className="text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}

                          {/* Description Field */}
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                            <Input
                              value={step.description || ''}
                              onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                              placeholder="What does this step do?"
                              className="text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Timeout Field */}
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Timeout (ms)</label>
                            <Input
                              type="number"
                              value={step.timeout || 5000}
                              onChange={(e) => updateStep(step.id, 'timeout', parseInt(e.target.value))}
                              min="0"
                              step="1000"
                              className="text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="text-xs text-gray-500 mt-1">Maximum time to wait for this action</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}

              <button
                onClick={() => setShowActionMenu(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600"
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Add Step</div>
              </button>
            </div>
          )}
        </div>
      </div>
      <EnvironmentManager
        open={showEnvManager}
        onOpenChange={setShowEnvManager}
        environments={environments}
        onSave={handleSaveEnvironments}
      />
    </div>
  )
}
