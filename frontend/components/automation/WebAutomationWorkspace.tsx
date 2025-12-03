'use client'

import React, { useState } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import {
  Home,
  ChevronRight,
  LayoutGrid,
  FlaskConical,
  MonitorPlay,
  FileText,
  Activity
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import TestExplorerTab from './TestExplorerTab'
import TestBuilderTab from './TestBuilderTab'
import LiveBrowserTab from './LiveBrowserTab'
import LogsTab from './LogsTab'
import AISelfHealTab from './AISelfHealTab'

interface WebAutomationWorkspaceProps {
  projectId: string
  flowId?: string
}

type TabView = 'explorer' | 'builder' | 'browser' | 'logs' | 'heal'

export default function WebAutomationWorkspace({ projectId, flowId }: WebAutomationWorkspaceProps) {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState<TabView>('explorer')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'explorer':
        return <TestExplorerTab />
      case 'builder':
        return <TestBuilderTab />
      case 'browser':
        return <LiveBrowserTab />
      case 'logs':
        return <LogsTab />
      case 'heal':
        return <AISelfHealTab />
      default:
        return <TestExplorerTab />
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
        <div className="px-6 py-3">
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  )
}
