'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2, File, Trash2, Download, Sparkles } from 'lucide-react'
import { documentsAPI } from '@/lib/api/documents'

interface Document {
  id: string
  title: string
  document_type: string
  source: string
  file_type: string
  file_size: string
  uploaded_by: string
  created_at: string
  chunk_count: number
  is_active: boolean
}

interface DocumentUploadModalProps {
  projectId: string
  onClose: () => void
  onUploadSuccess?: () => void
}

export default function DocumentUploadModal({ projectId, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'list'>('list')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents on mount
  useState(() => {
    loadDocuments()
  })

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await documentsAPI.list(projectId)
      setDocuments(result.documents || [])
    } catch (err: any) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const result = await documentsAPI.upload(file, {
        project_id: projectId,
        document_type: 'requirements',
        source: 'upload',
        description: `Uploaded ${file.name}`,
      })

      setSuccess(`Successfully uploaded: ${result.document.title}`)

      // Reload documents
      await loadDocuments()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Switch to list view
      setStep('list')

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (documentId: string) => {
    setAnalyzing(documentId)
    setError('')
    setSuccess('')

    try {
      const result = await documentsAPI.analyze(documentId)
      setSuccess(result.message)
      await loadDocuments()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze document')
    } finally {
      setAnalyzing(null)
    }
  }

  const handleGenerateTestPlan = async (documentId: string) => {
    setGenerating(documentId)
    setError('')
    setSuccess('')

    try {
      const result = await documentsAPI.generateTestPlan(documentId)
      setSuccess(result.message)

      // Close modal after short delay
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate test plan from document')
    } finally {
      setGenerating(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await documentsAPI.delete(documentId)
      setSuccess('Document deleted successfully')
      await loadDocuments()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete document')
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('doc')) return '📝'
    if (type.includes('txt') || type.includes('md')) return '📃'
    return '📄'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">Document Management</h2>
              <p className="text-blue-100 text-sm">Upload and analyze requirements documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setStep('list')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                step === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setStep('upload')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                step === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="p-6">
            {/* Info Card */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Supported File Types</h3>
              <div className="flex flex-wrap gap-2 text-sm text-blue-700">
                <span className="px-3 py-1 bg-white rounded-full border border-blue-200">📄 PDF</span>
                <span className="px-3 py-1 bg-white rounded-full border border-blue-200">📝 Word (DOC, DOCX)</span>
                <span className="px-3 py-1 bg-white rounded-full border border-blue-200">📃 Text (TXT)</span>
                <span className="px-3 py-1 bg-white rounded-full border border-blue-200">📋 Markdown (MD)</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">Maximum file size: 50MB</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading...</h3>
                  <p className="text-sm text-gray-500">Please wait while we upload and process your document</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Requirements Document</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Click to browse or drag and drop your file here
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Choose File
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* List Step */}
        {step === 'list' && (
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload your first requirements document to get started
                </p>
                <button
                  onClick={() => setStep('upload')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="text-4xl">{getFileIcon(doc.file_type)}</div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                          <span>{doc.file_type.toUpperCase()}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{doc.chunk_count || 0} chunks</span>
                          <span>•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {doc.document_type}
                          </span>
                          {doc.is_active && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAnalyze(doc.id)}
                          disabled={analyzing === doc.id}
                          className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {analyzing === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            'Analyze'
                          )}
                        </button>

                        <button
                          onClick={() => handleGenerateTestPlan(doc.id)}
                          disabled={generating === doc.id}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {generating === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Plan
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
