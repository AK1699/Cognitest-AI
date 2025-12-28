'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import WorkflowAutomationWorkspace from '@/components/workflow/WorkflowAutomationWorkspace'

export default function EditWorkflowPage() {
    const params = useParams()
    const projectId = params.projectId as string
    const workflowId = params.workflowId as string

    return (
        <div className="h-screen bg-white w-full">
            <WorkflowAutomationWorkspace projectId={projectId} workflowId={workflowId} />
        </div>
    )
}
