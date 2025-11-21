"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestPlan, testPlansAPI } from "@/lib/api/test-management"

interface EditTestPlanModalProps {
  open: boolean
  testPlan: TestPlan | null
  onOpenChange: (open: boolean) => void
  onUpdated?: (updated: TestPlan) => void
}

export default function EditTestPlanModal({ open, testPlan, onOpenChange, onUpdated }: EditTestPlanModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [objectives, setObjectives] = useState("")
  const [tags, setTags] = useState("")
  const [priority, setPriority] = useState<string>("")
  const [complexity, setComplexity] = useState<string>("")
  const [timeframe, setTimeframe] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!testPlan) return
    setName(testPlan.name || "")
    setDescription(testPlan.description || "")
    setObjectives(Array.isArray(testPlan.objectives) ? testPlan.objectives.join("\n") : "")
    setTags(Array.isArray(testPlan.tags) ? testPlan.tags.join(", ") : "")
    setPriority((testPlan as any).priority || "")
    setComplexity((testPlan as any).complexity || "")
    setTimeframe((testPlan as any).timeframe || "")
  }, [testPlan])

  const handleSave = async () => {
    if (!testPlan) return
    try {
      setSaving(true)
      const updated = await testPlansAPI.update(testPlan.id, {
        name,
        description,
        objectives: objectives.split("\n").map(s => s.trim()).filter(Boolean),
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
        priority: priority as any,
        complexity: complexity as any,
        timeframe,
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
          <DialogTitle>Edit Test Plan</DialogTitle>
          <DialogDescription>Update the basic information of this test plan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Test Plan name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the plan" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Objectives (one per line)</label>
            <Textarea value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="Objective 1\nObjective 2" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="api, regression, critical" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Complexity</label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger><SelectValue placeholder="Select complexity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timeframe</label>
              <Input value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="e.g., 4 weeks" />
            </div>
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
