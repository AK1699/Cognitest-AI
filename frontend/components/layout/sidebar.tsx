'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Code,
  Shield,
  Plus,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Menu,
  LogOut,
  FolderOpen,
  BarChart3,
  CreditCard,
  Users,
  Puzzle,
  Settings,
  Zap,
  Workflow
} from 'lucide-react'
import { CircuitLogoIcon } from '@/components/ui/CircuitLogoIcon'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useOrganizationStore } from '@/lib/store/organization-store'

interface SidebarProps {
  organisationId?: string
  projectId?: string
}

const getProjectMenuItems = (organisationId: string, projectId: string) => {
  return [
    {
      name: 'Home',
      href: `/organizations/${organisationId}/projects/${projectId}`,
      icon: LayoutDashboard,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Test Management',
      href: `/organizations/${organisationId}/projects/${projectId}/test-management`,
      icon: ClipboardList,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Automation Hub',
      href: `/organizations/${organisationId}/projects/${projectId}/automation-hub`,
      icon: Zap,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Security Testing',
      href: `/organizations/${organisationId}/projects/${projectId}/security-testing`,
      icon: Shield,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      name: 'Reports & Analytics',
      href: `/organizations/${organisationId}/projects/${projectId}/reports`,
      icon: BarChart3,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Activity Log',
      href: `/organizations/${organisationId}/projects/${projectId}/activity`,
      icon: Workflow,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      name: 'Settings',
      href: `/organizations/${organisationId}/projects/${projectId}/settings`,
      icon: Settings,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ]
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

export function Sidebar({ organisationId, projectId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Use organization store instead of local state
  const { currentOrganisation, isOwner } = useOrganizationStore()

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
          ${isCollapsed ? 'lg:w-20' : 'lg:w-60'}
          ${isMobileOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: '#f0fefa'
        }}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-50 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            {/* Logo Icon */}
            <div className="w-10 h-10 flex items-center justify-center">
              <CircuitLogoIcon className="w-8 h-8" />
            </div>

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
              {(projectId && organisationId
                ? getProjectMenuItems(organisationId, projectId)
                : getMainMenuItems(currentOrganisation?.id, isOwner)
              ).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                      ${isActive
                        ? `${item.bgColor} text-gray-900 shadow-lg border-2 border-gray-400 font-semibold`
                        : 'text-gray-700 hover:bg-white/50 border-2 border-transparent hover:border-gray-200'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${item.iconColor} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}
                    />
                    {!isCollapsed && (
                      <span className="font-medium text-sm truncate">{item.name}</span>
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
