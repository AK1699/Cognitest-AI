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
import { Plus, CheckSquare, Calendar, Trash2, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { testCasesAPI, testSuitesAPI, type TestCase, type TestSuite, type TestStep } from '@/lib/api/test-management'
import { formatDateHumanReadable } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/lib/hooks/use-confirm'

interface TestCasesTabProps {
  projectId: string
}

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  ready: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  blocked: 'bg-orange-500',
  skipped: 'bg-purple-500',
}

const PRIORITY_COLORS = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
}

export function TestCasesTab({ projectId }: TestCasesTabProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null)
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)
  const { toast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    test_suite_id: '',
    priority: 'medium' as TestCase['priority'],
    expected_result: '',
    tags: '',
    steps: [{ step_number: 1, action: '', expected_result: '' }] as TestStep[],
  })

  const [executeData, setExecuteData] = useState({
    status: 'passed' as TestCase['status'],
    actual_result: '',
    execution_notes: '',
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cases, suites] = await Promise.all([
        testCasesAPI.list(projectId),
        testSuitesAPI.list(projectId),
      ])
      setTestCases(cases)
      setTestSuites(suites)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load test cases',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const currentUser = localStorage.getItem('user_email') || 'user@cognitest.ai'

      const newCase = await testCasesAPI.create({
        project_id: projectId,
        test_suite_id: formData.test_suite_id || undefined,
        title: formData.title,
        description: formData.description,
        steps: formData.steps.filter(s => s.action.trim()),
        expected_result: formData.expected_result,
        priority: formData.priority,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'draft',
        created_by: currentUser,
        ai_generated: false,
        generated_by: 'manual',
        execution_logs: [],
        attachments: [],
        meta_data: {},
      })

      setTestCases([newCase, ...testCases])
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: 'Success',
        description: 'Test case created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test case',
        variant: 'destructive',
      })
    }
  }

  const handleExecute = async () => {
    if (!selectedCase) return

    try {
      const result = await testCasesAPI.execute({
        test_case_id: selectedCase.id,
        status: executeData.status,
        actual_result: executeData.actual_result,
        execution_notes: executeData.execution_notes,
      })

      setTestCases(testCases.map(tc => tc.id === selectedCase.id ? result.test_case : tc))
      setShowExecuteDialog(false)
      setSelectedCase(null)
      resetExecuteForm()

      toast({
        title: 'Success',
        description: 'Test case executed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute test case',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this test case?',
      variant: 'danger',
      confirmText: 'Delete'
    })
    if (!confirmed) return

    try {
      await testCasesAPI.delete(id)
      setTestCases(testCases.filter(tc => tc.id !== id))
      if (selectedCase?.id === id) setSelectedCase(null)

      toast({
        title: 'Success',
        description: 'Test case deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test case',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      test_suite_id: '',
      priority: 'medium',
      expected_result: '',
      tags: '',
      steps: [{ step_number: 1, action: '', expected_result: '' }],
    })
  }

  const resetExecuteForm = () => {
    setExecuteData({
      status: 'passed',
      actual_result: '',
      execution_notes: '',
    })
  }

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, {
        step_number: formData.steps.length + 1,
        action: '',
        expected_result: '',
      }],
    })
  }

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      steps: newSteps.map((step, i) => ({ ...step, step_number: i + 1 })),
    })
  }

  const updateStep = (index: number, field: keyof TestStep, value: string) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData({ ...formData, steps: newSteps })
  }

  const getTestSuiteName = (suiteId?: string) => {
    if (!suiteId) return null
    const suite = testSuites.find(s => s.id === suiteId)
    return suite?.name
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading test cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Cases</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Define detailed test cases with steps and track execution
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Test Case
        </Button>
      </div>

      {testCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No test cases yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first test case to start testing
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test Case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {testCases.map((testCase) => (
            <Card
              key={testCase.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${STATUS_COLORS[testCase.status]} text-white text-xs`}>
                        {testCase.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${PRIORITY_COLORS[testCase.priority]} text-white text-xs`}>
                        {testCase.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg cursor-pointer hover:text-primary" onClick={() => setSelectedCase(testCase)}>
                      {testCase.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {testCase.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testCase.test_suite_id && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Suite: {getTestSuiteName(testCase.test_suite_id)}
                    </div>
                  )}

                  {testCase.steps.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testCase.steps.length} step{testCase.steps.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {testCase.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {testCase.tags.slice(0, 5).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDateHumanReadable(testCase.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCase(testCase)
                          setShowExecuteDialog(true)
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Execute
                      </Button>
                      <button
                        onClick={() => handleDelete(testCase.id)}
                        className="text-gray-500 hover:text-red-600"
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
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>
              Define a detailed test case with steps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Test successful login with valid credentials"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test case validates"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_suite">Test Suite (optional)</Label>
                <Select
                  value={formData.test_suite_id}
                  onValueChange={(value) => setFormData({ ...formData, test_suite_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select suite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {testSuites.map((suite) => (
                      <SelectItem key={suite.id} value={suite.id}>
                        {suite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TestCase['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Test Steps</Label>
                <Button type="button" size="sm" variant="outline" onClick={addStep}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Step {step.step_number}</span>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Action (e.g., Navigate to login page)"
                      value={step.action}
                      onChange={(e) => updateStep(index, 'action', e.target.value)}
                    />
                    <Input
                      placeholder="Expected result (e.g., Login form is displayed)"
                      value={step.expected_result}
                      onChange={(e) => updateStep(index, 'expected_result', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_result">Overall Expected Result</Label>
              <Textarea
                id="expected_result"
                placeholder="What should be the final outcome?"
                rows={2}
                value={formData.expected_result}
                onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="smoke-test, critical, authentication"
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
              disabled={!formData.title.trim() || formData.steps.some(s => !s.action.trim())}
              className="bg-primary hover:bg-primary/90"
            >
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {selectedCase && !showExecuteDialog && (
        <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>{selectedCase.title}</DialogTitle>
                  <DialogDescription className="mt-2">
                    Created on {formatDateHumanReadable(selectedCase.created_at)}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${STATUS_COLORS[selectedCase.status]} text-white`}>
                    {selectedCase.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${PRIORITY_COLORS[selectedCase.priority]} text-white`}>
                    {selectedCase.priority}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedCase.description && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCase.description}
                  </p>
                </div>
              )}

              {selectedCase.steps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Test Steps
                  </h4>
                  <div className="space-y-3">
                    {selectedCase.steps.map((step, i) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <div className="font-medium text-sm text-primary">
                          Step {step.step_number}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Action:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {step.action}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Expected Result:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {step.expected_result}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.expected_result && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Overall Expected Result
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCase.expected_result}
                  </p>
                </div>
              )}

              {selectedCase.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCase(null)}>
                Close
              </Button>
              <Button
                onClick={() => setShowExecuteDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Execute Dialog */}
      {showExecuteDialog && selectedCase && (
        <Dialog open={showExecuteDialog} onOpenChange={() => {
          setShowExecuteDialog(false)
          resetExecuteForm()
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Execute Test Case</DialogTitle>
              <DialogDescription>
                Record the execution results for: {selectedCase.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={executeData.status}
                  onValueChange={(value) => setExecuteData({ ...executeData, status: value as TestCase['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Passed
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Failed
                      </div>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Blocked
                      </div>
                    </SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_result">Actual Result</Label>
                <Textarea
                  id="actual_result"
                  placeholder="What actually happened during execution?"
                  rows={4}
                  value={executeData.actual_result}
                  onChange={(e) => setExecuteData({ ...executeData, actual_result: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="execution_notes">Execution Notes</Label>
                <Textarea
                  id="execution_notes"
                  placeholder="Any additional notes or observations"
                  rows={3}
                  value={executeData.execution_notes}
                  onChange={(e) => setExecuteData({ ...executeData, execution_notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowExecuteDialog(false)
                resetExecuteForm()
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                className="bg-primary hover:bg-primary/90"
              >
                Save Execution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
