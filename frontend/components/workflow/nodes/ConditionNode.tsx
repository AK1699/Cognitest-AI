'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch, GitMerge, Repeat, Timer, Link2 } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
    'if-condition': GitBranch,
    'switch': GitMerge,
    'loop': Repeat,
    'wait': Timer,
}

export const ConditionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
    const Icon = iconMap[data.type] || GitBranch
    const isSwitch = data.type === 'switch'
    const isLoop = data.type === 'loop'
    const isIfCondition = data.type === 'if-condition'
    const isMerge = data.type === 'merge' || data.type === 'switch'

    // For merge-style nodes (multiple inputs on left)
    if (isMerge) {
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
                            ? 'border-cyan-400 shadow-lg shadow-cyan-500/30'
                            : 'border-slate-600 hover:border-slate-500'
                        }
                    `}
                >
                    {/* Icon */}
                    <Link2 className="w-6 h-6 text-cyan-400" />

                    {/* Multiple input handles on LEFT */}
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="input-1"
                        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-800 !-left-1.5"
                        style={{ top: '30%' }}
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="input-2"
                        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-800 !-left-1.5"
                        style={{ top: '70%' }}
                    />

                    {/* Input labels */}
                    <div className="absolute -left-12 top-[30%] -translate-y-1/2 text-[9px] text-slate-400">
                        Input 1
                    </div>
                    <div className="absolute -left-12 top-[70%] -translate-y-1/2 text-[9px] text-slate-400">
                        Input 2
                    </div>

                    {/* Output handle - RIGHT side */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-800 !-right-1.5"
                    />
                </div>

                {/* Label below */}
                <div className="mt-2 text-center max-w-24">
                    <div className="text-xs font-medium text-slate-700 truncate">
                        {data.label || 'Merge'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                        {data.description || 'combine'}
                    </div>
                </div>
            </div>
        )
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
                    ${selected
                        ? 'border-violet-400 shadow-lg shadow-violet-500/30'
                        : 'border-slate-600 hover:border-slate-500'
                    }
                `}
            >
                {/* Icon with ring for condition nodes */}
                <div className="w-9 h-9 rounded-full border-2 border-violet-400 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-400" />
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
                    className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-800 !-left-1.5"
                />

                {/* Output handles */}
                {isIfCondition ? (
                    <>
                        {/* True output - top right */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="true"
                            className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-800 !-right-1.5"
                            style={{ top: '30%' }}
                        />
                        {/* False output - bottom right */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="false"
                            className="!w-2.5 !h-2.5 !bg-red-400 !border-2 !border-slate-800 !-right-1.5"
                            style={{ top: '70%' }}
                        />
                    </>
                ) : isLoop ? (
                    <>
                        {/* Loop output */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="loop"
                            className="!w-2.5 !h-2.5 !bg-violet-400 !border-2 !border-slate-800 !-right-1.5"
                            style={{ top: '30%' }}
                        />
                        {/* Done output */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="done"
                            className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-800 !-right-1.5"
                            style={{ top: '70%' }}
                        />
                    </>
                ) : (
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-800 !-right-1.5"
                    />
                )}
            </div>

            {/* Label below the node */}
            <div className="mt-2 text-center max-w-24">
                <div className="text-xs font-medium text-slate-700 truncate">
                    {data.label || 'Condition'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                    {data.description || data.type?.replace(/-/g, ' ')}
                </div>
            </div>
        </div>
    )
})

ConditionNode.displayName = 'ConditionNode'

export default ConditionNode
