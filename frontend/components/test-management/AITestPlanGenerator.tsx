'use client'

import { useState } from 'react'
import { X, Sparkles, Upload, AlertCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface AITestPlanGeneratorProps {
  projectId: string
  onClose: () => void
  onGenerate: (request: any) => Promise<any>
}

export default function AITestPlanGenerator({ projectId, onClose, onGenerate }: AITestPlanGeneratorProps) {
  const [formData, setFormData] = useState({
    documentUrl: '',
    additionalContext: '',
    objectives: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const request = {
        project_id: projectId,
        source_documents: [formData.documentUrl],
        additional_context: formData.additionalContext || undefined,
        objectives: formData.objectives
          ? formData.objectives.split('\n').filter(o => o.trim())
          : undefined,
      }

      const response = await onGenerate(request)
      setResult(response)
    } catch (error: any) {
      if (error.response?.status === 501) {
        setError('AI generation is coming soon! This feature will be available after AI integration is complete.')
      } else {
        setError(error.response?.data?.detail || 'Failed to generate test plan. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-primary px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">AI Test Plan Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-purple-900">AI-Powered Generation</h3>
            <p className="text-sm text-purple-700 mt-1">
              Upload your requirements document or provide a URL. Our AI will analyze it and generate a comprehensive test plan with objectives, coverage areas, and recommendations.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements Document URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.documentUrl}
              onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
              placeholder="https://example.com/requirements.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported: PDF, Word documents, Google Docs, Notion pages
            </p>
          </div>

          {/* Additional Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={formData.additionalContext}
              onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              placeholder="Provide any additional information that might help the AI generate better test cases...&#10;Example: Focus on security testing, include edge cases, prioritize user workflows"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Specific Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Objectives (Optional)
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              placeholder="Enter specific objectives, one per line:&#10;Verify login functionality&#10;Test password reset flow&#10;Validate session management"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-900">AI Generation Not Available Yet</h3>
                <p className="text-sm text-amber-700 mt-1">{error}</p>
                <p className="text-sm text-amber-700 mt-2">
                  In the meantime, you can create test plans manually using the "Create Manually" button.
                </p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-green-900">Test Plan Generated Successfully!</h3>
              </div>
              <div className="text-sm text-green-700 space-y-2">
                <p><strong>Confidence Score:</strong> {result.confidence_score}%</p>
                {result.suggestions && result.suggestions.length > 0 && (
                  <div>
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {result.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
              {result ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || !!result}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Test Plan
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="p-6 pt-0">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <Sparkles className="w-5 h-5 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <p className="text-gray-700 font-medium mb-2">Analyzing your requirements...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>✓ Parsing document structure</p>
                <p>✓ Extracting requirements</p>
                <p>✓ Identifying test scenarios</p>
                <p className="animate-pulse">⏳ Generating test plan...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
