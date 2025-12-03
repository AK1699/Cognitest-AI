'use client'

import React, { useState, useEffect } from 'react'
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
    SortAsc
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useParams } from 'next/navigation'

interface TestItem {
    id: string
    name: string
    status: 'pending' | 'running' | 'passed' | 'failed' | 'draft' | 'scheduled'
    folderId: string | null
    lastRun?: string
    tags?: string[]
}

interface TestFolder {
    id: string
    name: string
    parentId: string | null
    tests: TestItem[]
    subfolders: TestFolder[]
    expanded: boolean
}

export default function TestExplorerTab() {
    const params = useParams()
    const projectId = params.projectId as string

    const [testFolders, setTestFolders] = useState<TestFolder[]>([])
    const [ungroupedTests, setUngroupedTests] = useState<TestItem[]>([])
    const [selectedTest, setSelectedTest] = useState<TestItem | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoaded, setIsLoaded] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'test' | 'root'; id?: string } | null>(null)
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

    // Load from localStorage
    useEffect(() => {
        if (projectId && typeof window !== 'undefined' && !isLoaded) {
            const savedFolders = localStorage.getItem(`webautomation-folders-${projectId}`)
            const savedTests = localStorage.getItem(`webautomation-tests-${projectId}`)

            if (savedFolders) {
                setTestFolders(JSON.parse(savedFolders))
            } else {
                // Initial demo data if empty
                setTestFolders([
                    {
                        id: 'folder-1',
                        name: 'E-Commerce Module',
                        parentId: null,
                        expanded: true,
                        subfolders: [
                            {
                                id: 'folder-2',
                                name: 'Authentication',
                                parentId: 'folder-1',
                                expanded: true,
                                subfolders: [],
                                tests: [
                                    { id: 'test-1', name: 'Login Flow', status: 'passed', folderId: 'folder-2', lastRun: '2 mins ago' },
                                    { id: 'test-2', name: 'Social Login', status: 'failed', folderId: 'folder-2', lastRun: '1 hour ago' }
                                ]
                            }
                        ],
                        tests: []
                    }
                ])
            }

            if (savedTests) {
                setUngroupedTests(JSON.parse(savedTests))
            }

            setIsLoaded(true)
        }
    }, [projectId])

    // Save to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && projectId && isLoaded) {
            localStorage.setItem(`webautomation-folders-${projectId}`, JSON.stringify(testFolders))
            localStorage.setItem(`webautomation-tests-${projectId}`, JSON.stringify(ungroupedTests))
        }
    }, [testFolders, ungroupedTests, projectId, isLoaded])

    const toggleFolder = (folderId: string, folders: TestFolder[] = testFolders): TestFolder[] => {
        return folders.map(f => {
            if (f.id === folderId) {
                return { ...f, expanded: !f.expanded }
            }
            if (f.subfolders.length > 0) {
                return { ...f, subfolders: toggleFolder(folderId, f.subfolders) }
            }
            return f
        })
    }

    const handleToggleFolder = (folderId: string) => {
        setTestFolders(toggleFolder(folderId))
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed':
                return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
            case 'failed':
                return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200" />
            case 'running':
                return <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            case 'draft':
                return <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400" />
            default:
                return <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        }
    }

    const renderFolder = (folder: TestFolder, level: number = 0) => {
        const indent = level * 16

        return (
            <div key={folder.id}>
                <div
                    className="flex items-center group px-2 py-1.5 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                    style={{ paddingLeft: `${indent + 8}px` }}
                    onClick={() => handleToggleFolder(folder.id)}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', id: folder.id })
                    }}
                >
                    <span className="mr-1.5 text-gray-400">
                        {folder.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <Folder className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" fillOpacity="0.1" />
                    <span className="text-sm text-gray-700 font-medium flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{folder.tests.length + folder.subfolders.length}</span>
                </div>

                {folder.expanded && (
                    <div>
                        {folder.subfolders.map(sub => renderFolder(sub, level + 1))}
                        {folder.tests.map(test => (
                            <div
                                key={test.id}
                                className={`flex items-center group px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selectedTest?.id === test.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                style={{ paddingLeft: `${indent + 28}px` }}
                                onClick={() => setSelectedTest(test)}
                                onContextMenu={(e) => {
                                    e.preventDefault()
                                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'test', id: test.id })
                                }}
                            >
                                <div className="mr-2 flex-shrink-0">
                                    {getStatusIcon(test.status)}
                                </div>
                                <span className="text-sm flex-1 truncate">{test.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex w-full h-full">
            {/* Left Sidebar - Tree View */}
            <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
                {/* Toolbar */}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-y-auto p-2" onClick={() => setContextMenu(null)}>
                    {testFolders.map(folder => renderFolder(folder))}
                    {ungroupedTests.map(test => (
                        <div
                            key={test.id}
                            className={`flex items-center group px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selectedTest?.id === test.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            style={{ paddingLeft: '8px' }}
                            onClick={() => setSelectedTest(test)}
                        >
                            <div className="mr-2 flex-shrink-0">
                                {getStatusIcon(test.status)}
                            </div>
                            <span className="text-sm flex-1 truncate">{test.name}</span>
                        </div>
                    ))}
                </div>

                {/* Bottom Status Bar */}
                <div className="p-2 border-t border-gray-200 bg-white text-xs text-gray-500 flex justify-between items-center">
                    <span>{testFolders.length} folders, {ungroupedTests.length} tests</span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>12</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span>2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Content Area */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                {selectedTest ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-white">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedTest.name}</h1>
                                    <Badge variant={selectedTest.status === 'passed' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                                        {selectedTest.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Folder className="w-3.5 h-3.5" />
                                        {testFolders.find(f => f.id === selectedTest.folderId)?.name || 'Root'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5" />
                                        Last run: {selectedTest.lastRun || 'Never'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">Edit Properties</Button>
                                <Button>Run Test</Button>
                            </div>
                        </div>

                        {/* Content Placeholder */}
                        <div className="flex-1 p-8 flex items-center justify-center bg-gray-50">
                            <div className="text-center max-w-md">
                                <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Test Details View</h3>
                                <p className="text-gray-500">
                                    Select "Test Builder" tab to edit steps or "Live Browser" to run this test interactively.
                                </p>
                            </div>
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
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Test
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
