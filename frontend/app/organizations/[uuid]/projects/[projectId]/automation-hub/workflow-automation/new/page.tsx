'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder'

export default function NewWorkflowPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.projectId as string
    const orgId = params.uuid as string

    const handleBack = () => {
        router.push(`/organizations/${orgId}/projects/${projectId}/automation-hub/workflow-automation`)
    }

    return (
        <WorkflowBuilder
            projectId={projectId}
            orgId={orgId}
            onBack={handleBack}
        />
    )
}
