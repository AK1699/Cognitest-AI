'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, FileText, GitBranch, Database, Mail, Globe, Circle } from 'lucide-react'

// Integration icons
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
    'send-email': Mail,
}

// Integration colors (for the ring)
const colorMap: Record<string, { ring: string, text: string }> = {
    'slack': { ring: 'border-purple-400', text: 'text-purple-400' },
    'jira': { ring: 'border-blue-500', text: 'text-blue-500' },
    'github': { ring: 'border-slate-400', text: 'text-slate-400' },
    'gitlab': { ring: 'border-orange-400', text: 'text-orange-400' },
    'postgresql': { ring: 'border-blue-400', text: 'text-blue-400' },
    'mysql': { ring: 'border-sky-400', text: 'text-sky-400' },
    'mongodb': { ring: 'border-green-400', text: 'text-green-400' },
    'email': { ring: 'border-red-400', text: 'text-red-400' },
    'send-email': { ring: 'border-blue-400', text: 'text-blue-400' },
    'google-sheets': { ring: 'border-green-500', text: 'text-green-500' },
    'webhook': { ring: 'border-pink-400', text: 'text-pink-400' },
}

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
        'send-email': 'Send Email',
        'google-sheets': 'Google Sheets',
        'webhook': 'Webhook',
    }
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
}

export const IntegrationNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const integrationType = data.type || 'webhook'
    const Icon = iconMap[integrationType] || Circle
    const colors = colorMap[integrationType] || { ring: 'border-pink-400', text: 'text-pink-400' }

    return (
        <div className="flex flex-col items-center">
            {/* Main Node - Square with centered icon */}
            <div
                className={`
                    relative w-14 h-14 rounded-xl
                    bg-slate-800 border-2
                    flex items-center justify-center
                    transition-all duration-200
                    ${selected
                        ? `${colors.ring} shadow-lg shadow-pink-500/30`
                        : 'border-slate-600 hover:border-slate-500'
                    }
                `}
            >
                {/* Icon with colored ring */}
                <div className={`w-9 h-9 rounded-full border-2 ${colors.ring} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>

                {/* "+" indicator for the last node (n8n style) */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden group-hover:flex">
                    <div className="w-4 h-4 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-600 cursor-pointer">
                        <span className="text-xs leading-none">+</span>
                    </div>
                </div>

                {/* Disabled overlay */}
                {data.disabled && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-slate-500">Off</span>
                    </div>
                )}

                {/* Input handle - LEFT side */}
                <Handle
                    type="target"
                    position={Position.Left}
                    className={`!w-3 !h-3 !border-2 !border-slate-800 !-left-1.5 !bg-pink-400`}
                />

                {/* Output handle - RIGHT side */}
                <Handle
                    type="source"
                    position={Position.Right}
                    className={`!w-3 !h-3 !border-2 !border-slate-800 !-right-1.5 !bg-pink-400`}
                />
            </div>

            {/* Label below the node */}
            <div className="mt-2 text-center max-w-28">
                <div className="text-xs font-medium text-slate-700 truncate">
                    {data.label || getIntegrationName(integrationType)}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {data.description || integrationType.replace(/-/g, ' ')}
                </div>
            </div>
        </div>
    )
})

IntegrationNode.displayName = 'IntegrationNode'

export default IntegrationNode
