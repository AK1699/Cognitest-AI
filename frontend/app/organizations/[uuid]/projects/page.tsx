'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Search, Plus, FolderOpen, MoreVertical, GitBranch, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Project {
  id: string
  name: string
  description?: string
  status?: 'ACTIVE' | 'ARCHIVED' | 'PAUSED'
  created_at?: string
  settings?: {
    enabled_modules?: string[]
  }
}

interface PageParams {
  uuid: string
}

const moduleConfig = {
  'test-management': { name: 'Test Management', color: 'blue' },
  'api-testing': { name: 'API Testing', color: 'green' },
  'automation-hub': { name: 'Automation Hub', color: 'purple' },
  'security-testing': { name: 'Security Testing', color: 'red' },
  'performance-testing': { name: 'Performance Testing', color: 'yellow' },
  'mobile-testing': { name: 'Mobile Testing', color: 'indigo' },
} as const

export default function ProjectsPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { uuid } = use(params)

  useEffect(() => {
    fetchProjects()
  }, [uuid])

  const fetchProjects = async () => {
    try {
      const response = await api.get(`/api/v1/projects/?organisation_id=${uuid}`)
      setProjects(response.data)
    } catch (error: any) {
      console.error('Failed to fetch projects:', error)

      // Handle different error scenarios
      if (error.response?.status === 404) {
        toast.error('You do not have access to this organization')
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view projects')
      } else {
        toast.error('Failed to load projects')
      }

      // Set empty array so UI shows "No projects" instead of error
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar organisationId={uuid} />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar organisationId={uuid} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="px-8 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
          </div>
          <p className="text-lg text-gray-600 mt-4">Create and manage your testing projects</p>
        </div>

        <div className="px-8 py-6">
          {/* Search and New Project Button */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-0 text-gray-900 placeholder-gray-400 outline-none"
              />
              <div className="text-sm text-gray-400 whitespace-nowrap">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first project to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Create project
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                  onClick={() => router.push(`/organizations/${uuid}/projects/${project.id}`)}
                >
                  {/* Project Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-primary mb-1 transition-colors">
                          {project.name}
                        </h2>
                        {project.description && (
                          <p className="text-sm text-gray-500">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Module Badges */}
                    {project.settings?.enabled_modules && project.settings.enabled_modules.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.settings.enabled_modules.map((moduleId) => {
                          const module = moduleConfig[moduleId as keyof typeof moduleConfig]
                          if (!module) return null

                          const colorClasses = {
                            blue: 'bg-blue-50 text-blue-700',
                            green: 'bg-green-50 text-green-700',
                            purple: 'bg-purple-50 text-purple-700',
                            red: 'bg-red-50 text-red-700',
                            yellow: 'bg-yellow-50 text-yellow-700',
                            indigo: 'bg-indigo-50 text-indigo-700',
                          }

                          return (
                            <span
                              key={moduleId}
                              className={`px-2 py-1 text-xs font-medium rounded ${colorClasses[module.color as keyof typeof colorClasses]}`}
                            >
                              {module.name}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-sm text-gray-500">Total Artifacts</div>
                        <div className="text-2xl font-semibold text-gray-900 mt-1">0</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Updated</div>
                        <div className="text-sm text-gray-900 mt-1">
                          {project.created_at
                            ? new Date(project.created_at).toLocaleDateString()
                            : 'Just now'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/organizations/${uuid}/projects/${project.id}`)
                      }}
                      className="w-full mt-4 py-2.5 px-4 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium rounded-lg transition-colors"
                    >
                      Open Project →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organisationId={uuid}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
