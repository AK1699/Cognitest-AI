'use client'

import { useState, useRef } from 'react'
import { X, Sparkles, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, Info, Upload, FileText, Image as ImageIcon, Eye, ThumbsUp, Edit } from 'lucide-react'
import { testPlansAPI } from '@/lib/api/test-management'
import { documentsAPI } from '@/lib/api/documents'
import { organisationMemoryAPI } from '@/lib/api/organisation-memory'
import JiraLikeEditor from './JiraLikeEditor'
import MagnifierLoader from '@/components/ui/MagnifierLoader'

interface AITestPlanGeneratorProps {
  projectId: string
  organisationId: string
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

export default function AITestPlanGenerator({ projectId, organisationId, onClose, onSuccess }: AITestPlanGeneratorProps) {
  const [mode, setMode] = useState<'manual' | 'document'>('manual')
  const [step, setStep] = useState<'form' | 'generating' | 'review' | 'accepting' | 'success'>('form')

  // Manual input with images
  const [manualImages, setManualImages] = useState<File[]>([])

  const [formData, setFormData] = useState({
    title: '',
    project_type: 'web-app',
    description: '',
    features: [''],
    platforms: ['Web'],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    complexity: 'medium' as 'low' | 'medium' | 'high',
    timeframe: '',
  })

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentContext, setDocumentContext] = useState('')
  const [documentObjectives, setDocumentObjectives] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  const handleDocumentUpload = async () => {
    if (!documentTitle.trim()) {
      setError('Please provide a title for the document')
      return
    }

    if (!selectedFile) {
      setError('Please select a document to upload')
      return
    }

    setStep('generating')
    setError('')

    try {
      // Step 1: Upload the document with title
      setGeneratedPlan({ message: 'Uploading document...' } as any)
      const uploadResult = await documentsAPI.upload(selectedFile, {
        project_id: projectId,
        document_type: 'requirement',
        document_name: documentTitle,
        source: 'file_upload',
        description: documentContext || `Uploaded ${selectedFile.name} for test plan generation`,
      })

      console.log('Document uploaded:', uploadResult.document.id)

      // Step 2: Analyze the document and generate test plan preview
      // The backend will automatically analyze the PDF content and extract requirements
      setGeneratedPlan({ message: 'Analyzing document and generating comprehensive test plan...' } as any)
      const result = await documentsAPI.generateTestPlan(uploadResult.document.id)

      console.log('Test plan generated:', result)

      // Override the AI-generated name with user's title
      if (documentTitle.trim()) {
        result.name = documentTitle.trim()
      }

      setPreviewData(result)
      setStep('review')  // Show review step instead of success
    } catch (err: any) {
      console.error('Error generating test plan:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate test plan from document'
      setError(errorMessage)
      setStep('form')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.title.trim()) {
      setError('Please provide a test plan title')
      return
    }

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
      // Step 1: Store in organization memory if images are provided (for self-evolving AI)
      if (manualImages.length > 0) {
        try {
          const fullDescription = `Project Type: ${formData.project_type}\n\nDescription: ${formData.description}\n\nFeatures: ${validFeatures.join(', ')}\n\nPlatforms: ${formData.platforms.join(', ')}\n\nPriority: ${formData.priority}\nComplexity: ${formData.complexity}`

          await organisationMemoryAPI.storeMemory(
            {
              organisation_id: organisationId,
              description: fullDescription,
              project_id: projectId,
              source: 'test_plan_generator',
              images: manualImages,
            },
            '' // Token not needed - auth via httpOnly cookies
          )
        } catch (memoryErr) {
          console.log('Failed to store in organization memory, continuing with generation:', memoryErr)
        }
      }

      // Step 2: Generate test plan
      const request = {
        project_id: projectId,
        title: formData.title,
        project_type: formData.project_type,
        description: formData.description,
        features: validFeatures,
        platforms: formData.platforms,
        priority: formData.priority,
        complexity: formData.complexity,
        timeframe: formData.timeframe || `${formData.complexity === 'low' ? '2' : formData.complexity === 'medium' ? '4' : '8'} weeks`,
      }

      // Generate test plan preview (AI response without database commit)
      const result = await testPlansAPI.generateComprehensive(request)

      // Override the AI-generated name with user's title
      if (formData.title) {
        result.name = formData.title
      }

      setPreviewData(result)
      setStep('review')  // Show review step instead of success
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate test plan. Please try again.')
      setStep('form')
    }
  }

  const handleAccept = async () => {
    setStep('accepting')
    setError('')

    try {
      // Add project_id to preview data before accepting
      const dataToAccept = {
        ...previewData,
        project_id: projectId,
      }

      // Call the accept-preview endpoint to create the test plan in database
      const createdTestPlan = await testPlansAPI.acceptPreview(dataToAccept)

      setGeneratedPlan(createdTestPlan)
      setStep('success')

      // Notify parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      console.error('Error accepting test plan:', err)
      setError(err.response?.data?.detail || 'Failed to create test plan. Please try again.')
      setStep('review')
    }
  }

  const handleReject = () => {
    // Go back to form with existing data
    setPreviewData(null)
    setStep('form')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#05757f] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">AI-Powered Test Plan Generator</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            disabled={step === 'generating' || step === 'accepting'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <>
            {/* Info Card */}
            <div className="mx-6 mt-6 p-4 bg-[#05757f]/5 border border-[#05757f]/20 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-[#05757f] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#05757f]">What You'll Get</h3>
                  <ul className="text-sm text-[#05757f]/80 mt-2 space-y-1">
                    <li>✓ <strong>IEEE 829 Compliant Test Plan</strong> with all sections</li>
                    <li>✓ <strong>5-7 Test Suites</strong> automatically created and organized</li>
                    <li>✓ <strong>30-70 Test Cases</strong> with detailed steps and expected results</li>
                    <li>✓ <strong>Entry/Exit Criteria</strong>, Risk Assessment, and Resource Planning</li>
                    <li>✓ <strong>Milestones & Schedule</strong> based on your complexity and timeframe</li>
                    <li>✓ <strong>📸 Paste Screenshots</strong> in description (Ctrl/Cmd+V) for better AI analysis</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="mx-6 mt-4 flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'manual'
                  ? 'bg-white text-[#05757f] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Manual Input
              </button>
              <button
                type="button"
                onClick={() => setMode('document')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'document'
                  ? 'bg-white text-[#05757f] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {/* Manual Input Form */}
            {mode === 'manual' && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Test Plan Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Plan Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., E-Commerce Platform Test Plan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
                  />
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description with JIRA-like Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <JiraLikeEditor
                    content={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    onImagesChange={setManualImages}
                    placeholder="Describe your project, its purpose, and key functionality... You can paste screenshots (Ctrl/Cmd+V) or drag & drop images directly!"
                    className="min-h-[250px]"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>Tip:</strong> Use the toolbar for rich formatting. Paste or drag & drop screenshots directly into the editor!
                  </p>
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
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
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
                    className="mt-2 flex items-center gap-2 text-[#05757f] hover:text-[#046169] text-sm font-medium"
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
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.platforms.includes(platform)
                          ? 'border-[#05757f] bg-[#05757f]/5 text-[#05757f] font-medium'
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
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
                    className="flex-1 px-4 py-2 bg-[#05757f] text-white rounded-lg hover:bg-[#046169] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    Generate Comprehensive Test Plan
                  </button>
                </div>
              </form>
            )}

            {/* Document Upload Form */}
            {mode === 'document' && (
              <div className="p-6 space-y-6">
                {/* File Upload Info */}
                <div className="p-4 bg-[#05757f]/5 border border-[#05757f]/20 rounded-lg">
                  <h3 className="text-sm font-medium text-[#05757f] mb-2">Supported File Types</h3>
                  <div className="flex flex-wrap gap-2 text-sm text-[#05757f]/80">
                    <span className="px-3 py-1 bg-white rounded-full border border-[#05757f]/20">📄 PDF</span>
                    <span className="px-3 py-1 bg-white rounded-full border border-[#05757f]/20">📝 Word (DOC, DOCX)</span>
                    <span className="px-3 py-1 bg-white rounded-full border border-[#05757f]/20">📃 Text (TXT)</span>
                    <span className="px-3 py-1 bg-white rounded-full border border-[#05757f]/20">📋 Markdown (MD)</span>
                  </div>
                  <p className="text-xs text-[#05757f]/60 mt-2">Maximum file size: 50MB</p>
                </div>

                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Plan Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g., E-Commerce Platform Test Plan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
                  />
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Requirements Document <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#05757f]/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.md"
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-[#05757f]" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{selectedFile.name}</div>
                          <div className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Requirements Document</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          BRD, PRD, FRD, or any requirements document
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-2 bg-[#05757f] text-white rounded-lg hover:bg-[#046169] transition-colors font-medium"
                        >
                          Choose File
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={documentContext}
                    onChange={(e) => setDocumentContext(e.target.value)}
                    placeholder="Provide any additional information that might help the AI generate better test cases...&#10;Example: Focus on security testing, include edge cases, prioritize user workflows"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent"
                  />
                </div>

                {/* Specific Objectives */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Objectives (Optional)
                  </label>
                  <textarea
                    value={documentObjectives}
                    onChange={(e) => setDocumentObjectives(e.target.value)}
                    placeholder="Enter specific objectives, one per line:&#10;Verify login functionality&#10;Test password reset flow&#10;Validate session management"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05757f] focus:border-transparent font-mono text-sm"
                  />
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
                    type="button"
                    onClick={handleDocumentUpload}
                    disabled={!selectedFile || !documentTitle.trim()}
                    className="flex-1 px-4 py-2 bg-[#05757f] text-white rounded-lg hover:bg-[#046169] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate from Document
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="p-12">
            <div className="max-w-md mx-auto text-center">
              {/* Animated Icon */}
              <div className="flex justify-center mb-6">
                <MagnifierLoader />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Generating Your Test Plan
              </h3>
              <p className="text-gray-600 mb-8">
                {mode === 'document'
                  ? 'Our AI is analyzing your document and creating a comprehensive test plan...'
                  : 'Our AI is analyzing your project and creating a comprehensive test plan...'}
              </p>

              {/* Progress Steps */}
              <div className="space-y-3 text-left bg-[#05757f]/5 rounded-lg p-6">
                {mode === 'document' ? (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Uploading document</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Extracting requirements and features</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Identifying test scenarios</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Loader2 className="w-5 h-5 text-[#05757f] animate-spin" />
                      <span className="text-gray-700 font-medium">Generating comprehensive test plan...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-50">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      <span className="text-gray-500">Creating test suites and cases</span>
                    </div>
                  </>
                ) : (
                  <>
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
                      <Loader2 className="w-5 h-5 text-[#05757f] animate-spin" />
                      <span className="text-gray-700 font-medium">Generating test suites and cases...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-50">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      <span className="text-gray-500">Finalizing test plan structure</span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-6">
                This typically takes 15-30 seconds
              </p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && previewData && (
          <div className="p-6">
            <div className="max-w-3xl mx-auto">
              {/* Review Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#05757f]/10 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#05757f]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Review AI-Generated Test Plan</h3>
                  <p className="text-gray-600 text-sm">Please review the generated content before creating the test plan</p>
                </div>
              </div>

              {/* Preview Content */}
              <div className="bg-[#05757f]/5 border border-[#05757f]/20 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#05757f]" />
                  Generated Test Plan Preview
                </h4>

                {/* Debug: Show raw data structure */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mb-4 bg-gray-100 p-2 rounded text-xs">
                    <summary className="cursor-pointer font-mono">Debug: View Raw Data</summary>
                    <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(previewData, null, 2)}</pre>
                  </details>
                )}

                <div className="space-y-4 text-sm">
                  {/* Test Plan Name */}
                  {previewData.name && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">Test Plan Name</div>
                      <div className="text-lg font-bold text-gray-900">{previewData.name}</div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {previewData.confidence_score && (
                      <div className="bg-white rounded-lg p-3 border border-[#05757f]/20 text-center">
                        <div className="text-2xl font-bold text-green-600 capitalize">{previewData.confidence_score}</div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>
                    )}
                    {previewData.id && (
                      <div className="bg-white rounded-lg p-3 border border-[#05757f]/20 text-center col-span-2">
                        <div className="text-xs font-mono text-gray-900">{previewData.id}</div>
                        <div className="text-xs text-gray-600">Plan ID</div>
                      </div>
                    )}
                  </div>

                  {/* Test Objectives */}
                  {previewData.test_objectives && previewData.test_objectives.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Test Objectives</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {previewData.test_objectives.slice(0, 3).map((obj: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#05757f]">•</span>
                            <span>{obj.title || obj.objective || obj}</span>
                          </li>
                        ))}
                        {previewData.test_objectives.length > 3 && (
                          <li className="text-gray-500 italic">+{previewData.test_objectives.length - 3} more objectives</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Scope */}
                  {previewData.scope_of_testing && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Scope of Testing</div>
                      <div className="grid grid-cols-2 gap-4">
                        {previewData.scope_of_testing.in_scope && (
                          <div>
                            <div className="text-xs font-medium text-green-700 mb-1">In Scope</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {previewData.scope_of_testing.in_scope.slice(0, 2).map((item: string, idx: number) => (
                                <li key={idx}>• {item}</li>
                              ))}
                              {previewData.scope_of_testing.in_scope.length > 2 && (
                                <li className="italic">+{previewData.scope_of_testing.in_scope.length - 2} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {previewData.scope_of_testing.testing_types && (
                          <div>
                            <div className="text-xs font-medium text-[#05757f] mb-1">Testing Types</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {previewData.scope_of_testing.testing_types.slice(0, 2).map((type: string, idx: number) => (
                                <li key={idx}>• {type}</li>
                              ))}
                              {previewData.scope_of_testing.testing_types.length > 2 && (
                                <li className="italic">+{previewData.scope_of_testing.testing_types.length - 2} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {previewData.description && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Description</div>
                      <div className="text-sm text-gray-700 line-clamp-3">{previewData.description}</div>
                    </div>
                  )}

                  {/* Test Suites */}
                  {previewData.test_suites && previewData.test_suites.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Test Suites & Cases</div>
                      <div className="space-y-3">
                        {previewData.test_suites.slice(0, 3).map((suite: any, idx: number) => {
                          const totalCases = suite.test_cases?.length || 0;
                          return (
                            <div key={idx} className="bg-[#05757f]/5 rounded-lg p-3 border border-[#05757f]/20">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-sm text-gray-900">{suite.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">{suite.description}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="px-2 py-0.5 bg-[#05757f]/10 text-[#05757f] text-xs rounded-full font-medium">
                                    {suite.category}
                                  </span>
                                  <span className="text-xs text-gray-600">{totalCases} test{totalCases !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              {suite.test_cases && suite.test_cases.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {suite.test_cases.slice(0, 2).map((testCase: any, tcIdx: number) => (
                                    <div key={tcIdx} className="text-xs text-gray-700 flex items-start gap-1">
                                      <span className="text-[#05757f]/80">▸</span>
                                      <span className="flex-1">{testCase.name}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${testCase.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                        testCase.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                          testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {testCase.priority}
                                      </span>
                                    </div>
                                  ))}
                                  {suite.test_cases.length > 2 && (
                                    <div className="text-xs text-gray-500 italic pl-3">
                                      +{suite.test_cases.length - 2} more test case{suite.test_cases.length - 2 !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {previewData.test_suites.length > 3 && (
                          <div className="text-sm text-gray-500 italic text-center pt-2">
                            +{previewData.test_suites.length - 3} more test suite{previewData.test_suites.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#05757f]/20 flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          Total: <strong className="text-[#05757f]">{previewData.test_suites.length}</strong> test suite{previewData.test_suites.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-600">
                          <strong className="text-[#05757f]">
                            {previewData.test_suites.reduce((sum: number, suite: any) => sum + (suite.test_cases?.length || 0), 0)}
                          </strong> total test case{previewData.test_suites.reduce((sum: number, suite: any) => sum + (suite.test_cases?.length || 0), 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fallback: Show minimal info if specific fields are missing */}
                  {!previewData.name && !previewData.test_objectives && (
                    <div className="bg-white rounded-lg p-4 border border-[#05757f]/20">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">✅ Test Plan Generated Successfully!</p>
                        <p className="text-gray-600">
                          A comprehensive test plan has been created with all IEEE 829 sections.
                          Click "Accept & Create Test Plan" to finalize.
                        </p>
                        {previewData.id && (
                          <p className="text-xs text-gray-500 mt-2 font-mono">ID: {previewData.id}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-[#05757f]/5 border border-[#05757f]/20 rounded-lg mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-[#05757f] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#05757f]">
                    <strong>Review Your Test Plan</strong>
                    <p className="mt-2 text-[#05757f]/90">
                      AI has generated a comprehensive test plan based on your requirements. Review the details above and choose an action:
                    </p>
                    <ul className="mt-2 space-y-1 text-[#05757f]/90">
                      <li>• <strong>"Accept & Create Test Plan"</strong> - Finalize and add to your project</li>
                      <li>• <strong>"Back to Edit"</strong> - Modify requirements and regenerate</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={false}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={false}
                  className="flex-1 px-6 py-3 bg-[#05757f] text-white rounded-lg hover:bg-[#046169] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {false ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Test Plan...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Accept & Create Test Plan
                    </>
                  )}
                </button>
              </div>
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
              <div className="bg-[#05757f]/5 rounded-lg p-6 text-left mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Generated Content:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  {generatedPlan.id && (
                    <div className="flex justify-between">
                      <span>Test Plan ID:</span>
                      <span className="font-mono font-medium text-xs">{generatedPlan.id}</span>
                    </div>
                  )}
                  {generatedPlan.name && (
                    <div className="flex justify-between">
                      <span>Plan Name:</span>
                      <span className="font-medium truncate ml-2">{generatedPlan.name}</span>
                    </div>
                  )}
                  {generatedPlan.confidence_score && (
                    <div className="flex justify-between">
                      <span>Confidence Score:</span>
                      <span className="font-medium capitalize">{generatedPlan.confidence_score}</span>
                    </div>
                  )}
                  {generatedPlan.test_objectives_ieee && (
                    <div className="flex justify-between">
                      <span>Test Objectives:</span>
                      <span className="font-medium">{generatedPlan.test_objectives_ieee.length} objectives</span>
                    </div>
                  )}
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
                className="w-full px-6 py-3 bg-[#05757f] text-white rounded-lg hover:bg-[#046169] transition-colors font-medium"
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
