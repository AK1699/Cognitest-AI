'use client'

import React, { useEffect, useState } from 'react'
import WorkflowAutomationWorkspace from '@/components/workflow/WorkflowAutomationWorkspace'

interface WorkflowAutomationPageProps {
    params: Promise<{
        uuid: string
        projectId: string
    }>
}

export default function WorkflowAutomationPage({ params }: WorkflowAutomationPageProps) {
    const [projectId, setProjectId] = useState<string>('')

    useEffect(() => {
        params.then(({ projectId }) => {
            setProjectId(projectId)
        })
    }, [params])

    return (
        <div className="h-screen bg-white w-full">
            <WorkflowAutomationWorkspace projectId={projectId} />
        </div>
    )
}
