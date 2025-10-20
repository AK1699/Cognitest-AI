'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CreateProjectPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
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

    if (!user) {
      toast.error('You must be logged in to create a project.')
      return
    }

    setLoading(true)
    setNameError(false)

    try {
      const token = localStorage.getItem('access_token')
      const organisation = JSON.parse(localStorage.getItem('current_organisation') || '{}')

      const response = await axios.post(
        `${API_URL}/api/v1/projects/`,
        {
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
          organisation_id: organisation.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // Store current project
      localStorage.setItem('current_project', JSON.stringify(response.data))

      toast.success('Project created successfully!')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast.error(error.response?.data?.detail || 'Failed to create project')
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
              Let's create a project
            </h1>
            <p className="text-lg text-gray-500">
              Projects help you organize your tests and collaborate with your team.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-base font-normal text-gray-900 mb-2">
                Project name
              </label>
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
                placeholder="e.g. My Awesome Project"
                maxLength={100}
              />
              {nameError && (
                <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  Name is required
                </div>
              )}
            </div>

            {/* Project Description */}
            <div>
              <label htmlFor="description" className="block text-base font-normal text-gray-900 mb-2">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base"
                placeholder="A short description of your project."
                rows={4}
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
                  Creating project...
                </span>
              ) : (
                'Create project'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
