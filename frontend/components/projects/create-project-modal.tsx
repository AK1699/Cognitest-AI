'use client'

import { useState } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useAuth } from '@/lib/auth-context'

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
  const [isPrivate, setIsPrivate] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

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
      const token = localStorage.getItem('access_token')

      const payload = {
        name: projectName.trim(),
        owner_id: user.id,
        organisation_id: organisationId,
        status: 'active',
        description: '',
        team_ids: [],
        settings: {},
      }

      console.log('Creating project with payload:', payload)

      const response = await axios.post(
        `${API_URL}/api/v1/projects/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log('Project created successfully:', response.data)
      toast.success('Project created successfully!')
      setProjectName('')
      setIsPrivate(true)
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-8">
          <h2 className="text-3xl font-normal text-gray-900 mb-3">
            Create a new project
          </h2>
          <p className="text-base text-gray-600">
            Projects help you organize and manage your test plans, test suites, and test cases in one place.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            {/* Project Name */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Project Name
              </label>
              <p className="text-sm text-gray-600 mb-4">
                The name of the project, product, or workspace that will be associated to each run.
              </p>
              <div className="relative">
                <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Your project name (e.g. Design System)"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 bg-gray-50 -mx-8 px-8 -mb-8 pb-8 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !projectName.trim()}
              className="px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isSubmitting ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
