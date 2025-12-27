'use client'

import { useState, useEffect } from 'react'
import { X, FolderOpen, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { checkResourceLimit, type ResourceLimitCheck } from '@/lib/api/subscription'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  organisationId: string
  onProjectCreated: () => void
}

export function CreateProjectModal({
  isOpen,
  onClose,
  organisationId,
  onProjectCreated,
}: CreateProjectModalProps) {
  const { user } = useAuth()
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [limitCheck, setLimitCheck] = useState<ResourceLimitCheck | null>(null)
  const [isCheckingLimit, setIsCheckingLimit] = useState(false)

  // Check limit when modal opens
  useEffect(() => {
    if (isOpen && organisationId) {
      checkLimit()
    }
  }, [isOpen, organisationId])

  const checkLimit = async () => {
    setIsCheckingLimit(true)
    try {
      const result = await checkResourceLimit(organisationId, 'projects')
      setLimitCheck(result)
    } catch (error) {
      console.error('Error checking project limit:', error)
      // Allow project creation if limit check fails
      setLimitCheck(null)
    } finally {
      setIsCheckingLimit(false)
    }
  }

  if (!isOpen) return null

  const modules = [
    { id: 'test-management', name: 'Test Management', color: 'blue' },
    { id: 'api-testing', name: 'API Testing', color: 'green' },
    { id: 'automation-hub', name: 'Automation Hub', color: 'purple' },
    { id: 'security-testing', name: 'Security Testing', color: 'red' },
    { id: 'performance-testing', name: 'Performance Testing', color: 'yellow' },
    { id: 'mobile-testing', name: 'Mobile Testing', color: 'indigo' },
  ]

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      toast.error('Project name is required')
      return
    }

    if (!user) {
      toast.error('User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: projectName.trim(),
        owner_id: user.id,
        organisation_id: organisationId,
        status: 'active',
        description: projectDescription.trim(),
        team_ids: [],
        settings: {
          enabled_modules: selectedModules,
        },
      }

      console.log('Creating project with payload:', payload)

      const response = await api.post('/api/v1/projects/', payload)

      console.log('Project created successfully:', response.data)
      toast.success('Project created successfully!')
      setProjectName('')
      setProjectDescription('')
      setSelectedModules([])
      onProjectCreated()
      onClose()
    } catch (error: any) {
      console.error('Failed to create project:', error)
      console.error('Error response:', error.response?.data)
      const errorDetail = error.response?.data?.detail
      const errorMessage = Array.isArray(errorDetail)
        ? errorDetail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
        : errorDetail || 'Failed to create project'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-8 flex-shrink-0">
          <h2 className="text-3xl font-semibold text-gray-900 mb-3">
            Create a new project
          </h2>
          <p className="text-base text-gray-600">
            Projects help you organize and manage your test plans, test suites, and test cases in one place.
          </p>
        </div>

        {/* Limit Reached Banner */}
        {limitCheck?.limit_reached && (
          <div className="mx-8 mb-6 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">
                  Project Limit Reached
                </h3>
                <p className="text-sm text-amber-700 mb-4">
                  You&apos;ve reached the maximum number of projects ({limitCheck.current}/{limitCheck.limit})
                  allowed on your current plan. Upgrade to create more projects.
                </p>
                <Link
                  href={`/organizations/${organisationId}/billing`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  Upgrade Plan
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isCheckingLimit && (
          <div className="mx-8 mb-6 p-4 text-center text-gray-500">
            Checking plan limits...
          </div>
        )}

        {/* Form - Scrollable (only show if limit not reached) */}
        {!limitCheck?.limit_reached && !isCheckingLimit && (
          <form id="create-project-form" onSubmit={handleSubmit} className="px-8 overflow-y-auto flex-1">
            <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  Project Name *
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Payroll Platform"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of your project..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Testing Modules */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Select Testing Modules
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which testing capabilities you want to enable for this project
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {modules.map((module) => {
                    const isSelected = selectedModules.includes(module.id)
                    const colorClasses = {
                      blue: 'border-blue-200 bg-blue-50 text-blue-700',
                      green: 'border-green-200 bg-green-50 text-green-700',
                      purple: 'border-purple-200 bg-purple-50 text-purple-700',
                      red: 'border-red-200 bg-red-50 text-red-700',
                      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
                      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                    }

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        disabled={isSubmitting}
                        className={`
                        relative p-4 rounded-lg border-2 text-left transition-all
                        ${isSelected
                            ? colorClasses[module.color as keyof typeof colorClasses]
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }
                      `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-current border-current' : 'border-gray-300'}
                        `}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">{module.name}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

          </form>
        )}

        {/* Footer - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-6 pb-6 px-8 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {limitCheck?.limit_reached ? 'Close' : 'Back'}
          </button>
          {!limitCheck?.limit_reached && !isCheckingLimit && (
            <button
              type="submit"
              form="create-project-form"
              disabled={isSubmitting || !projectName.trim()}
              className="px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isSubmitting ? 'Creating...' : 'Create project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
