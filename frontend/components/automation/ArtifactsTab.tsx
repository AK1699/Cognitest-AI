'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Image as ImageIcon,
    Video,
    Camera,
    Film,
    Download,
    Trash2,
    Eye,
    ChevronRight,
    Calendar,
    Clock,
    Folder,
    FolderOpen,
    Search,
    RefreshCw,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { webAutomationApi, Artifact as ApiArtifact } from '@/lib/api/webAutomation'

interface ArtifactsTabProps {
    projectId: string
}

type ArtifactSubTab = 'screenshots' | 'videos'

interface Artifact {
    id: string
    name: string
    type: 'screenshot' | 'video'
    url: string
    thumbnail_url?: string
    test_name: string
    step_name?: string
    created_at: string
    size_bytes?: number
    duration_ms?: number
}

export default function ArtifactsTab({ projectId }: ArtifactsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState<ArtifactSubTab>('screenshots')
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // State for artifacts
    const [screenshots, setScreenshots] = useState<Artifact[]>([])
    const [videos, setVideos] = useState<Artifact[]>([])

    // Convert API artifact to local format
    const convertArtifact = (apiArtifact: ApiArtifact): Artifact => ({
        id: apiArtifact.id,
        name: apiArtifact.name,
        type: apiArtifact.type,
        url: apiArtifact.file_url || webAutomationApi.getArtifactDownloadUrl(projectId, apiArtifact.id),
        test_name: apiArtifact.test_name || 'Unknown Test',
        step_name: apiArtifact.step_name,
        created_at: apiArtifact.created_at,
        size_bytes: apiArtifact.size_bytes,
        duration_ms: apiArtifact.duration_ms
    })

    // Fetch artifacts from API
    const fetchArtifacts = useCallback(async () => {
        setIsLoading(true)
        try {
            // Fetch screenshots
            const screenshotResponse = await webAutomationApi.listArtifacts(projectId, { type: 'screenshot' })
            setScreenshots(screenshotResponse.items.map(convertArtifact))

            // Fetch videos
            const videoResponse = await webAutomationApi.listArtifacts(projectId, { type: 'video' })
            setVideos(videoResponse.items.map(convertArtifact))
        } catch (error) {
            console.error('Failed to fetch artifacts:', error)
            // Keep existing data on error
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    // Load artifacts on mount
    useEffect(() => {
        fetchArtifacts()
    }, [fetchArtifacts])

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-'
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return '-'
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const filteredArtifacts = activeSubTab === 'screenshots'
        ? screenshots.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.test_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : videos.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.test_name.toLowerCase().includes(searchQuery.toLowerCase())
        )

    const handleRefresh = useCallback(() => {
        fetchArtifacts()
    }, [fetchArtifacts])

    const handleView = useCallback((artifact: Artifact, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setSelectedArtifact(artifact)
    }, [])

    const handleDownload = useCallback((artifact: Artifact, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        // Create a temporary link to trigger download
        const link = document.createElement('a')
        link.href = artifact.url
        link.download = artifact.name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [])

    const handleDelete = useCallback((artifactId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setDeleteConfirm(artifactId)
    }, [])

    const confirmDelete = useCallback(async (artifactId: string) => {
        try {
            // Call API to delete artifact
            await webAutomationApi.deleteArtifact(projectId, artifactId)

            // Remove from state
            if (activeSubTab === 'screenshots') {
                setScreenshots(prev => prev.filter(a => a.id !== artifactId))
            } else {
                setVideos(prev => prev.filter(a => a.id !== artifactId))
            }

            // Close preview modal if deleting the selected artifact
            if (selectedArtifact?.id === artifactId) {
                setSelectedArtifact(null)
            }
        } catch (error) {
            console.error('Failed to delete artifact:', error)
        } finally {
            setDeleteConfirm(null)
        }
    }, [projectId, activeSubTab, selectedArtifact])

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Artifacts</h1>
                        <p className="text-sm text-gray-500">Screenshots and video recordings from test executions</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Sub-tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveSubTab('screenshots')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'screenshots'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Camera className="w-4 h-4" />
                        Screenshots
                        <Badge variant="secondary" className="ml-1 text-xs">
                            {screenshots.length}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveSubTab('videos')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'videos'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Film className="w-4 h-4" />
                        Videos
                        <Badge variant="secondary" className="ml-1 text-xs">
                            {videos.length}
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={`Search ${activeSubTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredArtifacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        {activeSubTab === 'screenshots' ? (
                            <Camera className="w-12 h-12 mb-4 text-gray-300" />
                        ) : (
                            <Film className="w-12 h-12 mb-4 text-gray-300" />
                        )}
                        <h3 className="text-lg font-medium text-gray-600 mb-1">
                            No {activeSubTab} found
                        </h3>
                        <p className="text-sm text-gray-400">
                            {searchQuery
                                ? `No results for "${searchQuery}"`
                                : `${activeSubTab === 'screenshots' ? 'Screenshots' : 'Videos'} from test executions will appear here`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredArtifacts.map((artifact) => (
                            <Card
                                key={artifact.id}
                                className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedArtifact(artifact)}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                    {artifact.type === 'screenshot' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <Video className="w-8 h-8 text-gray-400" />
                                            {artifact.duration_ms && (
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                                                    {formatDuration(artifact.duration_ms)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" className="h-8" onClick={(e) => handleView(artifact, e)}>
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                        <Button size="sm" variant="secondary" className="h-8" onClick={(e) => handleDownload(artifact, e)}>
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 hover:bg-red-100 hover:text-red-600"
                                            onClick={(e) => handleDelete(artifact.id, e)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <h4 className="font-medium text-sm text-gray-900 truncate" title={artifact.name}>
                                        {artifact.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {artifact.test_name}
                                        {artifact.step_name && ` • ${artifact.step_name}`}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                        <span>{formatDate(artifact.created_at)}</span>
                                        <span>{formatFileSize(artifact.size_bytes)}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {selectedArtifact && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
                    onClick={() => setSelectedArtifact(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedArtifact.name}</h3>
                                <p className="text-sm text-gray-500">{selectedArtifact.test_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedArtifact)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(selectedArtifact.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedArtifact(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 bg-gray-900 flex items-center justify-center min-h-[400px]">
                            {selectedArtifact.type === 'screenshot' ? (
                                <div className="flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-16 h-16" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center text-gray-400">
                                    <Video className="w-16 h-16" />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(selectedArtifact.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Folder className="w-4 h-4" />
                                    {formatFileSize(selectedArtifact.size_bytes)}
                                </span>
                                {selectedArtifact.duration_ms && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDuration(selectedArtifact.duration_ms)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Delete Artifact</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this {activeSubTab === 'screenshots' ? 'screenshot' : 'video'}?
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => confirmDelete(deleteConfirm)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
