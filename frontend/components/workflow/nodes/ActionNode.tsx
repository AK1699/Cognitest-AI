'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Globe, Play, Mail, Shuffle, Variable, Filter } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'http-request': Globe,
    'run-test': Play,
    'send-email': Mail,
    'transform': Shuffle,
    'set-variable': Variable,
    'filter': Filter,
}

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || Play

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[180px]
        bg-zinc-900
        ${selected ? 'border-blue-400 shadow-lg shadow-blue-400/20' : 'border-blue-500/50'}
        transition-all duration-200
      `}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-blue-400 !border-2 !border-zinc-900"
            />

            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-blue-500/20">
                    <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white truncate">
                        {data.label || 'Action'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                        {data.type}
                    </div>
                </div>
            </div>

            {/* Description if exists */}
            {data.description && (
                <p className="text-xs text-zinc-400 mt-1 truncate">
                    {data.description}
                </p>
            )}

            {/* Config preview */}
            {data.config && Object.keys(data.config).length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                    {data.type === 'http-request' && data.config.url && (
                        <div className="text-xs text-zinc-500 truncate">
                            <span className="text-blue-400">{data.config.method || 'GET'}</span> {data.config.url}
                        </div>
                    )}
                    {data.type === 'run-test' && data.config.test_flow_id && (
                        <div className="text-xs text-zinc-500 truncate">
                            Test: {data.config.test_flow_id}
                        </div>
                    )}
                </div>
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
                className="!w-3 !h-3 !bg-blue-400 !border-2 !border-zinc-900"
            />
        </div>
    )
})

ActionNode.displayName = 'ActionNode'

export default ActionNode
