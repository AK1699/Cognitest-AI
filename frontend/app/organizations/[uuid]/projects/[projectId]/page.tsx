'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderOpen, Settings, BarChart3, FileText, TestTube, Play, Shield, Zap, Smartphone, Code, ChevronLeft, ChevronDown, Building2, Check, Plus, User, HelpCircle, LogOut, TrendingUp, Puzzle, Activity, Home, Calendar, Globe, Link as LinkIcon, Copy } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import Link from 'next/link'
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

const moduleConfig = {
  'test-management': { name: 'Test Management', color: 'blue', icon: FileText, iconColor: 'text-blue-600' },
  'api-testing': { name: 'API Testing', color: 'green', icon: Code, iconColor: 'text-green-600' },
  'automation-hub': { name: 'Automation Hub', color: 'purple', icon: Zap, iconColor: 'text-purple-600' },
  'security-testing': { name: 'Security Testing', color: 'red', icon: Shield, iconColor: 'text-red-600' },
  'performance-testing': { name: 'Performance Testing', color: 'yellow', icon: BarChart3, iconColor: 'text-orange-600' },
  'mobile-testing': { name: 'Mobile Testing', color: 'indigo', icon: Smartphone, iconColor: 'text-indigo-600' },
} as const

export default function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { uuid, projectId } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('general')

  useEffect(() => {
    fetchProject()
    fetchOrganisation()
    fetchOrganisations()
  }, [projectId, uuid])

  // Set default active tab to overview
  useEffect(() => {
    setActiveTab('overview')
  }, [project])

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(
        `${API_URL}/api/v1/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
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
      const token = localStorage.getItem('access_token')
      const response = await axios.get(
        `${API_URL}/api/v1/organisations/${uuid}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
    }
  }

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_URL}/api/v1/organisations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <button
            onClick={() => router.push(`/organizations/${uuid}/projects`)}
            className="mt-4 text-primary hover:text-primary/80"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    )
  }

  // Generate navigation items based on enabled modules
  const getModuleNavItems = () => {
    if (!project?.settings?.enabled_modules) return []

    return project.settings.enabled_modules.map((moduleId) => {
      const module = moduleConfig[moduleId as keyof typeof moduleConfig]
      if (!module) return null

      return {
        id: moduleId,
        label: module.name,
        icon: module.icon,
        iconColor: module.iconColor,
      }
    }).filter(Boolean)
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
                {/* Organisations Section */}
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

                {/* Add Organisation */}
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

                {/* Edit Profile */}
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

                {/* Account Settings */}
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

                {/* Support */}
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

                {/* Sign Out */}
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
            onClick={() => router.push(`/organizations/${uuid}/projects`)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            View all projects
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {/* Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4 text-blue-500" />
              Overview
            </button>

            {/* Module Navigation */}
            {getModuleNavItems().map((item: any) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              // Handle navigation for specific modules
              const handleClick = () => {
                if (item.id === 'test-management') {
                  router.push(`/organizations/${uuid}/projects/${projectId}/test-management`)
                } else {
                  setActiveTab(item.id)
                }
              }

              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Additional Navigation */}
          <div className="mt-1 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              Reports & Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Puzzle className="w-4 h-4 text-pink-600" />
              Integrations
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Activity className="w-4 h-4 text-teal-600" />
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-600" />
              Settings
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab !== 'settings' && (
          /* Header */
          <div className="border-b border-gray-200 bg-white">
            <div className="px-8 py-5">
              <h1 className="text-2xl font-normal text-gray-900">
                {activeTab === 'overview'
                  ? 'Overview'
                  : getModuleNavItems().find((item: any) => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={activeTab === 'settings' ? 'px-8 py-8' : 'px-8 py-6'}>
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-500 mb-2">Total Test Plans</div>
                  <div className="text-3xl font-semibold text-gray-900">0</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-500 mb-2">Total Test Cases</div>
                  <div className="text-3xl font-semibold text-gray-900">0</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-500 mb-2">Test Executions</div>
                  <div className="text-3xl font-semibold text-gray-900">0</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-4xl">
              {/* Settings Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Project Settings</h2>
                </div>
                <p className="text-gray-600 ml-15">Manage your project's profile and settings</p>
              </div>

              {/* Settings Tabs */}
              <div className="bg-gray-50 rounded-lg p-1 mb-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${
                      settingsTab === 'general'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setSettingsTab('modules')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${
                      settingsTab === 'modules'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Modules
                  </button>
                  <button
                    onClick={() => setSettingsTab('members')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${
                      settingsTab === 'members'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setSettingsTab('danger')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${
                      settingsTab === 'danger'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Danger
                  </button>
                </div>
              </div>

              {/* Settings Content */}
              {settingsTab === 'general' && (
                <div className="space-y-6">
                  {/* Project Created Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Project Created</h3>
                        <p className="text-sm text-gray-600 mb-1">The date your project joined CogniTest</p>
                        <p className="text-base font-semibold text-primary">
                          {project.created_at
                            ? new Date(project.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* General Settings Form */}
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">General Settings</h3>

                    {/* Project Name */}
                    <div className="mb-8">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                        Project Name
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Required</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-3">The name of your project that appears throughout CogniTest</p>
                      <input
                        type="text"
                        value={project.name}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter project name"
                      />
                    </div>

                    {/* Project Description */}
                    <div className="mb-8">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                        <Globe className="w-4 h-4" />
                        Project Description
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Optional</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-3">A brief description of your project</p>
                      <textarea
                        value={project.description || ''}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Enter project description"
                      />
                    </div>

                    {/* Project ID */}
                    <div className="mb-8">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                        <LinkIcon className="w-4 h-4" />
                        Project ID
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Read-only</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-3">Unique identifier for your project. Share this with support for faster assistance</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={project.id}
                          readOnly
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(project.id)
                            toast.success('Project ID copied to clipboard')
                          }}
                          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'modules' && (
                <div className="space-y-6">
                  {/* Enabled Modules */}
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Enabled Testing Modules</h3>
                    <p className="text-sm text-gray-600 mb-6">Manage which testing capabilities are enabled for this project</p>
                    {project.settings?.enabled_modules && project.settings.enabled_modules.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {project.settings.enabled_modules.map((moduleId) => {
                          const module = moduleConfig[moduleId as keyof typeof moduleConfig]
                          if (!module) return null

                          const colorClasses = {
                            blue: 'border-blue-200 bg-blue-50 text-blue-700',
                            green: 'border-green-200 bg-green-50 text-green-700',
                            purple: 'border-purple-200 bg-purple-50 text-purple-700',
                            red: 'border-red-200 bg-red-50 text-red-700',
                            yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
                            indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                          }

                          return (
                            <div
                              key={moduleId}
                              className={`p-4 rounded-lg border-2 ${colorClasses[module.color as keyof typeof colorClasses]}`}
                            >
                              <div className="text-sm font-medium">{module.name}</div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No modules enabled</p>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'members' && (
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <div className="text-center py-16 text-gray-500">
                    Members settings coming soon
                  </div>
                </div>
              )}

              {settingsTab === 'danger' && (
                <div className="bg-white border border-red-200 rounded-lg p-8">
                  <div className="text-center py-16 text-gray-500">
                    Danger zone settings coming soon
                  </div>
                </div>
              )}
            </div>
          ) : (
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
                {getModuleNavItems().find((item: any) => item.id === activeTab)?.label || 'Module'} Coming Soon
              </h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                This module is currently under development. Check back soon for updates.
              </p>

              <button className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
                Get Started
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
