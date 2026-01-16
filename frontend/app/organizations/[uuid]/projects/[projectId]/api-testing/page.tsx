'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserNav } from '@/components/layout/user-nav'
import {
    Send, Save, Plus, X, ChevronDown, ChevronRight, Home, Play,
    FileJson, Folder, FolderOpen, MoreHorizontal, Upload, Download,
    Settings, Settings2, Clock, Copy, Check, AlertCircle, Loader2,
    Sparkles, MessageSquare, Code2, Eye, FileText, Cookie,
    Link2, Lock, Key, Hash, Terminal, Wand2, Trash2, GripVertical, Edit2
} from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircuitLogoIcon } from '@/components/ui/CircuitLogoIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CodeEditor } from '@/components/api-testing/CodeEditor'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnvironmentManager, type Environment, type EnvironmentVariable } from '@/components/api-testing/EnvironmentManager'
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
        rawType?: 'text' | 'json' | 'xml' | 'html' | 'javascript'
        formData?: KeyValuePair[]
        graphqlVariables?: string
    }
    auth: {
        type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2' | 'digest' | 'hawk' | 'aws' | 'ntlm'
        token?: string
        username?: string
        password?: string
        apiKey?: string
        apiKeyHeader?: string
        realm?: string
        nonce?: string
        algorithm?: string
        qop?: string
        opaque?: string
        hawkId?: string
        hawkKey?: string
        awsAccessKey?: string
        awsSecretKey?: string
        awsRegion?: string
        awsService?: string
        ntlmDomain?: string
        ntlmWorkstation?: string
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

// Drag and Drop Components
const DraggableItem = ({ id, children, type, name }: { id: string; children: React.ReactNode; type: string; name: string }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group/drag">
            <div
                {...attributes}
                {...listeners}
                className="absolute left-[-2px] top-1/2 -translate-y-1/2 opacity-0 group-hover/drag:opacity-100 cursor-grab active:cursor-grabbing p-1 z-10"
            >
                <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
            {children}
        </div>
    );
};

const DroppableContainer = ({ id, children, type }: { id: string; children: React.ReactNode; type: string }) => {
    const { setNodeRef, isOver } = useSortable({ id, data: { type, id } });

    return (
        <div
            ref={setNodeRef}
            className={`transition-colors duration-200 rounded-lg ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}`}
        >
            {children}
        </div>
    );
};
const HEADER_PRESETS = [
    { key: 'Content-Type', value: 'application/json', description: 'JSON body' },
    { key: 'Accept', value: 'application/json', description: 'Accept JSON response' },
    { key: 'Authorization', value: 'Bearer {{token}}', description: 'Bearer authentication' },
    { key: 'User-Agent', value: 'Cognitest/1.0', description: 'Client identification' },
    { key: 'Cache-Control', value: 'no-cache', description: 'Disable caching' },
    { key: 'Origin', value: 'http://localhost:3000', description: 'Cross-origin request' },
]

const createNewRequest = (): APIRequest => ({
    id: `req-${Date.now()}`,
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [],
    headers: [
        { id: 'h1', key: 'Content-Type', value: 'application/json', description: 'Standard content type', enabled: true }
    ],
    body: { type: 'none', content: '', rawType: 'json' },
    auth: { type: 'none' },
    preRequestScript: '',
    testScript: ''
})

export default function APITestingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const uuid = params.uuid as string

    // Request tabs state
    const [openRequests, setOpenRequests] = useState<APIRequest[]>([])
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    // Load state from localStorage on mount
    useEffect(() => {
        const savedRequests = localStorage.getItem(`api-testing-tabs-${projectId}`)
        const savedActiveId = localStorage.getItem(`api-testing-active-tab-${projectId}`)

        if (savedRequests) {
            try {
                const parsed = JSON.parse(savedRequests)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setOpenRequests(parsed)
                    if (savedActiveId && parsed.find((r: any) => r.id === savedActiveId)) {
                        setActiveRequestId(savedActiveId)
                    } else {
                        setActiveRequestId(parsed[0].id)
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved tabs", e)
            }
        }
        setIsInitialLoad(false)
    }, [projectId])

    // Persistence
    useEffect(() => {
        if (isInitialLoad) return
        localStorage.setItem(`api-testing-tabs-${projectId}`, JSON.stringify(openRequests))
        if (activeRequestId) {
            localStorage.setItem(`api-testing-active-tab-${projectId}`, activeRequestId)
        } else {
            localStorage.removeItem(`api-testing-active-tab-${projectId}`)
        }
    }, [openRequests, activeRequestId, projectId, isInitialLoad])

    // Current request state
    const activeRequest = openRequests.find(r => r.id === activeRequestId) || null

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

    // Environment state - now fetched from backend
    const [environments, setEnvironments] = useState<Environment[]>([])
    const [environmentsLoading, setEnvironmentsLoading] = useState(true)
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null)
    const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false)
    const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [saveTarget, setSaveTarget] = useState({ collectionId: '', folderId: '' })

    // Sidebar state
    const [activeSidebarTab, setActiveSidebarTab] = useState<'collections' | 'history'>('collections')
    const [searchQuery, setSearchQuery] = useState('')
    const [history, setHistory] = useState<any[]>([])

    // Dialogs state
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
    const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false)
    const [targetId, setTargetId] = useState<string | null>(null)
    const [targetType, setTargetType] = useState<'collection' | 'folder' | 'request' | null>(null)
    const [tempName, setTempName] = useState('')

    // Drag and drop state
    const [activeDragItem, setActiveDragItem] = useState<{ id: string; type: string; name: string } | null>(null);

    // AI Assistant state
    const [showAIPanel, setShowAIPanel] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Active UI tabs
    const [activeConfigTab, setActiveConfigTab] = useState('params')
    const [activeResponseTab, setActiveResponseTab] = useState('body')
    const [responseBodyMode, setResponseBodyMode] = useState<'pretty' | 'raw' | 'preview'>('pretty')
    const [editingTabId, setEditingTabId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch environments from backend on mount
    useEffect(() => {
        const fetchEnvironments = async () => {
            try {
                setEnvironmentsLoading(true)
                const response = await fetch(`${API_URL}/api/v1/api-testing/environments/${projectId}`, {
                    credentials: 'include'
                })
                if (response.ok) {
                    const data = await response.json()
                    setEnvironments(data)
                    // Set default environment if one exists
                    const defaultEnv = data.find((e: Environment) => e.is_default)
                    if (defaultEnv) {
                        setSelectedEnvId(defaultEnv.id)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch environments:', error)
            } finally {
                setEnvironmentsLoading(false)
            }
        }
        fetchEnvironments()
    }, [projectId])

    // Environment API functions
    const createEnvironmentAPI = async (name: string, variables: any[] = []) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/environments`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    project_id: projectId,
                    variables,
                    is_default: environments.length === 0
                })
            })
            if (response.ok) {
                const newEnv = await response.json()
                setEnvironments(prev => [...prev, newEnv])
                return newEnv
            }
        } catch (error) {
            console.error('Failed to create environment:', error)
            toast.error('Failed to create environment')
        }
        return null
    }

    const updateEnvironmentAPI = async (envId: string, updates: Partial<Environment>) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/environments/${envId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (response.ok) {
                const updatedEnv = await response.json()
                setEnvironments(prev => prev.map(e => e.id === envId ? updatedEnv : e))
                return updatedEnv
            }
        } catch (error) {
            console.error('Failed to update environment:', error)
            toast.error('Failed to update environment')
        }
        return null
    }

    const deleteEnvironmentAPI = async (envId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/environments/${envId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (response.ok) {
                setEnvironments(prev => prev.filter(e => e.id !== envId))
                if (selectedEnvId === envId) {
                    setSelectedEnvId(null)
                }
                return true
            }
        } catch (error) {
            console.error('Failed to delete environment:', error)
            toast.error('Failed to delete environment')
        }
        return false
    }

    // Variable interpolation helper
    const interpolateVariables = (text: string): string => {
        if (!selectedEnvId) return text
        const selectedEnv = environments.find(e => e.id === selectedEnvId)
        if (!selectedEnv) return text

        let result = text
        selectedEnv.variables
            .filter(v => v.enabled)
            .forEach(v => {
                const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g')
                result = result.replace(regex, v.value)
            })
        return result
    }

    const updateActiveRequest = (updates: Partial<APIRequest>) => {
        if (!activeRequestId) return
        setOpenRequests(prev => prev.map(r =>
            r.id === activeRequestId ? { ...r, ...updates } : r
        ))
    }

    const deleteCollection = (id: string) => {
        setCollections(prev => prev.filter(c => c.id !== id))
    }

    const addRequestToCollection = (collectionId: string, folderId?: string) => {
        const newReq = { ...activeRequest!, id: `req-${Date.now()}` }
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                if (folderId) {
                    const updateFolders = (folders: Collection[]): Collection[] => {
                        return folders.map(f => {
                            if (f.id === folderId) {
                                return { ...f, requests: [...(f.requests || []), newReq] }
                            }
                            if (f.folders) return { ...f, folders: updateFolders(f.folders) }
                            return f
                        })
                    }
                    return { ...c, folders: updateFolders(c.folders || []) }
                }
                return { ...c, requests: [...c.requests, newReq], isOpen: true }
            }
            return c
        }))
        toast.success('Request saved to collection')
    }

    const handleSaveRequest = () => {
        if (!activeRequest) return
        setIsSaveDialogOpen(true)
    }

    const addFolderToCollection = (collectionId: string, name: string) => {
        const newFolder: Collection = {
            id: `folder-${Date.now()}`,
            name,
            requests: [],
            folders: [],
            isOpen: true
        }
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                return { ...c, folders: [...(c.folders || []), newFolder], isOpen: true }
            }
            return c
        }))
    }

    const duplicateRequest = (req: APIRequest, parentId: string) => {
        const newReq = { ...req, id: `req-${Date.now()}`, name: `${req.name} (Copy)` }
        setCollections(prev => prev.map(c => {
            if (c.id === parentId) {
                return { ...c, requests: [...c.requests, newReq] }
            }
            return {
                ...c,
                folders: (c.folders || []).map(f => f.id === parentId ? { ...f, requests: [...f.requests, newReq] } : f)
            }
        }))
        setOpenRequests(prev => [...prev, newReq])
        setActiveRequestId(newReq.id)
    }

    const deleteRequest = (id: string) => {
        setCollections(prev => prev.map(c => ({
            ...c,
            requests: c.requests.filter(r => r.id !== id),
            folders: (c.folders || []).map(f => ({ ...f, requests: f.requests.filter(r => r.id !== id) }))
        })))
        setOpenRequests(prev => prev.filter(r => r.id !== id))
        if (activeRequestId === id && openRequests.length > 1) {
            setActiveRequestId(openRequests[0].id)
        }
    }

    const handleRename = () => {
        if (!targetId || !tempName.trim()) return
        setCollections(prev => prev.map(c => {
            if (c.id === targetId) return { ...c, name: tempName }
            return {
                ...c,
                folders: (c.folders || []).map(f => f.id === targetId ? { ...f, name: tempName } : f),
                requests: c.requests.map(r => r.id === targetId ? { ...r, name: tempName } : r)
            }
        }))
        setOpenRequests(prev => prev.map(r => r.id === targetId ? { ...r, name: tempName } : r))
        setIsRenameDialogOpen(false)
    }

    // Drag and drop handlers
    const moveRequest = async (requestId: string, targetId: string, isToRoot: boolean = false) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/requests/${requestId}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collection_id: isToRoot ? targetId : targetId,
                    folder_id: isToRoot ? null : targetId
                }),
            });
            if (!response.ok) throw new Error('Failed to move request');
            // Refresh collections after move
            // fetchCollections(); 
        } catch (error) {
            console.error('Error moving request:', error);
            toast.error('Failed to move request');
        }
    };

    const moveFolder = async (folderId: string, targetId: string, isToRoot: boolean = false) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/collections/${folderId}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent_id: isToRoot ? null : targetId
                }),
            });
            if (!response.ok) throw new Error('Failed to move folder');
            // Refresh collections after move
            // fetchCollections();
        } catch (error) {
            console.error('Error moving folder:', error);
            toast.error('Failed to move folder');
        }
    };

    const handleDragStart = (event: any) => {
        const { active } = event;
        const data = active.data.current;
        if (data) {
            setActiveDragItem({
                id: active.id,
                type: data.type,
                name: data.name || 'Item'
            });
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'request') {
            if (overType === 'folder' || overType === 'collection') {
                await moveRequest(activeId, overId, overType === 'collection');
            }
        } else if (activeType === 'folder') {
            if (overType === 'collection' || overType === 'folder') {
                await moveFolder(activeId, overId, overType === 'collection');
            }
        }
    };

    // Add new request tab
    const addNewRequest = () => {
        const newReq = createNewRequest()
        setOpenRequests(prev => [...prev, newReq])
        setActiveRequestId(newReq.id)
    }

    // Close request tab
    const closeRequest = (id: string) => {
        const newRequests = openRequests.filter(r => r.id !== id)
        setOpenRequests(newRequests)
        if (newRequests.length === 0) {
            setActiveRequestId(null)
        } else if (activeRequestId === id) {
            setActiveRequestId(newRequests[newRequests.length - 1]?.id || null)
        }
    }

    const closeAllRequests = () => {
        setOpenRequests([])
        setActiveRequestId(null)
    }

    // Send request
    const sendRequest = async () => {
        if (!activeRequest) return
        if (!activeRequest.url) {
            toast.error('Please enter a URL')
            return
        }

        setLoading(true)
        setResponse(null)
        const startTime = Date.now()

        try {
            // Build URL with params and apply variable interpolation
            let url = interpolateVariables(activeRequest.url)
            const enabledParams = activeRequest.params.filter(p => p.enabled && p.key)
            if (enabledParams.length > 0) {
                const searchParams = new URLSearchParams()
                enabledParams.forEach(p => searchParams.append(
                    interpolateVariables(p.key),
                    interpolateVariables(p.value)
                ))
                url += (url.includes('?') ? '&' : '?') + searchParams.toString()
            }

            // Build headers with variable interpolation
            const headers: Record<string, string> = {}
            activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[interpolateVariables(h.key)] = interpolateVariables(h.value)
            })

            // Add auth headers with variable interpolation
            if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
                headers['Authorization'] = `Bearer ${interpolateVariables(activeRequest.auth.token)}`
            } else if (activeRequest.auth.type === 'basic' && activeRequest.auth.username) {
                const encoded = btoa(`${interpolateVariables(activeRequest.auth.username)}:${interpolateVariables(activeRequest.auth.password || '')}`)
                headers['Authorization'] = `Basic ${encoded}`
            } else if (activeRequest.auth.type === 'api-key' && activeRequest.auth.apiKey) {
                headers[activeRequest.auth.apiKeyHeader || 'X-API-Key'] = interpolateVariables(activeRequest.auth.apiKey)
            }

            // Build body with variable interpolation
            let body: string | FormData | undefined
            if (['POST', 'PUT', 'PATCH'].includes(activeRequest.method)) {
                if (activeRequest.body.type === 'json' || activeRequest.body.type === 'raw') {
                    body = interpolateVariables(activeRequest.body.content)
                } else if (activeRequest.body.type === 'form-data' && activeRequest.body.formData) {
                    const formData = new FormData()
                    activeRequest.body.formData.filter(f => f.enabled && f.key).forEach(f => {
                        formData.append(interpolateVariables(f.key), interpolateVariables(f.value))
                    })
                    body = formData
                    delete headers['Content-Type'] // Let browser set it
                } else if (activeRequest.body.type === 'x-www-form-urlencoded' && activeRequest.body.formData) {
                    const params = new URLSearchParams()
                    activeRequest.body.formData.filter(f => f.enabled && f.key).forEach(f => {
                        params.append(interpolateVariables(f.key), interpolateVariables(f.value))
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
        if (!activeRequest) return
        const newPair: KeyValuePair = { id: Math.random().toString(36).substr(2, 9), key: '', value: '', description: '', enabled: true }

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
        if (!activeRequest) return
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
        if (!activeRequest) return
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
        if (!activeRequest || !aiPrompt.trim()) return

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
    const KeyValueEditor = ({ type, pairs }: { type: 'params' | 'headers' | 'formData', pairs: KeyValuePair[] }) => {
        const [isBulkEdit, setIsBulkEdit] = useState(false)
        const [bulkValue, setBulkValue] = useState('')

        const toggleBulkEdit = () => {
            if (isBulkEdit) {
                // Parse bulk text back to pairs (Key: Value // Description)
                const lines = bulkValue.split('\n')
                const newPairs: KeyValuePair[] = lines
                    .filter(line => line.trim())
                    .map(line => {
                        const [content, description] = line.split('//')
                        const [key, ...valueParts] = content.split(':')
                        return {
                            id: Math.random().toString(36).substr(2, 9),
                            key: key?.trim() || '',
                            value: valueParts.join(':')?.trim() || '',
                            description: description?.trim() || '',
                            enabled: true
                        }
                    })

                if (type === 'params') updateActiveRequest({ params: newPairs })
                else if (type === 'headers') updateActiveRequest({ headers: newPairs })
                else if (type === 'formData') updateActiveRequest({ body: { ...activeRequest!.body, formData: newPairs } })
            } else {
                // Convert pairs to bulk text
                const text = pairs.map(p => `${p.key}: ${p.value}${p.description ? ` // ${p.description}` : ''}`).join('\n')
                setBulkValue(text)
            }
            setIsBulkEdit(!isBulkEdit)
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        {type}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleBulkEdit}
                        className="h-7 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/5 uppercase tracking-wider px-2"
                    >
                        {isBulkEdit ? 'Show Table' : 'Bulk Edit'}
                    </Button>
                </div>

                {isBulkEdit ? (
                    <Textarea
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        placeholder="key: value // description"
                        className="font-mono text-sm min-h-[200px] resize-y bg-white border-gray-300 focus:border-primary/40 transition-all p-4 rounded-xl shadow-sm"
                    />
                ) : (
                    <div className="space-y-0 relative">
                        <div className="grid grid-cols-[36px_1fr_1.5fr_1fr_40px] gap-0 text-[10px] font-black text-gray-500 px-1 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">
                            <div className="flex justify-center"></div>
                            <div className="pl-2">Key</div>
                            <div className="pl-2">Value</div>
                            <div className="pl-2">Description</div>
                            <div></div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {pairs.map(pair => (
                                <div key={pair.id} className="grid grid-cols-[36px_1fr_1.5fr_1fr_40px] gap-0 items-center group/kv hover:bg-gray-50 transition-colors py-0.5">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={pair.enabled}
                                            onChange={(e) => updateKeyValuePair(type, pair.id, { enabled: e.target.checked })}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                                        />
                                    </div>
                                    <input
                                        value={pair.key}
                                        onChange={(e) => updateKeyValuePair(type, pair.id, { key: e.target.value })}
                                        placeholder="Key"
                                        className="h-9 text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-800 font-medium placeholder:text-gray-300 placeholder:font-normal"
                                    />
                                    <input
                                        value={pair.value}
                                        onChange={(e) => updateKeyValuePair(type, pair.id, { value: e.target.value })}
                                        placeholder="Value"
                                        className="h-9 text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-600 font-mono placeholder:text-gray-300 placeholder:font-normal"
                                    />
                                    <input
                                        value={pair.description}
                                        onChange={(e) => updateKeyValuePair(type, pair.id, { description: e.target.value })}
                                        placeholder="Add description..."
                                        className="h-9 text-[12px] bg-transparent border-none focus:ring-0 px-2 text-gray-400 italic placeholder:text-gray-200"
                                    />
                                    <div className="flex items-center justify-center opacity-0 group-hover/kv:opacity-100 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => removeKeyValuePair(type, pair.id)}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addKeyValuePair(type)}
                                className="h-8 text-[12px] font-semibold text-primary/60 hover:text-primary hover:bg-primary/5 pl-2 pr-4 rounded-lg group/add"
                            >
                                <Plus className="w-4 h-4 mr-2 text-primary/40 group-hover/add:text-primary transition-colors" />
                                Add Row
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Top Bar with Logo and Profile */}
            <div className="border-b border-gray-300 bg-white flex-shrink-0">
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

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-300 shadow-sm">
                            <Select
                                value={selectedEnvId || ''}
                                onValueChange={(val) => setSelectedEnvId(val || null)}
                                open={envDropdownOpen}
                                onOpenChange={setEnvDropdownOpen}
                            >
                                <SelectTrigger className="w-44 h-8 text-xs border-none bg-transparent shadow-none focus:ring-0 font-bold text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedEnvId ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                                        <SelectValue placeholder="No Environment" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl p-1">
                                    {environments.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-gray-500 text-center">
                                            No environments yet
                                        </div>
                                    ) : (
                                        environments.map((env: Environment) => (
                                            <SelectItem key={env.id} value={env.id} className="rounded-lg text-xs font-bold py-2.5">
                                                {env.name}
                                            </SelectItem>
                                        ))
                                    )}
                                    <div className="my-1 border-t border-gray-100" />
                                    <button
                                        className="w-full flex items-center gap-2 px-2 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        onClick={() => {
                                            setEnvDropdownOpen(false)
                                            setIsEnvDialogOpen(true)
                                        }}
                                    >
                                        <Settings2 className="w-3.5 h-3.5" />
                                        Manage Environments
                                    </button>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-[1px] h-4 bg-gray-200 mx-1" />

                        <Button
                            size="sm"
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className={`h-9 px-4 text-xs font-black uppercase tracking-widest transition-all bg-primary text-white shadow-lg hover:bg-primary/90 ${showAIPanel
                                ? 'shadow-inner scale-[0.98] ring-2 ring-primary/20 bg-primary/95'
                                : 'shadow-primary/20'}`}
                        >
                            <span className="inline-flex items-center text-white">
                                <Sparkles className="w-3.5 h-3.5 mr-2" />
                                AI Assistant
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Request Tabs */}
            <div className="border-b border-gray-300 bg-white flex-shrink-0">
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
                                    <Badge className={`${getMethodColor(req.method)} px-1.5 py-0 text-[10px] font-black pointer-events-none`}>
                                        {req.method}
                                    </Badge>
                                    {editingTabId === req.id ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-24 text-sm font-medium text-primary select-all"
                                            value={req.name}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                setOpenRequests(prev => prev.map(r =>
                                                    r.id === req.id ? { ...r, name: newName } : r
                                                ));
                                            }}
                                            onBlur={() => setEditingTabId(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingTabId(null)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span
                                            className="max-w-32 truncate select-none"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setActiveRequestId(req.id);
                                                setEditingTabId(req.id);
                                            }}
                                        >
                                            {req.name}
                                        </span>
                                    )}
                                    <X
                                        className="w-3 h-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeRequest(req.id);
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    {openRequests.length > 0 && (
                        <button
                            onClick={closeAllRequests}
                            className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest px-3 py-1 transition-colors border-r border-gray-200 mr-1"
                        >
                            Close All
                        </button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addNewRequest}
                        className="h-8 px-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                        Add <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Collections Sidebar */}
                <div className="w-64 border-r border-gray-300 bg-white flex-shrink-0 flex flex-col">
                    <div className="flex items-center px-3 border-b border-gray-200 bg-gray-50/50">
                        <button
                            onClick={() => setActiveSidebarTab('collections')}
                            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeSidebarTab === 'collections' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Collections
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('history')}
                            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeSidebarTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            History
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {activeSidebarTab === 'collections' ? (
                            <>
                                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                    <DroppableContainer id="root" type="collection">
                                        <span className="font-semibold text-sm text-gray-700">Workspace</span>
                                    </DroppableContainer>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setIsNewCollectionOpen(true)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <Upload className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-0.5">
                                        {collections.map(collection => (
                                            <DroppableContainer key={collection.id} id={collection.id} type="collection">
                                                <div className="group/col">
                                                    <div className="flex items-center gap-1 group/row">
                                                        <button
                                                            className={`flex-1 flex items-center gap-2 p-1.5 rounded-lg text-left transition-all ${collection.isOpen ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
                                                            onClick={() => setCollections(prev => prev.map(c =>
                                                                c.id === collection.id ? { ...c, isOpen: !c.isOpen } : c
                                                            ))}
                                                        >
                                                            {collection.isOpen ? (
                                                                <FolderOpen className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                                                            ) : (
                                                                <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                                                            )}
                                                            <span className="text-[13px] font-medium text-gray-700 flex-1 truncate">
                                                                {collection.name}
                                                            </span>
                                                            <ChevronRight className={`w-3 h-3 text-gray-300 transition-transform duration-200 ${collection.isOpen ? 'rotate-90 text-gray-500' : ''}`} />
                                                        </button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover/row:opacity-100">
                                                                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-48">
                                                                <DropdownMenuItem onClick={() => addRequestToCollection(collection.id)}>
                                                                    <Plus className="w-4 h-4 mr-2" /> New Request
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => addFolderToCollection(collection.id, 'New Folder')}>
                                                                    <Folder className="w-4 h-4 mr-2" /> New Folder
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => {
                                                                    setTargetId(collection.id);
                                                                    setTargetType('collection');
                                                                    setTempName(collection.name);
                                                                    setIsRenameDialogOpen(true);
                                                                }}>
                                                                    <Edit2 className="w-4 h-4 mr-2" /> Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteCollection(collection.id)}>
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {collection.isOpen && (
                                                        <div className="ml-5 border-l border-gray-100 mt-0.5 space-y-0.5 pl-1 py-1">
                                                            {(() => {
                                                                const renderFolderItems = (folder: Collection, depth: number = 0): React.ReactNode => (
                                                                    <DroppableContainer key={folder.id} id={folder.id} type="folder">
                                                                        <DraggableItem id={folder.id} type="folder" name={folder.name}>
                                                                            <div className="group/folder">
                                                                                <div className="flex items-center gap-1 group/row-f pl-3">
                                                                                    <button
                                                                                        className={`flex-1 flex items-center gap-2 p-1.5 rounded-lg text-left transition-all ${folder.isOpen ? 'bg-gray-50/30' : 'hover:bg-gray-50'}`}
                                                                                        onClick={() => {
                                                                                            const toggleFolderRecursive = (cols: Collection[]): Collection[] =>
                                                                                                cols.map(c => c.id === folder.id
                                                                                                    ? { ...c, isOpen: !c.isOpen }
                                                                                                    : { ...c, folders: c.folders ? toggleFolderRecursive(c.folders) : [] }
                                                                                                )
                                                                                            setCollections(prev => prev.map(col => ({
                                                                                                ...col,
                                                                                                folders: toggleFolderRecursive(col.folders || [])
                                                                                            })))
                                                                                        }}
                                                                                    >
                                                                                        {folder.isOpen ? (
                                                                                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                                                                                        ) : (
                                                                                            <Folder className="w-3.5 h-3.5 text-amber-400" />
                                                                                        )}
                                                                                        <span className="text-[12px] text-gray-600 truncate flex-1">{folder.name}</span>
                                                                                        <ChevronRight className={`w-3 h-3 text-gray-300 transition-transform ${folder.isOpen ? 'rotate-90' : ''}`} />
                                                                                    </button>

                                                                                    <DropdownMenu>
                                                                                        <DropdownMenuTrigger asChild>
                                                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover/row-f:opacity-100">
                                                                                                <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>
                                                                                        <DropdownMenuContent align="start" className="w-48">
                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                const newReq = createNewRequest()
                                                                                                setCollections(prev => prev.map(c => ({
                                                                                                    ...c,
                                                                                                    folders: c.folders?.map(f => f.id === folder.id ? { ...f, requests: [...f.requests, newReq] } : f)
                                                                                                })))
                                                                                                setOpenRequests(prev => [...prev, newReq])
                                                                                                setActiveRequestId(newReq.id)
                                                                                            }}>
                                                                                                <Plus className="w-4 h-4 mr-2" /> New Request
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                setTargetId(folder.id);
                                                                                                setTargetType('folder');
                                                                                                setTempName(folder.name);
                                                                                                setIsRenameDialogOpen(true);
                                                                                            }}>
                                                                                                <Edit2 className="w-4 h-4 mr-2" /> Rename
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem className="text-red-600" onClick={() => {
                                                                                                setCollections(prev => prev.map(c => ({
                                                                                                    ...c,
                                                                                                    folders: c.folders?.filter(f => f.id !== folder.id)
                                                                                                })))
                                                                                            }}>
                                                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                                            </DropdownMenuItem>
                                                                                        </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                </div>
                                                                                {folder.isOpen && (
                                                                                    <div className="ml-4 border-l border-gray-100 space-y-0.5 mt-0.5 pl-1 py-1">
                                                                                        {folder.folders?.map(subfolder => renderFolderItems(subfolder, depth + 1))}
                                                                                        {folder.requests.map(req => (
                                                                                            <DraggableItem key={req.id} id={req.id} type="request" name={req.name}>
                                                                                                <div className="flex items-center group/req pl-3">
                                                                                                    <button
                                                                                                        className="flex-1 flex items-center gap-2 p-1.5 rounded-lg hover:bg-primary/[0.03] hover:text-primary transition-all text-left"
                                                                                                        onClick={() => {
                                                                                                            setOpenRequests(prev => prev.find(r => r.id === req.id) ? prev : [...prev, req])
                                                                                                            setActiveRequestId(req.id)
                                                                                                        }}
                                                                                                    >
                                                                                                        <span className={`text-[8px] font-black w-7 text-center rounded px-1 py-0.5 ${getMethodColor(req.method)}`}>
                                                                                                            {req.method}
                                                                                                        </span>
                                                                                                        <span className="text-[12px] text-gray-500 group-hover/req:text-primary truncate flex-1">{req.name}</span>
                                                                                                    </button>
                                                                                                    <DropdownMenu>
                                                                                                        <DropdownMenuTrigger asChild>
                                                                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/req:opacity-100">
                                                                                                                <MoreHorizontal className="w-3 h-3 text-gray-400" />
                                                                                                            </Button>
                                                                                                        </DropdownMenuTrigger>
                                                                                                        <DropdownMenuContent align="start" className="w-48">
                                                                                                            <DropdownMenuItem onClick={() => duplicateRequest(req, folder.id)}>
                                                                                                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                                                                                                            </DropdownMenuItem>
                                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                                setTargetId(req.id);
                                                                                                                setTargetType('request');
                                                                                                                setTempName(req.name);
                                                                                                                setIsRenameDialogOpen(true);
                                                                                                            }}>
                                                                                                                <Edit2 className="w-4 h-4 mr-2" /> Rename
                                                                                                            </DropdownMenuItem>
                                                                                                            <DropdownMenuSeparator />
                                                                                                            <DropdownMenuItem className="text-red-600" onClick={() => deleteRequest(req.id)}>
                                                                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                                                            </DropdownMenuItem>
                                                                                                        </DropdownMenuContent>
                                                                                                    </DropdownMenu>
                                                                                                </div>
                                                                                            </DraggableItem>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </DraggableItem>
                                                                    </DroppableContainer>
                                                                )
                                                                return collection.folders?.map(folder => renderFolderItems(folder))
                                                            })()}

                                                            {/* Root level requests in collection */}
                                                            {collection.requests.map(req => (
                                                                <DraggableItem key={req.id} id={req.id} type="request" name={req.name}>
                                                                    <div className="flex items-center group/req pl-3">
                                                                        <button
                                                                            className="flex-1 flex items-center gap-2 p-1.5 rounded-lg hover:bg-primary/[0.03] hover:text-primary transition-all text-left"
                                                                            onClick={() => {
                                                                                setOpenRequests(prev => prev.find(r => r.id === req.id) ? prev : [...prev, req])
                                                                                setActiveRequestId(req.id)
                                                                            }}
                                                                        >
                                                                            <span className={`text-[8px] font-black w-7 text-center rounded px-1 py-0.5 ${getMethodColor(req.method)}`}>
                                                                                {req.method}
                                                                            </span>
                                                                            <span className="text-[12px] text-gray-500 group-hover/req:text-primary truncate flex-1">{req.name}</span>
                                                                        </button>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/req:opacity-100">
                                                                                    <MoreHorizontal className="w-3 h-3 text-gray-400" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="start" className="w-48">
                                                                                <DropdownMenuItem onClick={() => duplicateRequest(req, collection.id)}>
                                                                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => {
                                                                                    setTargetId(req.id);
                                                                                    setTargetType('request');
                                                                                    setTempName(req.name);
                                                                                    setIsRenameDialogOpen(true);
                                                                                }}>
                                                                                    <Edit2 className="w-4 h-4 mr-2" /> Rename
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteRequest(req.id)}>
                                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </DraggableItem>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </DroppableContainer>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <DragOverlay>
                                    {activeDragItem && (
                                        <div className="p-2 bg-white rounded-lg shadow-lg border border-primary/20 text-sm">
                                            {activeDragItem.type === 'folder' ? (
                                                <div className="flex items-center gap-2">
                                                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>{activeDragItem.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 text-[8px] font-black text-center rounded px-1 py-0.5 bg-gray-100`}>REQ</div>
                                                    <span>{activeDragItem.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </DragOverlay>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                <Clock className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No Recent Activity</p>
                                <p className="text-xs mt-1">Your request history will appear here</p>
                            </div>
                        )}
                    </DndContext>
                </div>

                {/* Request Builder */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeRequest ? (
                        <>
                            {/* URL Bar */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-300 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                                    <div className="w-32 border-r border-gray-200 px-1">
                                        <Select
                                            value={activeRequest.method}
                                            onValueChange={(value: any) => updateActiveRequest({ method: value })}
                                        >
                                            <SelectTrigger className="border-none shadow-none focus:ring-0 text-xs font-black uppercase tracking-widest h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="min-w-[120px]">
                                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                                                    <SelectItem key={m} value={m} className="text-xs font-bold py-2">
                                                        <span className={getMethodColor(m)}>{m}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 px-1">
                                        <input
                                            className="w-full text-base font-medium bg-transparent border-none outline-none p-2 text-gray-700 placeholder:text-gray-300 placeholder:font-normal"
                                            value={activeRequest.url}
                                            onChange={(e) => updateActiveRequest({ url: e.target.value })}
                                            placeholder="Enter request URL (e.g. https://api.example.com/data)"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSaveRequest}
                                            className="h-8 text-gray-500 hover:text-primary hover:bg-primary/5 font-semibold text-xs px-3"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-1.5" />
                                            Save
                                        </Button>

                                        <Button
                                            onClick={sendRequest}
                                            disabled={loading}
                                            className="h-10 px-8 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-[0.98] rounded-xl"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5 mr-2" />
                                                    Send
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Request Config & Response */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Request Configuration */}
                                <div className="flex-1 flex flex-col border-r border-gray-300 overflow-hidden">
                                    <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="flex-1 flex flex-col">
                                        <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-white px-6 h-12 gap-8">
                                            <TabsTrigger value="params" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                Params
                                                {activeRequest.params.length > 0 && (
                                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-black">
                                                        {activeRequest.params.filter(p => p.enabled).length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger value="authorization" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5" />
                                                Auth
                                            </TabsTrigger>
                                            <TabsTrigger value="headers" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                Headers
                                                {activeRequest.headers.length > 0 && (
                                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-black">
                                                        {activeRequest.headers.filter(h => h.enabled).length}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger value="body" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0">
                                                Body
                                            </TabsTrigger>
                                            <TabsTrigger value="scripts" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                <Terminal className="w-3.5 h-3.5" />
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
                                                                <SelectItem value="digest">Digest Auth</SelectItem>
                                                                <SelectItem value="api-key">API Key</SelectItem>
                                                                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                                                                <SelectItem value="hawk">Hawk Authentication</SelectItem>
                                                                <SelectItem value="aws">AWS Signature</SelectItem>
                                                                <SelectItem value="ntlm">NTLM Authentication</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {activeRequest.auth.type === 'bearer' && (
                                                        <div>
                                                            <Label className="text-[10px] font-black uppercase text-gray-400">Token</Label>
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
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Username</Label>
                                                                <Input
                                                                    value={activeRequest.auth.username || ''}
                                                                    onChange={(e) => updateActiveRequest({
                                                                        auth: { ...activeRequest.auth, username: e.target.value }
                                                                    })}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Password</Label>
                                                                <Input
                                                                    type="password"
                                                                    value={activeRequest.auth.password || ''}
                                                                    onChange={(e) => updateActiveRequest({
                                                                        auth: { ...activeRequest.auth, password: e.target.value }
                                                                    })}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeRequest.auth.type === 'api-key' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Value</Label>
                                                                <Input
                                                                    value={activeRequest.auth.apiKey || ''}
                                                                    onChange={(e) => updateActiveRequest({
                                                                        auth: { ...activeRequest.auth, apiKey: e.target.value }
                                                                    })}
                                                                    className="mt-1 font-mono"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Header Name</Label>
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

                                                    {activeRequest.auth.type === 'oauth2' && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Access Token</Label>
                                                                <Button variant="link" className="h-4 p-0 text-[10px] font-bold text-primary">Get New Token</Button>
                                                            </div>
                                                            <Input
                                                                value={activeRequest.auth.token || ''}
                                                                onChange={(e) => updateActiveRequest({
                                                                    auth: { ...activeRequest.auth, token: e.target.value }
                                                                })}
                                                                placeholder="Paste token here"
                                                                className="mt-1 font-mono text-xs"
                                                            />
                                                        </div>
                                                    )}

                                                    {activeRequest.auth.type === 'digest' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Username</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.username || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, username: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Password</Label>
                                                                <Input className="mt-1" type="password" value={activeRequest.auth.password || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, password: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Realm</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.realm || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, realm: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Nonce</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.nonce || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, nonce: e.target.value } })} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeRequest.auth.type === 'hawk' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Hawk ID</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.hawkId || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, hawkId: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Hawk Key</Label>
                                                                <Input className="mt-1" type="password" value={activeRequest.auth.hawkKey || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, hawkKey: e.target.value } })} />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Algorithm</Label>
                                                                <Select value={activeRequest.auth.algorithm || 'sha256'} onValueChange={(val) => updateActiveRequest({ auth: { ...activeRequest.auth, algorithm: val } })}>
                                                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="sha256">SHA-256</SelectItem>
                                                                        <SelectItem value="sha1">SHA-1</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeRequest.auth.type === 'aws' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-2">
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Access Key</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.awsAccessKey || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, awsAccessKey: e.target.value } })} />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Secret Key</Label>
                                                                <Input className="mt-1" type="password" value={activeRequest.auth.awsSecretKey || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, awsSecretKey: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">AWS Region</Label>
                                                                <Input className="mt-1" placeholder="us-east-1" value={activeRequest.auth.awsRegion || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, awsRegion: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Service Name</Label>
                                                                <Input className="mt-1" placeholder="s3" value={activeRequest.auth.awsService || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, awsService: e.target.value } })} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeRequest.auth.type === 'ntlm' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Username</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.username || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, username: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Password</Label>
                                                                <Input className="mt-1" type="password" value={activeRequest.auth.password || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, password: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Domain</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.ntlmDomain || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, ntlmDomain: e.target.value } })} />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] font-black uppercase text-gray-400">Workstation</Label>
                                                                <Input className="mt-1" value={activeRequest.auth.ntlmWorkstation || ''} onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, ntlmWorkstation: e.target.value } })} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="headers" className="m-0">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Headers</Label>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-black text-primary hover:bg-primary/5">
                                                                        <Plus className="w-3 h-3 mr-1" />
                                                                        PRESETS
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="w-64">
                                                                    {HEADER_PRESETS.map((preset) => (
                                                                        <DropdownMenuItem
                                                                            key={preset.key}
                                                                            onClick={() => {
                                                                                const newPair: KeyValuePair = {
                                                                                    id: Math.random().toString(36).substr(2, 9),
                                                                                    key: preset.key,
                                                                                    value: preset.value,
                                                                                    description: preset.description,
                                                                                    enabled: true
                                                                                };
                                                                                updateActiveRequest({ headers: [...activeRequest.headers, newPair] });
                                                                            }}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-bold text-xs">{preset.key}</span>
                                                                                <span className="text-[10px] text-gray-400">{preset.description}</span>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <KeyValueEditor type="headers" pairs={activeRequest.headers} />
                                                </TabsContent>

                                                <TabsContent value="body" className="m-0 space-y-4">
                                                    <div className="flex items-center gap-6 flex-wrap pb-2 border-b border-gray-50">
                                                        {['none', 'json', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary', 'graphql'].map(type => (
                                                            <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                                                <div className="relative flex items-center justify-center">
                                                                    <input
                                                                        type="radio"
                                                                        name="bodyType"
                                                                        checked={activeRequest.body.type === type}
                                                                        onChange={() => updateActiveRequest({
                                                                            body: { ...activeRequest.body, type: type as any }
                                                                        })}
                                                                        className="peer appearance-none w-4 h-4 rounded-full border-2 border-gray-200 checked:border-primary transition-all"
                                                                    />
                                                                    <div className="absolute w-2 h-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200" />
                                                                </div>
                                                                <span className={`text-[10px] uppercase tracking-[0.15em] transition-all ${activeRequest.body.type === type ? 'text-primary font-black' : 'text-gray-400 font-bold group-hover:text-gray-600'}`}>
                                                                    {type === 'graphql' ? 'GraphQL' : type.replace(/-/g, ' ')}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {(activeRequest.body.type === 'json' || activeRequest.body.type === 'raw') && (
                                                        <div className="space-y-4">
                                                            {activeRequest.body.type === 'raw' && (
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs font-medium text-gray-500">FORMAT:</span>
                                                                    <Select
                                                                        value={activeRequest.body.rawType || 'text'}
                                                                        onValueChange={(val) => updateActiveRequest({
                                                                            body: { ...activeRequest.body, rawType: val as any }
                                                                        })}
                                                                    >
                                                                        <SelectTrigger className="h-7 w-28 text-xs">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text">Plain Text</SelectItem>
                                                                            <SelectItem value="json">JSON</SelectItem>
                                                                            <SelectItem value="xml">XML</SelectItem>
                                                                            <SelectItem value="html">HTML</SelectItem>
                                                                            <SelectItem value="javascript">JavaScript</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}
                                                            <CodeEditor
                                                                value={activeRequest.body.content}
                                                                onChange={(value) => updateActiveRequest({
                                                                    body: { ...activeRequest.body, content: value }
                                                                })}
                                                                language={activeRequest.body.type === 'json' ? 'json' : (activeRequest.body.rawType || 'text')}
                                                                height="250px"
                                                                placeholder={activeRequest.body.type === 'json' ? '{"key": "value"}' : 'Raw body content'}
                                                            />
                                                        </div>
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

                                                    {activeRequest.body.type === 'binary' && (
                                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-16 bg-gray-50/20 transition-colors hover:bg-gray-50/40">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-6 group transition-transform hover:scale-105">
                                                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
                                                            </div>
                                                            <h3 className="text-sm font-bold text-gray-700 tracking-tight">Select Binary File</h3>
                                                            <p className="text-xs text-gray-400 mt-2 max-w-[240px] text-center mb-8 leading-relaxed font-medium">
                                                                The selected file will be sent as the raw request body.
                                                            </p>
                                                            <Button variant="outline" className="h-10 px-8 text-[11px] font-black uppercase tracking-widest border-gray-200 hover:border-primary/20 hover:bg-white hover:shadow-md transition-all active:scale-[0.98]">
                                                                Choose File
                                                            </Button>
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

                                    {
                                        response ? (
                                            <Tabs value={activeResponseTab} onValueChange={setActiveResponseTab} className="flex-1 flex flex-col overflow-hidden">
                                                <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-gray-100 px-4 h-10 flex-shrink-0">
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
                                                    <TabsContent value="body" className="m-0 p-0 flex flex-col h-full overflow-hidden">
                                                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white sticky top-0 z-10">
                                                            <div className="flex bg-gray-100/50 p-0.5 rounded-lg border border-gray-200/50">
                                                                {(['pretty', 'raw', 'preview'] as const).map((mode) => (
                                                                    <button
                                                                        key={mode}
                                                                        onClick={() => setResponseBodyMode(mode)}
                                                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${responseBodyMode === mode ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                                    >
                                                                        {mode}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Select defaultValue="json">
                                                                    <SelectTrigger className="h-6 w-20 text-[10px] uppercase font-bold border-none bg-transparent">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="json">JSON</SelectItem>
                                                                        <SelectItem value="xml">XML</SelectItem>
                                                                        <SelectItem value="html">HTML</SelectItem>
                                                                        <SelectItem value="text">Text</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-gray-400" onClick={() => {
                                                                    navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
                                                                    toast.success('Copied to clipboard');
                                                                }}>
                                                                    <Copy className="w-3 h-3 mr-1" />
                                                                    COPY
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 p-4 overflow-auto">
                                                            {responseBodyMode === 'pretty' || responseBodyMode === 'raw' ? (
                                                                <CodeEditor
                                                                    value={typeof response.body === 'object'
                                                                        ? JSON.stringify(response.body, null, 2)
                                                                        : String(response.body)}
                                                                    onChange={() => { }}
                                                                    language="json"
                                                                    height="100%"
                                                                    readOnly={true}
                                                                />
                                                            ) : (
                                                                <div className="h-full bg-white rounded-lg border border-gray-100 p-4 font-sans text-sm text-gray-600 overflow-auto">
                                                                    {typeof response.body === 'string' && (response.body.includes('<html') || response.body.includes('<!DOCTYPE')) ? (
                                                                        <iframe srcDoc={response.body} className="w-full h-full border-none" title="Preview" />
                                                                    ) : (
                                                                        <pre className="whitespace-pre-wrap">{typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : String(response.body)}</pre>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
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
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                                    <Send className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="text-sm font-medium">No response yet</p>
                                                <p className="text-xs mt-1">Click Send to make a request</p>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white p-20 text-center overflow-auto">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full scale-150 animate-pulse" />
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <CircuitLogoIcon className="w-24 h-24 text-primary" />
                                </div>
                            </div>

                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                                Test Your APIs <span className="text-primary">Better</span>
                            </h1>
                            <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
                                Cognitest AI helps you test, document, and debug your APIs with an intelligent interface designed for modern engineering teams.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Button
                                    onClick={addNewRequest}
                                    className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    <Plus className="w-5 h-5 mr-3" />
                                    New HTTP Request
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-14 px-10 border-gray-200 hover:border-primary/30 hover:bg-primary/5 text-gray-600 font-bold text-base rounded-2xl transition-all"
                                >
                                    <Terminal className="w-5 h-5 mr-3" />
                                    Import from cURL
                                </Button>
                            </div>

                            <div className="mt-20 grid grid-cols-3 gap-12 max-w-3xl opacity-50">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Lock className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Secure Auth</span>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Sparkles className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">AI Assistant</span>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Code2 className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Code Generation</span>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div>

                {/* AI Assistant Panel */}
                {
                    showAIPanel && (
                        <div className="w-80 border-l border-gray-300 bg-white flex flex-col flex-shrink-0">
                            <div className="p-3 border-b border-gray-300 flex items-center justify-between">
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
                                            <button className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                                                <p className="text-sm font-medium text-gray-700">Add Authorization</p>
                                                <p className="text-xs text-gray-500 mt-1">This endpoint might need authentication</p>
                                            </button>
                                            <button className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
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
                    )
                }
            </div>

            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename {targetType}</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your {targetType}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="Enter name"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Collection Dialog */}
            <Dialog open={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Collection</DialogTitle>
                        <DialogDescription>
                            Create a new collection to organize your requests.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="Collection name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && tempName.trim()) {
                                    const newCol: Collection = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: tempName,
                                        isOpen: true,
                                        requests: [],
                                        folders: []
                                    }
                                    setCollections(prev => [...prev, newCol])
                                    setIsNewCollectionOpen(false)
                                    setTempName('')
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewCollectionOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (tempName.trim()) {
                                    const newCol: Collection = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        name: tempName,
                                        isOpen: true,
                                        requests: [],
                                        folders: []
                                    }
                                    setCollections(prev => [...prev, newCol])
                                    setIsNewCollectionOpen(false)
                                    setTempName('')
                                }
                            }}
                            disabled={!tempName.trim()}
                        >
                            Create Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Environment Manager Dialog */}
            <EnvironmentManager
                isOpen={isEnvDialogOpen}
                onClose={() => setIsEnvDialogOpen(false)}
                environments={environments}
                setEnvironments={setEnvironments}
                selectedEnvironmentId={selectedEnvId}
                setSelectedEnvironmentId={setSelectedEnvId}
                onCreateEnvironment={createEnvironmentAPI}
                onUpdateEnvironment={updateEnvironmentAPI}
                onDeleteEnvironment={deleteEnvironmentAPI}
            />

            {/* Save to Collection Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Request</DialogTitle>
                        <DialogDescription>
                            Choose a collection and folder to save this request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Collection</Label>
                            <Select
                                value={saveTarget.collectionId}
                                onValueChange={(val) => setSaveTarget({ ...saveTarget, collectionId: val, folderId: '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collections.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {saveTarget.collectionId && (
                            <div className="space-y-2">
                                <Label>Folder (Optional)</Label>
                                <Select
                                    value={saveTarget.folderId}
                                    onValueChange={(val) => setSaveTarget({ ...saveTarget, folderId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a folder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Folder</SelectItem>
                                        {collections.find(c => c.id === saveTarget.collectionId)?.folders?.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Request Name</Label>
                            <Input
                                value={activeRequest?.name}
                                onChange={(e) => updateActiveRequest({ name: e.target.value })}
                                placeholder="e.g. Get User Profile"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                addRequestToCollection(saveTarget.collectionId, saveTarget.folderId === 'none' ? undefined : saveTarget.folderId)
                                setIsSaveDialogOpen(false)
                            }}
                            disabled={!saveTarget.collectionId}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
