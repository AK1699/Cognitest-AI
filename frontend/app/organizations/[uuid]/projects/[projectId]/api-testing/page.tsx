'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserNav } from '@/components/layout/user-nav'
import {
    Send, Save, Plus, X, ChevronDown, ChevronRight, Home, Play,
    FileJson, Folder, FolderOpen, MoreHorizontal, Upload, Download,
    Settings, Settings2, Clock, Copy, Check, AlertCircle, Loader2,
    Sparkles, MessageSquare, Code2, Eye, FileText, Cookie,
    Link2, Lock, Key, Hash, Terminal, Wand2, Trash2, GripVertical, Edit2,
    Globe, Hexagon, Shapes, Box, Network, Activity, Radio, Zap, WrapText, Search, Binary, Beaker
} from 'lucide-react'
import { HttpIcon } from '@/components/icons/HttpIcon'
import { GraphqlIcon } from '@/components/icons/GraphqlIcon'
import { GrpcIcon } from '@/components/icons/GrpcIcon'
import { McpIcon } from '@/components/icons/McpIcon'
import { WebsocketIcon } from '@/components/icons/WebsocketIcon'
import { SocketIoIcon } from '@/components/icons/SocketIoIcon'
import { MqttIcon } from '@/components/icons/MqttIcon'
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
import { HighlightedInput } from '@/components/api-testing/HighlightedInput'
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
    protocol: 'http' | 'graphql' | 'grpc' | 'websocket' | 'socketio' | 'mqtt' | 'ai' | 'mcp'
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
    isDirty?: boolean
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

interface Message {
    id: string
    type: 'sent' | 'received'
    content: string
    timestamp: number
    topic?: string // For MQTT
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

const getMethodTextColor = (method: string) => {
    switch (method) {
        case 'GET': return 'text-green-500'
        case 'POST': return 'text-yellow-500'
        case 'PUT': return 'text-blue-500'
        case 'PATCH': return 'text-purple-500'
        case 'DELETE': return 'text-red-500'
        case 'HEAD': return 'text-blue-400'
        case 'OPTIONS': return 'text-pink-400'
        default: return 'text-gray-500'
    }
}
const PROTOCOLS = [
    { id: 'http', name: 'HTTP', icon: HttpIcon, description: 'REST, SOAP, or standard HTTP requests', color: 'text-blue-500', bgColor: 'bg-blue-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'graphql', name: 'GraphQL', icon: GraphqlIcon, description: 'Execute GraphQL queries and mutations', color: 'text-pink-500', bgColor: 'bg-pink-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'ai', name: 'AI', icon: Sparkles, description: 'Test LLM behaviors and custom prompts', color: 'text-purple-500', bgColor: 'bg-purple-50', iconSize: 'w-16 h-16', padding: 'p-2' },
    { id: 'mcp', name: 'MCP', icon: McpIcon, description: 'Model Context Protocol for AI Agent interactions', color: 'text-stone-500', bgColor: 'bg-stone-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'grpc', name: 'gRPC', icon: GrpcIcon, description: 'High-performance RPC using Protobuf', color: 'text-green-500', bgColor: 'bg-green-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'websocket', name: 'WebSocket', icon: WebsocketIcon, description: 'Full-duplex real-time communication', color: 'text-orange-500', bgColor: 'bg-orange-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'socketio', name: 'Socket.IO', icon: SocketIoIcon, description: 'Event-driven real-time testing', color: 'text-cyan-500', bgColor: 'bg-cyan-50', iconSize: 'w-16 h-16', padding: 'p-1' },
    { id: 'mqtt', name: 'MQTT', icon: MqttIcon, description: 'IoT messaging service testing', color: 'text-amber-500', bgColor: 'bg-amber-50', iconSize: 'w-16 h-16', padding: 'p-1' },
] as const;

const getProtocolBadgeInfo = (protocol: APIRequest['protocol'], method: string) => {
    if (protocol === 'http') {
        return {
            label: method,
            classes: getMethodColor(method)
        };
    }
    const proto = PROTOCOLS.find(p => p.id === protocol);
    const label = protocol === 'websocket' ? 'WS' :
        protocol === 'socketio' ? 'SIO' :
            protocol === 'graphql' ? 'GQL' :
                protocol.toUpperCase();
    return {
        label,
        classes: `${proto?.bgColor || 'bg-gray-100'} ${proto?.color || 'text-gray-700'}`
    };
};

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

// Response body formatter
const formatResponseBody = (body: any, mode: string): string => {
    if (!body) return ''

    // Base content string
    const contentStr = typeof body === 'object' ? JSON.stringify(body) : String(body)

    // For pretty printing (default JSON view)
    const prettyContent = typeof body === 'object' ? JSON.stringify(body, null, 2) :
        (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) ?
            (() => { try { return JSON.stringify(JSON.parse(body), null, 2) } catch { return body } })() : body

    switch (mode) {
        case 'pretty':
        case 'json':
            return prettyContent
        case 'xml':
        case 'html':
            return contentStr
        case 'hex':
            return contentStr.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
        case 'base64':
            return btoa(contentStr)
        case 'raw':
        case 'text':
        case 'javascript':
            return contentStr
        default:
            return contentStr
    }
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

const createNewRequest = (protocol: APIRequest['protocol'] = 'http'): APIRequest => ({
    id: `req-${Date.now()}`,
    name: 'New Request',
    protocol: protocol,
    method: protocol === 'http' ? 'GET' : 'POST',
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
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)

    // Collections state
    const [collections, setCollections] = useState<Collection[]>([])
    const [collectionsLoading, setCollectionsLoading] = useState(true)

    // Fetch collections on mount
    const fetchCollections = async () => {
        try {
            setCollectionsLoading(true)
            const response = await fetch(`${API_URL}/api/v1/api-testing/collections/${projectId}`, {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setCollections(data)
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error)
            toast.error('Failed to load collections')
        } finally {
            setCollectionsLoading(false)
        }
    }

    useEffect(() => {
        fetchCollections()
    }, [projectId])

    // Environment state - now fetched from backend
    const [environments, setEnvironments] = useState<Environment[]>([])
    const [environmentsLoading, setEnvironmentsLoading] = useState(true)
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null)
    const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false)
    const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [saveTarget, setSaveTarget] = useState({ collectionId: '', folderId: '' })
    const [newCollectionName, setNewCollectionName] = useState('')
    const [isCreatingNewCollection, setIsCreatingNewCollection] = useState(false)
    const [isProtocolSelectorOpen, setIsProtocolSelectorOpen] = useState(false)
    const [selectedProtocolForNewRequest, setSelectedProtocolForNewRequest] = useState<APIRequest['protocol']>('http')
    const [pendingAddLocation, setPendingAddLocation] = useState<{ collectionId: string, folderId?: string } | null>(null)



    // Sidebar state
    const [activeSidebarTab, setActiveSidebarTab] = useState<'collections' | 'history'>('collections')
    const [searchQuery, setSearchQuery] = useState('')
    const [history, setHistory] = useState<any[]>([])
    const [sidebarWidth, setSidebarWidth] = useState(256)
    const [isResizingSidebar, setIsResizingSidebar] = useState(false)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingSidebar) return
            setSidebarWidth(Math.max(200, Math.min(600, e.clientX)))
        }

        const handleMouseUp = () => {
            setIsResizingSidebar(false)
        }

        if (isResizingSidebar) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizingSidebar])

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

    // Unsaved Changes Dialog state
    const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
    const [pendingCloseRequestId, setPendingCloseRequestId] = useState<string | null>(null)

    // Active UI tabs
    const [activeConfigTab, setActiveConfigTab] = useState('params')
    const [activeResponseTab, setActiveResponseTab] = useState('body')
    const [responseBodyMode, setResponseBodyMode] = useState<'pretty' | 'raw' | 'text' | 'xml' | 'html' | 'javascript' | 'hex' | 'base64'>('pretty')
    const [showPreview, setShowPreview] = useState(false)
    const [editingTabId, setEditingTabId] = useState<string | null>(null)
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
    const [lastUsedProtocol, setLastUsedProtocol] = useState<APIRequest['protocol']>('http')

    useEffect(() => {
        const savedProtocol = localStorage.getItem('lastUsedProtocol') as APIRequest['protocol'];
        if (savedProtocol) setLastUsedProtocol(savedProtocol);
    }, []);

    useEffect(() => {
        localStorage.setItem('lastUsedProtocol', lastUsedProtocol);
    }, [lastUsedProtocol]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSaveRequest()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeRequestId, openRequests]) // Re-bind when state changes to capture latest activeRequest via closure if needed, though handleSaveRequest uses ref-like access if defined properly. 
    // Wait, handleSaveRequest depends on activeRequest state. 
    // handleSaveRequest is re-created on each render. 
    // So this effect needs to depend on handleSaveRequest or include it in dependency array.
    // Ideally, we add handleSaveRequest to dependencies.

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

    const syncParamsWithUrl = (url: string, currentParams: KeyValuePair[]): KeyValuePair[] => {
        try {
            const queryString = url.includes('?') ? url.split('?')[1] : '';
            if (!queryString) {
                return currentParams.filter(p => !p.enabled);
            }

            const searchParams = new URLSearchParams(queryString);
            const newParams: KeyValuePair[] = [];
            const processedParams = new Set<string>();

            searchParams.forEach((value, key) => {
                const existingParam = currentParams.find(p => p.key === key && p.value === value && !processedParams.has(p.id));

                if (existingParam) {
                    newParams.push({ ...existingParam, enabled: true });
                    processedParams.add(existingParam.id);
                } else {
                    const sameKeyParam = currentParams.find(p => p.key === key && !processedParams.has(p.id));
                    if (sameKeyParam) {
                        newParams.push({ ...sameKeyParam, value, enabled: true });
                        processedParams.add(sameKeyParam.id);
                    } else {
                        newParams.push({
                            id: Math.random().toString(36).substr(2, 9),
                            key,
                            value,
                            description: '',
                            enabled: true
                        });
                    }
                }
            });

            currentParams.forEach(p => {
                if (!p.enabled && !processedParams.has(p.id)) {
                    newParams.push(p);
                }
            });

            return newParams;
        } catch (e) {
            console.error("Error syncing params", e)
            return currentParams
        }
    }

    const syncUrlWithParams = (url: string, params: KeyValuePair[]): string => {
        const baseUrl = url.split('?')[0];
        const enabledParams = params.filter(p => p.enabled && p.key);
        if (enabledParams.length === 0) return baseUrl;

        const searchParams = new URLSearchParams();
        enabledParams.forEach(p => searchParams.append(p.key, p.value));
        return `${baseUrl}?${searchParams.toString()}`;
    }

    const updateActiveRequest = (updates: Partial<APIRequest>) => {
        if (!activeRequestId) return
        setOpenRequests(prev => prev.map(r => {
            if (r.id !== activeRequestId) return r;

            let updatedRequest = { ...r, ...updates, isDirty: true };

            if (updates.url !== undefined && updates.params === undefined) {
                updatedRequest.params = syncParamsWithUrl(updatedRequest.url, r.params);
            } else if (updates.params !== undefined && updates.url === undefined) {
                updatedRequest.url = syncUrlWithParams(r.url, updatedRequest.params);
            }

            return updatedRequest;
        }))
    }

    const updateRequestAPI = async (id: string, updates: Partial<APIRequest>) => {
        try {
            // Map frontend fields to backend if necessary
            const backendUpdates: any = {}
            if (updates.name) backendUpdates.name = updates.name
            if (updates.method) backendUpdates.method = updates.method
            if (updates.url) backendUpdates.url = updates.url
            if (updates.params) backendUpdates.params = updates.params
            if (updates.headers) backendUpdates.headers = updates.headers
            if (updates.body) backendUpdates.body = updates.body
            if (updates.auth) backendUpdates.auth = updates.auth
            if (updates.preRequestScript !== undefined) backendUpdates.pre_request_script = updates.preRequestScript
            if (updates.testScript !== undefined) backendUpdates.test_script = updates.testScript

            const response = await fetch(`${API_URL}/api/v1/api-testing/requests/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendUpdates)
            })

            if (response.ok) {
                const updated = await response.json()
                // Update local collections if the request is there
                await fetchCollections()

                // Update open requests state to clear dirty flag
                setOpenRequests(prev => prev.map(r =>
                    r.id === id ? { ...r, ...updated, isDirty: false } : r
                ))

                toast.success('Request updated in database')
                return updated
            }
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update request')
        }
        return null
    }




    const addRequestToCollection = async (collectionId: string, folderId?: string, protocol?: APIRequest['protocol']) => {
        let requestToSave: APIRequest | null = null;

        if (protocol) {
            requestToSave = createNewRequest(protocol);
        } else if (activeRequest) {
            requestToSave = activeRequest;
        }

        if (!requestToSave) return;

        try {
            const requestData = {
                name: requestToSave.name || 'New Request',
                method: requestToSave.method,
                protocol: requestToSave.protocol,
                url: requestToSave.url,
                params: requestToSave.params,
                headers: requestToSave.headers,
                body: requestToSave.body,
                auth: requestToSave.auth,
                pre_request_script: requestToSave.preRequestScript,
                test_script: requestToSave.testScript,
                collection_id: folderId || collectionId
            }

            // If we need to create a collection first
            let finalCollectionId = folderId || collectionId
            if (isCreatingNewCollection && newCollectionName.trim()) {
                const colRes = await fetch(`${API_URL}/api/v1/api-testing/collections`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newCollectionName,
                        project_id: projectId
                    })
                })
                if (colRes.ok) {
                    const newCol = await colRes.json()
                    finalCollectionId = newCol.id
                } else {
                    throw new Error('Failed to create collection')
                }
            }

            const response = await fetch(`${API_URL}/api/v1/api-testing/requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...requestData, collection_id: finalCollectionId })
            })

            if (response.ok) {
                const newReq = await response.json()
                // Update open tab with real ID
                setOpenRequests(prev => {
                    const existing = prev.find(r => r.id === (requestToSave as APIRequest).id);
                    if (existing) {
                        return prev.map(r => r.id === (requestToSave as APIRequest).id ? { ...r, id: newReq.id, isDirty: false } : r);
                    } else {
                        return [...prev, { ...requestToSave, id: newReq.id, isDirty: false } as APIRequest];
                    }
                })
                setActiveRequestId(newReq.id)

                await fetchCollections()
                toast.success(protocol ? 'Request created' : 'Request saved to database')
                setIsSaveDialogOpen(false)
                setIsCreatingNewCollection(false)
                setNewCollectionName('')
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save to database')
        }
    }

    const handleSaveRequest = (requestToSave: APIRequest | null = activeRequest) => {
        if (!requestToSave) return

        // If it's a real UUID (not temp string), just update it
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestToSave.id)

        if (isUUID) {
            updateRequestAPI(requestToSave.id, requestToSave)
        } else {
            // Ensure we are saving the correct request
            if (activeRequestId !== requestToSave.id) {
                setActiveRequestId(requestToSave.id)
            }
            setSaveTarget({ collectionId: '', folderId: '' })
            setNewCollectionName('')
            setIsCreatingNewCollection(collections.length === 0)
            setIsSaveDialogOpen(true)
        }
    }

    const addFolderToCollection = async (collectionId: string, name: string) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/collections`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    project_id: projectId,
                    parent_id: collectionId
                })
            })
            if (response.ok) {
                await fetchCollections()
                toast.success('Folder created')
            }
        } catch (error) {
            console.error('Create folder error:', error)
            toast.error('Failed to create folder')
        }
    }

    const duplicateRequest = async (req: APIRequest, parentId: string) => {
        try {
            const requestData = {
                name: `${req.name} (Copy)`,
                method: req.method,
                url: req.url,
                params: req.params,
                headers: req.headers,
                body: req.body,
                auth: req.auth,
                pre_request_script: req.preRequestScript,
                test_script: req.testScript,
                collection_id: parentId
            }

            const response = await fetch(`${API_URL}/api/v1/api-testing/requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })

            if (response.ok) {
                const newReq = await response.json()
                setOpenRequests(prev => [...prev, newReq])
                setActiveRequestId(newReq.id)
                await fetchCollections()
                toast.success('Request duplicated')
            }
        } catch (error) {
            console.error('Duplicate error:', error)
            toast.error('Failed to duplicate request')
        }
    }

    const deleteRequest = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/api-testing/requests/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (response.ok) {
                await fetchCollections()
                setOpenRequests(prev => prev.filter(r => r.id !== id))
                if (activeRequestId === id) {
                    setActiveRequestId(null)
                }
                toast.success('Request deleted')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete request')
        }
    }

    const getAllRequestIdsInCollection = (coll: Collection): string[] => {
        let ids = (coll.requests || []).map(r => r.id)
        if (coll.folders) {
            coll.folders.forEach(f => {
                ids = [...ids, ...getAllRequestIdsInCollection(f)]
            })
        }
        return ids
    }

    const deleteCollection = async (id: string) => {
        try {
            // Find all request IDs in this collection/folder BEFORE deleting
            let idsToRemove: string[] = []

            const findAndGetIds = (items: Collection[]) => {
                for (const item of items) {
                    if (item.id === id) {
                        idsToRemove = getAllRequestIdsInCollection(item)
                        return true
                    }
                    if (item.folders && findAndGetIds(item.folders)) return true
                }
                return false
            }

            findAndGetIds(collections)

            const response = await fetch(`${API_URL}/api/v1/api-testing/collections/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (response.ok) {
                await fetchCollections()

                // Close all affected tabs
                if (idsToRemove.length > 0) {
                    setOpenRequests(prev => {
                        const filtered = prev.filter(r => !idsToRemove.includes(r.id))
                        // Update active request if it was in the deleted set
                        if (activeRequestId && idsToRemove.includes(activeRequestId)) {
                            setActiveRequestId(filtered.length > 0 ? filtered[0].id : null)
                        }
                        return filtered
                    })
                }

                toast.success('Deleted successfully')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete')
        }
    }

    const handleRename = async () => {
        if (!targetId || !tempName.trim()) return

        try {
            const isRequest = openRequests.some(r => r.id === targetId) || collections.some(c => c.requests.some(req => req.id === targetId))
            const endpoint = isRequest ? `requests/${targetId}` : `collections/${targetId}`

            const response = await fetch(`${API_URL}/api/v1/api-testing/${endpoint}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tempName })
            })

            if (response.ok) {
                await fetchCollections()
                setOpenRequests(prev => prev.map(r => r.id === targetId ? { ...r, name: tempName } : r))
                toast.success('Renamed successfully')
            }
        } catch (error) {
            console.error('Rename error:', error)
            toast.error('Failed to rename')
        }
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
    const addNewRequest = (protocol: APIRequest['protocol'] = 'http') => {
        setLastUsedProtocol(protocol);
        if (pendingAddLocation) {
            addRequestToCollection(pendingAddLocation.collectionId, pendingAddLocation.folderId, protocol)
            setPendingAddLocation(null)
        } else {
            const newReq = createNewRequest(protocol)
            setOpenRequests(prev => [...prev, newReq])
            setActiveRequestId(newReq.id)
        }
    }

    // Close request tab
    const closeRequest = (id: string, force: boolean = false) => {
        const req = openRequests.find(r => r.id === id)
        if (!force && req?.isDirty) {
            setPendingCloseRequestId(id)
            setIsUnsavedChangesDialogOpen(true)
            return
        }

        const newRequests = openRequests.filter(r => r.id !== id)
        setOpenRequests(newRequests)
        if (newRequests.length === 0) {
            setActiveRequestId(null)
        } else if (activeRequestId === id) {
            setActiveRequestId(newRequests[newRequests.length - 1]?.id || null)
        }
    }

    const handleConfirmClose = () => {
        if (pendingCloseRequestId) {
            closeRequest(pendingCloseRequestId, true)
            setIsUnsavedChangesDialogOpen(false)
            setPendingCloseRequestId(null)
        }
    }

    const handleSaveAndClose = async () => {
        if (pendingCloseRequestId) {
            const req = openRequests.find(r => r.id === pendingCloseRequestId)
            if (req) {
                // Trigger save logic (reusing addRequestToCollection logic or similar)
                // Since handleSaveRequest depends on activeRequest, we might need to set active request or pass it.
                // For simplicity, let's just trigger the save flow if it's the active one, or we need a way to save *that* specific request.
                // If it's a new request, we need the save dialog.

                // If the request ID is a UUID, we can save directly.
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.id)
                if (isUUID) {
                    await updateRequestAPI(req.id, req)
                    closeRequest(req.id, true)
                } else {
                    // For new requests, we switch to it and open the save dialog
                    setActiveRequestId(req.id)
                    setIsUnsavedChangesDialogOpen(false)
                    handleSaveRequest(req)
                    return
                }
            }
            setIsUnsavedChangesDialogOpen(false)
            setPendingCloseRequestId(null)
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
                                    className={`flex items-center gap-3 px-4 py-2 text-xs transition-all relative group h-10 ${activeRequestId === req.id
                                        ? 'text-primary font-bold'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <span className={`${req.protocol === 'http' ? getMethodTextColor(req.method) : (PROTOCOLS.find(p => p.id === req.protocol)?.color || 'text-primary')} font-black text-[10px]`}>
                                        {getProtocolBadgeInfo(req.protocol, req.method).label}
                                    </span>
                                    {editingTabId === req.id ? (
                                        <input
                                            autoFocus
                                            className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-24 text-xs font-semibold text-primary select-all"
                                            value={req.name}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                setOpenRequests(prev => prev.map(r =>
                                                    r.id === req.id ? { ...r, name: newName, isDirty: true } : r
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
                                            {req.name}{req.isDirty && '*'}
                                        </span>
                                    )}
                                    <X
                                        className={`w-3 h-3 hover:text-red-500 transition-colors ${activeRequestId === req.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeRequest(req.id);
                                        }}
                                    />
                                    {activeRequestId === req.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in slide-in-from-bottom-1 duration-200" />
                                    )}
                                </button>
                            ))}
                            <div className="flex items-center gap-0.5 ml-2 border-l border-gray-200 pl-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newReq = createNewRequest(lastUsedProtocol);
                                        setOpenRequests(prev => [...prev, newReq]);
                                        setActiveRequestId(newReq.id);
                                    }}
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
                                    title={`New ${lastUsedProtocol.toUpperCase()} Request`}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsProtocolSelectorOpen(true)}
                                    className="h-8 px-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                >
                                    New
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </Button>
                            </div>
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
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Collections Sidebar */}
                <div
                    style={{ width: sidebarWidth }}
                    className="border-r border-gray-300 bg-white flex-shrink-0 flex flex-col relative group/sidebar"
                >
                    {/* Resize Handle */}
                    <div
                        className={`absolute top-0 right-[-4px] w-2 h-full cursor-col-resize z-50 hover:bg-primary/20 transition-colors ${isResizingSidebar ? 'bg-primary/20' : ''}`}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            setIsResizingSidebar(true)
                        }}
                    />
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
                                                                <DropdownMenuItem onClick={() => {
                                                                    addRequestToCollection(collection.id, undefined, lastUsedProtocol || 'http');
                                                                }}>
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
                                                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover/row-f:opacity-100 flex-shrink-0">
                                                                                                <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>
                                                                                        <DropdownMenuContent align="start" className="w-48">
                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                addRequestToCollection(collection.id, folder.id, lastUsedProtocol || 'http');
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
                                                                                            <DropdownMenuItem className="text-red-600" onClick={() => deleteCollection(folder.id)}>
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
                                                                                                <div className="relative flex items-center group/req pl-3">
                                                                                                    <button
                                                                                                        className="flex-1 min-w-0 flex items-center gap-2 p-1.5 pr-7 rounded-lg hover:bg-primary/[0.03] hover:text-primary transition-all text-left"
                                                                                                        onClick={() => {
                                                                                                            setOpenRequests(prev => prev.find(r => r.id === req.id) ? prev : [...prev, req])
                                                                                                            setActiveRequestId(req.id)
                                                                                                        }}
                                                                                                    >
                                                                                                        <span className={`text-[8px] font-black w-7 flex-shrink-0 text-center rounded px-1 py-0.5 ${getProtocolBadgeInfo(req.protocol, req.method).classes}`}>
                                                                                                            {getProtocolBadgeInfo(req.protocol, req.method).label}
                                                                                                        </span>
                                                                                                        <span className="text-[12px] text-gray-500 group-hover/req:text-primary truncate flex-1">{req.name}</span>
                                                                                                    </button>
                                                                                                    <DropdownMenu>
                                                                                                        <DropdownMenuTrigger asChild>
                                                                                                            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover/req:opacity-100 z-10 bg-white shadow-sm ring-1 ring-gray-100">
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
                                                                    <div className="relative flex items-center group/req pl-3">
                                                                        <button
                                                                            className="flex-1 min-w-0 flex items-center gap-2 p-1.5 pr-7 rounded-lg hover:bg-primary/[0.03] hover:text-primary transition-all text-left"
                                                                            onClick={() => {
                                                                                setOpenRequests(prev => prev.find(r => r.id === req.id) ? prev : [...prev, req])
                                                                                setActiveRequestId(req.id)
                                                                            }}
                                                                        >
                                                                            <span className={`text-[8px] font-black w-7 flex-shrink-0 text-center rounded px-1 py-0.5 ${getProtocolBadgeInfo(req.protocol, req.method).classes}`}>
                                                                                {getProtocolBadgeInfo(req.protocol, req.method).label}
                                                                            </span>
                                                                            <span className="text-[12px] text-gray-500 group-hover/req:text-primary truncate flex-1">{req.name}</span>
                                                                        </button>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover/req:opacity-100 z-10 bg-white shadow-sm ring-1 ring-gray-100">
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
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {activeRequest ? (
                        <>
                            {/* Request Header */}
                            {/* Request Header Removed */}

                            {/* URL Bar */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-300 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div className="flex items-center gap-2 pl-3 border-r border-gray-100 pr-2 cursor-pointer hover:bg-gray-50 rounded-l-xl transition-colors h-full">
                                                <div className={`p-1.5 rounded-lg ${PROTOCOLS.find(p => p.id === activeRequest.protocol)?.bgColor || 'bg-blue-50'} ${PROTOCOLS.find(p => p.id === activeRequest.protocol)?.color || 'text-blue-500'}`}>
                                                    {(() => {
                                                        const Icon = PROTOCOLS.find(p => p.id === activeRequest.protocol)?.icon || Globe
                                                        return <Icon className="w-4 h-4" />
                                                    })()}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {activeRequest.protocol}
                                                </span>
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-gray-100">
                                            {PROTOCOLS.map((proto) => (
                                                <DropdownMenuItem
                                                    key={proto.id}
                                                    onClick={() => {
                                                        updateActiveRequest({ protocol: proto.id as any });
                                                        setLastUsedProtocol(proto.id as any);
                                                    }}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary/5 group"
                                                >
                                                    <div className={`p-2 rounded-lg ${proto.bgColor} ${proto.color} group-hover:scale-110 transition-transform`}>
                                                        <proto.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{proto.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">{proto.description.split('.')[0]}</span>
                                                    </div>
                                                    {activeRequest.protocol === proto.id && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {activeRequest.protocol === 'http' && (
                                        <div className="w-24 border-r border-gray-100 px-1">
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
                                    )}
                                    <div className="flex-1 px-1">
                                        <HighlightedInput
                                            className="w-full text-base font-medium"
                                            value={activeRequest.url}
                                            onChange={(e) => updateActiveRequest({ url: e.target.value })}
                                            placeholder="Enter request URL (e.g. https://api.example.com/data)"
                                            resolveVariable={(val) => interpolateVariables(val)}
                                            variables={selectedEnvId ? environments.find(e => e.id === selectedEnvId)?.variables.filter(v => v.enabled) : []}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSaveRequest()}
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
                                            {activeRequest.protocol === 'http' && (
                                                <TabsTrigger value="params" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                    Params
                                                    {activeRequest.params.length > 0 && (
                                                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-black">
                                                            {activeRequest.params.filter(p => p.enabled).length}
                                                        </span>
                                                    )}
                                                </TabsTrigger>
                                            )}

                                            <TabsTrigger value="authorization" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5" />
                                                Auth
                                            </TabsTrigger>

                                            {['http', 'graphql', 'websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) && (
                                                <TabsTrigger value="headers" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                    {activeRequest.protocol === 'http' ? 'Headers' : 'Metadata'}
                                                    {activeRequest.headers.length > 0 && (
                                                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-black">
                                                            {activeRequest.headers.filter(h => h.enabled).length}
                                                        </span>
                                                    )}
                                                </TabsTrigger>
                                            )}

                                            <TabsTrigger value="body" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0">
                                                {activeRequest.protocol === 'ai' ? 'Prompt' :
                                                    activeRequest.protocol === 'graphql' ? 'Query' :
                                                        activeRequest.protocol === 'grpc' ? 'Message' : 'Body'}
                                            </TabsTrigger>

                                            {activeRequest.protocol === 'graphql' && (
                                                <TabsTrigger value="variables" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0">
                                                    Variables
                                                </TabsTrigger>
                                            )}

                                            {['http', 'ai', 'graphql', 'websocket'].includes(activeRequest.protocol) && (
                                                <TabsTrigger value="scripts" className="text-xs font-bold uppercase tracking-widest h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary transition-all px-0 flex items-center gap-2">
                                                    <Terminal className="w-3.5 h-3.5" />
                                                    Scripts
                                                </TabsTrigger>
                                            )}
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

                                                <TabsContent value="body" className="m-0">
                                                    {activeRequest.protocol === 'ai' && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Model Output Prompt</Label>
                                                                <div className="flex gap-2">
                                                                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">GPT-4o</Badge>
                                                                    <Badge variant="outline" className="text-[10px]">TEMP: 0.7</Badge>
                                                                </div>
                                                            </div>
                                                            <CodeEditor
                                                                value={activeRequest.body.content}
                                                                onChange={(value) => updateActiveRequest({
                                                                    body: { ...activeRequest.body, content: value }
                                                                })}
                                                                language="text"
                                                                height="400px"
                                                                placeholder="Enter your AI prompt here... e.g. Analyze the following request data..."
                                                            />
                                                        </div>
                                                    )}

                                                    {activeRequest.protocol === 'graphql' && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">GraphQL Query</Label>
                                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-black text-primary">
                                                                    PRETTIFY
                                                                </Button>
                                                            </div>
                                                            <CodeEditor
                                                                value={activeRequest.body.content}
                                                                onChange={(value) => updateActiveRequest({
                                                                    body: { ...activeRequest.body, content: value }
                                                                })}
                                                                language="graphql"
                                                                height="400px"
                                                                placeholder="query { users { id name } }"
                                                            />
                                                        </div>
                                                    )}

                                                    {activeRequest.protocol === 'grpc' && (
                                                        <div className="space-y-4">
                                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Protocol Buffer Message (JSON)</Label>
                                                            <CodeEditor
                                                                value={activeRequest.body.content}
                                                                onChange={(value) => updateActiveRequest({
                                                                    body: { ...activeRequest.body, content: value }
                                                                })}
                                                                language="json"
                                                                height="400px"
                                                                placeholder='{ "id": "123", "name": "Test User" }'
                                                            />
                                                        </div>
                                                    )}

                                                    {activeRequest.protocol === 'http' && (
                                                        <>
                                                            <div className="flex items-center gap-6 flex-wrap pb-2 border-b border-gray-50 mb-4">
                                                                {['none', 'json', 'form-data', 'x-www-form-urlencoded', 'raw', 'binary'].map(type => (
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
                                                                            {type.replace(/-/g, ' ')}
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
                                                                        height="400px"
                                                                        placeholder={activeRequest.body.type === 'json' ? '{"key": "value"}' : 'Raw body content'}
                                                                    />
                                                                </div>
                                                            )}

                                                            {(activeRequest.body.type === 'form-data' || activeRequest.body.type === 'x-www-form-urlencoded') && (
                                                                <KeyValueEditor type="formData" pairs={activeRequest.body.formData || []} />
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
                                                        </>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="variables" className="m-0">
                                                    <div className="space-y-4">
                                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">GraphQL Variables (JSON)</Label>
                                                        <CodeEditor
                                                            value={activeRequest.body.graphqlVariables || ''}
                                                            onChange={(value) => updateActiveRequest({
                                                                body: { ...activeRequest.body, graphqlVariables: value }
                                                            })}
                                                            language="json"
                                                            height="400px"
                                                            placeholder='{"userId": 123}'
                                                        />
                                                    </div>
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
                                            <span className="font-semibold text-sm text-gray-700">
                                                {['websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) ? 'Message Stream' : 'Response'}
                                            </span>
                                            {response && !['websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) && (
                                                <>
                                                    <Badge className={`${getStatusColor(response.status)} px-2 py-0.5`}>
                                                        {response.status} {response.statusText}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">{response.time}ms</span>
                                                    <span className="text-xs text-gray-500">{(response.size / 1024).toFixed(2)}KB</span>
                                                </>
                                            )}
                                            {['websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) && (
                                                <Badge className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1.5 px-2 py-0.5 animate-pulse">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    CONNECTED
                                                </Badge>
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
                                        {['websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) && messages.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] font-black text-gray-400 hover:text-red-500"
                                                onClick={() => setMessages([])}
                                            >
                                                CLEAR
                                            </Button>
                                        )}
                                    </div>

                                    {
                                        ['websocket', 'socketio', 'mqtt'].includes(activeRequest.protocol) ? (
                                            <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden">
                                                <ScrollArea className="flex-1 p-4">
                                                    <div className="space-y-3">
                                                        {messages.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                                                <Radio className="w-12 h-12 opacity-10 mb-4 animate-pulse" />
                                                                <p className="text-xs font-bold uppercase tracking-widest">Waiting for messages...</p>
                                                            </div>
                                                        ) : (
                                                            messages.map((msg) => (
                                                                <div key={msg.id} className={`flex flex-col gap-1 ${msg.type === 'sent' ? 'items-end' : 'items-start'}`}>
                                                                    <div className="flex items-center gap-2 px-2">
                                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                        </span>
                                                                        {msg.topic && (
                                                                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 text-primary bg-primary/5">
                                                                                {msg.topic}
                                                                            </Badge>
                                                                        )}
                                                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${msg.type === 'sent' ? 'text-blue-500' : 'text-green-500'}`}>
                                                                            {msg.type}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm border ${msg.type === 'sent'
                                                                        ? 'bg-primary text-white border-primary'
                                                                        : 'bg-white text-gray-700 border-gray-100'
                                                                        }`}>
                                                                        <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                                                                            {msg.content}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                                <div className="p-4 border-t border-gray-200 bg-white">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Type a message to send..."
                                                            className="h-10 text-xs font-medium border-gray-200 focus-visible:ring-primary/20"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                                    const text = e.currentTarget.value;
                                                                    setMessages(prev => [...prev, {
                                                                        id: `msg-${Date.now()}`,
                                                                        type: 'sent',
                                                                        content: text,
                                                                        timestamp: Date.now()
                                                                    }]);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }}
                                                        />
                                                        <Button className="h-10 px-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                            SEND
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : response ? (
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
                                                    <TabsTrigger value="test-results" className="text-xs">
                                                        <Beaker className="w-3 h-3 mr-1" />
                                                        Test Results
                                                    </TabsTrigger>
                                                </TabsList>

                                                <div className="flex-1 flex flex-col overflow-hidden">
                                                    <TabsContent value="body" className="m-0 p-0 data-[state=active]:flex flex-col h-full overflow-hidden">
                                                        <div className="flex flex-col border-b border-gray-100 bg-white sticky top-0 z-10">
                                                            <div className="flex items-center justify-between px-4 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    <Select
                                                                        value={responseBodyMode}
                                                                        onValueChange={(val) => setResponseBodyMode(val as any)}
                                                                    >
                                                                        <SelectTrigger className="h-7 gap-2 text-xs font-bold border-none shadow-none focus:ring-0 px-2 hover:bg-gray-50 data-[state=open]:bg-gray-100 min-w-[90px]">
                                                                            {responseBodyMode === 'pretty' && <span className="text-primary font-black">{'{ }'}</span>}
                                                                            {responseBodyMode === 'xml' && <Code2 className="w-3.5 h-3.5 text-primary" />}
                                                                            {responseBodyMode === 'html' && <Code2 className="w-3.5 h-3.5 text-primary" />}
                                                                            {responseBodyMode === 'javascript' && <span className="text-primary font-black text-[10px]">JS</span>}
                                                                            {responseBodyMode === 'raw' && <FileText className="w-3.5 h-3.5 text-primary" />}
                                                                            {responseBodyMode === 'hex' && <Binary className="w-3.5 h-3.5 text-primary" />}
                                                                            {responseBodyMode === 'base64' && <Binary className="w-3.5 h-3.5 text-primary" />}

                                                                            <span className="uppercase">
                                                                                {responseBodyMode === 'pretty' ? 'JSON' :
                                                                                    responseBodyMode === 'javascript' ? 'JavaScript' :
                                                                                        responseBodyMode}
                                                                            </span>
                                                                        </SelectTrigger>
                                                                        <SelectContent align="start" className="min-w-[180px]">
                                                                            <SelectItem value="pretty" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="font-mono font-bold text-xs">{'{ }'}</span>
                                                                                    <span>JSON</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="xml" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <Code2 className="w-3.5 h-3.5" />
                                                                                    <span>XML</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="html" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <Code2 className="w-3.5 h-3.5" />
                                                                                    <span>HTML</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="javascript" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="font-mono font-bold text-xs">JS</span>
                                                                                    <span>JavaScript</span>
                                                                                </div>
                                                                            </SelectItem>

                                                                            <div className="h-[1px] bg-gray-100 my-1 mx-2" />

                                                                            <SelectItem value="raw" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <FileText className="w-3.5 h-3.5" />
                                                                                    <span>Raw</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="hex" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="font-mono font-bold text-xs">0x</span>
                                                                                    <span>Hex</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="base64" className="gap-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="font-mono font-bold text-xs">64</span>
                                                                                    <span>Base64</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>

                                                                    <div className="h-4 w-[1px] bg-gray-200 mx-2" />

                                                                    <button
                                                                        onClick={() => setShowPreview(!showPreview)}
                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${showPreview
                                                                            ? 'bg-gray-100 text-gray-900'
                                                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <Play className="w-3 h-3 fill-current" />
                                                                        Preview
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-900">
                                                                        <WrapText className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-900">
                                                                        <Search className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-900" onClick={() => {
                                                                        navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
                                                                        toast.success('Copied to clipboard');
                                                                    }}>
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            {/* Filter Bar */}
                                                            <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-2">
                                                                <span className="text-xs text-gray-400 font-medium">Filter using JSONPath:</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="$.store.book[*].author"
                                                                    className="flex-1 bg-transparent border-none text-xs font-mono focus:ring-0 p-0 text-gray-600 placeholder:text-gray-300"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 p-4 overflow-auto">
                                                            {!showPreview ? (
                                                                <CodeEditor
                                                                    value={formatResponseBody(response.body, responseBodyMode)}
                                                                    onChange={() => { }}
                                                                    language={
                                                                        responseBodyMode === 'pretty' ? 'json' :
                                                                            responseBodyMode === 'javascript' ? 'javascript' :
                                                                                responseBodyMode === 'html' ? 'html' :
                                                                                    responseBodyMode === 'xml' ? 'xml' :
                                                                                        'text'
                                                                    }
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

                                                    <TabsContent value="headers" className="m-0 p-4 h-full overflow-auto">
                                                        <div className="space-y-2">
                                                            {Object.entries(response.headers).map(([key, value]) => (
                                                                <div key={key} className="flex items-start gap-2 text-sm">
                                                                    <span className="font-medium text-gray-700 min-w-32">{key}:</span>
                                                                    <span className="text-gray-600 font-mono">{value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="cookies" className="m-0 p-4 h-full overflow-auto">
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

                                                    <TabsContent value="test-results" className="m-0 p-4 h-full overflow-auto">
                                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                            <Beaker className="w-8 h-8 opacity-20 mb-2" />
                                                            <p className="text-sm font-medium">No tests executed</p>
                                                        </div>
                                                    </TabsContent>
                                                </div>
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
                                    onClick={() => setIsProtocolSelectorOpen(true)}
                                    className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    <Plus className="w-5 h-5 mr-3" />
                                    New Request
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
                            onClick={async () => {
                                if (tempName.trim()) {
                                    try {
                                        const response = await fetch(`${API_URL}/api/v1/api-testing/collections`, {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                name: tempName,
                                                project_id: projectId
                                            })
                                        })
                                        if (response.ok) {
                                            await fetchCollections()
                                            setIsNewCollectionOpen(false)
                                            setTempName('')
                                            toast.success('Collection created')
                                        }
                                    } catch (error) {
                                        console.error('Create collection error:', error)
                                        toast.error('Failed to create collection')
                                    }
                                }
                            }}
                            disabled={!tempName.trim()}
                        >
                            Create Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Protocol Selector Modal */}
            <Dialog open={isProtocolSelectorOpen} onOpenChange={(open) => {
                setIsProtocolSelectorOpen(open);
                if (!open) setPendingAddLocation(null);
            }}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <DialogHeader className="px-8 pt-8 pb-4 bg-gray-50/50">
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            Create New Request
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium text-sm mt-1">
                            {pendingAddLocation
                                ? "Choose a protocol to add a new request to your collection"
                                : "Select the protocol for your new independent API request"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 grid grid-cols-2 gap-4 bg-white">
                        {PROTOCOLS.map((proto) => (
                            <button
                                key={proto.id}
                                onClick={() => {
                                    addNewRequest(proto.id as any);
                                    setIsProtocolSelectorOpen(false);
                                }}
                                className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 transition-all group text-left"
                            >
                                <div className={`${(proto as any).padding || 'p-3'} rounded-xl ${proto.bgColor} ${proto.color} transition-transform group-hover:scale-110`}>
                                    <proto.icon className={(proto as any).iconSize || "w-6 h-6"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 mb-0.5 group-hover:text-primary transition-colors">
                                        {proto.name}
                                    </div>
                                    <div className="text-xs text-gray-500 leading-relaxed font-medium">
                                        {proto.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white text-[10px] font-black uppercase tracking-widest py-0.5 px-2">Advanced</Badge>
                            <span className="text-xs text-gray-400 font-medium">Testing across diverse protocols is now fully optimized.</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsProtocolSelectorOpen(false)} className="font-bold text-xs">
                            Cancel
                        </Button>
                    </div>
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
                        {!isCreatingNewCollection && collections.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Collection</Label>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-xs text-primary"
                                        onClick={() => {
                                            setIsCreatingNewCollection(true)
                                            setSaveTarget({ collectionId: '', folderId: '' })
                                        }}
                                    >
                                        + Create New
                                    </Button>
                                </div>
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
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>New Collection Name</Label>
                                    {collections.length > 0 && (
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs text-primary"
                                            onClick={() => setIsCreatingNewCollection(false)}
                                        >
                                            Cancel New
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="e.g. My API Collection"
                                    autoFocus
                                />
                                {collections.length === 0 && (
                                    <p className="text-[10px] text-amber-600 font-medium">
                                        You don't have any collections yet. Please create one to save your request.
                                    </p>
                                )}
                            </div>
                        )}

                        {saveTarget.collectionId && !isCreatingNewCollection && (
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
                            }}
                            disabled={isCreatingNewCollection ? !newCollectionName.trim() : !saveTarget.collectionId}
                        >
                            {isCreatingNewCollection ? 'Create & Save' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Unsaved Changes Confirmation Dialog */}
            <Dialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Do you want to save?</DialogTitle>
                        <DialogDescription>
                            This tab has unsaved changes which will be lost if you choose to close it. Save these changes to avoid losing your work.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="destructive" onClick={handleConfirmClose} className="mr-auto bg-gray-600 hover:bg-gray-700 text-white">
                            Don't save
                        </Button>
                        <Button variant="ghost" onClick={() => setIsUnsavedChangesDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAndClose}
                            className="bg-primary text-white hover:bg-primary/90"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
