'use client'

import { useParams } from 'next/navigation'
import WebAutomationRecorder from '@/components/automation/WebAutomationRecorder'

export default function RecorderPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const handleSave = async (testData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8000/api/v1/web-automation/test-flows?project_id=${projectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
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

  return (
    <div className="h-screen">
      <WebAutomationRecorder projectId={projectId} onSave={handleSave} />
    </div>
  )
}
