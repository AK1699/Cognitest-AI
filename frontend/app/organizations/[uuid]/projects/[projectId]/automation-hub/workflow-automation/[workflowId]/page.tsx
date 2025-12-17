'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder'

export default function EditWorkflowPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const orgId = params.uuid as string
    const workflowId = params.workflowId as string

    const handleBack = () => {
        router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation`)
    }

    return (
        <WorkflowBuilder
            workflowId={workflowId}
            projectId={projectId}
            orgId={orgId}
            onBack={handleBack}
        />
    )
}
