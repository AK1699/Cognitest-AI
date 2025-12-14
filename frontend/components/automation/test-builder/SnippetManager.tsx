'use client'

import React, { useState, useEffect } from 'react'
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
    Plus,
    Trash2,
    Search,
    Edit2,
    FunctionSquare,
    Tag,
    Globe,
    Copy,
    MoreVertical,
    AlertCircle,
    Loader2,
} from 'lucide-react'
import { snippetApi, Snippet, SnippetParameter } from '@/lib/api/webAutomation'
import { toast } from 'sonner'

interface SnippetManagerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    onSnippetSelect?: (snippet: Snippet) => void
}

export function SnippetManager({
    open,
    onOpenChange,
    projectId,
    onSnippetSelect,
}: SnippetManagerProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Form state for create/edit
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formTags, setFormTags] = useState<string[]>([])
    const [formIsGlobal, setFormIsGlobal] = useState(false)
    const [formParameters, setFormParameters] = useState<SnippetParameter[]>([])
    const [newTagInput, setNewTagInput] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            loadSnippets()
        }
    }, [open, projectId])

    const loadSnippets = async () => {
        try {
            setLoading(true)
            const data = await snippetApi.listSnippets(projectId, { includeGlobal: true })
            setSnippets(data)
        } catch (error) {
            console.error('Failed to load snippets:', error)
            toast.error('Failed to load snippets')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormName('')
        setFormDescription('')
        setFormTags([])
        setFormIsGlobal(false)
        setFormParameters([])
        setNewTagInput('')
        setSelectedSnippet(null)
        setIsEditing(false)
        setIsCreating(false)
    }

    const handleCreate = () => {
        resetForm()
        setIsCreating(true)
    }

    const handleEdit = (snippet: Snippet) => {
        setSelectedSnippet(snippet)
        setFormName(snippet.name)
        setFormDescription(snippet.description || '')
        setFormTags(snippet.tags || [])
        setFormIsGlobal(snippet.is_global)
        setFormParameters(snippet.parameters || [])
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Snippet name is required')
            return
        }

        setSaving(true)
        try {
            if (isEditing && selectedSnippet) {
                await snippetApi.updateSnippet(selectedSnippet.id, {
                    name: formName,
                    description: formDescription,
                    tags: formTags,
                    is_global: formIsGlobal,
                    parameters: formParameters,
                })
                toast.success('Snippet updated')
            } else {
                await snippetApi.createSnippet(projectId, {
                    name: formName,
                    description: formDescription,
                    parameters: formParameters,
                    steps: [],
                    tags: formTags,
                    is_global: formIsGlobal,
                })
                toast.success('Snippet created')
            }
            await loadSnippets()
            resetForm()
        } catch (error) {
            console.error('Failed to save snippet:', error)
            toast.error('Failed to save snippet')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (snippet: Snippet) => {
        if (!confirm(`Delete snippet "${snippet.name}"?`)) return

        try {
            await snippetApi.deleteSnippet(snippet.id)
            toast.success('Snippet deleted')
            await loadSnippets()
        } catch (error) {
            console.error('Failed to delete snippet:', error)
            toast.error('Failed to delete snippet')
        }
    }

    const addTag = () => {
        if (newTagInput.trim() && !formTags.includes(newTagInput.trim())) {
            setFormTags([...formTags, newTagInput.trim()])
            setNewTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setFormTags(formTags.filter((t) => t !== tag))
    }

    const addParameter = () => {
        setFormParameters([
            ...formParameters,
            { name: '', type: 'string', default: '', description: '' },
        ])
    }

    const updateParameter = (index: number, field: keyof SnippetParameter, value: string) => {
        const updated = [...formParameters]
        updated[index] = { ...updated[index], [field]: value }
        setFormParameters(updated)
    }

    const removeParameter = (index: number) => {
        setFormParameters(formParameters.filter((_, i) => i !== index))
    }

    const filteredSnippets = snippets.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.description?.toLowerCase().includes(search.toLowerCase()) ||
            s.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[650px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FunctionSquare className="w-5 h-5 text-violet-500" />
                        Snippet Manager
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Snippet List */}
                    <div className="w-72 border-r bg-gray-50 flex flex-col">
                        <div className="p-4 space-y-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search snippets..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                            <Button onClick={handleCreate} className="w-full" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Snippet
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : filteredSnippets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    {search ? 'No snippets found' : 'No snippets yet'}
                                </div>
                            ) : (
                                filteredSnippets.map((snippet) => (
                                    <div
                                        key={snippet.id}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedSnippet?.id === snippet.id
                                                ? 'bg-violet-50 border border-violet-200'
                                                : 'hover:bg-gray-100 border border-transparent'
                                            }`}
                                        onClick={() => setSelectedSnippet(snippet)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FunctionSquare className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                                <span className="font-medium text-sm truncate">{snippet.name}</span>
                                            </div>
                                            {snippet.is_global && (
                                                <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        {snippet.description && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 ml-6">
                                                {snippet.description}
                                            </p>
                                        )}
                                        {snippet.tags && snippet.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2 ml-6">
                                                {snippet.tags.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-2 ml-6">
                                            {snippet.parameters?.length || 0} params • {snippet.steps?.length || 0} steps
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail/Edit Panel */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        {isCreating || isEditing ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g., Login Flow"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="What does this snippet do?"
                                    />
                                </div>

                                {/* Tags */}
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            placeholder="Add tag"
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            className="flex-1"
                                        />
                                        <Button onClick={addTag} size="sm" variant="outline">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {formTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {formTags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="flex items-center gap-1 cursor-pointer"
                                                    onClick={() => removeTag(tag)}
                                                >
                                                    {tag}
                                                    <Trash2 className="w-3 h-3" />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Parameters */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Parameters</Label>
                                        <Button onClick={addParameter} size="sm" variant="ghost">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    {formParameters.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No parameters. Use {'{{param_name}}'} in step values.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {formParameters.map((param, idx) => (
                                                <Card key={idx} className="p-3">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <Input
                                                            value={param.name}
                                                            onChange={(e) => updateParameter(idx, 'name', e.target.value)}
                                                            placeholder="Name"
                                                            className="text-sm"
                                                        />
                                                        <select
                                                            value={param.type}
                                                            onChange={(e) =>
                                                                updateParameter(idx, 'type', e.target.value as any)
                                                            }
                                                            className="text-sm border rounded px-2"
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
                                                            className="text-sm"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={param.description || ''}
                                                                onChange={(e) =>
                                                                    updateParameter(idx, 'description', e.target.value)
                                                                }
                                                                placeholder="Description"
                                                                className="text-sm flex-1"
                                                            />
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-500"
                                                                onClick={() => removeParameter(idx)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Global toggle */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is-global"
                                        checked={formIsGlobal}
                                        onChange={(e) => setFormIsGlobal(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="is-global" className="cursor-pointer">
                                        Make this snippet available to all projects (Global)
                                    </Label>
                                </div>
                            </div>
                        ) : selectedSnippet ? (
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            {selectedSnippet.name}
                                            {selectedSnippet.is_global && (
                                                <Badge variant="outline" className="text-blue-600">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    Global
                                                </Badge>
                                            )}
                                        </h3>
                                        {selectedSnippet.description && (
                                            <p className="text-gray-600 mt-1">{selectedSnippet.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(selectedSnippet)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                onSnippetSelect?.(selectedSnippet)
                                                onOpenChange(false)
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            Use
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDelete(selectedSnippet)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Parameters list */}
                                {selectedSnippet.parameters && selectedSnippet.parameters.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                                        <div className="space-y-1">
                                            {selectedSnippet.parameters.map((param, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded"
                                                >
                                                    <code className="text-violet-600 font-mono">
                                                        {'{{'}{param.name}{'}}'}
                                                    </code>
                                                    <Badge variant="secondary">{param.type}</Badge>
                                                    {param.default && (
                                                        <span className="text-gray-500">= {param.default}</span>
                                                    )}
                                                    {param.description && (
                                                        <span className="text-gray-400 ml-auto">{param.description}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Steps preview */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">
                                        Steps ({selectedSnippet.steps?.length || 0})
                                    </h4>
                                    {(!selectedSnippet.steps || selectedSnippet.steps.length === 0) ? (
                                        <p className="text-sm text-gray-500">No steps defined yet.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {selectedSnippet.steps.map((step, idx) => (
                                                <div key={idx} className="text-sm bg-gray-50 p-2 rounded flex gap-2">
                                                    <span className="text-gray-400">{idx + 1}.</span>
                                                    <span className="font-medium">{step.action || step.type}</span>
                                                    {step.selector && (
                                                        <code className="text-xs text-gray-500 truncate max-w-[200px]">
                                                            {step.selector}
                                                        </code>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                {selectedSnippet.tags && selectedSnippet.tags.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedSnippet.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="mt-4 pt-4 border-t text-xs text-gray-400">
                                    <p>Version: {selectedSnippet.version}</p>
                                    <p>Used: {selectedSnippet.usage_count} times</p>
                                    <p>Created: {new Date(selectedSnippet.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <FunctionSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Select a snippet to view details</p>
                                    <p className="text-sm mt-1">or create a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-white flex-shrink-0">
                    {(isCreating || isEditing) ? (
                        <>
                            <Button variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : isEditing ? (
                                    'Save Changes'
                                ) : (
                                    'Create Snippet'
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
