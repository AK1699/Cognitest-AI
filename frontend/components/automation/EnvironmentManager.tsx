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
import {
    Plus,
    Trash2,
    Save,
    X,
    Edit2,
    Check,
    Settings,
    AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface Environment {
    id: string
    name: string
    variables: Record<string, string>
}

interface EnvironmentManagerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    environments: Environment[]
    onSave: (environments: Environment[]) => void
}

export function EnvironmentManager({
    open,
    onOpenChange,
    environments: initialEnvironments,
    onSave
}: EnvironmentManagerProps) {
    const [environments, setEnvironments] = useState<Environment[]>(initialEnvironments)
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(initialEnvironments[0]?.id || null)
    const [editingEnvId, setEditingEnvId] = useState<string | null>(null)
    const [newEnvName, setNewEnvName] = useState('')
    const [newVarKey, setNewVarKey] = useState('')
    const [newVarValue, setNewVarValue] = useState('')

    useEffect(() => {
        setEnvironments(initialEnvironments)
        if (initialEnvironments.length > 0 && !selectedEnvId) {
            setSelectedEnvId(initialEnvironments[0].id)
        }
        setEditingEnvId(null)
        setNewEnvName('')
        setError(null)
    }, [initialEnvironments, open])

    const [error, setError] = useState<string | null>(null)

    const validateEnvName = (name: string) => {
        if (!name.trim()) return 'Name cannot be empty'
        if (environments.some(e => e.name.toLowerCase() === name.trim().toLowerCase() && e.id !== editingEnvId)) {
            return 'Environment name must be unique'
        }
        return null
    }

    const validateVariableKey = (key: string) => {
        if (!key.trim()) return 'Key cannot be empty'
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
            return 'Key must start with letter/underscore and contain only alphanumeric characters'
        }
        return null
    }

    const handleAddEnvironment = () => {
        const newName = 'New Environment'
        // Ensure unique name
        let name = newName
        let counter = 1
        while (environments.some(e => e.name === name)) {
            name = `${newName} ${counter++}`
        }

        const newEnv: Environment = {
            id: `env-${Date.now()}`,
            name: name,
            variables: {}
        }
        setEnvironments([...environments, newEnv])
        setSelectedEnvId(newEnv.id)
        setEditingEnvId(newEnv.id)
        setNewEnvName(name)
        setError(null)
    }

    const handleDeleteEnvironment = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newEnvs = environments.filter(e => e.id !== id)
        setEnvironments(newEnvs)
        if (selectedEnvId === id) {
            setSelectedEnvId(newEnvs[0]?.id || null)
        }
    }

    const handleUpdateEnvironment = (id: string, updates: Partial<Environment>) => {
        setEnvironments(environments.map(e => e.id === id ? { ...e, ...updates } : e))
    }

    const handleAddVariable = () => {
        setError(null)
        if (!selectedEnvId) return

        const keyError = validateVariableKey(newVarKey)
        if (keyError) {
            setError(keyError)
            return
        }

        const env = environments.find(e => e.id === selectedEnvId)
        if (!env) return

        if (env.variables[newVarKey.trim()]) {
            setError('Variable key already exists in this environment')
            return
        }

        const updatedVariables = { ...env.variables, [newVarKey.trim()]: newVarValue }
        handleUpdateEnvironment(selectedEnvId, { variables: updatedVariables })
        setNewVarKey('')
        setNewVarValue('')
    }

    const handleDeleteVariable = (key: string) => {
        if (!selectedEnvId) return
        const env = environments.find(e => e.id === selectedEnvId)
        if (!env) return

        const updatedVariables = { ...env.variables }
        delete updatedVariables[key]
        handleUpdateEnvironment(selectedEnvId, { variables: updatedVariables })
    }

    const handleSaveEnvName = () => {
        const nameError = validateEnvName(newEnvName)
        if (nameError) {
            // Toast or inline error would be better here, but for inline editing usually we just don't save or show border red
            // For now, let's just reset or keep logic simple.
            // I'll add a simple alert or just block
            return
        }

        if (editingEnvId && newEnvName.trim()) {
            handleUpdateEnvironment(editingEnvId, { name: newEnvName.trim() })
            setEditingEnvId(null)
        }
    }

    const handleSaveAll = () => {
        let finalEnvironments = [...environments]

        // Apply pending rename if currently editing
        if (editingEnvId && newEnvName.trim()) {
            const nameError = validateEnvName(newEnvName)
            if (!nameError) {
                finalEnvironments = finalEnvironments.map(e =>
                    e.id === editingEnvId ? { ...e, name: newEnvName.trim() } : e
                )
            }
        }

        onSave(finalEnvironments)
        onOpenChange(false)
    }

    const selectedEnv = environments.find(e => e.id === selectedEnvId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Manage Environments
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Environment List */}
                    <div className="w-64 border-r bg-gray-50 flex flex-col">
                        <div className="p-4 border-b">
                            <Button onClick={handleAddEnvironment} className="w-full flex gap-2" variant="outline">
                                <Plus className="w-4 h-4" />
                                New Environment
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {environments.map(env => (
                                <div
                                    key={env.id}
                                    onClick={() => setSelectedEnvId(env.id)}
                                    className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedEnvId === env.id ? 'bg-white shadow-sm border border-blue-200' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {editingEnvId === env.id ? (
                                        <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                            <Input
                                                value={newEnvName}
                                                onChange={e => setNewEnvName(e.target.value)}
                                                className="h-8 text-sm"
                                                autoFocus
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveEnvName()
                                                    if (e.key === 'Escape') setEditingEnvId(null)
                                                }}
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveEnvName}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-2 h-2 rounded-full ${selectedEnvId === env.id ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                <span className="text-sm font-medium truncate">{env.name}</span>
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingEnvId(env.id)
                                                        setNewEnvName(env.name)
                                                    }}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-gray-500 hover:text-red-600"
                                                    onClick={(e) => handleDeleteEnvironment(env.id, e)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content - Variables */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedEnv ? (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-900">Variables</h3>
                                        <span className="text-xs text-gray-500">{Object.keys(selectedEnv.variables).length} variables</span>
                                    </div>

                                    <div className="mb-4 grid grid-cols-[1fr,1.5fr,auto] gap-3 items-end p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <div>
                                            <Label className="text-xs text-gray-500 mb-1.5 block">Key</Label>
                                            <Input
                                                value={newVarKey}
                                                onChange={e => setNewVarKey(e.target.value)}
                                                placeholder="API_KEY"
                                                className="h-9 bg-white"
                                                onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500 mb-1.5 block">Value</Label>
                                            <Input
                                                value={newVarValue}
                                                onChange={e => setNewVarValue(e.target.value)}
                                                placeholder="secret_value_123"
                                                className="h-9 bg-white"
                                                onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
                                            />
                                        </div>
                                        <Button onClick={handleAddVariable} size="sm" className="h-9">
                                            <Plus className="w-4 h-4 mr-1.5" />
                                            Add
                                        </Button>
                                    </div>
                                    {error && (
                                        <div className="mb-4 text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {Object.entries(selectedEnv.variables).map(([key, value]) => (
                                            <Card key={key} className="p-3 flex items-center gap-3 hover:border-gray-300 transition-colors group">
                                                <div className="flex-1 min-w-0 grid grid-cols-[1fr,1.5fr] gap-3">
                                                    <div className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded self-start inline-block truncate" title={key}>
                                                        {key}
                                                    </div>
                                                    <div className="text-sm text-gray-600 truncate font-mono" title={value}>
                                                        {value}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    onClick={() => handleDeleteVariable(key)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </Card>
                                        ))}
                                        {Object.keys(selectedEnv.variables).length === 0 && (
                                            <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                                                No variables defined for this environment
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                Select an environment to edit
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-white flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveAll} className="min-w-[100px]">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
