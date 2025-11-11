'use client'

import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
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
      <main className="flex-1 overflow-auto">
        {/* Top Bar with Profile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="h-[80px] px-8 flex items-center justify-end">
            <UserNav />
          </div>
        </div>

        {/* Page Content */}
        <div className="px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Puzzle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-15">Connect your favorite tools and services</p>
          </div>
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
      </main>
    </div>
  )
}
