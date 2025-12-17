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
        bg-white shadow-sm
        ${selected ? 'border-purple-500 shadow-lg shadow-purple-200' : 'border-purple-400'}
        transition-all duration-200
      `}
        >
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
            />

            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-purple-100">
                    <Icon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                        {data.label || 'Condition'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                        {data.type}
                    </div>
                </div>
            </div>

            {/* Condition preview */}
            {data.config?.condition && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 font-mono truncate">
                        {data.config.condition}
                    </div>
                </div>
            )}

            {/* Wait duration preview */}
            {data.type === 'wait' && data.config?.duration && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                        Wait {data.config.duration}s
                    </div>
                </div>
            )}

            {/* Description if exists */}
            {data.description && !data.config?.condition && (
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

            {/* Output handles - IF has true/false, others have single output */}
            {data.type === 'if-condition' ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
                        style={{ left: '30%' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
                        style={{ left: '70%' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[10px] text-gray-400 translate-y-4">
                        <span className="text-green-600">True</span>
                        <span className="text-red-500">False</span>
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
                            className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white"
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
                        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
                        style={{ left: '30%' }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="done"
                        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
                        style={{ left: '70%' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[10px] text-gray-400 translate-y-4">
                        <span className="text-purple-600">Loop</span>
                        <span className="text-green-600">Done</span>
                    </div>
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
                />
            )}
        </div>
    )
})

ConditionNode.displayName = 'ConditionNode'

export default ConditionNode
