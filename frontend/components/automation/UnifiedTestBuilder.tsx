'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Workflow,
  Circle,
  Sparkles,
  Save,
  Play,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  MousePointer,
  Type,
  Globe,
  Clock,
  Loader2,
  ArrowDown,
  Wand2,
} from 'lucide-react'

interface TestStep {
  id: string
  type: string
  description: string
  selector?: string
  value?: string
}

interface UnifiedTestBuilderProps {
  projectId: string
  onSave?: (testData: any) => void
}

export default function UnifiedTestBuilder({ projectId, onSave }: UnifiedTestBuilderProps) {
  const [testName, setTestName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [steps, setSteps] = useState<TestStep[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const actionTypes = [
    { id: 'navigate', label: 'Navigate', icon: Globe },
    { id: 'click', label: 'Click', icon: MousePointer },
    { id: 'type', label: 'Type', icon: Type },
    { id: 'wait', label: 'Wait', icon: Clock },
    { id: 'assert', label: 'Assert', icon: CheckCircle2 },
  ]

  const addStep = (type: string) => {
    const newStep: TestStep = {
      id: Date.now().toString(),
      type,
      description: `${type} step`,
    }
    setSteps([...steps, newStep])
  }

  const deleteStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id))
  }

  const handleGenerateFromAI = async () => {
    setIsGenerating(true)
    setTimeout(() => {
      const generatedSteps: TestStep[] = [
        { id: Date.now() + '1', type: 'navigate', description: `Navigate to ${baseUrl}` },
        { id: Date.now() + '2', type: 'click', description: 'Click login button', selector: '#login' },
        { id: Date.now() + '3', type: 'type', description: 'Enter email', selector: '#email', value: 'user@test.com' },
        { id: Date.now() + '4', type: 'click', description: 'Submit', selector: 'button[type="submit"]' },
      ]
      setSteps([...steps, ...generatedSteps])
      setIsGenerating(false)
      setAiPrompt('')
    }, 1500)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleSave = () => {
    if (onSave) {
      onSave({ name: testName, baseUrl, steps })
    }
  }

  const getStepIcon = (type: string) => {
    const action = actionTypes.find(a => a.id === type)
    return action?.icon || Globe
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Create Test Flow</h1>
            <p className="text-sm text-gray-500">Use any method below to build your test</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleSave}>
              <Play className="w-4 h-4 mr-2" />
              Run Test
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Test Name</Label>
            <Input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Login Flow Test"
            />
          </div>
          <div>
            <Label className="text-xs">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Side: Methods */}
        <div className="w-96 border-r bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Method 1: AI Prompt */}
            <Card className="p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Prompt</h3>
                  <p className="text-xs text-gray-500">Generate from description</p>
                </div>
              </div>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your test...&#10;e.g., Test login with user@test.com"
                rows={3}
                className="mb-3 text-sm"
              />
              <Button
                onClick={handleGenerateFromAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-2" />
                    Generate Steps
                  </>
                )}
              </Button>
            </Card>

            {/* Method 2: Recorder */}
            <Card className="p-4 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
                  <Circle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Browser Recorder</h3>
                  <p className="text-xs text-gray-500">Record interactions</p>
                </div>
              </div>
              <Button
                onClick={toggleRecording}
                className={`w-full ${isRecording ? 'bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                size="sm"
              >
                {isRecording ? (
                  <>
                    <Circle className="w-3 h-3 mr-2 fill-white" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Circle className="w-3 h-3 mr-2 fill-white" />
                    Start Recording
                  </>
                )}
              </Button>
              {isRecording && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-red-500 animate-pulse" />
                  Recording... interact with your app
                </div>
              )}
            </Card>

            {/* Method 3: Drag & Drop */}
            <Card className="p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                  <Workflow className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Test Actions</h3>
                  <p className="text-xs text-gray-500">Click to add steps</p>
                </div>
              </div>
              <div className="space-y-1">
                {actionTypes.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => addStep(action.id)}
                    >
                      <Icon className="w-3 h-3 mr-2" />
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 How to use:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Type prompt & generate with AI</li>
                <li>• Click "Record" and use your app</li>
                <li>• Click actions to add manually</li>
                <li>• Mix all methods freely!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Test Steps */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Test Steps</h2>
                <p className="text-sm text-gray-500">{steps.length} steps added</p>
              </div>
              {steps.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSteps([])}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {steps.length === 0 ? (
              <Card className="p-12 text-center">
                <ArrowDown className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-bounce" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No steps yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Use any method on the left to start building your test
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Prompt
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="w-4 h-4 text-red-500" />
                    Recorder
                  </div>
                  <div className="flex items-center gap-1">
                    <Workflow className="w-4 h-4 text-blue-500" />
                    Actions
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = getStepIcon(step.type)
                  return (
                    <Card key={step.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <Badge variant="outline" className="text-xs">
                              {step.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {step.description}
                          </p>
                          {step.selector && (
                            <p className="text-xs text-gray-500 font-mono">
                              {step.selector}
                            </p>
                          )}
                          {step.value && (
                            <p className="text-xs text-purple-600 mt-1">
                              Value: {step.value}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStep(step.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
