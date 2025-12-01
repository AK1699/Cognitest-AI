'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react'

interface ExecutionResultsProps {
  executionRunId: string
}

interface StepResult {
  id: string
  step_name: string
  step_type: string
  status: 'passed' | 'failed' | 'skipped' | 'healed'
  duration_ms: number
  error_message?: string
  screenshot_url?: string
  was_healed: boolean
  healing_applied?: any
}

interface HealingEvent {
  id: string
  healing_type: string
  strategy: string
  original_value: string
  healed_value: string
  success: boolean
  confidence_score: number
  ai_reasoning?: string
}

interface ExecutionRunDetail {
  id: string
  browser_type: string
  execution_mode: string
  status: string
  total_steps: number
  passed_steps: number
  failed_steps: number
  healed_steps: number
  duration_ms: number
  started_at: string
  ended_at: string
  step_results: StepResult[]
  healing_events: HealingEvent[]
}

export default function ExecutionResults({ executionRunId }: ExecutionResultsProps) {
  const [executionData, setExecutionData] = useState<ExecutionRunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStep, setSelectedStep] = useState<StepResult | null>(null)

  useEffect(() => {
    loadExecutionResults()
  }, [executionRunId])

  const loadExecutionResults = async () => {
    try {
      const response = await fetch(
        `/api/v1/web-automation/executions/${executionRunId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      const data = await response.json()
      setExecutionData(data)
    } catch (error) {
      console.error('Failed to load execution results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading results...</div>
  }

  if (!executionData) {
    return <div className="p-4">No results found</div>
  }

  const successRate = executionData.total_steps > 0
    ? (executionData.passed_steps / executionData.total_steps) * 100
    : 0

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Execution Results</h2>
          <Badge
            variant={executionData.status === 'completed' ? 'default' : 'destructive'}
          >
            {executionData.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Browser</p>
            <p className="text-lg font-semibold">{executionData.browser_type}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Mode</p>
            <p className="text-lg font-semibold">{executionData.execution_mode}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-lg font-semibold">
              {(executionData.duration_ms / 1000).toFixed(2)}s
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-lg font-semibold">{successRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Step Summary */}
        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold">{executionData.passed_steps} Passed</span>
          </div>
          
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{executionData.failed_steps} Failed</span>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{executionData.healed_steps} Healed</span>
          </div>
        </div>
      </Card>

      {/* Healing Events Summary */}
      {executionData.healing_events.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">🔧 Self-Healing Events</h3>
          <p className="text-sm text-gray-600 mb-4">
            {executionData.healing_events.length} healing event(s) occurred during execution
          </p>
          
          <div className="space-y-3">
            {executionData.healing_events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 bg-yellow-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">
                    {event.healing_type} - {event.strategy}
                  </Badge>
                  <Badge variant={event.success ? 'default' : 'destructive'}>
                    {event.success ? '✓ Success' : '✗ Failed'}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Original:</span>{' '}
                    <code className="bg-gray-100 px-1 rounded">{event.original_value}</code>
                  </p>
                  <p>
                    <span className="font-semibold">Healed:</span>{' '}
                    <code className="bg-green-100 px-1 rounded">{event.healed_value}</code>
                  </p>
                  
                  {event.confidence_score && (
                    <p>
                      <span className="font-semibold">Confidence:</span>{' '}
                      {(event.confidence_score * 100).toFixed(0)}%
                    </p>
                  )}
                  
                  {event.ai_reasoning && (
                    <p className="text-gray-600 italic">{event.ai_reasoning}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step Results */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Step Results</h3>
        
        <div className="space-y-2">
          {executionData.step_results.map((step, idx) => (
            <div
              key={step.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedStep?.id === step.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedStep(step)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">#{idx + 1}</span>
                  
                  {step.status === 'passed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {step.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {step.status === 'healed' && (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  
                  <div>
                    <p className="font-semibold">{step.step_name}</p>
                    <p className="text-sm text-gray-500">{step.step_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {step.was_healed && (
                    <Badge variant="outline" className="bg-yellow-100">
                      🔧 Healed
                    </Badge>
                  )}
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {step.duration_ms}ms
                    </p>
                  </div>
                  
                  {step.screenshot_url && (
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {step.error_message && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                  {step.error_message}
                </div>
              )}
              
              {step.healing_applied && selectedStep?.id === step.id && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                  <p className="font-semibold">Healing Applied:</p>
                  <pre className="text-xs mt-1">
                    {JSON.stringify(step.healing_applied, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Download Report */}
      <div className="flex justify-end">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>
    </div>
  )
}
