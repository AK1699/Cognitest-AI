'use client'

import React, { useState, useEffect } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import {
    Home,
    ChevronRight,
    LayoutGrid,
    FlaskConical,
    FileText,
    Settings,
    Plus,
    Check,
    Video,
    Camera,
    Wand2,
} from 'lucide-react'
import { CircuitLogoIcon } from '@/components/ui/CircuitLogoIcon'
import { useRouter, useParams } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { projectsApi, ProjectSettings } from '@/lib/api/projects'
import { getSelectedEnvironment, setSelectedEnvironment } from '@/lib/api/session'
import WorkflowExplorerTab from './WorkflowExplorerTab'
import WorkflowBuilder from './WorkflowBuilder'
import { Environment, EnvironmentManager } from '../automation/EnvironmentManager'
import { WorkflowSummary } from '@/lib/api/workflow'

interface WorkflowAutomationWorkspaceProps {
    projectId: string
    workflowId?: string
}

type TabView = 'explorer' | 'builder' | 'logs'

export default function WorkflowAutomationWorkspace({ projectId, workflowId }: WorkflowAutomationWorkspaceProps) {
    const router = useRouter()
    const params = useParams()
    const orgId = params.uuid as string
    const [activeTab, setActiveTab] = useState<TabView>(workflowId ? 'builder' : 'explorer')
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(workflowId || null)

    // Environment State
    const [environments, setEnvironments] = useState<Environment[]>([])
    const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('')
    const [showEnvManager, setShowEnvManager] = useState(false)
    const [loadingVars, setLoadingVars] = useState(false)

    // Execution Settings State
    const [executionSettings, setExecutionSettings] = useState({
        videoRecording: true,
        screenshotOnFailure: true,
        screenshotEachStep: false,
        aiSelfHeal: true
    })

    const selectedEnvironment = environments.find(e => e.id === selectedEnvironmentId)

    // Fetch Environments and Execution Settings
    useEffect(() => {
        const fetchProjectSettings = async () => {
            if (!projectId) return
            try {
                setLoadingVars(true)
                const project = await projectsApi.getProject(projectId)
                if (project.settings?.environments && project.settings.environments.length > 0) {
                    setEnvironments(project.settings.environments)
                    const savedEnvId = await getSelectedEnvironment(projectId)
                    if (savedEnvId && project.settings.environments.some(e => e.id === savedEnvId)) {
                        setSelectedEnvironmentId(savedEnvId)
                    } else {
                        setSelectedEnvironmentId(project.settings.environments[0].id)
                    }
                }
                if (project.settings?.executionSettings) {
                    setExecutionSettings(prev => ({
                        ...prev,
                        ...project.settings.executionSettings
                    }))
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

    // Save execution settings to project
    const saveExecutionSettings = async (newSettings: typeof executionSettings) => {
        setExecutionSettings(newSettings)
        if (!projectId) return

        try {
            const project = await projectsApi.getProject(projectId)
            const updatedSettings: ProjectSettings = {
                ...project.settings,
                executionSettings: newSettings
            }
            await projectsApi.updateProject(projectId, { settings: updatedSettings })
        } catch (error) {
            console.error('Failed to save execution settings:', error)
        }
    }

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

            if (selectedEnvironmentId && !newEnvironments.find(e => e.id === selectedEnvironmentId)) {
                setSelectedEnvironmentId(newEnvironments[0]?.id || '')
            }
        } catch (error) {
            console.error('Failed to save environments:', error)
        }
    }

    const handleEditWorkflow = (workflowId: string) => {
        setSelectedWorkflowId(workflowId)
        setActiveTab('builder')
    }

    const handleBackFromBuilder = () => {
        setSelectedWorkflowId(null)
        setActiveTab('explorer')
    }

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'explorer':
                return (
                    <WorkflowExplorerTab
                        onEditWorkflow={handleEditWorkflow}
                        onSelectWorkflow={(workflow: WorkflowSummary | null) => { }}
                    />
                )
            case 'builder':
                return (
                    <WorkflowBuilder
                        workflowId={selectedWorkflowId || undefined}
                        projectId={projectId}
                        orgId={orgId}
                        onBack={handleBackFromBuilder}
                    />
                )
            case 'logs':
                return (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Workflow execution logs will appear here</p>
                        </div>
                    </div>
                )
            default:
                return <WorkflowExplorerTab onEditWorkflow={handleEditWorkflow} />
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white w-full">
            {/* Top Bar with Logo and Profile */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CircuitLogoIcon className="w-8 h-8" />
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            Cogni<span className="text-primary">Test</span>
                        </h1>
                    </div>
                    <UserNav />
                </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}`)}
                        className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                        onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub`)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Automation Hub
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">Workflow Automation</span>
                </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="border-b border-gray-300 bg-gradient-to-r from-slate-50 via-gray-50 to-stone-50">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveTab('explorer')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'explorer'
                                ? 'text-purple-700 bg-white border-b-2 border-purple-700 shadow-sm'
                                : 'text-gray-600 hover:text-purple-700 hover:bg-white/50'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Workflow Explorer
                        </button>
                        <button
                            onClick={() => setActiveTab('builder')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'builder'
                                ? 'text-purple-700 bg-white border-b-2 border-purple-700 shadow-sm'
                                : 'text-gray-600 hover:text-purple-700 hover:bg-white/50'
                                }`}
                        >
                            <FlaskConical className="w-4 h-4" />
                            Workflow Builder
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'logs'
                                ? 'text-purple-700 bg-white border-b-2 border-purple-700 shadow-sm'
                                : 'text-gray-600 hover:text-purple-700 hover:bg-white/50'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Logs
                        </button>
                    </div>

                    {/* Settings & Environment Selector */}
                    <div className="flex items-center gap-3">
                        {/* Settings Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 border-gray-200 hover:bg-gray-50"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Execution Settings</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4 text-gray-500" />
                                                <Label htmlFor="video-recording" className="text-sm font-medium cursor-pointer">
                                                    Video Recording
                                                </Label>
                                            </div>
                                            <Switch
                                                id="video-recording"
                                                checked={executionSettings.videoRecording}
                                                onCheckedChange={(checked) =>
                                                    saveExecutionSettings({ ...executionSettings, videoRecording: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-gray-500" />
                                                <Label htmlFor="screenshot-failure" className="text-sm font-medium cursor-pointer">
                                                    Screenshot on Failure
                                                </Label>
                                            </div>
                                            <Switch
                                                id="screenshot-failure"
                                                checked={executionSettings.screenshotOnFailure}
                                                onCheckedChange={(checked) =>
                                                    saveExecutionSettings({ ...executionSettings, screenshotOnFailure: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-gray-500" />
                                                <Label htmlFor="screenshot-step" className="text-sm font-medium cursor-pointer">
                                                    Screenshot Each Step
                                                </Label>
                                            </div>
                                            <Switch
                                                id="screenshot-step"
                                                checked={executionSettings.screenshotEachStep}
                                                onCheckedChange={(checked) =>
                                                    saveExecutionSettings({ ...executionSettings, screenshotEachStep: checked })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wand2 className="w-4 h-4 text-gray-500" />
                                                <Label htmlFor="ai-self-heal" className="text-sm font-medium cursor-pointer">
                                                    AI Self-Heal
                                                </Label>
                                            </div>
                                            <Switch
                                                id="ai-self-heal"
                                                checked={executionSettings.aiSelfHeal}
                                                onCheckedChange={(checked) =>
                                                    saveExecutionSettings({ ...executionSettings, aiSelfHeal: checked })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        These settings apply to all workflow executions in this project.
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Environment Dropdown */}
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Environment:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-8 border-dashed ${!selectedEnvironment ? 'text-gray-500' : 'text-purple-600 border-purple-200 bg-purple-50'}`}
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
                                        {selectedEnvironmentId === env.id && <Check className="w-4 h-4 text-purple-600" />}
                                    </DropdownMenuItem>
                                ))}
                                {environments.length === 0 && (
                                    <div className="p-2 text-xs text-gray-500 text-center italic">No environments created</div>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setShowEnvManager(true)} className="cursor-pointer text-purple-600 focus:text-purple-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Manage Environments
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 w-full overflow-hidden">
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
