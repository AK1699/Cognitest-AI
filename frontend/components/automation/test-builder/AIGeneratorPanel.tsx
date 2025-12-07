'use client'

import React from 'react'
import { Sparkles, Wand2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TestStep } from './types'
import { browserActions } from './action-configs'

interface AIGeneratorPanelProps {
    aiPrompt: string
    onPromptChange: (prompt: string) => void
    isGenerating: boolean
    generatedSteps: TestStep[]
    generateError: string | null
    onGenerateSteps: () => void
    onAddGeneratedSteps: () => void
}

/**
 * Panel for AI-powered step generation
 */
export function AIGeneratorPanel({
    aiPrompt,
    onPromptChange,
    isGenerating,
    generatedSteps,
    generateError,
    onGenerateSteps,
    onAddGeneratedSteps,
}: AIGeneratorPanelProps) {
    return (
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">AI Generator</h3>
                    <p className="text-[10px] text-gray-500">Describe your test in plain English</p>
                </div>
            </div>

            <textarea
                className="flex-shrink-0 w-full h-24 p-3 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Example: Login with email 'user@test.com' and password 'secret123', then click the dashboard link and verify the page title contains 'Dashboard'"
                value={aiPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                disabled={isGenerating}
            />

            <Button
                className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                onClick={onGenerateSteps}
                disabled={isGenerating || !aiPrompt.trim()}
            >
                {isGenerating ? (
                    <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Steps
                    </>
                )}
            </Button>

            {generateError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    {generateError}
                </div>
            )}

            {/* Generated Steps Preview */}
            {generatedSteps.length > 0 && (
                <div className="mt-3 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">
                            Generated {generatedSteps.length} steps
                        </span>
                        <Button
                            size="sm"
                            onClick={onAddGeneratedSteps}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add All
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {generatedSteps.map((step, index) => {
                            const actionDef = browserActions.find((a) => a.id === step.action)
                            return (
                                <div
                                    key={step.id || index}
                                    className="p-2 bg-purple-50 border border-purple-200 rounded-md text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-purple-900">
                                            {actionDef?.name || step.action}
                                        </span>
                                    </div>
                                    {step.description && (
                                        <p className="text-gray-600 mt-1 ml-7">{step.description}</p>
                                    )}
                                    {step.selector && (
                                        <code className="text-[10px] text-gray-500 ml-7 block mt-1 font-mono">
                                            {step.selector}
                                        </code>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
