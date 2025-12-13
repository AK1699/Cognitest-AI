'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Loader2,
  Check,
  Edit,
  Play,
  Save,
  Trash2,
  ChevronRight,
  Lightbulb,
  Wand2,
} from 'lucide-react'

interface GeneratedStep {
  id: string
  type: string
  description: string
  selector?: string
  value?: string
  assertion?: string
}

interface AIPromptBuilderProps {
  projectId: string
  onSave?: (testData: any) => void
}

export default function AIPromptBuilder({ projectId, onSave }: AIPromptBuilderProps) {
  const [testName, setTestName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSteps, setGeneratedSteps] = useState<GeneratedStep[]>([])
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const examplePrompts = [
    'Test the login flow with valid credentials',
    'Search for a product and add it to cart',
    'Fill out the contact form and submit',
    'Navigate to pricing page and click free trial',
    'Register a new user account with email verification',
  ]

  const generateTestFromPrompt = async () => {
    if (!prompt.trim() || !baseUrl.trim()) {
      alert('Please enter both a prompt and base URL')
      return
    }

    setIsGenerating(true)

    try {
      // Use the centralized API client which handles auth automatically
      const response = await fetch(
        '/api/v1/web-automation/generate-from-prompt',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Use httpOnly cookies for auth
          body: JSON.stringify({
            prompt: prompt,
            base_url: baseUrl,
            project_id: projectId,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setGeneratedSteps(data.steps || mockGenerateSteps(prompt))
        if (!testName) {
          setTestName(data.suggested_name || `Test: ${prompt.slice(0, 50)}`)
        }
      } else {
        // Fallback to mock generation
        setGeneratedSteps(mockGenerateSteps(prompt))
        if (!testName) {
          setTestName(`Test: ${prompt.slice(0, 50)}`)
        }
      }
    } catch (error) {
      console.error('Failed to generate test:', error)
      // Fallback to mock generation
      setGeneratedSteps(mockGenerateSteps(prompt))
      if (!testName) {
        setTestName(`Test: ${prompt.slice(0, 50)}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const mockGenerateSteps = (prompt: string): GeneratedStep[] => {
    // Simple mock generation based on keywords
    const steps: GeneratedStep[] = []

    steps.push({
      id: `step-${Date.now()}-0`,
      type: 'navigate',
      description: `Navigate to ${baseUrl}`,
    })

    if (prompt.toLowerCase().includes('login')) {
      steps.push({
        id: `step-${Date.now()}-1`,
        type: 'click',
        description: 'Click on login button',
        selector: 'button[data-testid="login"]',
      })
      steps.push({
        id: `step-${Date.now()}-2`,
        type: 'type',
        description: 'Enter email address',
        selector: 'input[name="email"]',
        value: 'user@example.com',
      })
      steps.push({
        id: `step-${Date.now()}-3`,
        type: 'type',
        description: 'Enter password',
        selector: 'input[name="password"]',
        value: 'password123',
      })
      steps.push({
        id: `step-${Date.now()}-4`,
        type: 'click',
        description: 'Click submit button',
        selector: 'button[type="submit"]',
      })
      steps.push({
        id: `step-${Date.now()}-5`,
        type: 'assert',
        description: 'Verify successful login',
        assertion: 'Dashboard is visible',
      })
    } else if (prompt.toLowerCase().includes('search')) {
      steps.push({
        id: `step-${Date.now()}-1`,
        type: 'type',
        description: 'Enter search query',
        selector: 'input[name="search"]',
        value: 'product name',
      })
      steps.push({
        id: `step-${Date.now()}-2`,
        type: 'click',
        description: 'Click search button',
        selector: 'button[type="submit"]',
      })
      steps.push({
        id: `step-${Date.now()}-3`,
        type: 'assert',
        description: 'Verify search results appear',
        assertion: 'Search results are displayed',
      })
    } else if (prompt.toLowerCase().includes('form')) {
      steps.push({
        id: `step-${Date.now()}-1`,
        type: 'type',
        description: 'Fill name field',
        selector: 'input[name="name"]',
        value: 'John Doe',
      })
      steps.push({
        id: `step-${Date.now()}-2`,
        type: 'type',
        description: 'Fill email field',
        selector: 'input[name="email"]',
        value: 'john@example.com',
      })
      steps.push({
        id: `step-${Date.now()}-3`,
        type: 'type',
        description: 'Fill message field',
        selector: 'textarea[name="message"]',
        value: 'Test message',
      })
      steps.push({
        id: `step-${Date.now()}-4`,
        type: 'click',
        description: 'Submit form',
        selector: 'button[type="submit"]',
      })
      steps.push({
        id: `step-${Date.now()}-5`,
        type: 'assert',
        description: 'Verify submission success',
        assertion: 'Success message is displayed',
      })
    }

    return steps
  }

  const deleteStep = (stepId: string) => {
    setGeneratedSteps(generatedSteps.filter(step => step.id !== stepId))
  }

  const handleSave = async () => {
    if (onSave) {
      onSave({
        name: testName,
        baseUrl: baseUrl,
        prompt: prompt,
        steps: generatedSteps,
      })
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'navigate':
        return '🌐'
      case 'click':
        return '👆'
      case 'type':
        return '⌨️'
      case 'select':
        return '📋'
      case 'assert':
        return '✓'
      case 'wait':
        return '⏰'
      default:
        return '•'
    }
  }

  const getStepColor = (type: string) => {
    switch (type) {
      case 'navigate':
        return 'bg-blue-100 text-blue-700'
      case 'click':
        return 'bg-green-100 text-green-700'
      case 'type':
        return 'bg-purple-100 text-purple-700'
      case 'assert':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Prompt Builder
              </h1>
              <p className="text-gray-600">
                Describe your test in natural language, AI will create it
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Describe Your Test
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Test Name</Label>
                  <Input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Login Flow Test"
                  />
                </div>

                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label>What do you want to test?</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your test in plain English...&#10;&#10;Example: 'Test the login flow with email user@example.com and password test123, then verify the dashboard loads'"
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific about what to click, type, and verify
                  </p>
                </div>

                <Button
                  onClick={generateTestFromPrompt}
                  disabled={isGenerating || !prompt.trim() || !baseUrl.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Test Steps...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Test with AI
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Example Prompts */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                <Lightbulb className="w-4 h-4" />
                Example Prompts
              </h3>
              <div className="space-y-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                  >
                    <ChevronRight className="w-4 h-4 inline mr-2 text-purple-500" />
                    {example}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Generated Steps */}
          <div>
            <Card className="p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Generated Test Steps
                  {generatedSteps.length > 0 && (
                    <Badge className="bg-purple-100 text-purple-700">
                      {generatedSteps.length} steps
                    </Badge>
                  )}
                </h3>
              </div>

              {generatedSteps.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No steps generated yet</p>
                  <p className="text-xs">Enter a prompt and click "Generate" above</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {generatedSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-4 rounded-lg border-2 transition-all ${selectedStep === index
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200'
                          }`}
                        onClick={() => setSelectedStep(index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>
                            <span className="text-lg">{getStepIcon(step.type)}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-500">
                                #{index + 1}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {step.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {step.description}
                            </p>
                            {step.selector && (
                              <p className="text-xs text-gray-500 truncate">
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
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteStep(step.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Playback functionality
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Preview Test
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Test
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
