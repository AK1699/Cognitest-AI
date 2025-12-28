'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PlayCircle, Clock, Webhook, CheckCircle, Zap } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'manual-trigger': PlayCircle,
    'schedule-trigger': Clock,
    'webhook-trigger': Webhook,
    'test-completion': CheckCircle,
}

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || Zap

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
                        ? 'border-emerald-400 shadow-lg shadow-emerald-500/30'
                        : 'border-slate-600 hover:border-slate-500'
                    }
                `}
            >
                {/* Lightning bolt indicator for trigger */}
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 rounded-md flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-white" />
                </div>

                {/* Icon with ring */}
                <div className="w-9 h-9 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-400" />
                </div>

                {/* Disabled overlay */}
                {data.disabled && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] text-slate-500">Off</span>
                    </div>
                )}

                {/* Output handle - RIGHT side (horizontal flow) */}
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-800 !-right-1.5"
                />
            </div>

            {/* Label below the node */}
            <div className="mt-2 text-center max-w-24">
                <div className="text-xs font-medium text-slate-700 truncate">
                    {data.label || 'Execute'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {data.description || data.type?.replace(/-/g, ' ')}
                </div>
            </div>
        </div>
    )
})

TriggerNode.displayName = 'TriggerNode'

export default TriggerNode
