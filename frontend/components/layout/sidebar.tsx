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
  Menu
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  organisationId?: string
  projectId?: string
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Test Management',
    href: '/test-management',
    icon: ClipboardList,
  },
  {
    name: 'API Testing',
    href: '/api-testing',
    icon: Code,
  },
  {
    name: 'Security Testing',
    href: '/security-testing',
    icon: Shield,
  },
  {
    name: 'Performance Testing',
    href: '/performance-testing',
    icon: Zap,
  },
  {
    name: 'Automation Hub',
    href: '/automation-hub',
    icon: Workflow,
  },
]

export function Sidebar({ organisationId, projectId }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">CT</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  CogniTest
                </span>
              </Link>
            )}

            {/* Collapse Button - Desktop Only */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
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
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="font-normal text-sm">{item.name}</span>
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
