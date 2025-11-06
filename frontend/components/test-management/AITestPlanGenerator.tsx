'use client'

import { useState } from 'react'
import { X, Sparkles, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { testPlansAPI } from '@/lib/api/test-management'

interface AITestPlanGeneratorProps {
  projectId: string
  onClose: () => void
  onSuccess?: () => void
}

const PROJECT_TYPES = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'mobile-app', label: 'Mobile Application' },
  { value: 'api', label: 'API/Backend Service' },
  { value: 'desktop-app', label: 'Desktop Application' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'saas', label: 'SaaS Platform' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'enterprise', label: 'Enterprise System' },
  { value: 'other', label: 'Other' },
]

const PLATFORMS = [
  'Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux',
  'Chrome', 'Firefox', 'Safari', 'Edge'
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
]

const COMPLEXITIES = [
  { value: 'low', label: 'Low - Simple feature', description: '1-2 weeks' },
  { value: 'medium', label: 'Medium - Moderate complexity', description: '2-4 weeks' },
  { value: 'high', label: 'High - Complex system', description: '1-3 months' },
]

export default function AITestPlanGenerator({ projectId, onClose, onSuccess }: AITestPlanGeneratorProps) {
  const [step, setStep] = useState<'form' | 'generating' | 'success'>('form')

  const [formData, setFormData] = useState({
    project_type: 'web-app',
    description: '',
    features: [''],
    platforms: ['Web'],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    complexity: 'medium' as 'low' | 'medium' | 'high',
    timeframe: '',
  })

  const [error, setError] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const togglePlatform = (platform: string) => {
    const platforms = formData.platforms.includes(platform)
      ? formData.platforms.filter(p => p !== platform)
      : [...formData.platforms, platform]
    setFormData({ ...formData, platforms })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.description.trim()) {
      setError('Please provide a project description')
      return
    }

    const validFeatures = formData.features.filter(f => f.trim())
    if (validFeatures.length === 0) {
      setError('Please add at least one feature')
      return
    }

    if (formData.platforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setStep('generating')

    try {
      const request = {
        project_id: projectId,
        project_type: formData.project_type,
        description: formData.description,
        features: validFeatures,
        platforms: formData.platforms,
        priority: formData.priority,
        complexity: formData.complexity,
        timeframe: formData.timeframe || `${formData.complexity === 'low' ? '2' : formData.complexity === 'medium' ? '4' : '8'} weeks`,
      }

      const result = await testPlansAPI.generateComprehensive(request)
      setGeneratedPlan(result)
      setStep('success')

      // Notify parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate test plan. Please try again.')
      setStep('form')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">AI-Powered Test Plan Generator</h2>
              <p className="text-purple-100 text-sm">IEEE 829 Compliant • Comprehensive Coverage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            disabled={step === 'generating'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <>
            {/* Info Card */}
            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-purple-900">What You'll Get</h3>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>✓ <strong>IEEE 829 Compliant Test Plan</strong> with all sections</li>
                    <li>✓ <strong>5-7 Test Suites</strong> automatically created and organized</li>
                    <li>✓ <strong>30-70 Test Cases</strong> with detailed steps and expected results</li>
                    <li>✓ <strong>Entry/Exit Criteria</strong>, Risk Assessment, and Resource Planning</li>
                    <li>✓ <strong>Milestones & Schedule</strong> based on your complexity and timeframe</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {PROJECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project, its purpose, and key functionality...&#10;Example: A modern e-commerce platform for selling electronics with user accounts, shopping cart, payment integration, order tracking, and admin dashboard."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Features <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1} (e.g., User Authentication, Payment Processing)`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  className="mt-2 flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Feature
                </button>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platforms <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.platforms.includes(platform)
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority and Complexity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complexity <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.complexity}
                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {COMPLEXITIES.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label} ({c.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe (Optional)
                </label>
                <input
                  type="text"
                  value={formData.timeframe}
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  placeholder="e.g., 4 weeks, 2 months, Q1 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated based on complexity if not provided
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Comprehensive Test Plan
                </button>
              </div>
            </form>
          </>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="p-12">
            <div className="max-w-md mx-auto text-center">
              {/* Animated Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600"></div>
                  <Sparkles className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Generating Your Test Plan
              </h3>
              <p className="text-gray-600 mb-8">
                Our AI is analyzing your project and creating a comprehensive test plan...
              </p>

              {/* Progress Steps */}
              <div className="space-y-3 text-left bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Analyzing project requirements</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Generating test objectives and scope</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Creating test strategy and approach</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-gray-700 font-medium">Generating test suites and cases...</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-50">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  <span className="text-gray-500">Finalizing test plan structure</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                This typically takes 15-30 seconds
              </p>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && generatedPlan && (
          <div className="p-12">
            <div className="max-w-md mx-auto text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Test Plan Generated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your comprehensive test plan is ready to use
              </p>

              {/* Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 text-left mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Generated Content:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Test Plan ID:</span>
                    <span className="font-mono font-medium">{generatedPlan.id?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Suites:</span>
                    <span className="font-medium">Ready to view</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Cases:</span>
                    <span className="font-medium">Ready to execute</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score:</span>
                    <span className="font-medium">{generatedPlan.confidence_score || 'High'}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-sm text-gray-500 mb-6">
                Redirecting to test management view...
              </p>

              {/* Action */}
              <button
                onClick={() => {
                  if (onSuccess) onSuccess()
                  onClose()
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                View Test Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
