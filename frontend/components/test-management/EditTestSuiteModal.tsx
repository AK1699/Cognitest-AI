"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestSuite, testSuitesAPI, TestPlan, testPlansAPI } from "@/lib/api/test-management"

interface EditTestSuiteModalProps {
  open: boolean
  testSuite: TestSuite | null
  onOpenChange: (open: boolean) => void
  onUpdated?: (updated: TestSuite) => void
  projectId: string
}

export default function EditTestSuiteModal({ open, testSuite, onOpenChange, onUpdated, projectId }: EditTestSuiteModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [linkedPlan, setLinkedPlan] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadPlans()
    }
  }, [open, projectId])

  useEffect(() => {
    if (!testSuite) return
    setName(testSuite.name || "")
    setDescription(testSuite.description || "")
    setTags(Array.isArray(testSuite.tags) ? testSuite.tags.join(", ") : "")
    setLinkedPlan(testSuite.test_plan_id || "")
  }, [testSuite])

  const loadPlans = async () => {
    try {
      const plans = await testPlansAPI.list(projectId)
      setTestPlans(plans || [])
    } catch {
      setTestPlans([])
    }
  }

  const handleSave = async () => {
    if (!testSuite) return
    try {
      setSaving(true)
      const updated = await testSuitesAPI.update(testSuite.id, {
        name,
        description,
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
        test_plan_id: linkedPlan || undefined,
      })
      onUpdated?.(updated)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Test Suite</DialogTitle>
          <DialogDescription>Update the details of this test suite.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Suite name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the suite" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="smoke, regression" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Linked Test Plan</label>
            <Select value={linkedPlan} onValueChange={setLinkedPlan}>
              <SelectTrigger><SelectValue placeholder="Select a test plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {testPlans.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
