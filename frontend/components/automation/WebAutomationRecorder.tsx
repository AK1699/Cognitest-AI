'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Circle,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Copy,
  Edit,
  Eye,
  MousePointer,
  Type,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Zap,
  Settings,
  Code,
} from 'lucide-react'

interface RecordedStep {
  id: string
  type: 'navigate' | 'click' | 'type' | 'select' | 'hover' | 'scroll' | 'wait' | 'assert'
  timestamp: number
  selector: string
  value?: string
  tagName?: string
  innerText?: string
  url?: string
  screenshot?: string
}

interface WebAutomationRecorderProps {
  projectId: string
  onSave?: (recording: any) => void
}

export default function WebAutomationRecorder({ projectId, onSave }: WebAutomationRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedSteps, setRecordedSteps] = useState<RecordedStep[]>([])
  const [testName, setTestName] = useState('Untitled Test')
  const [baseUrl, setBaseUrl] = useState('https://example.com')
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [showCode, setShowCode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const startRecording = () => {
    setIsRecording(true)
    setIsPaused(false)
    setRecordedSteps([])
    
    // Add initial navigate step
    const navigateStep: RecordedStep = {
      id: `step-${Date.now()}`,
      type: 'navigate',
      timestamp: Date.now(),
      selector: '',
      url: baseUrl,
    }
    setRecordedSteps([navigateStep])
    
    // Initialize recorder in iframe
    if (iframeRef.current) {
      iframeRef.current.src = baseUrl
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
  }

  const pauseRecording = () => {
    setIsPaused(!isPaused)
  }

  const deleteStep = (stepId: string) => {
    setRecordedSteps(recordedSteps.filter(step => step.id !== stepId))
  }

  const editStep = (stepId: string) => {
    const stepIndex = recordedSteps.findIndex(step => step.id === stepId)
    setSelectedStep(stepIndex)
  }

  const playbackTest = async () => {
    // TODO: Implement playback functionality
    console.log('Playing back test...', recordedSteps)
  }

  const exportTest = () => {
    const testData = {
      name: testName,
      baseUrl,
      steps: recordedSteps,
      createdAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${testName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
  }

  const saveTest = () => {
    const testData = {
      name: testName,
      baseUrl,
      steps: recordedSteps,
      projectId,
    }
    
    if (onSave) {
      onSave(testData)
    }
  }

  const generateCode = () => {
    let code = `// ${testName}\n`
    code += `const { chromium } = require('playwright');\n\n`
    code += `(async () => {\n`
    code += `  const browser = await chromium.launch({ headless: false });\n`
    code += `  const page = await browser.newPage();\n\n`
    
    recordedSteps.forEach(step => {
      switch (step.type) {
        case 'navigate':
          code += `  await page.goto('${step.url}');\n`
          break
        case 'click':
          code += `  await page.click('${step.selector}');\n`
          break
        case 'type':
          code += `  await page.fill('${step.selector}', '${step.value}');\n`
          break
        case 'wait':
          code += `  await page.waitForTimeout(${step.value || 1000});\n`
          break
      }
    })
    
    code += `\n  await browser.close();\n`
    code += `})();\n`
    
    return code
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'navigate': return <Globe className="w-4 h-4" />
      case 'click': return <MousePointer className="w-4 h-4" />
      case 'type': return <Type className="w-4 h-4" />
      case 'select': return <ArrowRight className="w-4 h-4" />
      case 'hover': return <Eye className="w-4 h-4" />
      case 'wait': return <Clock className="w-4 h-4" />
      case 'assert': return <CheckCircle2 className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getStepColor = (type: string) => {
    switch (type) {
      case 'navigate': return 'bg-blue-100 text-blue-700'
      case 'click': return 'bg-green-100 text-green-700'
      case 'type': return 'bg-purple-100 text-purple-700'
      case 'assert': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Simulate recording (in real implementation, this would capture from iframe)
  useEffect(() => {
    if (isRecording && !isPaused && iframeRef.current) {
      // Listen to iframe events
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'recorded-action') {
          const newStep: RecordedStep = {
            id: `step-${Date.now()}`,
            ...event.data.action,
            timestamp: Date.now(),
          }
          setRecordedSteps(prev => [...prev, newStep])
        }
      }
      
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }
  }, [isRecording, isPaused])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Recorded Steps */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="mb-4">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Test Name</Label>
            <Input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="mt-1"
              placeholder="Enter test name"
            />
          </div>
          
          <div className="mb-4">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="mt-1"
              placeholder="https://example.com"
              disabled={isRecording}
            />
          </div>

          {/* Recording Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <Circle className="w-4 h-4 mr-2 fill-white" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Recorded Steps List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Recorded Steps ({recordedSteps.length})
            </h3>
            {isRecording && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <Circle className="w-2 h-2 mr-1 fill-white" />
                Recording
              </Badge>
            )}
          </div>

          {recordedSteps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MousePointer className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No steps recorded yet</p>
              <p className="text-xs">Click "Start Recording" to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordedSteps.map((step, index) => (
                <Card
                  key={step.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedStep === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedStep(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>
                      {getStepIcon(step.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.type}
                        </Badge>
                      </div>
                      
                      {step.type === 'navigate' && (
                        <p className="text-sm text-gray-700 truncate">{step.url}</p>
                      )}
                      
                      {step.type === 'click' && (
                        <>
                          <p className="text-sm text-gray-700 truncate">{step.innerText || 'Click element'}</p>
                          <p className="text-xs text-gray-400 truncate">{step.selector}</p>
                        </>
                      )}
                      
                      {step.type === 'type' && (
                        <>
                          <p className="text-sm text-gray-700 truncate">Type: {step.value}</p>
                          <p className="text-xs text-gray-400 truncate">{step.selector}</p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          editStep(step.id)
                        }}
                      >
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
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              variant="outline"
              onClick={playbackTest}
              disabled={recordedSteps.length === 0}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Playback
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCode(!showCode)}
              disabled={recordedSteps.length === 0}
              className="w-full"
            >
              <Code className="w-4 h-4 mr-2" />
              {showCode ? 'Hide' : 'Show'} Code
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={exportTest}
              disabled={recordedSteps.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={saveTest}
              disabled={recordedSteps.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Test
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Browser Preview or Code */}
      <div className="flex-1 flex flex-col">
        {showCode ? (
          // Code View
          <div className="flex-1 p-6 overflow-auto bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Generated Code</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generateCode())
                }}
                className="bg-gray-800 text-white border-gray-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>
            <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm overflow-auto font-mono">
              {generateCode()}
            </pre>
          </div>
        ) : (
          // Browser Preview
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                {baseUrl}
              </div>
              {isRecording && (
                <Badge className="bg-red-500 text-white">
                  <Circle className="w-2 h-2 mr-1 fill-white animate-pulse" />
                  Recording
                </Badge>
              )}
            </div>
            
            <div className="flex-1 bg-white">
              {isRecording ? (
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Browser Preview</h3>
                    <p className="text-sm">Click "Start Recording" to begin capturing interactions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
