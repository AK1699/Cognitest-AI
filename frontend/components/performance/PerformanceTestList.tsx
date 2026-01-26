'use client'

import { useState, useEffect } from 'react'
import {
    Zap,
    TrendingUp,
    Activity,
    Globe,
    Play,
    Trash2,
    Calendar,
    Clock,
    MoreVertical,
    Smartphone,
    Monitor,
    Loader2,
    AlertTriangle,
    Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface PerformanceTestListProps {
    projectId: string
    refreshTrigger?: number
    onTestExecuted?: (testId: string, testType: string) => void
    onEditTest?: (test: any) => void
}

interface PerformanceTest {
    id: string
    name: string
    description?: string
    test_type: 'lighthouse' | 'load' | 'stress' | 'spike' | 'endurance' | 'api'
    target_url: string
    status: string
    created_at: string
    last_run_at?: string
    // Configuration details
    device_type?: string
    virtual_users?: number
    duration_seconds?: number
    audit_mode?: string
    test_location?: string
}

const testTypeIcons = {
    lighthouse: { icon: Zap, color: 'text-teal-600', bg: 'bg-teal-100', label: 'Lighthouse' },
    load: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Load Test' },
    stress: { icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Stress Test' },
    spike: { icon: Zap, color: 'text-red-600', bg: 'bg-red-100', label: 'Spike Test' },
    endurance: { icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Endurance Test' },
    api: { icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100', label: 'API Test' }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function PerformanceTestList({ projectId, refreshTrigger = 0, onTestExecuted, onEditTest }: PerformanceTestListProps) {
    const [tests, setTests] = useState<PerformanceTest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [executingId, setExecutingId] = useState<string | null>(null)
    const [testToDelete, setTestToDelete] = useState<PerformanceTest | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests?project_id=${projectId}&page=1&page_size=100`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setTests(data.items || [])
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTests()
    }, [projectId, refreshTrigger])

    const handleRunTest = async (testId: string) => {
        setExecutingId(testId)
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testId}/execute`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })
            if (response.ok) {
                const test = tests.find(t => t.id === testId)
                // Trigger the callback to start polling in the parent
                if (onTestExecuted && test) {
                    onTestExecuted(testId, test.test_type)
                }
            }
        } catch (error) {
            console.error('Failed to execute test:', error)
        } finally {
            setExecutingId(null)
        }
    }

    const confirmDelete = async () => {
        if (!testToDelete) return

        setIsDeleting(true)
        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_URL}/api/v1/performance/tests/${testToDelete.id}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            })
            if (response.ok) {
                setTests(prev => prev.filter(t => t.id !== testToDelete.id))
                setTestToDelete(null)
            }
        } catch (error) {
            console.error('Failed to delete test:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        )
    }

    if (tests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Tests Found</h3>
                <p className="text-gray-500 text-center max-w-sm mb-4">
                    You haven't created any performance tests yet. Use the "Create Test" button to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => {
                const typeInfo = testTypeIcons[test.test_type] || testTypeIcons.lighthouse
                const Icon = typeInfo.icon

                return (
                    <div key={test.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => onEditTest?.(test)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit Configuration
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                            onClick={() => setTestToDelete(test)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-900 line-clamp-1" title={test.name}>{test.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1" title={test.target_url}>{test.target_url}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-gray-600">
                                {test.test_type === 'lighthouse' ? (
                                    <>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            {test.device_type === 'desktop' ? <Monitor className="w-3 h-3 text-brand-600" /> : <Smartphone className="w-3 h-3 text-brand-600" />}
                                            <span className="capitalize">{test.device_type || 'Mobile'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            <Zap className="w-3 h-3 text-brand-600" />
                                            <span className="capitalize truncate">{test.audit_mode || 'Navigation'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            <TrendingUp className="w-3 h-3 text-brand-600" />
                                            <span>{test.virtual_users || 0} VUs</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            <Clock className="w-3 h-3 text-brand-600" />
                                            <span>{test.duration_seconds || 0}s</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <span className="text-xs text-gray-500">
                                    {test.created_at ? formatDistanceToNow(new Date(test.created_at), { addSuffix: true }) : 'Just now'}
                                </span>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                                    onClick={() => handleRunTest(test.id)}
                                    disabled={executingId === test.id}
                                >
                                    {executingId === test.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5" />
                                    )}
                                    Run
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            })}

            <Dialog open={!!testToDelete} onOpenChange={(open) => !open && setTestToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirm Action
                        </DialogTitle>
                        <DialogDescription className="pt-4 flex flex-col gap-3 text-base leading-relaxed">
                            <span className="break-all">
                                Are you sure you want to delete <span className="font-semibold text-gray-900">"{testToDelete?.name}"</span>?
                            </span>
                            <span>
                                This action cannot be undone and will delete all associated history and reports.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setTestToDelete(null)}
                            disabled={isDeleting}
                            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-red-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm focus:ring-red-500"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
