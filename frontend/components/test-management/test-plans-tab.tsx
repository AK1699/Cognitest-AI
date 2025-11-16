'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, FileText, Calendar, Tag, Trash2, Edit, Sparkles } from 'lucide-react'
import { testPlansAPI, type TestPlan } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/lib/hooks/use-confirm'
import { TestPlanDetailsModal } from './TestPlanDetailsModal'

interface TestPlansTabProps {
  projectId: string
}

export function TestPlansTab({ projectId }: TestPlansTabProps) {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<TestPlan | null>(null)
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectives: '',
    tags: '',
  })

  useEffect(() => {
    loadTestPlans()
  }, [projectId])

  const loadTestPlans = async () => {
    try {
      setLoading(true)
      const plans = await testPlansAPI.list(projectId)
      setTestPlans(plans || [])
    } catch (error: any) {
      // Set empty array on error to avoid blocking the UI
      setTestPlans([])

      // Only show error if it's not a 403 or 404 (expected for new projects)
      const status = error.response?.status
      if (status && ![403, 404].includes(status)) {
        toast({
          title: 'Error',
          description: 'Failed to load test plans',
          variant: 'destructive',
        })
      }
      // For 403/404, silently handle - these are expected for new projects
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const currentUser = localStorage.getItem('user_email') || 'user@cognitest.ai'

      const newPlan = await testPlansAPI.create({
        project_id: projectId,
        name: formData.name,
        description: formData.description,
        objectives: formData.objectives.split('\n').filter(o => o.trim()),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        created_by: currentUser,
        generated_by: 'manual',
        source_documents: [],
        meta_data: {},
      })

      setTestPlans([newPlan, ...testPlans])
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: 'Success',
        description: 'Test plan created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test plan',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this test plan?',
      variant: 'danger',
      confirmText: 'Delete'
    })
    if (!confirmed) return

    try {
      await testPlansAPI.delete(id)
      setTestPlans(testPlans.filter(p => p.id !== id))
      if (selectedPlan?.id === id) setSelectedPlan(null)

      toast({
        title: 'Success',
        description: 'Test plan deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test plan',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      objectives: '',
      tags: '',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading test plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Plans</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize your testing strategy with comprehensive test plans
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Test Plan
        </Button>
      </div>

      {/* Test Plans Grid */}
      {testPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No test plans yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first test plan to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testPlans.map((plan) => (
            <Card
              key={plan.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  {plan.generated_by === 'ai' && (
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Objectives */}
                  {plan.objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Objectives
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {plan.objectives.slice(0, 2).map((obj, i) => (
                          <li key={i} className="truncate">" {obj}</li>
                        ))}
                        {plan.objectives.length > 2 && (
                          <li className="text-primary">+{plan.objectives.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {plan.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {plan.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plan.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDateHumanReadable(plan.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(plan.id)
                        }}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Test Plan</DialogTitle>
            <DialogDescription>
              Define a comprehensive test plan for your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., User Authentication Test Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the scope and purpose of this test plan"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Objectives (one per line)</Label>
              <Textarea
                id="objectives"
                placeholder="Verify login flow&#10;Test password reset&#10;Validate session management"
                rows={4}
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="authentication, security, critical"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Create Test Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Details Modal */}
      <TestPlanDetailsModal
        testPlan={selectedPlan}
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
        readOnly={true}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
