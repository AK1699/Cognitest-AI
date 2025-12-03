'use client'

import React, { useEffect, useState } from 'react'
import WebAutomationWorkspace from '@/components/automation/WebAutomationWorkspace'

interface WebAutomationPageProps {
  params: Promise<{
    uuid: string
    projectId: string
  }>
}

export default function WebAutomationPage({ params }: WebAutomationPageProps) {
  const [projectId, setProjectId] = useState<string>('')

  // Get params
  useEffect(() => {
    params.then(({ uuid, projectId }) => {
      setProjectId(projectId)
    })
  }, [params])

  return (
    <div className="h-screen bg-white w-full">
      <WebAutomationWorkspace projectId={projectId} />
    </div>
  )
}
