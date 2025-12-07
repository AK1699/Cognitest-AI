'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderOpen, Settings, BarChart3, FileText, TestTube, Play, Shield, Zap, Smartphone, Code, ChevronLeft, ChevronDown, Building2, Check, Plus, User, HelpCircle, LogOut, TrendingUp, Puzzle, Activity, Home, Calendar, Globe, Link as LinkIcon, Copy, BrainCircuit } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { UserNav } from '@/components/layout/user-nav'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ReportsAnalyticsTab } from '@/components/dashboard/reports-analytics-tab'
import { StatsCard } from '@/components/dashboard/stats-card'
import { TestManagementOverview } from '@/components/dashboard/module-overviews/test-management-overview'
import { ApiTestingOverview } from '@/components/dashboard/module-overviews/api-testing-overview'
import { AutomationHubOverview } from '@/components/dashboard/module-overviews/automation-hub-overview'
import { SecurityTestingOverview } from '@/components/dashboard/module-overviews/security-testing-overview'
import { PerformanceTestingOverview } from '@/components/dashboard/module-overviews/performance-testing-overview'
import { MobileTestingOverview } from '@/components/dashboard/module-overviews/mobile-testing-overview'

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

const colorToBg: Record<string, string> = {
  'blue': 'bg-blue-100',
  'green': 'bg-green-100',
  'purple': 'bg-purple-100',
  'red': 'bg-red-100',
  'orange': 'bg-orange-100',
  'indigo': 'bg-indigo-100',
}

const colorToText: Record<string, string> = {
  'blue': 'text-blue-700',
  'green': 'text-green-700',
  'purple': 'text-purple-700',
  'red': 'text-red-700',
  'orange': 'text-orange-700',
  'indigo': 'text-indigo-700',
}

const moduleConfig = {
  'test-management': {
    name: 'Test Management',
    color: 'blue',
    icon: FileText,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    textLabelColor: 'text-blue-500',
    textNumberColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    darkTextLabelColor: 'dark:text-blue-300',
    darkTextNumberColor: 'dark:text-blue-100',
  },
  'api-testing': {
    name: 'API Testing',
    color: 'green',
    icon: Code,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    textLabelColor: 'text-green-500',
    textNumberColor: 'text-green-700',
    borderColor: 'border-green-200',
    darkTextLabelColor: 'dark:text-green-300',
    darkTextNumberColor: 'dark:text-green-100',
  },
  'automation-hub': {
    name: 'Automation Hub',
    color: 'purple',
    icon: Zap,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    textLabelColor: 'text-purple-500',
    textNumberColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    darkTextLabelColor: 'dark:text-purple-300',
    darkTextNumberColor: 'dark:text-purple-100',
  },
  'security-testing': {
    name: 'Security Testing',
    color: 'red',
    icon: Shield,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    textLabelColor: 'text-red-500',
    textNumberColor: 'text-red-700',
    borderColor: 'border-red-200',
    darkTextLabelColor: 'dark:text-red-300',
    darkTextNumberColor: 'dark:text-red-100',
  },
  'performance-testing': {
    name: 'Performance Testing',
    color: 'orange',
    icon: BarChart3,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    textLabelColor: 'text-orange-500',
    textNumberColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    darkTextLabelColor: 'dark:text-orange-300',
    darkTextNumberColor: 'dark:text-orange-100',
  },
  'mobile-testing': {
    name: 'Mobile Testing',
    color: 'indigo',
    icon: Smartphone,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    textLabelColor: 'text-indigo-500',
    textNumberColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    darkTextLabelColor: 'dark:text-indigo-300',
    darkTextNumberColor: 'dark:text-indigo-100',
  },
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
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (project) {
      setFormData({ name: project.name, description: project.description || '' })
      if (project.settings?.enabled_modules) {
        setEnabledModules(project.settings.enabled_modules)
      }
    }
  }, [project])

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
    if (!projectId) return // Guard against undefined projectId
    try {
      const response = await api.get(`/api/v1/projects/${projectId}`)
      setProject(response.data)
    } catch (error: any) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganisation = async () => {
    if (!uuid) return // Guard against undefined uuid
    try {
      const response = await api.get(`/api/v1/organisations/${uuid}`)
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
    }
  }

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const response = await api.get('/api/v1/organisations/')
      setOrganisations(response.data)
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  const handleSave = async () => {
    try {
      await api.put(`/api/v1/projects/${projectId}`, formData);
      toast.success('Project updated successfully');
      fetchProject(); // Refetch project data to ensure UI consistency
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setEnabledModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleModuleSave = async () => {
    try {
      const newSettings = {
        ...project?.settings,
        enabled_modules: enabledModules,
      };
      await api.put(`/api/v1/projects/${projectId}`, { settings: newSettings });
      toast.success('Modules updated successfully');
      fetchProject(); // Refetch project data
    } catch (error) {
      console.error('Failed to update modules:', error);
      toast.error('Failed to update modules');
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmation('');
  };

  const handleDeleteProject = async () => {
    try {
      await api.delete(`/api/v1/projects/${projectId}`);
      toast.success('Project deleted successfully');
      router.push(`/organizations/${uuid}/projects`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const switchOrganisation = async (org: Organisation) => {
    setOrganisation(org)
    const { setCurrentOrganization } = await import('@/lib/api/session')
    await setCurrentOrganization(org.id)
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
      <aside className="w-64 flex flex-col" style={{ backgroundColor: '#f0fefa' }}>
        {/* Logo Section - CogniTest branding */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              Cogni<span className="text-primary">Test</span>
            </h1>
          </div>
        </div>

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
            {/* Home */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors border-2 ${activeTab === 'overview'
                ? 'bg-primary/10 text-primary font-medium border-gray-400 shadow-lg'
                : 'text-gray-700 hover:bg-gray-100 border-transparent'
                }`}
            >
              <Home className="w-4 h-4 text-blue-500" />
              Home
            </button>

            {/* Module Navigation */}
            {getModuleNavItems().map((item: any) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              // Handle navigation for specific modules
              const handleClick = () => {
                if (item.id === 'test-management') {
                  router.push(`/organizations/${uuid}/projects/${projectId}/test-management`)
                } else if (item.id === 'automation-hub') {
                  router.push(`/organizations/${uuid}/projects/${projectId}/automation-hub`)
                } else {
                  setActiveTab(item.id)
                }
              }

              const moduleItem = moduleConfig[item.id as keyof typeof moduleConfig] as any
              const bgColor = moduleItem?.bgColor || 'bg-primary/10'
              const textColor = moduleItem?.color ? colorToText[moduleItem.color] : 'text-primary'

              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors border-2 ${isActive
                    ? `${bgColor} ${textColor} font-medium border-gray-400 shadow-lg`
                    : 'text-gray-700 hover:bg-gray-100 border-transparent'
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
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors border-2 ${activeTab === 'reports'
                ? 'bg-primary/10 text-primary font-medium border-gray-400 shadow-lg'
                : 'text-gray-700 hover:bg-gray-100 border-transparent'
                }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              Reports & Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border-2 border-transparent">
              <Puzzle className="w-4 h-4 text-pink-600" />
              Integrations
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border-2 border-transparent">
              <Activity className="w-4 h-4 text-teal-600" />
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors border-2 ${activeTab === 'settings'
                ? 'bg-primary/10 text-primary font-medium border-gray-400 shadow-lg'
                : 'text-gray-700 hover:bg-gray-100 border-transparent'
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
        {/* Top Bar with Title and Profile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="h-[80px] px-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'overview'
                  ? 'Overview'
                  : activeTab === 'reports'
                    ? 'Reports & Analytics'
                    : activeTab === 'settings'
                      ? 'Settings'
                      : getModuleNavItems().find((item: any) => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-500">
                {activeTab === 'overview' && 'Project dashboard and metrics'}
                {activeTab === 'reports' && 'Analytics and insights'}
                {activeTab === 'settings' && 'Manage project settings'}
              </p>
            </div>
            <UserNav />
          </div>
        </div>

        {/* Content Area */}
        <div className={activeTab === 'settings' ? 'px-8 py-8' : 'px-8 py-6'}>
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.settings?.enabled_modules?.map(moduleId => {
                  switch (moduleId) {
                    case 'test-management':
                      return <TestManagementOverview key={moduleId} />
                    case 'api-testing':
                      return <ApiTestingOverview key={moduleId} />
                    case 'automation-hub':
                      return <AutomationHubOverview key={moduleId} />
                    case 'security-testing':
                      return <SecurityTestingOverview key={moduleId} />
                    case 'performance-testing':
                      return <PerformanceTestingOverview key={moduleId} />
                    case 'mobile-testing':
                      return <MobileTestingOverview key={moduleId} />
                    default:
                      const module = moduleConfig[moduleId as keyof typeof moduleConfig]
                      if (!module) return null

                      return (
                        <StatsCard
                          key={moduleId}
                          title={module.name}
                          value={0} // Replace with actual data
                          icon={module.icon}
                          iconColor={module.iconColor}
                          iconBgColor={`bg-${module.color}-100`}
                          borderColor={module.borderColor}
                          textLabelColor={`${module.textLabelColor} ${module.darkTextLabelColor}`}
                          textNumberColor={`${module.textNumberColor} ${module.darkTextNumberColor}`}
                        />)
                  }
                })}
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            <ReportsAnalyticsTab />
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
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${settingsTab === 'general'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setSettingsTab('modules')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${settingsTab === 'modules'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Modules
                  </button>
                  <button
                    onClick={() => setSettingsTab('members')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${settingsTab === 'members'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setSettingsTab('danger')}
                    className={`flex-1 px-4 py-2 text-base font-bold rounded-md transition-colors ${settingsTab === 'danger'
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
                            ? formatDateHumanReadable(project.created_at)
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
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <button onClick={handleSave} className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'modules' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Enabled Testing Modules</h3>
                    <p className="text-sm text-gray-600 mb-6">Manage which testing capabilities are enabled for this project</p>
                    <div className="space-y-4">
                      {Object.entries(moduleConfig).map(([moduleId, module]) => (
                        <div key={moduleId} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${module.color}-100 flex items-center justify-center`}>
                              <module.icon className={`w-5 h-5 text-${module.color}-600`} />
                            </div>
                            <h4 className="font-medium text-gray-800">{module.name}</h4>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={enabledModules.includes(moduleId)}
                              onChange={() => handleModuleToggle(moduleId)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button onClick={handleModuleSave} className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm">
                        Save Changes
                      </button>
                    </div>
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
                <div className="space-y-6">
                  <div className="bg-white border border-red-500 rounded-lg p-8">
                    <h3 className="text-xl font-bold text-red-600 mb-4">Delete Project</h3>
                    <p className="text-sm text-gray-600 mb-6">Permanently delete this project, including all associated test plans, test cases, and execution results. This action cannot be undone.</p>
                    <button onClick={openDeleteModal} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-sm">
                      Delete Project
                    </button>
                  </div>

                  <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete the <strong>{project.name}</strong> project.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-700">Please type <strong>{project.name}</strong> to confirm.</p>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <DialogFooter>
                        <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                        <button
                          onClick={handleDeleteProject}
                          disabled={deleteConfirmation !== project.name}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                        >
                          Delete Project
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
