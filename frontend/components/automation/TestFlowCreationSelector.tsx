'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Workflow,
  Video,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  MousePointer,
  MessageSquare,
  Code,
  Clock,
  Brain,
} from 'lucide-react'

interface TestFlowCreationSelectorProps {
  projectId: string
  orgId: string
}

export default function TestFlowCreationSelector({
  projectId,
  orgId,
}: TestFlowCreationSelectorProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const creationMethods = [
    {
      id: 'drag-drop',
      title: 'Visual Flow Builder',
      icon: Workflow,
      color: 'from-blue-500 to-indigo-500',
      description: 'Build tests visually with drag-and-drop actions',
      features: [
        'Drag and drop test actions',
        'Visual flow canvas',
        'Configure each step manually',
        'Advanced customization options',
      ],
      bestFor: 'Complex test flows with custom logic',
      difficulty: 'Intermediate',
      time: '5-10 minutes',
      path: `/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation/new/flow-builder`,
    },
    {
      id: 'recorder',
      title: 'Browser Recorder',
      icon: Video,
      color: 'from-red-500 to-pink-500',
      description: 'Record your browser interactions automatically',
      features: [
        'Click "Record" and use your app',
        'Auto-capture all interactions',
        'Live browser preview',
        'Instant test generation',
      ],
      bestFor: 'Quick testing of user journeys',
      difficulty: 'Beginner',
      time: '2-5 minutes',
      path: `/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation/new/recorder`,
    },
    {
      id: 'ai-prompt',
      title: 'AI Prompt Builder',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      description: 'Describe your test in natural language, AI creates it',
      features: [
        'Write what you want to test',
        'AI generates test steps',
        'Natural language understanding',
        'Review and refine',
      ],
      bestFor: 'Fast test creation from descriptions',
      difficulty: 'Beginner',
      time: '1-3 minutes',
      path: `/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation/new/ai-prompt`,
    },
  ]

  const handleSelect = (methodId: string, path: string) => {
    setSelectedMethod(methodId)
    setTimeout(() => {
      router.push(path)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Test Flow
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you want to create your automated test
          </p>
        </div>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {creationMethods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id

            return (
              <Card
                key={method.id}
                className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                }`}
                onClick={() => handleSelect(method.id, method.path)}
              >
                {/* Gradient Header */}
                <div
                  className={`h-32 bg-gradient-to-br ${method.color} flex items-center justify-center relative`}
                >
                  <Icon className="w-16 h-16 text-white" />
                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-white rounded-full p-1">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{method.description}</p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {method.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3 mb-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Best for:</span>
                      <span className="font-medium text-gray-900">
                        {method.bestFor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Difficulty:</span>
                      <span
                        className={`font-medium ${
                          method.difficulty === 'Beginner'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {method.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Avg. Time:</span>
                      <span className="font-medium text-gray-900">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {method.time}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${method.color} text-white hover:opacity-90`}
                    size="lg"
                  >
                    Choose This Method
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Comparison Table */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <Workflow className="w-5 h-5 inline mr-1" />
                    Flow Builder
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <Video className="w-5 h-5 inline mr-1" />
                    Recorder
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <Sparkles className="w-5 h-5 inline mr-1" />
                    AI Prompt
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Speed</td>
                  <td className="text-center py-3 px-4">⚡⚡</td>
                  <td className="text-center py-3 px-4">⚡⚡⚡</td>
                  <td className="text-center py-3 px-4">⚡⚡⚡⚡</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Flexibility</td>
                  <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
                  <td className="text-center py-3 px-4">⭐⭐⭐</td>
                  <td className="text-center py-3 px-4">⭐⭐⭐</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Learning Curve</td>
                  <td className="text-center py-3 px-4">Medium</td>
                  <td className="text-center py-3 px-4">Low</td>
                  <td className="text-center py-3 px-4">Very Low</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Code Generation</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Live Preview</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">AI-Powered</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Not sure which method to choose?
          </p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700">
                <strong>New to testing?</strong> Try AI Prompt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-red-500" />
              <span className="text-gray-700">
                <strong>Quick test?</strong> Use Recorder
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">
                <strong>Complex flow?</strong> Use Flow Builder
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
