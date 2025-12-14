'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
    FunctionSquare,
    Plus,
    Trash2,
    Check,
    Loader2,
} from 'lucide-react'
import { TestStep, SnippetParameter } from './types'
import { snippetApi } from '@/lib/api/webAutomation'
import { toast } from 'sonner'
import { getActionConfig } from './action-configs'

interface CreateSnippetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedSteps: TestStep[]
    projectId: string
    onCreated?: (snippetId: string) => void
}

/**
 * Dialog for creating a new snippet from selected test steps
 * Allows users to name the snippet, add parameters, and configure settings
 */
export function CreateSnippetDialog({
    open,
    onOpenChange,
    selectedSteps,
    projectId,
    onCreated,
}: CreateSnippetDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [parameters, setParameters] = useState<SnippetParameter[]>([])
    const [newParamName, setNewParamName] = useState('')
    const [isGlobal, setIsGlobal] = useState(false)
    const [saving, setSaving] = useState(false)

    const resetForm = () => {
        setName('')
        setDescription('')
        setParameters([])
        setNewParamName('')
        setIsGlobal(false)
    }

    const addParameter = () => {
        if (!newParamName.trim()) return
        if (parameters.some(p => p.name === newParamName.trim())) {
            toast.error('Parameter name already exists')
            return
        }
        setParameters([
            ...parameters,
            { name: newParamName.trim(), type: 'string', default: '', description: '' }
        ])
        setNewParamName('')
    }

    const removeParameter = (paramName: string) => {
        setParameters(parameters.filter(p => p.name !== paramName))
    }

    const updateParameter = (index: number, field: keyof SnippetParameter, value: string) => {
        const updated = [...parameters]
        updated[index] = { ...updated[index], [field]: value }
        setParameters(updated)
    }

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Snippet name is required')
            return
        }

        if (selectedSteps.length === 0) {
            toast.error('No steps selected')
            return
        }

        setSaving(true)
        try {
            // Create snippet from selected steps
            const result = await snippetApi.createFromSteps(projectId, {
                name: name.trim(),
                description: description.trim(),
                parameters,
                step_ids: selectedSteps.map(s => s.id),
                is_global: isGlobal,
            })

            toast.success(`Snippet "${name}" created with ${selectedSteps.length} steps`)
            resetForm()
            onOpenChange(false)
            onCreated?.(result.id)
        } catch (error) {
            console.error('Failed to create snippet:', error)
            toast.error('Failed to create snippet')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FunctionSquare className="w-5 h-5 text-violet-500" />
                        Create Snippet from Steps
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Snippet Name */}
                    <div className="space-y-2">
                        <Label>Snippet Name *</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Login Flow"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this snippet do?"
                        />
                    </div>

                    {/* Selected Steps Preview */}
                    <div className="space-y-2">
                        <Label>Steps to Include ({selectedSteps.length})</Label>
                        <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                            {selectedSteps.map((step, idx) => {
                                const config = getActionConfig(step.action)
                                return (
                                    <div
                                        key={step.id}
                                        className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-gray-100"
                                    >
                                        <span className="text-gray-400 w-4 text-right">{idx + 1}.</span>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs px-1.5 py-0 ${config?.color || 'bg-gray-500'}`}
                                        >
                                            {config?.name || step.action}
                                        </Badge>
                                        {step.selector && (
                                            <code className="text-gray-500 truncate max-w-[200px]">{step.selector}</code>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Parameters */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Parameters</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newParamName}
                                    onChange={(e) => setNewParamName(e.target.value)}
                                    placeholder="param_name"
                                    className="h-7 text-xs w-32"
                                    onKeyDown={(e) => e.key === 'Enter' && addParameter()}
                                />
                                <Button size="sm" variant="outline" onClick={addParameter} className="h-7">
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Use {'{{param_name}}'} in step values to reference parameters.
                        </p>
                        {parameters.length > 0 && (
                            <div className="space-y-2">
                                {parameters.map((param, idx) => (
                                    <Card key={param.name} className="p-2">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-violet-600 font-mono bg-violet-50 px-1.5 py-0.5 rounded">
                                                {'{{'}{param.name}{'}}'}
                                            </code>
                                            <select
                                                value={param.type}
                                                onChange={(e) => updateParameter(idx, 'type', e.target.value)}
                                                className="text-xs border rounded px-1.5 py-0.5"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="selector">Selector</option>
                                            </select>
                                            <Input
                                                value={param.default || ''}
                                                onChange={(e) => updateParameter(idx, 'default', e.target.value)}
                                                placeholder="Default"
                                                className="h-6 text-xs flex-1"
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-red-500"
                                                onClick={() => removeParameter(param.name)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Global Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is-global-checkbox"
                            checked={isGlobal}
                            onChange={(e) => setIsGlobal(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="is-global-checkbox" className="cursor-pointer text-sm">
                            Make available to all projects (Global)
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={saving || !name.trim() || selectedSteps.length === 0}
                        className="bg-violet-600 hover:bg-violet-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Create Snippet
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
