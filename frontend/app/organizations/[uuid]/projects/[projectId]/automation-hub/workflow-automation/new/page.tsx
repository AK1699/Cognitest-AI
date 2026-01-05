'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder'
import { UserNav } from '@/components/layout/user-nav'
import { Home, ChevronRight } from 'lucide-react'

export default function NewWorkflowPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const orgId = params.uuid as string

    const handleBack = () => {
        router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation`)
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
                    <button
                        onClick={handleBack}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Workflow Automation
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-semibold">New Workflow</span>
                </div>
            </div>

            {/* Workflow Builder */}
            <div className="flex-1 overflow-hidden">
                <WorkflowBuilder
                    projectId={projectId}
                    orgId={orgId}
                    onBack={handleBack}
                />
            </div>
        </div>
    )
}
