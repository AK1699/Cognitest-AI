'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

export default function CreateOrganizationPage() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [nameError, setNameError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setLoading(true)
    setNameError(false)

    try {
      const response = await api.post(
        '/api/v1/organisations/',
        {
          name: name.trim(),
          website: website.trim() || null,
          description: null
        }
      )

      // Store current organization in Redis session
      const { setCurrentOrganization } = await import('@/lib/api/session')
      await setCurrentOrganization(response.data.id)

      toast.success('Organization created successfully!')

      // Redirect to projects with organization UUID
      router.push(`/organizations/${response.data.id}/projects`)
    } catch (error: any) {
      console.error('Error creating organization:', error)

      // Check if it's an authentication error
      if (error.isAuthError || error.response?.status === 401) {
        toast.error('Your session has expired. Please sign in again.')
        router.push('/auth/signin')
        return
      }

      toast.error(error.response?.data?.detail || 'Failed to create organization')
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-teal-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-teal-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="pt-6 px-6 sm:px-12">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-xl">
          {/* Card Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 sm:p-12">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-3">
              Let's create an organization
            </h1>

            {/* Subtitle */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
              This organization will be the workspace for your company or team
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Organization name
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  It's best to use your company or team name
                </p>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError(false)
                  }}
                  placeholder="Enter your organization name"
                  className={`w-full px-4 py-3 rounded-lg border ${nameError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500'
                    } dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 transition-colors placeholder-gray-400 dark:placeholder-gray-500`}
                />
                {nameError && (
                  <p className="text-red-500 text-sm mt-2">Organization name is required</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Organization website <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This helps us validate your organization
                </p>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg bg-primary hover:opacity-90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
              >
                {loading ? 'Creating organization...' : 'Create organization'}
              </button>
            </form>

            {/* Helper Text */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              You can add team members and configure settings after creating your organization
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/organizations')}
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium"
            >
              Back to your organization list
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
