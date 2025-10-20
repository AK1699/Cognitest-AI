'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CreateOrganisationPage() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [nameError, setNameError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setLoading(true)
    setNameError(false)

    try {
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API_URL}/api/v1/organisations/`,
        {
          name: name.trim(),
          website: website.trim() || null,
          description: null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // Store current organization
      localStorage.setItem('current_organisation', JSON.stringify(response.data))

      toast.success('Organization created successfully!')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating organisation:', error)
      toast.error(error.response?.data?.detail || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-normal text-gray-900 mb-3">
              Let's create an organization
            </h1>
            <p className="text-lg text-gray-500">
              This organization will be the workspace for your company or team
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-base font-normal text-gray-900 mb-2">
                Organization name
              </label>
              <p className="text-sm text-red-500 mb-3">
                It's best to use your company or team name
              </p>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(false)
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  nameError
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                } text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base`}
                placeholder=""
                maxLength={100}
              />
              {nameError && (
                <>
                  <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    Name is required
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Name is required</span>
                  </div>
                </>
              )}
            </div>

            {/* Organization Website */}
            <div>
              <label htmlFor="website" className="block text-base font-normal text-gray-900 mb-2">
                Organization website <span className="text-gray-400">(optional)</span>
              </label>
              <p className="text-sm text-gray-500 mb-3">
                This helps us validate your organization
              </p>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base"
                placeholder="https://example.com"
                maxLength={500}
              />
            </div>

            {/* Create Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating organization...
                </span>
              ) : (
                'Create organization'
              )}
            </button>
          </form>

          {/* User Info Display (matching screenshot style) */}
          {user && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
                     user.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
