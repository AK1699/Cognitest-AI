'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const integrationsData = [
  {
    name: 'Jira',
    description: 'Sync issues and test cases with your Jira projects.',
    logo: 'https://logo.clearbit.com/atlassian.com',
    connected: false,
  },
  {
    name: 'Slack',
    description: 'Get notifications about test runs and results in Slack.',
    logo: 'https://logo.clearbit.com/slack.com',
    connected: false,
  },
  {
    name: 'GitHub',
    description: 'Link test runs to commits and pull requests.',
    logo: 'https://logo.clearbit.com/github.com',
    connected: false,
  },
  {
    name: 'Jenkins',
    description: 'Trigger test runs from your Jenkins CI/CD pipeline.',
    logo: 'https://logo.clearbit.com/jenkins.io',
    connected: false,
  },
  {
    name: 'GitLab',
    description: 'Link test runs to commits and merge requests.',
    logo: 'https://static.cdnlogo.com/logos/g/39/gitlab.svg',
    connected: false,
  },
  {
    name: 'Asana',
    description: 'Create tasks in Asana for failed test cases.',
    logo: 'https://logo.clearbit.com/asana.com',
    connected: false,
  },
]

export default function IntegrationsPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {integrationsData.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{integration.name}</CardTitle>
              <img src={integration.logo} alt={`${integration.name} logo`} className="h-8 w-8" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{integration.description}</p>
              <Button className="w-full" variant={integration.connected ? 'secondary' : 'default'}>
                {integration.connected ? 'Manage' : 'Connect'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
