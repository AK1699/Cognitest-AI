'use client'

import { useParams } from 'next/navigation'
import ExecutionResults from '@/components/automation/ExecutionResults'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ExecutionResultsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const executionId = params.id as string
  const orgId = params.uuid as string

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/organizations/${orgId}/projects/${projectId}/automation-hub/web-automation`}
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Web Automation
            </Button>
          </Link>
        </div>

        <ExecutionResults executionRunId={executionId} />
      </div>
    </div>
  )
}
