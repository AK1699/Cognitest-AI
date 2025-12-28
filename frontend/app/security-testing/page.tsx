'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { UserNav } from '@/components/layout/user-nav'
import { Shield, Globe, GitBranch, ShieldAlert, ClipboardCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Note: Import from the security components when fully set up
// import { SecurityDashboard, URLSecurityPanel, VulnerabilityCard } from '@/components/security'

export default function SecurityTestingPage() {
  const [activeModule, setActiveModule] = useState<'overview' | 'url' | 'repo' | 'vapt' | 'compliance'>('overview')

  // Demo project/org IDs - in real usage, these come from context/params
  const projectId = 'demo-project-id'
  const organisationId = 'demo-org-id'

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
                <Shield className="w-6 h-6 text-teal-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Security Testing</h1>
              </div>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Module Tabs */}
            <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">URL Security</span>
                </TabsTrigger>
                <TabsTrigger value="repo" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="hidden sm:inline">Repo Security</span>
                </TabsTrigger>
                <TabsTrigger value="vapt" className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden sm:inline">VAPT</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Compliance</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Risk Score Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-6 border border-teal-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Risk Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-4xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-lg">A+</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Score: 0/100</p>
                        </div>
                        <Shield className="w-12 h-12 text-teal-600 opacity-50" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Open Vulnerabilities</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                          <p className="text-xs text-gray-500 mt-2">0 resolved</p>
                        </div>
                        <ShieldAlert className="w-10 h-10 text-orange-500 opacity-70" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                          <p className="text-3xl font-bold text-green-600 mt-1">0</p>
                          <p className="text-xs text-gray-500 mt-2">No critical issues</p>
                        </div>
                        <Shield className="w-10 h-10 text-green-500 opacity-70" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Scans</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                          <p className="text-xs text-gray-500 mt-2">Start your first scan</p>
                        </div>
                        <Globe className="w-10 h-10 text-teal-500 opacity-70" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-teal-300 transition-colors"
                      onClick={() => setActiveModule('url')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">URL Security</h3>
                          <p className="text-sm text-gray-500">SSL, Headers, Ports</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-purple-300 transition-colors"
                      onClick={() => setActiveModule('repo')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <GitBranch className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Repo Security</h3>
                          <p className="text-sm text-gray-500">Secrets, Dependencies</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-orange-300 transition-colors"
                      onClick={() => setActiveModule('vapt')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <ShieldAlert className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">VAPT</h3>
                          <p className="text-sm text-gray-500">OWASP Top 10</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-white rounded-xl p-6 border shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => setActiveModule('compliance')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ClipboardCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Compliance</h3>
                          <p className="text-sm text-gray-500">ISO, SOC 2, GDPR</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Getting Started */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-2">Get Started with Security Testing</h2>
                    <p className="text-teal-100 mb-6">
                      Scan your applications for vulnerabilities, check compliance status, and get AI-powered remediation suggestions.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        className="bg-white text-teal-600 hover:bg-teal-50"
                        onClick={() => setActiveModule('url')}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Start URL Scan
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-teal-600"
                        onClick={() => setActiveModule('repo')}
                      >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Scan Repository
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* URL Security Tab */}
              <TabsContent value="url">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">URL Security Scanner</h2>
                      <p className="text-sm text-gray-500">Analyze SSL/TLS, security headers, open ports, and subdomains</p>
                    </div>
                  </div>

                  {/* URL Security Panel will be imported from components */}
                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <p className="text-gray-500 text-center py-8">
                      URL Security Scanner component ready. Connect to project context to enable scanning.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Repo Security Tab */}
              <TabsContent value="repo">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Repository Security</h2>
                      <p className="text-sm text-gray-500">Detect secrets, scan dependencies, check licenses</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <p className="text-gray-500 text-center py-8">
                      Repository Security Scanner - Coming Soon
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* VAPT Tab */}
              <TabsContent value="vapt">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">VAPT Scanner</h2>
                      <p className="text-sm text-gray-500">OWASP Top 10 vulnerability assessment and penetration testing</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border shadow-sm">
                    <p className="text-gray-500 text-center py-8">
                      VAPT Scanner - Coming Soon
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setActiveModule('overview')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Compliance Dashboard</h2>
                      <p className="text-sm text-gray-500">Track compliance with ISO 27001, SOC 2, GDPR, PCI-DSS, HIPAA</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['ISO 27001', 'SOC 2', 'GDPR', 'PCI DSS', 'HIPAA', 'NIST CSF'].map((framework) => (
                      <div key={framework} className="bg-white rounded-xl p-6 border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">{framework}</h3>
                          <span className="text-sm text-gray-500">Not assessed</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-teal-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">0% compliant</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
