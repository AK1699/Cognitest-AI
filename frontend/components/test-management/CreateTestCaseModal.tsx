'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Loader2, Link as LinkIcon } from 'lucide-react'
import { TestSuite } from '@/lib/api/test-management'

interface CreateTestCaseModalProps {
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  testSuites?: TestSuite[]
}

interface TestStep {
  step_number: number
  action: string
  expected_result: string
}

export default function CreateTestCaseModal({ onClose, onCreate, testSuites = [] }: CreateTestCaseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    test_suite_id: '',
    steps: [{ step_number: 1, action: '', expected_result: '' }] as TestStep[],
    expected_result: '',
    priority: 'medium',
    status: 'draft',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addStep = () => {
    const newStepNumber = formData.steps.length + 1
    setFormData({
      ...formData,
      steps: [...formData.steps, { step_number: newStepNumber, action: '', expected_result: '' }]
    })
  }

  const updateStep = (index: number, field: 'action' | 'expected_result', value: string) => {
    const newSteps = [...formData.steps]
    newSteps[index][field] = value
    setFormData({ ...formData, steps: newSteps })
  }

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index)
      // Renumber steps
      const renumberedSteps = newSteps.map((step, i) => ({
        ...step,
        step_number: i + 1
      }))
      setFormData({ ...formData, steps: renumberedSteps })
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const trimmedTag = tagInput.trim()
      if (!formData.tags.includes(trimmedTag)) {
        setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Test case title is required'
    }

    const validSteps = formData.steps.filter(step => step.action.trim() && step.expected_result.trim())
    if (validSteps.length === 0) {
      newErrors.steps = 'At least one complete step is required (both action and expected result)'
    }

    if (!formData.expected_result.trim()) {
      newErrors.expected_result = 'Overall expected result is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      // Filter out empty steps
      const validSteps = formData.steps.filter(step => step.action.trim() && step.expected_result.trim())

      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        steps: validSteps,
        expected_result: formData.expected_result,
        priority: formData.priority,
        status: formData.status,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      }

      // Only include test_suite_id if one is selected
      if (formData.test_suite_id) {
        payload.test_suite_id = formData.test_suite_id
      }

      await onCreate(payload)
    } catch (error) {
      console.error('Failed to create test case:', error)
      setErrors({ submit: 'Failed to create test case. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Create Test Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Case Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    if (errors.title) setErrors({ ...errors, title: '' })
                  }}
                  placeholder="e.g., Test successful login with valid credentials"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this test case verifies..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>

              {/* Link to Test Suite */}
              {testSuites.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Link to Test Suite (Optional)
                    </div>
                  </label>
                  <select
                    value={formData.test_suite_id}
                    onChange={(e) => setFormData({ ...formData, test_suite_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">No Test Suite</option>
                    {testSuites.map((suite) => (
                      <option key={suite.id} value={suite.id}>
                        {suite.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Type a tag and press Enter"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Steps */}
            <div className="space-y-6">
              {/* Test Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Steps <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Step {step.step_number}</span>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={step.action}
                        onChange={(e) => {
                          updateStep(index, 'action', e.target.value)
                          if (errors.steps) setErrors({ ...errors, steps: '' })
                        }}
                        placeholder="Action to perform"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={loading}
                      />
                      <input
                        type="text"
                        value={step.expected_result}
                        onChange={(e) => {
                          updateStep(index, 'expected_result', e.target.value)
                          if (errors.steps) setErrors({ ...errors, steps: '' })
                        }}
                        placeholder="Expected result"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
                {errors.steps && (
                  <p className="mt-1 text-sm text-red-600">{errors.steps}</p>
                )}
                <button
                  type="button"
                  onClick={addStep}
                  className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>

              {/* Overall Expected Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Expected Result <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.expected_result}
                  onChange={(e) => {
                    setFormData({ ...formData, expected_result: e.target.value })
                    if (errors.expected_result) setErrors({ ...errors, expected_result: '' })
                  }}
                  placeholder="Describe the overall expected outcome of this test case..."
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.expected_result ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.expected_result && (
                  <p className="mt-1 text-sm text-red-600">{errors.expected_result}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Test Case'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
