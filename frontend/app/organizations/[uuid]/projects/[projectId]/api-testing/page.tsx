'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserNav } from '@/components/layout/user-nav'
import {
    Send, Save, Plus, X, ChevronDown, ChevronRight, Home, Play,
    FileJson, Folder, FolderOpen, MoreHorizontal, Upload, Download,
    Settings, Clock, Copy, Check, AlertCircle, Loader2,
    Sparkles, MessageSquare, Code2, Eye, FileText, Cookie,
    Link2, Lock, Key, Hash, Terminal, Wand2, Trash2
} from 'lucide-react'
import { CircuitLogoIcon } from '@/components/ui/CircuitLogoIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CodeEditor } from '@/components/api-testing/CodeEditor'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Types
interface KeyValuePair {
    id: string
    key: string
    value: string
    description?: string
    enabled: boolean
}

interface APIRequest {
    id: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
    url: string
    params: KeyValuePair[]
    headers: KeyValuePair[]
    body: {
        type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql'
        content: string
        formData?: KeyValuePair[]
        graphqlVariables?: string
    }
    auth: {
        type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2'
        token?: string
        username?: string
        password?: string
        apiKey?: string
        apiKeyHeader?: string
    }
    preRequestScript?: string
    testScript?: string
}

interface APIResponse {
    status: number
    statusText: string
    time: number
    size: number
    headers: Record<string, string>
    body: any
    cookies?: Record<string, string>
}

interface Collection {
    id: string
    name: string
    requests: APIRequest[]
    folders?: Collection[]
    isOpen?: boolean
}

// Method color helpers
const getMethodColor = (method: string) => {
    switch (method) {
        case 'GET': return 'bg-green-100 text-green-700 border-green-200'
        case 'POST': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        case 'PUT': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'PATCH': return 'bg-purple-100 text-purple-700 border-purple-200'
        case 'DELETE': return 'bg-red-100 text-red-700 border-red-200'
        case 'HEAD': return 'bg-gray-100 text-gray-700 border-gray-200'
        case 'OPTIONS': return 'bg-pink-100 text-pink-700 border-pink-200'
        default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
}

const getMethodBgColor = (method: string) => {
    switch (method) {
        case 'GET': return 'bg-green-500'
        case 'POST': return 'bg-yellow-500'
        case 'PUT': return 'bg-blue-500'
        case 'PATCH': return 'bg-purple-500'
        case 'DELETE': return 'bg-red-500'
        default: return 'bg-gray-500'
    }
}

const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50'
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-50'
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50'
    if (status >= 500) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
}

// Default request template
const createNewRequest = (): APIRequest => ({
    id: `req-${Date.now()}`,
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [],
    headers: [
        { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: { type: 'none', content: '' },
    auth: { type: 'none' }
})

export default function APITestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    // Request tabs state
    const [openRequests, setOpenRequests] = useState<APIRequest[]>([createNewRequest()])
    const [activeRequestId, setActiveRequestId] = useState<string>(openRequests[0].id)

    // Current request state
    const activeRequest = openRequests.find(r => r.id === activeRequestId) || openRequests[0]

    // Response state
    const [response, setResponse] = useState<APIResponse | null>(null)
    const [loading, setLoading] = useState(false)

    // Collections state
    const [collections, setCollections] = useState<Collection[]>([
        {
            id: 'c1',
            name: 'My Collection',
            isOpen: true,
            requests: [],
            folders: []
        }
    ])

    // Environment state
    const [selectedEnvironment, setSelectedEnvironment] = useState('No Environment')
    const [environments] = useState(['No Environment', 'Development', 'Staging', 'Production'])

    // AI Assistant state
    const [showAIPanel, setShowAIPanel] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Active config tab
    const [activeConfigTab, setActiveConfigTab] = useState('params')
    const [activeResponseTab, setActiveResponseTab] = useState('body')

    // Update active request
    const updateActiveRequest = (updates: Partial<APIRequest>) => {
        setOpenRequests(prev => prev.map(r =>
            r.id === activeRequestId ? { ...r, ...updates } : r
        ))
    }

    // Add new request tab
    const addNewRequest = () => {
        const newReq = createNewRequest()
        setOpenRequests(prev => [...prev, newReq])
        setActiveRequestId(newReq.id)
    }

    // Close request tab
    const closeRequest = (id: string) => {
        if (openRequests.length === 1) return
        const newRequests = openRequests.filter(r => r.id !== id)
        setOpenRequests(newRequests)
        if (activeRequestId === id) {
            setActiveRequestId(newRequests[newRequests.length - 1].id)
        }
    }

    // Send request
    const sendRequest = async () => {
        if (!activeRequest.url) {
            toast.error('Please enter a URL')
            return
        }

        setLoading(true)
        setResponse(null)
        const startTime = Date.now()

        try {
            // Build URL with params
            let url = activeRequest.url
            const enabledParams = activeRequest.params.filter(p => p.enabled && p.key)
            if (enabledParams.length > 0) {
                const searchParams = new URLSearchParams()
                enabledParams.forEach(p => searchParams.append(p.key, p.value))
                url += (url.includes('?') ? '&' : '?') + searchParams.toString()
            }

            // Build headers
            const headers: Record<string, string> = {}
            activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[h.key] = h.value
            })

            // Add auth headers
            if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
                headers['Authorization'] = `Bearer ${activeRequest.auth.token}`
            } else if (activeRequest.auth.type === 'basic' && activeRequest.auth.username) {
                const encoded = btoa(`${activeRequest.auth.username}:${activeRequest.auth.password || ''}`)
                headers['Authorization'] = `Basic ${encoded}`
            } else if (activeRequest.auth.type === 'api-key' && activeRequest.auth.apiKey) {
                headers[activeRequest.auth.apiKeyHeader || 'X-API-Key'] = activeRequest.auth.apiKey
            }

            // Build body
            let body: string | FormData | undefined
            if (['POST', 'PUT', 'PATCH'].includes(activeRequest.method)) {
                if (activeRequest.body.type === 'json' || activeRequest.body.type === 'raw') {
                    body = activeRequest.body.content
                } else if (activeRequest.body.type === 'form-data' && activeRequest.body.formData) {
                    const formData = new FormData()
                    activeRequest.body.formData.filter(f => f.enabled && f.key).forEach(f => {
                        formData.append(f.key, f.value)
                    })
                    body = formData
                    delete headers['Content-Type'] // Let browser set it
                } else if (activeRequest.body.type === 'x-www-form-urlencoded' && activeRequest.body.formData) {
                    const params = new URLSearchParams()
                    activeRequest.body.formData.filter(f => f.enabled && f.key).forEach(f => {
                        params.append(f.key, f.value)
                    })
                    body = params.toString()
                    headers['Content-Type'] = 'application/x-www-form-urlencoded'
                }
            }

            // Make request via proxy to avoid CORS
            const proxyResponse = await fetch(`${API_URL}/api/v1/api-testing/proxy`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: activeRequest.method,
                    url: url,
                    headers: headers,
                    body: body
                })
            })

            const result = await proxyResponse.json()
            const endTime = Date.now()

            setResponse({
                status: result.status || proxyResponse.status,
                statusText: result.statusText || proxyResponse.statusText,
                time: endTime - startTime,
                size: JSON.stringify(result.body || result).length,
                headers: result.headers || {},
                body: result.body || result,
                cookies: result.cookies
            })

            toast.success(`Request completed: ${result.status || proxyResponse.status}`)
        } catch (error) {
            console.error('Request failed:', error)
            toast.error('Request failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
            setResponse({
                status: 0,
                statusText: 'Error',
                time: Date.now() - startTime,
                size: 0,
                headers: {},
                body: { error: error instanceof Error ? error.message : 'Request failed' }
            })
        } finally {
            setLoading(false)
        }
    }

    // Add key-value pair
    const addKeyValuePair = (type: 'params' | 'headers' | 'formData') => {
        const newPair: KeyValuePair = {
            id: `${type}-${Date.now()}`,
            key: '',
            value: '',
            enabled: true
        }

        if (type === 'params') {
            updateActiveRequest({ params: [...activeRequest.params, newPair] })
        } else if (type === 'headers') {
            updateActiveRequest({ headers: [...activeRequest.headers, newPair] })
        } else if (type === 'formData') {
            updateActiveRequest({
                body: {
                    ...activeRequest.body,
                    formData: [...(activeRequest.body.formData || []), newPair]
                }
            })
        }
    }

    // Update key-value pair
    const updateKeyValuePair = (type: 'params' | 'headers' | 'formData', id: string, updates: Partial<KeyValuePair>) => {
        const updateFn = (pairs: KeyValuePair[]) =>
            pairs.map(p => p.id === id ? { ...p, ...updates } : p)

        if (type === 'params') {
            updateActiveRequest({ params: updateFn(activeRequest.params) })
        } else if (type === 'headers') {
            updateActiveRequest({ headers: updateFn(activeRequest.headers) })
        } else if (type === 'formData') {
            updateActiveRequest({
                body: {
                    ...activeRequest.body,
                    formData: updateFn(activeRequest.body.formData || [])
                }
            })
        }
    }

    // Remove key-value pair
    const removeKeyValuePair = (type: 'params' | 'headers' | 'formData', id: string) => {
        const filterFn = (pairs: KeyValuePair[]) => pairs.filter(p => p.id !== id)

        if (type === 'params') {
            updateActiveRequest({ params: filterFn(activeRequest.params) })
        } else if (type === 'headers') {
            updateActiveRequest({ headers: filterFn(activeRequest.headers) })
        } else if (type === 'formData') {
            updateActiveRequest({
                body: {
                    ...activeRequest.body,
                    formData: filterFn(activeRequest.body.formData || [])
                }
            })
        }
    }

    // AI Generate suggestion
    const generateWithAI = async () => {
        if (!aiPrompt.trim()) return

        setAiLoading(true)
        try {
            // Mock AI response - in production this would call your AI endpoint
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Example: parsing a simple prompt
            if (aiPrompt.toLowerCase().includes('get')) {
                updateActiveRequest({ method: 'GET' })
            } else if (aiPrompt.toLowerCase().includes('post')) {
                updateActiveRequest({ method: 'POST' })
            }

            if (aiPrompt.includes('http')) {
                const urlMatch = aiPrompt.match(/https?:\/\/[^\s]+/)
                if (urlMatch) {
                    updateActiveRequest({ url: urlMatch[0] })
                }
            }

            toast.success('AI suggestion applied!')
            setAiPrompt('')
        } catch (error) {
            toast.error('Failed to generate suggestion')
        } finally {
            setAiLoading(false)
        }
    }

    // Key-value editor component
    const KeyValueEditor = ({ type, pairs }: { type: 'params' | 'headers' | 'formData', pairs: KeyValuePair[] }) => (
        <div className="space-y-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="w-6"></div>
                <div>KEY</div>
                <div>VALUE</div>
                <div className="w-8"></div>
                <div className="w-8"></div>
            </div>
            {pairs.map(pair => (
                <div key={pair.id} className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
                    <input
                        type="checkbox"
                        checked={pair.enabled}
                        onChange={(e) => updateKeyValuePair(type, pair.id, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                    />
                    <Input
                        value={pair.key}
                        onChange={(e) => updateKeyValuePair(type, pair.id, { key: e.target.value })}
                        placeholder="Key"
                        className="h-8 text-sm"
                    />
                    <Input
                        value={pair.value}
                        onChange={(e) => updateKeyValuePair(type, pair.id, { value: e.target.value })}
                        placeholder="Value"
                        className="h-8 text-sm"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => removeKeyValuePair(type, pair.id)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => addKeyValuePair(type)}
                className="text-gray-500 hover:text-gray-700"
            >
                <Plus className="w-4 h-4 mr-1" />
                Add
            </Button>
        </div>
    )

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Bar with Logo and Profile */}
            <div className="border-b border-gray-200 bg-white flex-shrink-0">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CircuitLogoIcon className="w-8 h-8" />
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            Cogni<span className="text-primary">Test</span>
                        </h1>
                    </div>
                    <UserNav />
                </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className="px-6 py-2 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            onClick={() => router.push(`/organizations/${uuid}/projects/${projectId}`)}
                            className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-semibold">API Testing</span>
                    </div>

                    {/* Environment Selector */}
                    <div className="flex items-center gap-3">
                        <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {environments.map(env => (
                                    <SelectItem key={env} value={env}>{env}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={showAIPanel ? 'bg-primary/10 border-primary text-primary' : ''}
                        >
                            <Sparkles className="w-4 h-4 mr-1" />
                            AI Assistant
                        </Button>
                    </div>
                </div>
            </div>

            {/* Request Tabs */}
            <div className="border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center px-2">
                    <ScrollArea className="flex-1">
                        <div className="flex items-center gap-1 py-1">
                            {openRequests.map(req => (
                                <button
                                    key={req.id}
                                    onClick={() => setActiveRequestId(req.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm transition-colors group ${activeRequestId === req.id
                                        ? 'bg-gray-100 border border-b-0 border-gray-200'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <Badge className={`${getMethodColor(req.method)} px-1.5 py-0 text-xs font-medium`}>
                                        {req.method}
                                    </Badge>
                                    <span className="max-w-32 truncate">{req.name}</span>
                                    {openRequests.length > 1 && (
                                        <X
                                            className="w-3 h-3 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { e.stopPropagation(); closeRequest(req.id) }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    <Button variant="ghost" size="sm" onClick={addNewRequest} className="ml-1">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Collections Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-700">Collections</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Plus className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Upload className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            {collections.map(collection => (
                                <div key={collection.id}>
                                    <button
                                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-left"
                                        onClick={() => setCollections(prev => prev.map(c =>
                                            c.id === collection.id ? { ...c, isOpen: !c.isOpen } : c
                                        ))}
                                    >
                                        {collection.isOpen ? (
                                            <FolderOpen className="w-4 h-4 text-yellow-500" />
                                        ) : (
                                            <Folder className="w-4 h-4 text-yellow-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                                            {collection.name}
                                        </span>
                                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${collection.isOpen ? 'rotate-90' : ''
                                            }`} />
                                    </button>
                                    {collection.isOpen && (
                                        <div className="ml-4 pl-2 border-l border-gray-100">
                                            {collection.requests.length === 0 ? (
                                                <p className="text-xs text-gray-400 p-2">No requests yet</p>
                                            ) : (
                                                collection.requests.map(req => (
                                                    <button
                                                        key={req.id}
                                                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-left"
                                                    >
                                                        <Badge className={`${getMethodColor(req.method)} px-1 py-0 text-[10px]`}>
                                                            {req.method}
                                                        </Badge>
                                                        <span className="text-sm text-gray-600 truncate">{req.name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Request Builder */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* URL Bar */}
                    <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Select
                                value={activeRequest.method}
                                onValueChange={(value: any) => updateActiveRequest({ method: value })}
                            >
                                <SelectTrigger className={`w-28 h-10 font-semibold ${getMethodColor(activeRequest.method)}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(method => (
                                        <SelectItem key={method} value={method}>
                                            <span className={`font-semibold ${getMethodColor(method).split(' ')[1]}`}>
                                                {method}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                value={activeRequest.url}
                                onChange={(e) => updateActiveRequest({ url: e.target.value })}
                                placeholder="Enter request URL"
                                className="flex-1 h-10 font-mono text-sm"
                            />

                            <Button variant="outline" className="h-10">
                                <Save className="w-4 h-4 mr-1" />
                                Save
                            </Button>

                            <Button
                                onClick={sendRequest}
                                disabled={loading}
                                className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-semibold"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Request Config & Response */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Request Configuration */}
                        <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
                            <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="flex-1 flex flex-col">
                                <TabsList className="w-full justify-start rounded-none border-b bg-white px-4 h-10">
                                    <TabsTrigger value="params" className="text-sm">
                                        Params
                                        {activeRequest.params.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                                                {activeRequest.params.filter(p => p.enabled).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="authorization" className="text-sm">
                                        <Lock className="w-3 h-3 mr-1" />
                                        Authorization
                                    </TabsTrigger>
                                    <TabsTrigger value="headers" className="text-sm">
                                        Headers
                                        {activeRequest.headers.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                                                {activeRequest.headers.filter(h => h.enabled).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="body" className="text-sm">
                                        Body
                                    </TabsTrigger>
                                    <TabsTrigger value="scripts" className="text-sm">
                                        <Terminal className="w-3 h-3 mr-1" />
                                        Scripts
                                    </TabsTrigger>
                                </TabsList>

                                <ScrollArea className="flex-1 bg-white">
                                    <div className="p-4">
                                        <TabsContent value="params" className="m-0">
                                            <KeyValueEditor type="params" pairs={activeRequest.params} />
                                        </TabsContent>

                                        <TabsContent value="authorization" className="m-0 space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium">Type</Label>
                                                <Select
                                                    value={activeRequest.auth.type}
                                                    onValueChange={(value: any) => updateActiveRequest({
                                                        auth: { ...activeRequest.auth, type: value }
                                                    })}
                                                >
                                                    <SelectTrigger className="w-full mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Auth</SelectItem>
                                                        <SelectItem value="bearer">Bearer Token</SelectItem>
                                                        <SelectItem value="basic">Basic Auth</SelectItem>
                                                        <SelectItem value="api-key">API Key</SelectItem>
                                                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {activeRequest.auth.type === 'bearer' && (
                                                <div>
                                                    <Label className="text-sm font-medium">Token</Label>
                                                    <Input
                                                        value={activeRequest.auth.token || ''}
                                                        onChange={(e) => updateActiveRequest({
                                                            auth: { ...activeRequest.auth, token: e.target.value }
                                                        })}
                                                        placeholder="Enter token"
                                                        className="mt-1 font-mono"
                                                    />
                                                </div>
                                            )}

                                            {activeRequest.auth.type === 'basic' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label className="text-sm font-medium">Username</Label>
                                                        <Input
                                                            value={activeRequest.auth.username || ''}
                                                            onChange={(e) => updateActiveRequest({
                                                                auth: { ...activeRequest.auth, username: e.target.value }
                                                            })}
                                                            placeholder="Username"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">Password</Label>
                                                        <Input
                                                            type="password"
                                                            value={activeRequest.auth.password || ''}
                                                            onChange={(e) => updateActiveRequest({
                                                                auth: { ...activeRequest.auth, password: e.target.value }
                                                            })}
                                                            placeholder="Password"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {activeRequest.auth.type === 'api-key' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label className="text-sm font-medium">Key</Label>
                                                        <Input
                                                            value={activeRequest.auth.apiKey || ''}
                                                            onChange={(e) => updateActiveRequest({
                                                                auth: { ...activeRequest.auth, apiKey: e.target.value }
                                                            })}
                                                            placeholder="API Key"
                                                            className="mt-1 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">Header Name</Label>
                                                        <Input
                                                            value={activeRequest.auth.apiKeyHeader || ''}
                                                            onChange={(e) => updateActiveRequest({
                                                                auth: { ...activeRequest.auth, apiKeyHeader: e.target.value }
                                                            })}
                                                            placeholder="X-API-Key"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="headers" className="m-0">
                                            <KeyValueEditor type="headers" pairs={activeRequest.headers} />
                                        </TabsContent>

                                        <TabsContent value="body" className="m-0 space-y-4">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                {['none', 'json', 'form-data', 'x-www-form-urlencoded', 'raw', 'graphql'].map(type => (
                                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="bodyType"
                                                            checked={activeRequest.body.type === type}
                                                            onChange={() => updateActiveRequest({
                                                                body: { ...activeRequest.body, type: type as any }
                                                            })}
                                                            className="w-4 h-4 text-primary"
                                                        />
                                                        <span className={`text-sm ${activeRequest.body.type === type ? 'text-primary font-medium' : 'text-gray-700'}`}>
                                                            {type === 'graphql' ? 'GraphQL' : type}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>

                                            {(activeRequest.body.type === 'json' || activeRequest.body.type === 'raw') && (
                                                <CodeEditor
                                                    value={activeRequest.body.content}
                                                    onChange={(value) => updateActiveRequest({
                                                        body: { ...activeRequest.body, content: value }
                                                    })}
                                                    language={activeRequest.body.type === 'json' ? 'json' : 'text'}
                                                    height="250px"
                                                    placeholder={activeRequest.body.type === 'json' ? '{"key": "value"}' : 'Raw body content'}
                                                />
                                            )}

                                            {(activeRequest.body.type === 'form-data' || activeRequest.body.type === 'x-www-form-urlencoded') && (
                                                <KeyValueEditor type="formData" pairs={activeRequest.body.formData || []} />
                                            )}

                                            {activeRequest.body.type === 'graphql' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* GraphQL Query Panel */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-semibold text-gray-700">QUERY</Label>
                                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-500">
                                                                Prettify
                                                            </Button>
                                                        </div>
                                                        <CodeEditor
                                                            value={activeRequest.body.content}
                                                            onChange={(value) => updateActiveRequest({
                                                                body: { ...activeRequest.body, content: value }
                                                            })}
                                                            language="graphql"
                                                            height="280px"
                                                            placeholder="query { users { id name } }"
                                                        />
                                                    </div>

                                                    {/* GraphQL Variables Panel */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-semibold text-gray-700">GRAPHQL VARIABLES</Label>
                                                            <span className="text-xs text-gray-400">Optional</span>
                                                        </div>
                                                        <CodeEditor
                                                            value={activeRequest.body.graphqlVariables || ''}
                                                            onChange={(value) => updateActiveRequest({
                                                                body: { ...activeRequest.body, graphqlVariables: value }
                                                            })}
                                                            language="json"
                                                            height="280px"
                                                            placeholder='{"userId": 123}'
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="scripts" className="m-0 space-y-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm font-semibold text-gray-700">Pre-request Script</Label>
                                                    <span className="text-xs text-gray-400">JavaScript • Runs before request</span>
                                                </div>
                                                <CodeEditor
                                                    value={activeRequest.preRequestScript || ''}
                                                    onChange={(value) => updateActiveRequest({ preRequestScript: value })}
                                                    language="javascript"
                                                    height="180px"
                                                    placeholder="// Set environment variables, handle auth, etc."
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm font-semibold text-gray-700">Post-request Script</Label>
                                                    <span className="text-xs text-gray-400">JavaScript • Runs after response</span>
                                                </div>
                                                <CodeEditor
                                                    value={activeRequest.testScript || ''}
                                                    onChange={(value) => updateActiveRequest({ testScript: value })}
                                                    language="javascript"
                                                    height="180px"
                                                    placeholder="// pm.test('Status is 200', () => pm.response.to.have.status(200));"
                                                />
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </Tabs>
                        </div>

                        {/* Response Panel */}
                        <div className="w-[45%] flex flex-col overflow-hidden bg-white">
                            <div className="border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-sm text-gray-700">Response</span>
                                    {response && (
                                        <>
                                            <Badge className={`${getStatusColor(response.status)} px-2 py-0.5`}>
                                                {response.status} {response.statusText}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{response.time}ms</span>
                                            <span className="text-xs text-gray-500">{(response.size / 1024).toFixed(2)}KB</span>
                                        </>
                                    )}
                                </div>
                                {response && (
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {response ? (
                                <Tabs value={activeResponseTab} onValueChange={setActiveResponseTab} className="flex-1 flex flex-col overflow-hidden">
                                    <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 px-4 h-9 flex-shrink-0">
                                        <TabsTrigger value="body" className="text-xs">
                                            <FileJson className="w-3 h-3 mr-1" />
                                            Body
                                        </TabsTrigger>
                                        <TabsTrigger value="headers" className="text-xs">
                                            <FileText className="w-3 h-3 mr-1" />
                                            Headers
                                        </TabsTrigger>
                                        <TabsTrigger value="cookies" className="text-xs">
                                            <Cookie className="w-3 h-3 mr-1" />
                                            Cookies
                                        </TabsTrigger>
                                    </TabsList>

                                    <ScrollArea className="flex-1">
                                        <TabsContent value="body" className="m-0 p-4">
                                            <CodeEditor
                                                value={typeof response.body === 'object'
                                                    ? JSON.stringify(response.body, null, 2)
                                                    : String(response.body)}
                                                onChange={() => { }}
                                                language="json"
                                                height="400px"
                                                readOnly={true}
                                            />
                                        </TabsContent>

                                        <TabsContent value="headers" className="m-0 p-4">
                                            <div className="space-y-2">
                                                {Object.entries(response.headers).map(([key, value]) => (
                                                    <div key={key} className="flex items-start gap-2 text-sm">
                                                        <span className="font-medium text-gray-700 min-w-32">{key}:</span>
                                                        <span className="text-gray-600 font-mono">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="cookies" className="m-0 p-4">
                                            {response.cookies && Object.keys(response.cookies).length > 0 ? (
                                                <div className="space-y-2">
                                                    {Object.entries(response.cookies).map(([key, value]) => (
                                                        <div key={key} className="flex items-start gap-2 text-sm">
                                                            <span className="font-medium text-gray-700">{key}:</span>
                                                            <span className="text-gray-600 font-mono">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No cookies received</p>
                                            )}
                                        </TabsContent>
                                    </ScrollArea>
                                </Tabs>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Send className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No response yet</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Click Send to make a request
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Assistant Panel */}
                {showAIPanel && (
                    <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-sm">AI Assistant</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowAIPanel(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                {/* Quick Actions */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Quick Actions</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                                            <Wand2 className="w-3 h-3 mr-1" />
                                            Generate Tests
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                                            <FileText className="w-3 h-3 mr-1" />
                                            Generate Docs
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                                            <Code2 className="w-3 h-3 mr-1" />
                                            From cURL
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Debug Error
                                        </Button>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Suggestions</p>
                                    <div className="space-y-2">
                                        <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <p className="text-sm font-medium text-gray-700">Add Authorization</p>
                                            <p className="text-xs text-gray-500 mt-1">This endpoint might need authentication</p>
                                        </button>
                                        <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <p className="text-sm font-medium text-gray-700">Add Content-Type Header</p>
                                            <p className="text-xs text-gray-500 mt-1">Recommended for POST requests</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* AI Input */}
                        <div className="p-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ask AI anything..."
                                    className="flex-1 h-9 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
                                />
                                <Button
                                    size="sm"
                                    onClick={generateWithAI}
                                    disabled={aiLoading || !aiPrompt.trim()}
                                    className="h-9"
                                >
                                    {aiLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
