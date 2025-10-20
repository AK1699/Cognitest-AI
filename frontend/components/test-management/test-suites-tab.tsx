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
import { testSuitesAPI, testPlansAPI, type TestSuite, type TestPlan } from '@/lib/api/test-management'
import { useToast } from '@/hooks/use-toast'

interface TestSuitesTabProps {
  projectId: string
}

export function TestSuitesTab({ projectId }: TestSuitesTabProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const { toast } = useToast()

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
      setTestSuites(suites)
      setTestPlans(plans)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load test suites',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const currentUser = localStorage.getItem('user_email') || 'user@cognitest.ai'

      const newSuite = await testSuitesAPI.create({
        project_id: projectId,
        test_plan_id: formData.test_plan_id || undefined,
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        created_by: currentUser,
        generated_by: 'manual',
        meta_data: {},
      })

      setTestSuites([newSuite, ...testSuites])
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: 'Success',
        description: 'Test suite created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test suite',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test suite?')) return

    try {
      await testSuitesAPI.delete(id)
      setTestSuites(testSuites.filter(s => s.id !== id))
      if (selectedSuite?.id === id) setSelectedSuite(null)

      toast({
        title: 'Success',
        description: 'Test suite deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test suite',
        variant: 'destructive',
      })
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
                      {new Date(suite.created_at).toLocaleDateString()}
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

      {selectedSuite && (
        <Dialog open={!!selectedSuite} onOpenChange={() => setSelectedSuite(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedSuite.name}</DialogTitle>
              <DialogDescription>
                Created on {new Date(selectedSuite.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedSuite.description && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedSuite.description}
                  </p>
                </div>
              )}

              {selectedSuite.test_plan_id && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Test Plan
                  </h4>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{getTestPlanName(selectedSuite.test_plan_id)}</span>
                  </div>
                </div>
              )}

              {selectedSuite.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSuite.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created By:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedSuite.created_by}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Generation Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedSuite.generated_by}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSuite(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
