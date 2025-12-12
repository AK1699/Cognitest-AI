'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    Search,
    ChevronRight,
    ChevronDown,
    Folder,
    FolderPlus,
    Plus,
    Trash2,
    FileText,
    FlaskConical,
    MoreVertical,
    Filter,
    SortAsc,
    Loader2,
    Play,
    Monitor,
    MonitorOff,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useParams, useRouter } from 'next/navigation'
import { webAutomationApi, TestFlow, TestFlowCreate } from '@/lib/api/webAutomation'
import { projectsApi, ProjectSettings } from '@/lib/api/projects'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// Internal UI Structure
interface ExplorerItem {
    id: string
    type: 'folder' | 'test'
    name: string
    parentId: string | null
    children?: ExplorerItem[]
    expanded?: boolean
    data?: TestFlow // Only for tests
}

// Persisted Folder Structure (in Project Settings)
interface FolderNode {
    id: string
    name: string
    children: FolderNode[]
    testIds: string[]
    expanded: boolean
}

interface TestExplorerTabProps {
    onEditTest?: (flowId: string) => void
    onRunInBrowser?: (flowId: string, testName: string) => void
}

export default function TestExplorerTab({ onEditTest, onRunInBrowser }: TestExplorerTabProps) {
    const params = useParams()
    const projectId = params.projectId as string
    const router = useRouter()

    const [explorerData, setExplorerData] = useState<ExplorerItem[]>([])
    const [rawTests, setRawTests] = useState<TestFlow[]>([])
    const [selectedItem, setSelectedItem] = useState<ExplorerItem | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isRunning, setIsRunning] = useState(false)

    // Execution tracking state for headless mode
    const [executingStepIndex, setExecutingStepIndex] = useState<number | null>(null)
    const [stepStatuses, setStepStatuses] = useState<Map<number, 'pending' | 'running' | 'passed' | 'failed'>>(new Map())
    const wsRef = useRef<WebSocket | null>(null)

    // Modal States
    const [isCreateTestOpen, setIsCreateTestOpen] = useState(false)
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
    const [isRenameOpen, setIsRenameOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [itemToActOn, setItemToActOn] = useState<ExplorerItem | null>(null)
    const [newItemName, setNewItemName] = useState('')
    const [newItemUrl, setNewItemUrl] = useState('') // For test creation
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null)

    // Load Data
    const loadData = useCallback(async () => {
        if (!projectId) return
        setIsLoading(true)
        try {
            // Fetch project settings first
            const project = await projectsApi.getProject(projectId)

            // Try to fetch test flows, but gracefully handle errors
            let tests: TestFlow[] = []
            try {
                tests = await webAutomationApi.listTestFlows(projectId)
            } catch (flowError) {
                console.warn('No test flows found or API error:', flowError)
                // Continue with empty array - will show "No records"
            }

            setRawTests(tests)

            // Reconstruct Tree
            const savedFolders: FolderNode[] = project.settings?.testFolders || []
            const tree = buildExplorerTree(savedFolders, tests)
            setExplorerData(tree)

        } catch (error) {
            console.error('Failed to load explorer data:', error)
            setRawTests([])
            setExplorerData([])
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Helper: Build Tree for UI from Saved Folders + Test List
    const buildExplorerTree = (folders: FolderNode[], tests: TestFlow[]): ExplorerItem[] => {
        const usedTestIds = new Set<string>()

        // Recursive function to build folder nodes
        const mapFolder = (node: FolderNode, parentId: string | null): ExplorerItem => {
            const children: ExplorerItem[] = []

            // Subfolders
            if (node.children) {
                children.push(...node.children.map(child => mapFolder(child, node.id)))
            }

            // Tests in this folder
            if (node.testIds) {
                node.testIds.forEach(testId => {
                    const test = tests.find(t => t.id === testId)
                    if (test) {
                        usedTestIds.add(testId)
                        children.push({
                            id: test.id,
                            type: 'test',
                            name: test.name,
                            parentId: node.id,
                            data: test
                        })
                    }
                })
            }

            return {
                id: node.id,
                type: 'folder',
                name: node.name,
                parentId: parentId,
                expanded: node.expanded,
                children: children
            }
        }

        const tree = folders.map(f => mapFolder(f, null))

        // Handle Orphan Tests (not in any folder)
        const orphanTests = tests.filter(t => !usedTestIds.has(t.id))
        orphanTests.forEach(test => {
            tree.push({
                id: test.id,
                type: 'test',
                name: test.name,
                parentId: null,
                data: test
            })
        })

        return tree
    }

    // Helper: Convert UI Tree back to FolderNode for persistence
    const serializeTree = (items: ExplorerItem[]): FolderNode[] => {
        return items
            .filter(item => item.type === 'folder')
            .map(folder => ({
                id: folder.id,
                name: folder.name,
                expanded: folder.expanded || false,
                children: serializeTree(folder.children || []),
                testIds: folder.children?.filter(c => c.type === 'test').map(c => c.id) || []
            }))
    }

    const saveFolderStructure = async (newTree: ExplorerItem[]) => {
        try {
            setIsSaving(true)
            const project = await projectsApi.getProject(projectId)
            const serialized = serializeTree(newTree)

            await projectsApi.updateProject(projectId, {
                settings: {
                    ...project.settings,
                    testFolders: serialized
                }
            })
        } catch (error) {
            console.error('Failed to save structure:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Toggle Folder Expansion
    const handleToggleFolder = (folderId: string) => {
        const toggleRecursive = (items: ExplorerItem[]): ExplorerItem[] => {
            return items.map(item => {
                if (item.id === folderId) {
                    return { ...item, expanded: !item.expanded }
                }
                if (item.children) {
                    return { ...item, children: toggleRecursive(item.children) }
                }
                return item
            })
        }

        const newTree = toggleRecursive(explorerData)
        setExplorerData(newTree)
        // Optionally debounce save expansion state
        saveFolderStructure(newTree)
    }

    // Create New Test Flow
    const handleCreateTest = async () => {
        if (!newItemName.trim()) return

        try {
            setIsSaving(true)
            const newTest = await webAutomationApi.createTestFlow(projectId, {
                name: newItemName
            })

            // Add to tree
            const addTestToTree = (items: ExplorerItem[]): ExplorerItem[] => {
                // If creating in root
                if (!targetFolderId) {
                    return [...items, {
                        id: newTest.id,
                        type: 'test',
                        name: newTest.name,
                        parentId: null,
                        data: newTest
                    }]
                }

                // If creating in a folder
                return items.map(item => {
                    if (item.id === targetFolderId && item.type === 'folder') {
                        return {
                            ...item,
                            children: [...(item.children || []), {
                                id: newTest.id,
                                type: 'test',
                                name: newTest.name,
                                parentId: item.id,
                                data: newTest
                            }],
                            expanded: true
                        }
                    }
                    if (item.children) {
                        return { ...item, children: addTestToTree(item.children) }
                    }
                    return item
                })
            }

            const newTree = addTestToTree(explorerData)
            setExplorerData(newTree)
            setRawTests([...rawTests, newTest])
            setSelectedItem({
                id: newTest.id,
                type: 'test',
                name: newTest.name,
                parentId: targetFolderId,
                data: newTest
            })

            await saveFolderStructure(newTree)
            setIsCreateTestOpen(false)
            setNewItemName('')
            setNewItemUrl('')

        } catch (error) {
            console.error("Failed to create test:", error)
        } finally {
            setIsSaving(false)
        }
    }

    // Run Test
    const handleRunTest = async (mode: 'headed' | 'headless') => {
        if (!selectedItem?.data?.id) return

        if (mode === 'headed') {
            // Switch to Live Browser tab to run visually
            if (onRunInBrowser) {
                onRunInBrowser(selectedItem.data.id, selectedItem.name)
                toast.info('Switching to Live Browser for headed execution...')
            } else {
                toast.error('Live Browser not available')
            }
            return
        }

        // Headless mode - run in background with real-time step updates
        setIsRunning(true)
        setExecutingStepIndex(null)

        // Capture flowId at start (before closures use it)
        const flowId = selectedItem.data!.id

        // Initialize step statuses
        const steps = selectedItem.data?.nodes || []
        const initialStatuses = new Map<number, 'pending' | 'running' | 'passed' | 'failed'>()
        steps.forEach((_: any, index: number) => {
            initialStatuses.set(index, 'pending')
        })
        setStepStatuses(initialStatuses)

        toast.info('Starting headless test execution...')

        // Create WebSocket connection for live updates
        const sessionId = `headless-${Date.now()}`
        const wsUrl = `ws://localhost:8000/api/v1/web-automation/ws/browser-session/${sessionId}`

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                // Launch browser in headless mode
                ws.send(JSON.stringify({
                    action: 'launch',
                    browserType: 'chromium',
                    device: 'desktop_chrome',
                    url: 'about:blank',
                    headless: true
                }))
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    switch (data.type) {
                        case 'session_started':
                            // Browser is ready, execute the test
                            ws.send(JSON.stringify({
                                action: 'execute_test',
                                flowId: flowId
                            }))
                            break

                        case 'step_started':
                            setExecutingStepIndex(data.stepIndex)
                            setStepStatuses(prev => {
                                const newMap = new Map(prev)
                                newMap.set(data.stepIndex, 'running')
                                return newMap
                            })
                            break

                        case 'step_completed':
                            setStepStatuses(prev => {
                                const newMap = new Map(prev)
                                newMap.set(data.stepIndex, data.status === 'passed' ? 'passed' : 'failed')
                                return newMap
                            })
                            break

                        case 'test_execution_completed':
                            setExecutingStepIndex(null)
                            setIsRunning(false)
                            ws.close()
                            wsRef.current = null

                            if (data.failedSteps > 0) {
                                toast.error(`Test failed! ${data.passedSteps} passed, ${data.failedSteps} failed`)
                            } else {
                                toast.success(`Test passed! All ${data.passedSteps} steps completed successfully`)
                            }
                            break

                        case 'error':
                            console.error('Execution error:', data.error)
                            toast.error(`Error: ${data.error}`)
                            setIsRunning(false)
                            setExecutingStepIndex(null)
                            ws.close()
                            wsRef.current = null
                            break
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err)
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                toast.error('Failed to connect to execution server')
                setIsRunning(false)
                setExecutingStepIndex(null)
            }

            ws.onclose = () => {
                if (isRunning) {
                    setIsRunning(false)
                    setExecutingStepIndex(null)
                }
                wsRef.current = null
            }

        } catch (error: any) {
            console.error("Failed to run test:", error)
            toast.error(`Failed to run test: ${error.message || 'Unknown error'}`)
            setIsRunning(false)
            setExecutingStepIndex(null)
        }
    }

    // Create New Folder
    const handleCreateFolder = async () => {
        if (!newItemName.trim()) return

        const newFolder: ExplorerItem = {
            id: `folder-${Date.now()}`,
            type: 'folder',
            name: newItemName,
            parentId: targetFolderId,
            expanded: true,
            children: []
        }

        const addFolderToTree = (items: ExplorerItem[]): ExplorerItem[] => {
            if (!targetFolderId) {
                return [...items, newFolder]
            }
            return items.map(item => {
                if (item.id === targetFolderId && item.type === 'folder') {
                    return {
                        ...item,
                        children: [...(item.children || []), newFolder],
                        expanded: true
                    }
                }
                if (item.children) {
                    return { ...item, children: addFolderToTree(item.children) }
                }
                return item
            })
        }

        const newTree = addFolderToTree(explorerData)
        setExplorerData(newTree)
        await saveFolderStructure(newTree)

        setIsCreateFolderOpen(false)
        setNewItemName('')
    }

    // Rename Item (Folder or Test)
    const handleRename = async () => {
        if (!itemToActOn || !newItemName.trim()) return

        try {
            setIsSaving(true)

            if (itemToActOn.type === 'test') {
                // Rename test via API
                await webAutomationApi.updateTestFlow(itemToActOn.id, { name: newItemName })

                // Update rawTests
                setRawTests(prev => prev.map(t =>
                    t.id === itemToActOn.id ? { ...t, name: newItemName } : t
                ))
            }

            // Update explorer tree (both folders and tests)
            const renameInTree = (items: ExplorerItem[]): ExplorerItem[] => {
                return items.map(item => {
                    if (item.id === itemToActOn.id) {
                        return { ...item, name: newItemName }
                    }
                    if (item.children) {
                        return { ...item, children: renameInTree(item.children) }
                    }
                    return item
                })
            }

            const newTree = renameInTree(explorerData)
            setExplorerData(newTree)

            // Update selected item if it was renamed
            if (selectedItem?.id === itemToActOn.id) {
                setSelectedItem({ ...selectedItem, name: newItemName })
            }

            // Save folder structure if it was a folder rename
            if (itemToActOn.type === 'folder') {
                await saveFolderStructure(newTree)
            }

            setIsRenameOpen(false)
            setNewItemName('')
            setItemToActOn(null)
        } catch (error) {
            console.error('Failed to rename:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Delete Item (Folder or Test)
    const handleDelete = async () => {
        if (!itemToActOn) return

        try {
            setIsSaving(true)

            if (itemToActOn.type === 'test') {
                // Delete test via API
                await webAutomationApi.deleteTestFlow(itemToActOn.id)

                // Remove from rawTests
                setRawTests(prev => prev.filter(t => t.id !== itemToActOn.id))
            }

            // Remove from explorer tree
            const removeFromTree = (items: ExplorerItem[]): ExplorerItem[] => {
                return items
                    .filter(item => item.id !== itemToActOn.id)
                    .map(item => {
                        if (item.children) {
                            return { ...item, children: removeFromTree(item.children) }
                        }
                        return item
                    })
            }

            const newTree = removeFromTree(explorerData)
            setExplorerData(newTree)

            // Clear selection if deleted item was selected
            if (selectedItem?.id === itemToActOn.id) {
                setSelectedItem(null)
            }

            // Save folder structure
            await saveFolderStructure(newTree)

            setIsDeleteOpen(false)
            setItemToActOn(null)
        } catch (error) {
            console.error('Failed to delete:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Open Rename Dialog
    const openRenameDialog = (item: ExplorerItem) => {
        setItemToActOn(item)
        setNewItemName(item.name)
        setIsRenameOpen(true)
    }

    // Open Delete Dialog
    const openDeleteDialog = (item: ExplorerItem) => {
        setItemToActOn(item)
        setIsDeleteOpen(true)
    }

    // Render Tree Recursively
    const renderNode = (item: ExplorerItem, level = 0) => {
        // Filter by search
        if (searchQuery && item.type === 'test' && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null
        }

        const paddingLeft = level * 16 + 12

        if (item.type === 'folder') {
            return (
                <div key={item.id}>
                    <div
                        className={`flex items-center group px-2 py-1.5 hover:bg-gray-100 rounded-md cursor-pointer transition-colors text-sm
                            ${selectedItem?.id === item.id ? 'bg-gray-100' : ''}`}
                        style={{ paddingLeft: `${paddingLeft}px` }}
                        onClick={() => handleToggleFolder(item.id)}
                    >
                        <span className="mr-1 text-gray-400">
                            {item.expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                        <Folder className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-gray-700 font-medium truncate flex-1">{item.name}</span>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        setTargetFolderId(item.id)
                                        setNewItemName('')
                                        setIsCreateTestOpen(true)
                                    }}>
                                        <Plus className="w-3.5 h-3.5 mr-2" />
                                        New Test
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        setTargetFolderId(item.id)
                                        setNewItemName('')
                                        setIsCreateFolderOpen(true)
                                    }}>
                                        <FolderPlus className="w-3.5 h-3.5 mr-2" />
                                        New Folder
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        openRenameDialog(item)
                                    }}>
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        openDeleteDialog(item)
                                    }}>
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {item.expanded && item.children && (
                        <div>
                            {item.children.map(child => renderNode(child, level + 1))}
                        </div>
                    )}
                </div>
            )
        }

        // Render Test Item
        return (
            <div
                key={item.id}
                className={`flex items-center group px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm
                    ${selectedItem?.id === item.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                style={{ paddingLeft: `${paddingLeft + 16}px` }} // Indent test more
                onClick={() => setSelectedItem(item)}
            >
                <FlaskConical className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span className="truncate flex-1">{item.name}</span>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-200">
                                <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                openRenameDialog(item)
                            }}>
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                openDeleteDialog(item)
                            }}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="flex w-full h-full">
            {/* Left Sidebar */}
            <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
                <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            className="h-8 pl-8 text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-900"
                            onClick={() => {
                                setTargetFolderId(null)
                                setNewItemName('')
                                setIsCreateFolderOpen(true)
                            }}
                            title="New Folder"
                        >
                            <FolderPlus className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-900"
                            onClick={() => {
                                setTargetFolderId(null)
                                setNewItemName('')
                                setIsCreateTestOpen(true)
                            }}
                            title="New Test"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">

                    {explorerData.map(node => renderNode(node))}
                    {explorerData.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <FlaskConical className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm font-medium">No records found</p>
                            <p className="text-xs mt-1">Create a new test to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                {selectedItem && selectedItem.type === 'test' ? (
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-white">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h1>
                                    <Badge variant={(selectedItem.data?.status === 'active' || !selectedItem.data?.status) ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                        {selectedItem.data?.status || 'Draft'}
                                    </Badge>
                                </div>

                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => onEditTest?.(selectedItem.id)}
                                >
                                    Edit
                                </Button>
                                <Button variant="outline">Properties</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button disabled={isRunning} className="min-w-[110px]">
                                            {isRunning ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Run Test
                                                </>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleRunTest('headed')} className="cursor-pointer">
                                            <Monitor className="w-4 h-4 mr-2" />
                                            <span>Run Headed</span>
                                            <span className="ml-auto text-xs text-gray-400">Visible</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRunTest('headless')} className="cursor-pointer">
                                            <MonitorOff className="w-4 h-4 mr-2" />
                                            <span>Run Headless</span>
                                            <span className="ml-auto text-xs text-gray-400">Fast</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                            {selectedItem.data?.nodes && selectedItem.data.nodes.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                        Test Steps ({selectedItem.data.nodes.length})
                                    </h3>
                                    {selectedItem.data.nodes.map((step: any, index: number) => {
                                        const stepStatus = stepStatuses.get(index) || 'pending'
                                        const isCurrentlyExecuting = executingStepIndex === index

                                        return (
                                            <div
                                                key={step.id || index}
                                                className={`flex items-start gap-3 p-4 bg-white border-2 rounded-lg shadow-sm transition-all ${isCurrentlyExecuting
                                                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-blue-100'
                                                    : stepStatus === 'passed'
                                                        ? 'border-green-400 bg-green-50/30'
                                                        : stepStatus === 'failed'
                                                            ? 'border-red-400 bg-red-50/30'
                                                            : 'border-gray-200 hover:shadow-md'
                                                    }`}
                                            >
                                                {/* Step number/status indicator */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCurrentlyExecuting
                                                    ? 'bg-blue-500 text-white animate-pulse'
                                                    : stepStatus === 'passed'
                                                        ? 'bg-green-500 text-white'
                                                        : stepStatus === 'failed'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-blue-600 text-white'
                                                    }`}>
                                                    {isCurrentlyExecuting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : stepStatus === 'passed' ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : stepStatus === 'failed' ? (
                                                        <XCircle className="w-4 h-4" />
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-gray-900 capitalize">
                                                            {step.action?.replace(/_/g, ' ') || 'Unknown Action'}
                                                        </span>
                                                        {isCurrentlyExecuting && (
                                                            <span className="text-xs text-blue-600 animate-pulse">Running...</span>
                                                        )}
                                                        {stepStatus === 'passed' && !isCurrentlyExecuting && (
                                                            <span className="text-xs text-green-600">Passed</span>
                                                        )}
                                                        {stepStatus === 'failed' && !isCurrentlyExecuting && (
                                                            <span className="text-xs text-red-600">Failed</span>
                                                        )}
                                                    </div>

                                                    {/* Navigate Action - Enhanced Display */}
                                                    {step.action === 'navigate' && step.url && (
                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-blue-700">URL:</span>
                                                                <a
                                                                    href={step.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline truncate flex-1"
                                                                    title={step.url}
                                                                >
                                                                    {step.url}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Description */}
                                                    {step.description && (
                                                        <p className="text-xs text-gray-600 mt-2">{step.description}</p>
                                                    )}

                                                    {/* Selector */}
                                                    {step.selector && (
                                                        <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-md">
                                                            <span className="text-[10px] font-medium text-gray-500 uppercase">Selector</span>
                                                            <code className="text-xs text-gray-700 font-mono block mt-0.5 truncate">
                                                                {step.selector}
                                                            </code>
                                                        </div>
                                                    )}

                                                    {/* Value (for type, assertions, etc.) */}
                                                    {step.value && step.action !== 'navigate' && (
                                                        <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md">
                                                            <span className="text-[10px] font-medium text-green-700 uppercase">Value</span>
                                                            <p className="text-xs text-green-800 mt-0.5">{step.value}</p>
                                                        </div>
                                                    )}

                                                    {/* Timeout */}
                                                    {step.timeout && step.timeout !== 5000 && (
                                                        <Badge variant="outline" className="mt-2 text-[10px]">
                                                            Timeout: {step.timeout}ms
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Steps Yet</h3>
                                    <p className="text-gray-500 mb-4">
                                        This test has no steps. Click "Edit" to add steps in the Test Builder.
                                    </p>
                                    <Button variant="outline" onClick={() => onEditTest?.(selectedItem.id)}>
                                        Open in Test Builder
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FlaskConical className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Test Selected</h3>
                            <p className="max-w-sm mx-auto mb-6">Select a test from the explorer or create a new one to get started.</p>
                            <Button onClick={() => {
                                setTargetFolderId(null)
                                setNewItemName('')
                                setIsCreateTestOpen(true)
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Test
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Test Dialog */}
            <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Test</DialogTitle>
                        <DialogDescription>
                            Create a new test flow to start automating.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label>Test Name</Label>
                            <Input
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="e.g. Login Flow"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateTestOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTest} disabled={!newItemName.trim() || isSaving}>
                            {isSaving ? 'Creating...' : 'Create Test'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Folder Name</Label>
                        <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. Authentication"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder} disabled={!newItemName.trim() || isSaving}>
                            {isSaving ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={(open) => {
                setIsRenameOpen(open)
                if (!open) {
                    setItemToActOn(null)
                    setNewItemName('')
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename {itemToActOn?.type === 'folder' ? 'Folder' : 'Test'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>New Name</Label>
                        <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Enter new name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newItemName.trim()) {
                                    handleRename()
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename} disabled={!newItemName.trim() || isSaving}>
                            {isSaving ? 'Renaming...' : 'Rename'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={(open) => {
                setIsDeleteOpen(open)
                if (!open) setItemToActOn(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {itemToActOn?.type === 'folder' ? 'Folder' : 'Test'}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{itemToActOn?.name}"?
                            {itemToActOn?.type === 'folder' && (
                                <span className="block mt-2 text-amber-600">
                                    Warning: This will remove the folder and all its contents.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
