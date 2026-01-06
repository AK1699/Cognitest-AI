'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Globe, Play, Mail, Shuffle, Variable, Filter, Circle, Loader2, CheckCircle2, XCircle } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'http-request': Globe,
    'run-test': Play,
    'send-email': Mail,
    'transform': Shuffle,
    'set-variable': Variable,
    'filter': Filter,
}

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || Circle
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
                return selected ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-slate-600 hover:border-slate-500'
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
                {/* Icon with ring */}
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${executionStatus === 'running' ? 'border-amber-400' :
                        executionStatus === 'completed' ? 'border-green-400' :
                            executionStatus === 'failed' ? 'border-red-400' :
                                'border-blue-400'
                    }`}>
                    <Icon className={`w-5 h-5 ${executionStatus === 'running' ? 'text-amber-400' :
                            executionStatus === 'completed' ? 'text-green-400' :
                                executionStatus === 'failed' ? 'text-red-400' :
                                    'text-blue-400'
                        }`} />
                </div>

                {/* Execution status indicator */}
                {executionStatus && executionStatus !== 'pending' && (
                    <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5">
                        {getStatusIndicator()}
                    </div>
                )}

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
                    className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-800 !-left-1.5"
                />

                {/* Output handle - RIGHT side */}
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-800 !-right-1.5"
                />

                {/* Add button indicator (n8n style) */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-4 h-4 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-600 cursor-pointer">
                        <span className="text-xs">+</span>
                    </div>
                </div>
            </div>

            {/* Label below the node */}
            <div className="mt-2 text-center max-w-28">
                <div className="text-xs font-medium text-slate-700 truncate">
                    {data.label || 'Action'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {data.description || data.type?.replace(/-/g, ' ')}
                </div>
            </div>
        </div>
    )
})

ActionNode.displayName = 'ActionNode'

export default ActionNode
