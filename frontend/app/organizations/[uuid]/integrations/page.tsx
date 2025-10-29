'use client'

import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sidebar } from '@/components/layout/sidebar'
import { Puzzle } from 'lucide-react'

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

interface PageParams {
  uuid: string
}

export default function IntegrationsPage({ params }: { params: Promise<PageParams> }) {
  const { uuid } = use(params)

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar organisationId={uuid} />
      <div className="flex-1 p-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Integrations</h1>
      </div>
      <p className="text-lg text-gray-600 mb-8 mt-4">Connect your favorite tools and services</p>

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
    </div>
  )
}
