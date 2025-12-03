'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, FolderKanban, Calendar, Trash2, FileText } from 'lucide-react'
import { testSuitesAPI, testPlansAPI, type TestSuite, type TestPlan, type TestCase } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/lib/hooks/use-confirm'
import { TestSuiteDetailsModal } from './TestSuiteDetailsModal'
import { TestCaseDetailsModal } from './TestCaseDetailsModal'

interface TestSuitesTabProps {
  projectId: string
}

export function TestSuitesTab({ projectId }: TestSuitesTabProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    test_plan_id: '',
    tags: '',
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [suites, plans] = await Promise.all([
        testSuitesAPI.list(projectId),
        testPlansAPI.list(projectId),
      ])
      setTestSuites(suites || [])
      setTestPlans(plans || [])
    } catch (error: any) {
      // Set empty arrays on error to avoid blocking the UI
      setTestSuites([])
      setTestPlans([])

      // Only show error if it's not a 403 or 404 (expected for new projects)
      const status = error.response?.status
      if (status && ![403, 404].includes(status)) {
        toast.error('Failed to load test suites')
      }
      // For 403/404, silently handle - these are expected for new projects
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const currentUser = localStorage.getItem('user_email') || 'user@cognitest.ai'

      const payload: any = {
        project_id: projectId,
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        created_by: currentUser,
        generated_by: 'manual',
        meta_data: {},
      }
      
      if (formData.test_plan_id) {
        payload.test_plan_id = formData.test_plan_id
      }

      const newSuite = await testSuitesAPI.create(payload)

      setTestSuites([newSuite, ...testSuites])
      setShowCreateDialog(false)
      resetForm()

      toast.success('Test suite created successfully')
    } catch (error) {
      toast.error('Failed to create test suite')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this test suite?',
      variant: 'danger',
      confirmText: 'Delete'
    })
    if (!confirmed) return

    try {
      await testSuitesAPI.delete(id)
      setTestSuites(testSuites.filter(s => s.id !== id))
      if (selectedSuite?.id === id) setSelectedSuite(null)

      toast.success('Test suite deleted successfully')
    } catch (error) {
      toast.error('Failed to delete test suite')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      test_plan_id: '',
      tags: '',
    })
  }

  const getTestPlanName = (planId?: string) => {
    if (!planId) return null
    const plan = testPlans.find(p => p.id === planId)
    return plan?.name
  }

  const handleViewTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading test suites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Suites</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Group related test cases into organized suites
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Test Suite
        </Button>
      </div>

      {testSuites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No test suites yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first test suite to organize test cases
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test Suite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testSuites.map((suite) => (
            <Card
              key={suite.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedSuite(suite)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{suite.name}</CardTitle>
                <CardDescription className="mt-2">
                  {suite.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.test_plan_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {getTestPlanName(suite.test_plan_id) || 'Linked Test Plan'}
                      </span>
                    </div>
                  )}

                  {suite.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suite.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {suite.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{suite.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDateHumanReadable(suite.created_at)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(suite.id)
                      }}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Test Suite</DialogTitle>
            <DialogDescription>
              Group related test cases into an organized suite
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Login Flow Test Suite"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the scope of this test suite"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_plan">Test Plan (optional)</Label>
              <Select
                value={formData.test_plan_id}
                onValueChange={(value) => setFormData({ ...formData, test_plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a test plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {testPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="login, authentication, critical"
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
              Create Test Suite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Test Suite Details Modal */}
      <TestSuiteDetailsModal
        testSuite={selectedSuite}
        open={!!selectedSuite}
        onOpenChange={(open) => !open && setSelectedSuite(null)}
        onViewTestCase={handleViewTestCase}
        readOnly={true}
      />

      {/* Test Case Details Modal (for drilling down from suite) */}
      <TestCaseDetailsModal
        testCase={selectedTestCase}
        open={!!selectedTestCase}
        onOpenChange={(open) => !open && setSelectedTestCase(null)}
        readOnly={true}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
