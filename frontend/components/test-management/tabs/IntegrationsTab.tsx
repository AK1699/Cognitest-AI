'use client'

import { useState, useEffect } from 'react'
import { Link2, Settings, CheckCircle, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

interface IntegrationsTabProps {
    projectId: string
    organisationId: string
}

interface Integration {
    id: string
    name: string
    type: string
    description: string
    connected: boolean
    icon: string
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
    {
        id: 'jira',
        name: 'Jira',
        type: 'issue_tracker',
        description: 'Sync issues with Jira projects',
        connected: false,
        icon: '🔷',
    },
    {
        id: 'github',
        name: 'GitHub',
        type: 'source_control',
        description: 'Link issues to GitHub PRs',
        connected: false,
        icon: '🐙',
    },
    {
        id: 'slack',
        name: 'Slack',
        type: 'notification',
        description: 'Get notifications in Slack',
        connected: false,
        icon: '💬',
    },
    {
        id: 'testrail',
        name: 'TestRail',
        type: 'test_management',
        description: 'Sync with TestRail',
        connected: false,
        icon: '🧪',
    },
]

export default function IntegrationsTab({ projectId, organisationId }: IntegrationsTabProps) {
    const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS)
    const [loading, setLoading] = useState(false)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
                <p className="text-sm text-gray-500">Connect with your favorite tools to enhance your workflow</p>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-2 gap-4">
                {integrations.map((integration) => (
                    <div
                        key={integration.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary/50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{integration.icon}</div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                                    <p className="text-sm text-gray-500">{integration.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {integration.connected ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        <XCircle className="w-3 h-3" />
                                        Not Connected
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            {integration.connected ? (
                                <>
                                    <button className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                        Configure
                                    </button>
                                    <button className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    <Link2 className="w-4 h-4" />
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-medium text-blue-900">Need a different integration?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Contact your administrator to request additional integrations or use our API to build custom connections.
                    </p>
                </div>
            </div>
        </div>
    )
}
