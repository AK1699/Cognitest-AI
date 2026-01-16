'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    X, Plus, Trash2, Settings, Key, Check, HelpCircle,
    Globe, Zap, Copy, Eye, EyeOff, Search, Sparkles, Save, Loader2, Pencil
} from 'lucide-react'
import { toast } from 'sonner'

export interface EnvironmentVariable {
    id: string
    key: string
    value: string
    enabled: boolean
    secret?: boolean
}

export interface Environment {
    id: string
    name: string
    variables: EnvironmentVariable[]
    project_id?: string
    is_default?: boolean
    created_at?: string
    updated_at?: string
}

interface EnvironmentManagerProps {
    isOpen: boolean
    onClose: () => void
    environments: Environment[]
    setEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>
    selectedEnvironmentId: string | null
    setSelectedEnvironmentId: (id: string | null) => void
    // API callbacks for persistence
    onCreateEnvironment?: (name: string, variables?: EnvironmentVariable[]) => Promise<Environment | null>
    onUpdateEnvironment?: (envId: string, updates: Partial<Environment>) => Promise<Environment | null>
    onDeleteEnvironment?: (envId: string) => Promise<boolean>
}

export function EnvironmentManager({
    isOpen,
    onClose,
    environments,
    setEnvironments,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
    onCreateEnvironment,
    onUpdateEnvironment,
    onDeleteEnvironment
}: EnvironmentManagerProps) {
    const [editingEnvId, setEditingEnvId] = useState<string | null>(null)
    const [newEnvName, setNewEnvName] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [renamingEnvId, setRenamingEnvId] = useState<string | null>(null)
    const [renamingName, setRenamingName] = useState('')

    if (!isOpen) return null

    const createEnvironment = async () => {
        const name = newEnvName.trim()
        if (!name) return

        setIsSaving(true)
        try {
            if (onCreateEnvironment) {
                // Use API callback if provided
                const newEnv = await onCreateEnvironment(name, [])
                if (newEnv) {
                    setNewEnvName('')
                    setEditingEnvId(newEnv.id)
                    toast.success(`Environment "${newEnv.name}" created`)
                }
            } else {
                // Fallback to local state
                const newEnv: Environment = {
                    id: `env-${Date.now()}`,
                    name: name,
                    variables: []
                }
                setEnvironments(prev => [...prev, newEnv])
                setNewEnvName('')
                setEditingEnvId(newEnv.id)
                toast.success(`Environment "${newEnv.name}" created`)
            }
        } finally {
            setIsSaving(false)
        }
    }

    const deleteEnvironment = async (envId: string) => {
        const env = environments.find(e => e.id === envId)

        setIsSaving(true)
        try {
            if (onDeleteEnvironment) {
                // Use API callback if provided
                const success = await onDeleteEnvironment(envId)
                if (success) {
                    setEditingEnvId(null)
                    toast.success(`Environment "${env?.name}" deleted`)
                }
            } else {
                // Fallback to local state
                setEnvironments(prev => prev.filter(e => e.id !== envId))
                if (selectedEnvironmentId === envId) {
                    setSelectedEnvironmentId(null)
                }
                setEditingEnvId(null)
                toast.success(`Environment "${env?.name}" deleted`)
            }
        } finally {
            setIsSaving(false)
        }
    }

    const addEnvVariable = (envId: string) => {
        const newVar: EnvironmentVariable = {
            id: `var-${Date.now()}`,
            key: '',
            value: '',
            enabled: true,
            secret: false
        }
        setEnvironments(prev => prev.map(env =>
            env.id === envId
                ? { ...env, variables: [...env.variables, newVar] }
                : env
        ))
    }

    const updateEnvVariable = (envId: string, varId: string, updates: Partial<EnvironmentVariable>) => {
        setEnvironments(prev => prev.map(env =>
            env.id === envId
                ? {
                    ...env,
                    variables: env.variables.map(v =>
                        v.id === varId ? { ...v, ...updates } : v
                    )
                }
                : env
        ))
    }

    const removeEnvVariable = (envId: string, varId: string) => {
        setEnvironments(prev => prev.map(env =>
            env.id === envId
                ? { ...env, variables: env.variables.filter(v => v.id !== varId) }
                : env
        ))
    }

    // Save environment variables to backend when changed
    const saveEnvironmentVariables = async (envId: string) => {
        const env = environments.find(e => e.id === envId)
        if (!env || !onUpdateEnvironment) return

        setIsSaving(true)
        try {
            await onUpdateEnvironment(envId, { variables: env.variables })
            toast.success('Environment saved')
        } finally {
            setIsSaving(false)
        }
    }

    const copyVariable = (key: string) => {
        navigator.clipboard.writeText(`{{${key}}}`)
        toast.success(`Copied {{${key}}} to clipboard`)
    }

    const toggleSecretVisibility = (varId: string) => {
        setShowSecrets(prev => ({ ...prev, [varId]: !prev[varId] }))
    }

    const currentEnv = editingEnvId
        ? environments.find(e => e.id === editingEnvId)
        : null

    const filteredVariables = currentEnv?.variables.filter(v =>
        v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.value.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg shadow-primary/20">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Environment Manager</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Manage variables across different environments</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            onClose()
                            setEditingEnvId(null)
                            setNewEnvName('')
                        }}
                        className="rounded-xl hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Environment List */}
                    <div className="w-80 border-r border-gray-300 bg-gray-50/50 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={newEnvName}
                                        onChange={(e) => setNewEnvName(e.target.value)}
                                        placeholder="New environment name..."
                                        className="h-10 pl-4 pr-4 text-sm rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 bg-white"
                                        onKeyDown={(e) => e.key === 'Enter' && createEnvironment()}
                                    />
                                </div>
                                <Button
                                    onClick={createEnvironment}
                                    size="sm"
                                    className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    disabled={!newEnvName.trim()}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-2">
                                {environments.length === 0 ? (
                                    <div className="text-center py-16 px-4">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                            <Globe className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">No environments yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Create your first environment above</p>
                                    </div>
                                ) : (
                                    environments.map(env => (
                                        <div
                                            key={env.id}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all group ${editingEnvId === env.id
                                                ? 'bg-white shadow-lg shadow-gray-200/50 border border-primary/20 ring-2 ring-primary/10'
                                                : 'hover:bg-white hover:shadow-md border border-transparent'
                                                }`}
                                        >
                                            <button
                                                onClick={() => setEditingEnvId(env.id)}
                                                className="flex items-center gap-3 min-w-0 flex-1"
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedEnvironmentId === env.id
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
                                                    : 'bg-gray-100'
                                                    }`}>
                                                    <Globe className={`w-5 h-5 ${selectedEnvironmentId === env.id ? 'text-white' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    {renamingEnvId === env.id ? (
                                                        <Input
                                                            value={renamingName}
                                                            onChange={(e) => setRenamingName(e.target.value)}
                                                            onKeyDown={async (e) => {
                                                                if (e.key === 'Enter' && renamingName.trim()) {
                                                                    if (onUpdateEnvironment) {
                                                                        await onUpdateEnvironment(env.id, { name: renamingName.trim() })
                                                                    }
                                                                    setRenamingEnvId(null)
                                                                } else if (e.key === 'Escape') {
                                                                    setRenamingEnvId(null)
                                                                }
                                                            }}
                                                            onBlur={async () => {
                                                                if (renamingName.trim() && renamingName !== env.name) {
                                                                    if (onUpdateEnvironment) {
                                                                        await onUpdateEnvironment(env.id, { name: renamingName.trim() })
                                                                    }
                                                                }
                                                                setRenamingEnvId(null)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="h-7 text-sm font-semibold w-full"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <>
                                                            <p className={`font-semibold truncate max-w-[100px] ${editingEnvId === env.id ? 'text-primary' : 'text-gray-900'}`}>
                                                                {env.name}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {env.variables.length} variable{env.variables.length !== 1 ? 's' : ''}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {selectedEnvironmentId === env.id && (
                                                    <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-bold mr-1">
                                                        ACTIVE
                                                    </Badge>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setRenamingEnvId(env.id)
                                                        setRenamingName(env.name)
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Rename"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteEnvironment(env.id)
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Environment Details */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        {currentEnv ? (
                            <>
                                {/* Environment Header */}
                                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedEnvironmentId === currentEnv.id
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
                                                : 'bg-gray-100'
                                                }`}>
                                                <Globe className={`w-6 h-6 ${selectedEnvironmentId === currentEnv.id ? 'text-white' : 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">{currentEnv.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {currentEnv.variables.length} variable{currentEnv.variables.length !== 1 ? 's' : ''} defined
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedEnvironmentId(currentEnv.id)}
                                                className={`rounded-xl h-10 px-4 transition-all ${selectedEnvironmentId === currentEnv.id
                                                    ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                                                    : 'hover:border-primary hover:text-primary'
                                                    }`}
                                            >
                                                {selectedEnvironmentId === currentEnv.id ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Active Environment
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="w-4 h-4 mr-2" />
                                                        Set as Active
                                                    </>
                                                )}
                                            </Button>
                                            {onUpdateEnvironment && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => saveEnvironmentVariables(currentEnv.id)}
                                                    disabled={isSaving}
                                                    className="rounded-xl h-10 px-4 hover:border-primary hover:text-primary"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4 mr-2" />
                                                    )}
                                                    Save
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteEnvironment(currentEnv.id)}
                                                disabled={isSaving}
                                                className="rounded-xl h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Variables Section */}
                                <div className="flex-1 overflow-auto p-6">
                                    {/* Toolbar */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="relative flex-1 max-w-xs">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <Input
                                                placeholder="Search variables..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-10 pl-10 rounded-xl border-gray-300 bg-white"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => addEnvVariable(currentEnv.id)}
                                            className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Variable
                                        </Button>
                                    </div>

                                    {currentEnv.variables.length === 0 ? (
                                        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                                <Key className="w-10 h-10 text-primary/40" />
                                            </div>
                                            <p className="text-lg font-semibold text-gray-700">No variables yet</p>
                                            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                                                Add variables to use dynamic values in your API requests with <code className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono text-xs">{'{{variable}}'}</code> syntax
                                            </p>
                                            <Button
                                                onClick={() => addEnvVariable(currentEnv.id)}
                                                variant="outline"
                                                className="mt-6 rounded-xl"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Your First Variable
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[40px_1fr_1fr_120px] gap-4 px-4 py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <div></div>
                                                <div>Variable Name</div>
                                                <div>Value</div>
                                                <div className="text-right">Actions</div>
                                            </div>

                                            {/* Variable Rows */}
                                            {filteredVariables.map(variable => (
                                                <div
                                                    key={variable.id}
                                                    className={`grid grid-cols-[40px_1fr_1fr_120px] gap-4 items-center p-4 rounded-xl border transition-all group ${variable.enabled
                                                        ? 'bg-white border-gray-200 shadow-sm hover:border-primary/40 hover:shadow-md'
                                                        : 'bg-gray-50/50 border-gray-200 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={variable.enabled}
                                                            onChange={(e) => updateEnvVariable(currentEnv.id, variable.id, { enabled: e.target.checked })}
                                                            className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={variable.key}
                                                        onChange={(e) => updateEnvVariable(currentEnv.id, variable.id, { key: e.target.value })}
                                                        placeholder="VARIABLE_NAME"
                                                        className="h-10 text-sm font-mono font-medium border-gray-300 rounded-lg focus:border-primary focus:ring-primary/20 bg-white"
                                                    />
                                                    <div className="relative">
                                                        <Input
                                                            type={variable.secret && !showSecrets[variable.id] ? 'password' : 'text'}
                                                            value={variable.value}
                                                            onChange={(e) => updateEnvVariable(currentEnv.id, variable.id, { value: e.target.value })}
                                                            placeholder="Value"
                                                            className="h-10 text-sm font-mono border-gray-300 rounded-lg pr-10 focus:border-primary focus:ring-primary/20 bg-white"
                                                        />
                                                        {variable.secret && (
                                                            <button
                                                                onClick={() => toggleSecretVisibility(variable.id)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                {showSecrets[variable.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => copyVariable(variable.key)}
                                                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
                                                            title="Copy reference"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => updateEnvVariable(currentEnv.id, variable.id, { secret: !variable.secret })}
                                                            className={`h-8 w-8 rounded-lg ${variable.secret ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
                                                            title={variable.secret ? 'Secret variable' : 'Mark as secret'}
                                                        >
                                                            <Key className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeEnvVariable(currentEnv.id, variable.id)}
                                                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pro Tips */}
                                    <div className="mt-8 p-5 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl border border-primary/10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">Pro Tips</p>
                                                <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                        Use <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-xs">{'{{variableName}}'}</code> in URLs, headers, or body
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                        Mark sensitive values as secrets to hide them
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                        Switch environments to test different configurations
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center max-w-md px-8">
                                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                        <Settings className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Environment</h3>
                                    <p className="text-gray-500">
                                        Choose an environment from the list to view and edit its variables, or create a new one to get started.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EnvironmentManager
