'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, AlertCircle, Loader2, MessageSquare, Trash2, CheckCircle2, Clock, Tag, X } from 'lucide-react'
import { issuesAPI, Issue } from '@/lib/api/issues'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface IssuesTabProps {
    projectId: string
}

const SEVERITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
}

const PRIORITY_COLORS = {
    trivial: 'bg-gray-100 text-gray-600',
    low: 'bg-green-100 text-green-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
    blocker: 'bg-red-200 text-red-900',
}

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    fixed: 'bg-green-100 text-green-800',
    retested: 'bg-teal-100 text-teal-800',
    closed: 'bg-gray-100 text-gray-800',
    reopened: 'bg-red-100 text-red-800',
    wont_fix: 'bg-gray-200 text-gray-600',
    duplicate: 'bg-gray-200 text-gray-600',
    deferred: 'bg-yellow-200 text-yellow-800',
}

export default function IssuesTab({ projectId }: IssuesTabProps) {
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
    const [issues, setIssues] = useState<Issue[]>([])
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { confirm, ConfirmDialog } = useConfirm()

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        severity: '',
        priority: '',
    })

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'medium' as Issue['severity'],
        priority: 'medium' as Issue['priority'],
        status: 'new' as Issue['status'],
        steps_to_reproduce: [
            { step_number: 1, action: '', expected: '', actual: '' },
        ],
        expected_result: '',
        actual_result: '',
        environment: {},
        affected_features: [''],
        workaround: '',
        tags: [''],
    })

    useEffect(() => {
        loadIssues()
    }, [filters])

    const loadIssues = async () => {
        setLoading(true)
        try {
            const result = await issuesAPI.list(projectId, {
                search: filters.search || undefined,
                status: filters.status || undefined,
                severity: filters.severity || undefined,
                priority: filters.priority || undefined,
            })
            setIssues(result)
        } catch (err: any) {
            setError('Failed to load issues')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            await issuesAPI.create({
                project_id: projectId,
                title: formData.title,
                description: formData.description,
                severity: formData.severity,
                priority: formData.priority,
                status: formData.status,
                detected_by: 'manual',
                steps_to_reproduce: formData.steps_to_reproduce.filter(s => s.action),
                actual_result: formData.actual_result,
                expected_result: formData.expected_result,
                environment: formData.environment,
                attachments: [],
                affected_features: formData.affected_features.filter(f => f),
                workaround: formData.workaround,
                remediation_suggestions: [],
                tags: formData.tags.filter(t => t),
                labels: [],
                meta_data: {},
                created_by: 'current-user',
            })

            setSuccess('Issue created successfully!')
            await loadIssues()
            setView('list')
            resetForm()
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create issue')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (issueId: string, newStatus: Issue['status']) => {
        try {
            await issuesAPI.changeStatus(issueId, {
                status: newStatus,
                user_id: 'current-user',
                user_name: 'Current User',
                notes: `Changed status to ${newStatus}`,
            })
            setSuccess(`Status changed to ${newStatus}`)
            await loadIssues()
            if (selectedIssue?.id === issueId) {
                const updated = await issuesAPI.get(issueId)
                setSelectedIssue(updated)
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to change status')
        }
    }

    const handleDelete = async (issueId: string) => {
        const confirmed = await confirm({
            message: 'Are you sure you want to delete this issue?',
            variant: 'danger',
            confirmText: 'Delete'
        })
        if (!confirmed) return

        try {
            await issuesAPI.delete(issueId)
            setSuccess('Issue deleted successfully')
            await loadIssues()
            if (selectedIssue?.id === issueId) {
                setView('list')
                setSelectedIssue(null)
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete issue')
        }
    }

    const viewIssueDetail = async (issue: Issue) => {
        setSelectedIssue(issue)
        setView('detail')
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            severity: 'medium',
            priority: 'medium',
            status: 'new',
            steps_to_reproduce: [{ step_number: 1, action: '', expected: '', actual: '' }],
            expected_result: '',
            actual_result: '',
            environment: {},
            affected_features: [''],
            workaround: '',
            tags: [''],
        })
    }

    const addStep = () => {
        setFormData({
            ...formData,
            steps_to_reproduce: [
                ...formData.steps_to_reproduce,
                { step_number: formData.steps_to_reproduce.length + 1, action: '', expected: '', actual: '' },
            ],
        })
    }

    const updateStep = (index: number, field: string, value: string) => {
        const newSteps = [...formData.steps_to_reproduce]
        newSteps[index] = { ...newSteps[index], [field]: value }
        setFormData({ ...formData, steps_to_reproduce: newSteps })
    }

    return (
        <div className="bg-white">
            {/* Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-900">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-900">Success</h3>
                        <p className="text-sm text-green-700 mt-1">{success}</p>
                    </div>
                    <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div>
                    {/* Filters and Actions */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search issues..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="fixed">Fixed</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">All Severities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>

                        <button
                            onClick={() => setView('create')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            New Issue
                        </button>
                    </div>

                    {/* Issues List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                            <p className="text-gray-600">Loading issues...</p>
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {filters.search || filters.status || filters.severity
                                    ? 'Try adjusting your filters'
                                    : 'Create your first issue to get started'}
                            </p>
                            {!filters.search && !filters.status && !filters.severity && (
                                <button
                                    onClick={() => setView('create')}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    Create First Issue
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    onClick={() => viewIssueDetail(issue)}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">{issue.title}</h4>
                                            {issue.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[issue.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {issue.status.replace('_', ' ')}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${SEVERITY_COLORS[issue.severity]}`}>
                                                {issue.severity}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(issue.created_at).toLocaleDateString()}
                                        </div>
                                        {issue.comments && issue.comments.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="w-4 h-4" />
                                                {issue.comments.length}
                                            </div>
                                        )}
                                        {issue.tags && issue.tags.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Tag className="w-4 h-4" />
                                                {issue.tags.slice(0, 2).join(', ')}
                                                {issue.tags.length > 2 && ` +${issue.tags.length - 2}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create View */}
            {view === 'create' && (
                <div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Create New Issue</h3>
                        <p className="text-sm text-gray-500">Report a bug or defect</p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Brief description of the issue"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detailed description..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Severity <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="trivial">Trivial</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                    <option value="blocker">Blocker</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => { setView('list'); resetForm(); }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Issue'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Detail View */}
            {view === 'detail' && selectedIssue && (
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{selectedIssue.title}</h3>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[selectedIssue.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {selectedIssue.status.replace('_', ' ')}
                                </span>
                                <span className={`px-3 py-1 text-sm rounded-full ${SEVERITY_COLORS[selectedIssue.severity]}`}>
                                    {selectedIssue.severity}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setView('list')}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back to List
                            </button>
                            <button
                                onClick={() => handleDelete(selectedIssue.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            {selectedIssue.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-gray-700">{selectedIssue.description}</p>
                                </div>
                            )}

                            {selectedIssue.steps_to_reproduce && selectedIssue.steps_to_reproduce.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Steps to Reproduce</h4>
                                    <div className="space-y-2">
                                        {selectedIssue.steps_to_reproduce.map((step, index) => (
                                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="font-medium text-sm text-gray-700 mb-1">
                                                    Step {step.step_number}: {step.action}
                                                </div>
                                                <div className="text-sm text-gray-600">Expected: {step.expected}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Change Status</h4>
                                <select
                                    value={selectedIssue.status}
                                    onChange={(e) => handleStatusChange(selectedIssue.id, e.target.value as Issue['status'])}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="new">New</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="retested">Retested</option>
                                    <option value="closed">Closed</option>
                                    <option value="reopened">Reopened</option>
                                    <option value="wont_fix">Won&apos;t Fix</option>
                                    <option value="duplicate">Duplicate</option>
                                    <option value="deferred">Deferred</option>
                                </select>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <div className="font-medium">{new Date(selectedIssue.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog />
        </div>
    )
}
