'use client'

import React, { useState, useEffect } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import {
  Home,
  ChevronRight,
  LayoutGrid,
  FlaskConical,
  MonitorPlay,
  FileText,
  Activity,
  Settings,
  Plus,
  Check,
  FolderOpen
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { projectsApi, ProjectSettings } from '@/lib/api/projects'
import { getSelectedEnvironment, setSelectedEnvironment } from '@/lib/api/session'
import TestExplorerTab from './TestExplorerTab'
import TestBuilderTab from './test-builder'
import LiveBrowserTab from './LiveBrowserTab'
import LogsTab from './LogsTab'
import AISelfHealTab from './AISelfHealTab'
import ArtifactsTab from './ArtifactsTab'
import { Environment, EnvironmentManager } from './EnvironmentManager'

interface WebAutomationWorkspaceProps {
  projectId: string
  flowId?: string // Optional: for deep linking to a specific flow
}

type TabView = 'explorer' | 'builder' | 'browser' | 'logs' | 'artifacts' | 'heal'

export default function WebAutomationWorkspace({ projectId, flowId }: WebAutomationWorkspaceProps) {
  const router = useRouter()
  const params = useParams() // Get full params including uuid
  const [activeTab, setActiveTab] = useState<TabView>(flowId ? 'builder' : 'explorer')
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(flowId || null)

  // Environment State
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('')
  const [showEnvManager, setShowEnvManager] = useState(false)
  const [loadingVars, setLoadingVars] = useState(false)

  const selectedEnvironment = environments.find(e => e.id === selectedEnvironmentId)

  // Fetch Environments
  useEffect(() => {
    const fetchProjectSettings = async () => {
      if (!projectId) return
      try {
        setLoadingVars(true)
        const project = await projectsApi.getProject(projectId)
        if (project.settings?.environments && project.settings.environments.length > 0) {
          setEnvironments(project.settings.environments)
          // Restore selected env from server-side session or default to first
          const savedEnvId = await getSelectedEnvironment(projectId)
          if (savedEnvId && project.settings.environments.some(e => e.id === savedEnvId)) {
            setSelectedEnvironmentId(savedEnvId)
          } else {
            setSelectedEnvironmentId(project.settings.environments[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch project settings:', error)
      } finally {
        setLoadingVars(false)
      }
    }
    fetchProjectSettings()
  }, [projectId])

  // Save selected env to server-side session
  useEffect(() => {
    if (selectedEnvironmentId && projectId) {
      setSelectedEnvironment(projectId, selectedEnvironmentId)
    }
  }, [selectedEnvironmentId, projectId])

  const handleSaveEnvironments = async (newEnvironments: Environment[]) => {
    setEnvironments(newEnvironments)
    if (!projectId) return

    try {
      const project = await projectsApi.getProject(projectId)
      const updatedSettings: ProjectSettings = {
        ...project.settings,
        environments: newEnvironments
      }
      await projectsApi.updateProject(projectId, { settings: updatedSettings })

      // If currently selected env was deleted, select another one
      if (selectedEnvironmentId && !newEnvironments.find(e => e.id === selectedEnvironmentId)) {
        setSelectedEnvironmentId(newEnvironments[0]?.id || '')
      }
    } catch (error) {
      console.error('Failed to save environments:', error)
    }
  }

  // Handler for editing a test - switch to builder tab with selected flow
  const handleEditTest = (flowId: string) => {
    setSelectedFlowId(flowId)
    setActiveTab('builder')
  }

  // Handler for running test in Live Browser (headed mode)
  const [testToRun, setTestToRun] = useState<{ flowId: string, testName: string } | null>(null)

  const handleRunInBrowser = (flowId: string, testName: string) => {
    setTestToRun({ flowId, testName })
    setActiveTab('browser')
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'explorer':
        return <TestExplorerTab onEditTest={handleEditTest} onRunInBrowser={handleRunInBrowser} />
      case 'builder':
        // @ts-ignore - We'll update TestBuilderTab types in the next step
        return <TestBuilderTab selectedEnvironment={selectedEnvironment} flowId={selectedFlowId} projectId={projectId} />
      case 'browser':
        return <LiveBrowserTab projectId={projectId} testToRun={testToRun} onTestComplete={() => setTestToRun(null)} />
      case 'logs':
        return <LogsTab projectId={projectId} />
      case 'artifacts':
        return <ArtifactsTab projectId={projectId} />
      case 'heal':
        return <AISelfHealTab projectId={projectId} />
      default:
        return <TestExplorerTab onEditTest={handleEditTest} onRunInBrowser={handleRunInBrowser} />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white w-full">
      {/* Top Bar with Profile */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-end">
            <UserNav />
          </div>
        </div>
      </div>

      {/* Breadcrumbs Bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push(`/organizations/${params.uuid}/projects/${projectId}`)}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push(`/organizations/${params.uuid}/projects/${projectId}/automation-hub`)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Automation Hub
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Web Automation</span>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'explorer'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Test Explorer
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'builder'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <FlaskConical className="w-4 h-4" />
              Test Builder
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'browser'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <MonitorPlay className="w-4 h-4" />
              Live Browser
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'logs'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <FileText className="w-4 h-4" />
              Logs
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'artifacts'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <FolderOpen className="w-4 h-4" />
              Artifacts
            </button>
            <button
              onClick={() => setActiveTab('heal')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'heal'
                ? 'text-blue-700 bg-white border-b-2 border-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-blue-700 hover:bg-white/50'
                }`}
            >
              <Activity className="w-4 h-4" />
              AI Self Heal
            </button>
          </div>

          {/* Environment Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Environment:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 border-dashed ${!selectedEnvironment ? 'text-gray-500' : 'text-blue-600 border-blue-200 bg-blue-50'}`}
                >
                  {selectedEnvironment ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {selectedEnvironment.name}
                    </span>
                  ) : (
                    "No Environment"
                  )}
                  <ChevronRight className="w-3 h-3 ml-2 rotate-90 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Select Environment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {environments.map(env => (
                  <DropdownMenuItem
                    key={env.id}
                    onClick={() => setSelectedEnvironmentId(env.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{env.name}</span>
                    {selectedEnvironmentId === env.id && <Check className="w-4 h-4 text-blue-600" />}
                  </DropdownMenuItem>
                ))}
                {environments.length === 0 && (
                  <div className="p-2 text-xs text-gray-500 text-center italic">No environments created</div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEnvManager(true)} className="cursor-pointer text-blue-600 focus:text-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Environments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>

      <EnvironmentManager
        open={showEnvManager}
        onOpenChange={setShowEnvManager}
        environments={environments}
        onSave={handleSaveEnvironments}
      />
    </div>
  )
}
