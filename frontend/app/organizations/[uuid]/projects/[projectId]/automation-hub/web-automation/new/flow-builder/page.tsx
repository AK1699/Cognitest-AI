'use client'

import { useParams } from 'next/navigation'
import TestFlowBuilder from '@/components/automation/TestFlowBuilder'

export default function FlowBuilderPage() {
  const params = useParams()
  const projectId = params.projectId as string

  return (
    <div className="h-screen bg-gray-50">
      <TestFlowBuilder projectId={projectId} />
    </div>
  )
}
