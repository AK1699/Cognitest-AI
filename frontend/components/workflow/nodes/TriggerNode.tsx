'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PlayCircle, Clock, Webhook, CheckCircle } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'manual-trigger': PlayCircle,
    'schedule-trigger': Clock,
    'webhook-trigger': Webhook,
    'test-completion': CheckCircle,
}

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || PlayCircle

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[180px]
        bg-white shadow-sm
        ${selected ? 'border-green-500 shadow-lg shadow-green-200' : 'border-green-400'}
        transition-all duration-200
      `}
        >
            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-green-100">
                    <Icon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                        {data.label || 'Trigger'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                        {data.type}
                    </div>
                </div>
            </div>

            {/* Description if exists */}
            {data.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                    {data.description}
                </p>
            )}

            {/* Disabled overlay */}
            {data.disabled && (
                <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400">Disabled</span>
                </div>
            )}

            {/* Output handle - triggers only have output */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
            />
        </div>
    )
})

TriggerNode.displayName = 'TriggerNode'

export default TriggerNode
