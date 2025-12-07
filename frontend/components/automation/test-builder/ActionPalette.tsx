'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ActionConfig } from './types'
import { actionCategories } from './action-configs'

interface ActionPaletteProps {
    onAddStep: (actionType: string) => void
}

/**
 * Left panel action library showing all available test actions
 */
export function ActionPalette({ onAddStep }: ActionPaletteProps) {
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {actionCategories.map((category) => (
                <div key={category.name}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
                        {category.name}
                    </h3>
                    <div className="space-y-1.5">
                        {category.actions.map((action) => (
                            <ActionButton
                                key={action.id}
                                action={action}
                                onClick={() => onAddStep(action.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

interface ActionButtonProps {
    action: ActionConfig
    onClick: () => void
}

function ActionButton({ action, onClick }: ActionButtonProps) {
    const Icon = action.icon

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all group text-left"
        >
            <div className={`${action.color} p-1.5 rounded text-white flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900">{action.name}</div>
                <div className="text-[10px] text-gray-500 truncate">{action.description}</div>
            </div>
        </button>
    )
}

interface ActionPaletteHeaderProps {
    searchQuery?: string
    onSearchChange?: (query: string) => void
}

export function ActionPaletteHeader({ searchQuery, onSearchChange }: ActionPaletteHeaderProps) {
    return (
        <>
            <h2 className="text-sm font-bold text-gray-900 mb-2">Action Library</h2>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                    placeholder="Search actions..."
                    className="pl-8 h-8 text-xs"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                />
            </div>
        </>
    )
}
