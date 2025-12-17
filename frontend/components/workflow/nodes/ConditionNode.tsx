'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch, GitMerge, Repeat, Timer } from 'lucide-react'

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

    return (
        <div
            className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[180px]
        bg-zinc-900
        ${selected ? 'border-purple-400 shadow-lg shadow-purple-400/20' : 'border-purple-500/50'}
        transition-all duration-200
      `}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-purple-400 !border-2 !border-zinc-900"
            />

            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-purple-500/20">
                    <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white truncate">
                        {data.label || 'Condition'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                        {data.type}
                    </div>
                </div>
            </div>

            {/* Condition preview */}
            {data.config?.condition && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 font-mono truncate">
                        {data.config.condition}
                    </div>
                </div>
            )}

            {/* Wait duration preview */}
            {data.type === 'wait' && data.config?.duration && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500">
                        Wait {data.config.duration}s
                    </div>
                </div>
            )}

            {/* Description if exists */}
            {data.description && !data.config?.condition && (
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

            {/* Output handles - IF has true/false, others have single output */}
            {data.type === 'if-condition' ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        className="!w-3 !h-3 !bg-green-400 !border-2 !border-zinc-900"
                        style={{ left: '30%' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        className="!w-3 !h-3 !bg-red-400 !border-2 !border-zinc-900"
                        style={{ left: '70%' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[10px] text-zinc-500 translate-y-4">
                        <span className="text-green-400">True</span>
                        <span className="text-red-400">False</span>
                    </div>
                </>
            ) : isSwitch ? (
                <>
                    {[1, 2, 3, 4].map((i) => (
                        <Handle
                            key={i}
                            type="source"
                            position={Position.Bottom}
                            id={`case-${i}`}
                            className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-zinc-900"
                            style={{ left: `${20 + (i - 1) * 20}%` }}
                        />
                    ))}
                </>
            ) : isLoop ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="loop"
                        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-zinc-900"
                        style={{ left: '30%' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="done"
                        className="!w-3 !h-3 !bg-green-400 !border-2 !border-zinc-900"
                        style={{ left: '70%' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[10px] text-zinc-500 translate-y-4">
                        <span className="text-purple-400">Loop</span>
                        <span className="text-green-400">Done</span>
                    </div>
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-3 !h-3 !bg-purple-400 !border-2 !border-zinc-900"
                />
            )}
        </div>
    )
})

ConditionNode.displayName = 'ConditionNode'

export default ConditionNode
