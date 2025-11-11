'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Code,
  Shield,
  Zap,
  Workflow,
  ChevronLeft,
  Menu,
  FolderOpen,
  BarChart3,
  CreditCard,
  Users,
  Puzzle,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import CognitestBot3D from '@/components/ui/CognitestBot3D'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SidebarProps {
  organisationId?: string
  projectId?: string
}

const getMainMenuItems = (organisationId?: string, isOwner?: boolean) => {
  const allItems = [
    {
      name: 'Projects',
      href: organisationId ? `/organizations/${organisationId}/projects` : '/projects',
      icon: FolderOpen,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      allowMember: true, // Members can see this
    },
    {
      name: 'Enterprise Reporting',
      href: organisationId ? `/organizations/${organisationId}/enterprise-reporting` : '/enterprise-reporting',
      icon: BarChart3,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      allowMember: false, // Only owners
    },
    {
      name: 'Billing & Usage',
      href: organisationId ? `/organizations/${organisationId}/billing` : '/billing',
      icon: CreditCard,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      allowMember: false, // Only owners
    },
    {
      name: 'Users & Teams',
      href: organisationId ? `/organizations/${organisationId}/users-teams` : '/users-teams',
      icon: Users,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      allowMember: false, // Only owners
    },
    {
      name: 'Integrations',
      href: organisationId ? `/organizations/${organisationId}/integrations` : '/integrations',
      icon: Puzzle,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-100',
      allowMember: false, // Only owners
    },
    {
      name: 'Settings',
      href: organisationId ? `/organizations/${organisationId}/settings` : '/settings',
      icon: Settings,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
      allowMember: false, // Only owners
    },
  ]

  // Filter items based on user role
  if (isOwner) {
    return allItems
  } else {
    // Members only see items where allowMember is true
    return allItems.filter(item => item.allowMember)
  }
}

const otherMenuItems = []

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

export function Sidebar({ organisationId, projectId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentOrganisation, setCurrentOrganisation] = useState<Organisation | null>(null)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const currentOrg = localStorage.getItem('current_organization')
    if (currentOrg) {
      try {
        setCurrentOrganisation(JSON.parse(currentOrg))
      } catch (error) {
        console.error('Failed to parse organization from localStorage', error)
      }
    }
    if (user) {
      fetchOrganisations()
    }
  }, [user])

  // Check if current user is the owner of the organization
  useEffect(() => {
    if (user && currentOrganisation) {
      setIsOwner(currentOrganisation.owner_id === user.id)
    }
  }, [user, currentOrganisation])

  const fetchOrganisations = async () => {
    if (!user) return
    try {
      const response = await api.get('/api/v1/organisations/')
      setOrganisations(response.data)
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: '#f0fefa'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - 3D Kimi Bot with CogniTest text */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            {/* 3D Kimi Bot Icon - Glossy, animated sphere */}
            <CognitestBot3D size={48} className="flex-shrink-0" />

            {/* CogniTest Text - Hidden when collapsed */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">
                  Cogni<span className="text-primary">Test</span>
                </h1>
              </div>
            )}
          </div>


          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <div className="space-y-1 mb-6">
              {getMainMenuItems(currentOrganisation?.id, isOwner).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                      ${
                        isActive
                          ? `${item.bgColor} text-gray-900 shadow-lg border-2 border-gray-400`
                          : 'text-gray-700 hover:bg-white/30 border-2 border-transparent'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${item.iconColor}`}
                    />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </Link>
                )
              })}
            </div>

          </nav>

          {/* Footer - Project Info */}
          {!isCollapsed && projectId && (
            <div className="p-4 border-t border-gray-300">
              <div className="text-xs text-gray-600 mb-1">
                Current Project
              </div>
              <div className="text-sm font-medium text-gray-800 truncate">
                Project Name
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
