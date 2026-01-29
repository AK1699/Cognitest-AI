'use client'

import { useState, useEffect } from 'react'
import {
    Zap,
    TrendingUp,
    Users,
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
        if (!projectId) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            const token = localStorage.getItem('access_token')

            // Add timeout
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 10000)

            const response = await fetch(`${API_URL}/api/v1/performance/tests?project_id=${projectId}&page=1&page_size=100`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include',
                signal: controller.signal
            })

            clearTimeout(id)

            if (response.ok) {
                const data = await response.json()
                setTests(data.items || [])
            } else {
                console.error(`Failed to fetch tests: ${response.status}`)
                // Optionally handle 401 etc
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
        <div className="flex flex-col gap-4">
            {tests.map(test => {
                const typeInfo = testTypeIcons[test.test_type] || testTypeIcons.lighthouse
                const Icon = typeInfo.icon

                return (
                    <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group p-4 flex flex-col md:flex-row md:items-center gap-6">
                        {/* Icon & Name Info */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl ${typeInfo.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                                <Icon className={`w-6 h-6 ${typeInfo.color}`} />
                            </div>
                            <div className="min-w-0 pr-4">
                                <h3 className="font-bold text-gray-900 line-clamp-1 text-base leading-tight" title={test.name}>{test.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5 font-medium opacity-80" title={test.target_url}>{test.target_url}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        {test.test_type === 'endurance' ? 'SOAK' : test.test_type.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Created {test.created_at ? formatDistanceToNow(new Date(test.created_at), { addSuffix: true }) : 'Just now'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Config Details */}
                        <div className="flex items-center gap-3 md:px-6 md:border-x border-gray-100 shrink-0 min-w-[200px]">
                            {test.test_type === 'lighthouse' ? (
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 bg-teal-50/50 px-3 py-1.5 rounded-xl border border-teal-100 shadow-sm">
                                        {test.device_type === 'desktop' ? <Monitor className="w-3.5 h-3.5 text-teal-600" /> : <Smartphone className="w-3.5 h-3.5 text-teal-600" />}
                                        <span className="text-xs font-bold text-teal-700 capitalize">{test.device_type || 'Mobile'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-teal-50/50 px-3 py-1.5 rounded-xl border border-teal-100 shadow-sm">
                                        <Zap className="w-3.5 h-3.5 text-teal-600" />
                                        <span className="text-xs font-bold text-teal-700 capitalize truncate max-w-[80px]">{test.audit_mode || 'Nav'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 bg-brand-50/50 px-3 py-1.5 rounded-xl border border-brand-100 shadow-sm">
                                        <Users className="w-3.5 h-3.5 text-brand-600" />
                                        <span className="text-xs font-bold text-brand-700">{test.virtual_users || 0} VUs</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-brand-50/50 px-3 py-1.5 rounded-xl border border-brand-100 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                                        <span className="text-xs font-bold text-brand-700">{test.duration_seconds || 0}s</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                            <Button
                                size="lg"
                                className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 border-none transition-all hover:-translate-y-0.5 active:translate-y-0 rounded-xl font-bold text-sm gap-2"
                                onClick={() => handleRunTest(test.id)}
                                disabled={executingId === test.id}
                            >
                                {executingId === test.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                Run Test
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-gray-100 shadow-xl">
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-600"
                                        onClick={() => onEditTest?.(test)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Configuration
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 cursor-pointer gap-2 py-2.5 rounded-lg font-medium hover:bg-red-50"
                                        onClick={() => setTestToDelete(test)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Test
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
