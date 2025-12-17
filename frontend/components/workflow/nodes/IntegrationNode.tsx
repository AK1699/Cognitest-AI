'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, FileText, GitBranch, Database, Mail, Globe } from 'lucide-react'

// Integration icons - in production would use actual brand icons
const iconMap: Record<string, React.ComponentType<any>> = {
    'slack': MessageSquare,
    'jira': FileText,
    'github': GitBranch,
    'gitlab': GitBranch,
    'postgresql': Database,
    'mysql': Database,
    'mongodb': Database,
    'email': Mail,
    'google-sheets': FileText,
    'webhook': Globe,
}

// Integration colors
const colorMap: Record<string, string> = {
    'slack': '#4A154B',
    'jira': '#0052CC',
    'github': '#24292e',
    'gitlab': '#FC6D26',
    'postgresql': '#336791',
    'mysql': '#4479A1',
    'mongodb': '#47A248',
    'email': '#EA4335',
    'google-sheets': '#34A853',
    'webhook': '#ec4899',
}

export const IntegrationNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const integrationType = data.type || 'webhook'
    const Icon = iconMap[integrationType] || Globe
    const color = colorMap[integrationType] || '#ec4899'

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[180px]
        bg-zinc-900
        transition-all duration-200
      `}
            style={{
                borderColor: selected ? color : `${color}80`,
                boxShadow: selected ? `0 10px 25px -5px ${color}30` : 'none',
            }}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !border-2 !border-zinc-900"
                style={{ backgroundColor: color }}
            />

            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
                <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: `${color}30` }}
                >
                    <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white truncate">
                        {data.label || getIntegrationName(integrationType)}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                        {integrationType}
                    </div>
                </div>
            </div>

            {/* Config preview based on integration type */}
            {data.config && Object.keys(data.config).length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                    {renderConfigPreview(integrationType, data.config)}
                </div>
            )}

            {/* Description if exists */}
            {data.description && (
                <p className="text-xs text-zinc-400 mt-1 truncate">
                    {data.description}
                </p>
            )}

            {/* Disabled overlay */}
            {data.disabled && (
                <div className="absolute inset-0 bg-zinc-900/80 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-zinc-500">Disabled</span>
                </div>
            )}

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !border-2 !border-zinc-900"
                style={{ backgroundColor: color }}
            />
        </div>
    )
})

function getIntegrationName(type: string): string {
    const names: Record<string, string> = {
        'slack': 'Slack',
        'jira': 'Jira',
        'github': 'GitHub',
        'gitlab': 'GitLab',
        'postgresql': 'PostgreSQL',
        'mysql': 'MySQL',
        'mongodb': 'MongoDB',
        'email': 'Email',
        'google-sheets': 'Google Sheets',
        'webhook': 'Webhook',
    }
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

function renderConfigPreview(type: string, config: Record<string, any>): React.ReactNode {
    switch (type) {
        case 'slack':
            return config.channel ? (
                <div className="text-xs text-zinc-500 truncate">
                    Channel: <span className="text-pink-400">{config.channel}</span>
                </div>
            ) : null

        case 'jira':
            return (
                <div className="text-xs text-zinc-500 truncate">
                    {config.action && <span className="text-blue-400">{config.action}</span>}
                    {config.project && <span> in {config.project}</span>}
                </div>
            )

        case 'github':
            return (
                <div className="text-xs text-zinc-500 truncate">
                    {config.owner && config.repo && (
                        <span>{config.owner}/{config.repo}</span>
                    )}
                </div>
            )

        case 'postgresql':
        case 'mysql':
        case 'mongodb':
            return config.query ? (
                <div className="text-xs text-zinc-500 font-mono truncate">
                    {config.query.substring(0, 30)}...
                </div>
            ) : null

        case 'email':
            return config.to ? (
                <div className="text-xs text-zinc-500 truncate">
                    To: {config.to}
                </div>
            ) : null

        default:
            return null
    }
}

IntegrationNode.displayName = 'IntegrationNode'

export default IntegrationNode
