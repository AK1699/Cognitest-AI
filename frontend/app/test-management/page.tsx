'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, FileText, FolderKanban, CheckSquare } from 'lucide-react'
import { TestPlansTab } from '@/components/test-management/test-plans-tab'
import { TestSuitesTab } from '@/components/test-management/test-suites-tab'
import { TestCasesTab } from '@/components/test-management/test-cases-tab'

export default function TestManagementPage() {
  const [activeTab, setActiveTab] = useState('plans')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    // Get current project from localStorage or URL
    const projectId = localStorage.getItem('current_project_id')
    if (projectId) {
      setSelectedProject(projectId)
    }
  }, [])

  if (!selectedProject) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="w-full px-6 sm:px-8 lg:px-12">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4 lg:ml-0 ml-12">
                  <h1 className="text-2xl font-semibold text-primary">CogniTest</h1>
                </div>
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No Project Selected
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Please select a project to manage tests
              </p>
              <Button onClick={() => (window.location.href = '/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="w-full px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4 lg:ml-0 ml-12">
                <h1 className="text-2xl font-semibold text-primary">Test Management</h1>
              </div>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TabsTrigger value="plans" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Test Plans
                </TabsTrigger>
                <TabsTrigger value="suites" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Test Suites
                </TabsTrigger>
                <TabsTrigger value="cases" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Test Cases
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="plans" className="mt-0">
              <TestPlansTab projectId={selectedProject} />
            </TabsContent>

            <TabsContent value="suites" className="mt-0">
              <TestSuitesTab projectId={selectedProject} />
            </TabsContent>

            <TabsContent value="cases" className="mt-0">
              <TestCasesTab projectId={selectedProject} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
