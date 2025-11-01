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
  ChevronDown,
  Building2,
  Plus,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Check
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { toast } from 'sonner'

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
      bgColor: 'bg-blue-50',
      allowMember: true, // Members can see this
    },
    {
      name: 'Enterprise Reporting',
      href: organisationId ? `/organizations/${organisationId}/enterprise-reporting` : '/enterprise-reporting',
      icon: BarChart3,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      allowMember: false, // Only owners
    },
    {
      name: 'Billing & Usage',
      href: organisationId ? `/organizations/${organisationId}/billing` : '/billing',
      icon: CreditCard,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      allowMember: false, // Only owners
    },
    {
      name: 'Users & Teams',
      href: organisationId ? `/organizations/${organisationId}/users-teams` : '/users-teams',
      icon: Users,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      allowMember: false, // Only owners
    },
    {
      name: 'Integrations',
      href: organisationId ? `/organizations/${organisationId}/integrations` : '/integrations',
      icon: Puzzle,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
      allowMember: false, // Only owners
    },
    {
      name: 'Settings',
      href: organisationId ? `/organizations/${organisationId}/settings` : '/settings',
      icon: Settings,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const currentOrg = localStorage.getItem('current_organisation')
    if (currentOrg) {
      try {
        setCurrentOrganisation(JSON.parse(currentOrg))
      } catch (error) {
        console.error('Failed to parse organisation from localStorage', error)
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

  const switchOrganisation = (org: Organisation) => {
    setCurrentOrganisation(org)
    localStorage.setItem('current_organisation', JSON.stringify(org))
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    setIsProfileOpen(false)
    // Refetch organizations after switching
    setTimeout(() => fetchOrganisations(), 100)
    router.push(`/organizations/${org.id}/projects`)
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
          fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          {!isCollapsed && user && currentOrganisation && (
            <div className="p-4 relative">
              {/* Main Profile Button */}
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen)
                  if (!isProfileOpen) {
                    // Refetch organizations when opening the profile menu
                    fetchOrganisations()
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isProfileOpen
                    ? 'border border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {currentOrganisation.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">
                    {currentOrganisation.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">
                    {user.username}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Details - Overlay */}
              {isProfileOpen && (
                <div className="absolute top-24 left-4 right-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg space-y-4 z-50">
                  {/* Organisations Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Organisations ({organisations.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {organisations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => switchOrganisation(org)}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white flex-1 truncate">
                            {org.name}
                          </span>
                          {currentOrganisation?.id === org.id && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Organisation - Only show for owners */}
                  {isOwner && (
                    <>
                      <hr className="border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          router.push('/organizations/new')
                          setIsProfileOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">Add Organisation</span>
                      </button>
                    </>
                  )}

                  <hr className="border-gray-200 dark:border-gray-700" />

                  {/* Edit Profile */}
                  <button
                    onClick={() => {
                      router.push('/profile/edit')
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">Edit profile</span>
                  </button>

                  {/* Account Settings */}
                  <button
                    onClick={() => {
                      router.push('/account/settings')
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">Account settings</span>
                  </button>

                  {/* Support */}
                  <button
                    onClick={() => {
                      router.push('/support')
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">Support</span>
                  </button>

                  <hr className="border-gray-200 dark:border-gray-700" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      logout()
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">Sign out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Close profile dropdown when clicking outside */}
          {isProfileOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsProfileOpen(false)}
            />
          )}

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
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                      ${
                        isActive
                          ? `${item.bgColor} text-gray-900 dark:text-white`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Current Project
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Project Name
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
