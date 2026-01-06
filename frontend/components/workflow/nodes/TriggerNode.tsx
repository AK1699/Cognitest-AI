'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PlayCircle, Clock, Webhook, CheckCircle, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'manual-trigger': PlayCircle,
    'schedule-trigger': Clock,
    'webhook-trigger': Webhook,
    'test-completion': CheckCircle,
}

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || Zap
    const executionStatus = data.executionStatus // 'running' | 'completed' | 'failed' | 'pending' | undefined

    // Execution status colors
    const getStatusStyles = () => {
        switch (executionStatus) {
            case 'running':
                return 'border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse'
            case 'completed':
                return 'border-green-400 shadow-lg shadow-green-500/30'
            case 'failed':
                return 'border-red-400 shadow-lg shadow-red-500/30'
            case 'pending':
                return 'border-slate-500'
            default:
                return selected ? 'border-emerald-400 shadow-lg shadow-emerald-500/30' : 'border-slate-600 hover:border-slate-500'
        }
    }

    const getStatusIndicator = () => {
        switch (executionStatus) {
            case 'running':
                return <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
            case 'completed':
                return <CheckCircle2 className="w-3 h-3 text-green-400" />
            case 'failed':
                return <XCircle className="w-3 h-3 text-red-400" />
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col items-center">
            {/* Main Node - Square with centered icon */}
            <div
                className={`
                    relative w-14 h-14 rounded-xl
                    bg-slate-800 border-2
                    flex items-center justify-center
                    transition-all duration-200
                    ${getStatusStyles()}
                `}
            >
                {/* Lightning bolt indicator for trigger */}
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 rounded-md flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-white" />
                </div>

                {/* Execution status indicator */}
                {executionStatus && executionStatus !== 'pending' && (
                    <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5">
                        {getStatusIndicator()}
                    </div>
                )}

                {/* Icon with ring */}
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${executionStatus === 'running' ? 'border-amber-400' :
                        executionStatus === 'completed' ? 'border-green-400' :
                            executionStatus === 'failed' ? 'border-red-400' :
                                'border-emerald-400'
                    }`}>
                    <Icon className={`w-5 h-5 ${executionStatus === 'running' ? 'text-amber-400' :
                            executionStatus === 'completed' ? 'text-green-400' :
                                executionStatus === 'failed' ? 'text-red-400' :
                                    'text-emerald-400'
                        }`} />
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
