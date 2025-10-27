'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Settings, ChevronLeft, ChevronDown, Building2, Check, Plus, User, HelpCircle, LogOut, FileText, Search, Filter, Sparkles, Target, Play, CheckCircle2, Clock } from 'lucide-react'
import axios from '@/lib/axios'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Project {
  id: string
  name: string
  description?: string
  status?: string
  created_at?: string
  settings?: {
    enabled_modules?: string[]
  }
}

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

interface PageParams {
  uuid: string
  projectId: string
}

export default function TestManagementPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { uuid, projectId } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchOrganisation()
    fetchOrganisations()
  }, [projectId, uuid])

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/v1/projects/${projectId}`)
      setProject(response.data)
    } catch (error: any) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganisation = async () => {
    try {
      const response = await axios.get(`/api/v1/organisations/${uuid}`)
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
    }
  }

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const response = await axios.get('/api/v1/organisations/')
      setOrganisations(response.data)
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  const switchOrganisation = (org: Organisation) => {
    setOrganisation(org)
    localStorage.setItem('current_organisation', JSON.stringify(org))
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    setIsProfileOpen(false)
    router.push(`/organizations/${org.id}/projects`)
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Organization & User Header */}
        {organisation && user && (
          <div className="p-4 border-b border-gray-200 relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen)
                if (!isProfileOpen) {
                  fetchOrganisations()
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isProfileOpen
                  ? 'border border-primary bg-primary/5'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">
                  {organisation.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-base font-semibold truncate text-gray-900">{organisation.name}</h2>
                <p className="text-xs text-gray-500 uppercase">{user.username}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-24 left-4 right-4 p-4 rounded-lg border border-gray-200 bg-white shadow-lg space-y-4 z-50">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-600">
                    Organisations ({organisations.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {organisations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => switchOrganisation(org)}
                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                      >
                        <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-900 flex-1 truncate">
                          {org.name}
                        </span>
                        {organisation?.id === org.id && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    router.push('/organisations/new')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Add Organisation</span>
                </button>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    router.push('/profile/edit')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Edit profile</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/account/settings')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Account settings</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/support')
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Support</span>
                </button>
                <hr className="border-gray-200" />
                <button
                  onClick={() => {
                    logout()
                    setIsProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-100 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close profile dropdown when clicking outside */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
        )}

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate text-gray-900">{project.name}</h3>
            </div>
          </div>
          <button
            onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Back to project
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Test Management</div>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-primary/10 text-primary font-medium transition-colors">
              <FileText className="w-4 h-4" />
              Test Plans
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <FileText className="w-4 h-4" />
              Test Suites
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <FileText className="w-4 h-4" />
              Test Cases
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-8 py-5">
            <h1 className="text-2xl font-normal text-gray-900">Test Plans</h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-64 h-64 mb-8 opacity-50">
              <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300">
                <circle cx="100" cy="60" r="40" fill="currentColor" opacity="0.1" />
                <rect x="60" y="120" width="80" height="60" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="70" y="130" width="20" height="40" rx="2" fill="currentColor" opacity="0.3" />
                <rect x="110" y="130" width="20" height="40" rx="2" fill="currentColor" opacity="0.3" />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Test Plans Yet
            </h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Create your first test plan to organize and manage your testing efforts.
            </p>

            <button className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
              Create Test Plan
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
