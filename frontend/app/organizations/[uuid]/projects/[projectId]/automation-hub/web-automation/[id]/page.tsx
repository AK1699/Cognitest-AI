'use client'

import { useParams } from 'next/navigation'
import WebAutomationWorkspace from '@/components/automation/WebAutomationWorkspace'

export default function EditWebAutomationPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const flowId = params.id as string

  return (
    <div className="h-screen bg-gray-50">
      <WebAutomationWorkspace projectId={projectId} flowId={flowId} />
    </div>
  )
}
