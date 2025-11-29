'use client'

import React, { useState, useEffect } from 'react'
import { UserNav } from '@/components/layout/user-nav'
import { Globe, Plus, Play, Edit, Trash2, FileCode, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, Search, Filter, BarChart3, Settings, Workflow, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import CognitestBot3D from '@/components/ui/CognitestBot3D'

interface AutomationScript {
  id: string
  name: string
  description: string
  script_type: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  total_executions: number
  successful_executions: number
  failed_executions: number
  average_duration: number
  created_at: string
  updated_at: string
  created_by: string
}

interface WebAutomationPageProps {
  params: Promise<{
    uuid: string
    projectId: string
  }>
}

export default function WebAutomationPage({ params }: WebAutomationPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [orgId, setOrgId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('Project')
  const [scripts, setScripts] = useState<AutomationScript[]>([])
  const [filteredScripts, setFilteredScripts] = useState<AutomationScript[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'scripts' | 'executions' | 'settings'>('scripts')

  // Get params
  useEffect(() => {
    params.then(({ uuid, projectId }) => {
      setOrgId(uuid)
      setProjectId(projectId)
    })
  }, [params])

  // Fetch scripts
  useEffect(() => {
    fetchScripts()
  }, [])

  // Filter scripts
  useEffect(() => {
    let filtered = scripts

    if (searchQuery) {
      filtered = filtered.filter(script =>
        script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(script => script.status === statusFilter)
    }

    setFilteredScripts(filtered)
  }, [scripts, searchQuery, statusFilter])

  const fetchScripts = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/automation/scripts?script_type=web_automation')
      // const data = await response.json()
      // setScripts(data)

      // Mock data for now
      setScripts([])
    } catch (error) {
      console.error('Failed to fetch scripts:', error)
      toast.error('Failed to load automation scripts')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Active' },
      inactive: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Inactive' },
      archived: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Archived' }
    }
    const variant = variants[status] || variants.draft
    return (
      <Badge className={`${variant.color} border-0`}>
        {variant.label}
      </Badge>
    )
  }

  const calculateSuccessRate = (script: AutomationScript) => {
    if (script.total_executions === 0) return 0
    return Math.round((script.successful_executions / script.total_executions) * 100)
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: '#f0fefa' }}>
        {/* Logo Section */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200">
          <CognitestBot3D size={48} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              Cogni<span className="text-primary">Test</span>
            </h1>
          </div>
        </div>

        {/* Project Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate text-gray-900">Web Automation</h3>
            </div>
          </div>
          <button
            onClick={() => orgId && projectId && router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub`)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            disabled={!orgId || !projectId}
          >
            <ChevronLeft className="w-3 h-3" />
            Back to Automation Hub
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Web Automation Section */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Web Automation</div>
              <button
                onClick={() => setActiveTab('scripts')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'scripts'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileCode className="w-4 h-4" />
                All Scripts
              </button>
              <button
                onClick={() => setActiveTab('executions')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'executions'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Executions
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Other Automation Types Section */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Other Automation</div>
              <button
                disabled
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
              >
                <Workflow className="w-4 h-4" />
                Workflow Automation
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Soon</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="h-[80px] px-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'scripts' && 'Web Automation Scripts'}
                {activeTab === 'executions' && 'Execution History'}
                {activeTab === 'settings' && 'Automation Settings'}
              </h1>
              <p className="text-xs text-gray-500">
                {activeTab === 'scripts' && 'Create and manage web automation scripts'}
                {activeTab === 'executions' && 'View automation execution history and results'}
                {activeTab === 'settings' && 'Configure automation settings and preferences'}
              </p>
            </div>
            <UserNav />
          </div>
        </div>

        {/* Action Buttons - Only for scripts tab */}
        {activeTab === 'scripts' && scripts.length > 0 && (
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-end">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Script
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-8">
          {activeTab === 'scripts' && (
            <div className="space-y-6">{/* Filters */}

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search scripts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scripts List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredScripts.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <FileCode className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {scripts.length === 0 ? 'No automation scripts yet' : 'No scripts found'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {scripts.length === 0
                      ? 'Create your first web automation script to get started'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                  {scripts.length === 0 && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Script
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredScripts.map((script) => {
                    const successRate = calculateSuccessRate(script)

                    return (
                      <Card key={script.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {script.name}
                              </h3>
                              {getStatusBadge(script.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {script.description || 'No description provided'}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Run
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Clock className="w-4 h-4" />
                              Executions
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {script.total_executions}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Success Rate
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              {successRate}%
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <XCircle className="w-4 h-4" />
                              Failed
                            </div>
                            <div className="text-lg font-semibold text-red-600">
                              {script.failed_executions}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <Clock className="w-4 h-4" />
                              Avg Duration
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {script.average_duration}s
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Executions Tab Content */}
          {activeTab === 'executions' && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Execution History
              </h3>
              <p className="text-gray-500">
                View and analyze automation execution results and history
              </p>
            </Card>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automation Settings
              </h3>
              <p className="text-gray-500">
                Configure automation preferences and default settings
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* Create Script Dialog */}
      <CreateScriptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchScripts}
      />
    </div>
  )
}

interface CreateScriptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CreateScriptDialog({ open, onOpenChange, onSuccess }: CreateScriptDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    script_type: 'web_automation',
    script_content: '',
    execution_timeout: 300,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/automation/scripts', {
      //   method: 'POST',
      //   body: JSON.stringify(formData)
      // })

      toast.success('Automation script has been created successfully')

      onSuccess()
      onOpenChange(false)
      setFormData({
        name: '',
        description: '',
        script_type: 'web_automation',
        script_content: '',
        execution_timeout: 300,
      })
    } catch (error) {
      console.error('Failed to create script:', error)
      toast.error('Failed to create automation script')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Web Automation Script</DialogTitle>
          <DialogDescription>
            Create a new web automation script for automated testing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Script Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Login Flow Test"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this script does..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="script_content">Script Content</Label>
            <Textarea
              id="script_content"
              value={formData.script_content}
              onChange={(e) => setFormData({ ...formData, script_content: e.target.value })}
              placeholder="// Playwright script code"
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="timeout">Execution Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={formData.execution_timeout}
              onChange={(e) => setFormData({ ...formData, execution_timeout: parseInt(e.target.value) })}
              min={1}
              max={3600}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Script
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
