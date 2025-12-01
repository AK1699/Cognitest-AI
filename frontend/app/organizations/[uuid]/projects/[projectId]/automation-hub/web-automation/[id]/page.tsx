'use client'

import { useParams } from 'next/navigation'
import TestFlowBuilder from '@/components/automation/TestFlowBuilder'

export default function EditWebAutomationPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const flowId = params.id as string

  return (
    <div className="h-screen bg-gray-50">
      <TestFlowBuilder projectId={projectId} flowId={flowId} />
    </div>
  )
}
