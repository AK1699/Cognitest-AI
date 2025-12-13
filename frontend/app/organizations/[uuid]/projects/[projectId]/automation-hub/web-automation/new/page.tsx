'use client'

import { useParams } from 'next/navigation'
import UnifiedTestBuilder from '@/components/automation/UnifiedTestBuilder'

export default function NewWebAutomationPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const handleSave = async (testData: any) => {
    try {
      const response = await fetch(
        `/api/v1/web-automation/test-flows?project_id=${projectId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Use httpOnly cookies for auth
          body: JSON.stringify({
            name: testData.name,
            base_url: testData.baseUrl,
            nodes: testData.steps,
            edges: [],
            flow_json: testData,
          }),
        }
      )

      if (response.ok) {
        alert('Test saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save test:', error)
      alert('Failed to save test')
    }
  }

  return <UnifiedTestBuilder projectId={projectId} onSave={handleSave} />
}
