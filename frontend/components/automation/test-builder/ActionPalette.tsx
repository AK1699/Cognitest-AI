'use client'

import React, { useState } from 'react'
import { Search, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ActionConfig } from './types'
import { actionCategories } from './action-configs'
import { SnippetManager } from './SnippetManager'

interface ActionPaletteProps {
    onAddStep: (actionType: string) => void
    projectId?: string
    showSnippetManager?: boolean
    onSnippetManagerChange?: (open: boolean) => void
    searchQuery?: string
}

/**
 * Left panel action library showing all available test actions
 */
export function ActionPalette({ onAddStep, projectId, showSnippetManager = false, onSnippetManagerChange, searchQuery = '' }: ActionPaletteProps) {
    // Filter actions based on search query
    const filteredCategories = searchQuery
        ? actionCategories.map(category => ({
            ...category,
            actions: category.actions.filter(action =>
                action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                action.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(category => category.actions.length > 0)
        : actionCategories

    return (
        <>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No actions found for "{searchQuery}"
                    </div>
                ) : (
                    filteredCategories.map((category) => (
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
                    ))
                )}
            </div>

            {/* Snippet Manager Dialog */}
            {projectId && onSnippetManagerChange && (
                <SnippetManager
                    open={showSnippetManager}
                    onOpenChange={onSnippetManagerChange}
                    projectId={projectId}
                />
            )}
        </>
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
    onSnippetManagerClick?: () => void
}

export function ActionPaletteHeader({ searchQuery, onSearchChange, onSnippetManagerClick }: ActionPaletteHeaderProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Action Library</h2>
                {onSnippetManagerClick && (
                    <button
                        onClick={onSnippetManagerClick}
                        className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                    >
                        <Settings className="w-3 h-3" />
                        Manage
                    </button>
                )}
            </div>
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

