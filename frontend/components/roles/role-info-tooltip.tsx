'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export interface RoleDescription {
  name: string
  description: string
  permissions: string[]
}

const ROLE_DESCRIPTIONS: Record<string, RoleDescription> = {
  owner: {
    name: 'Owner',
    description: 'Full organization control - manage billing, plans, delete org, and user management.',
    permissions: ['Manage billing and plans', 'Delete organization', 'Manage users', 'Full admin access']
  },
  admin: {
    name: 'Admin',
    description: 'Full system access except for organization deletion.',
    permissions: ['Manage all projects', 'Manage all users', 'Configure settings', 'Full system access']
  },
  qa_manager: {
    name: 'QA Manager',
    description: 'Manage test projects, assign testers, and review results.',
    permissions: ['Manage test projects', 'Assign testers', 'Review test results', 'Manage team members']
  },
  qa_lead: {
    name: 'QA Lead',
    description: 'Manage test cases, assign tasks, and approve AI fixes.',
    permissions: ['Manage test cases', 'Assign tasks', 'Approve AI fixes', 'Execute tests']
  },
  qa_engineer: {
    name: 'QA Engineer',
    description: 'Execute tests and manage test data.',
    permissions: ['Execute tests', 'Create test cases', 'Manage test data', 'View results']
  },
  product_owner: {
    name: 'Product Owner',
    description: 'Read-only access to view reports and dashboards.',
    permissions: ['View reports', 'View dashboards', 'View test results', 'Read-only access']
  },
  viewer: {
    name: 'Viewer',
    description: 'View reports and results.',
    permissions: ['View projects', 'View test results', 'View dashboards', 'Read-only access']
  }
}

interface RoleInfoTooltipProps {
  roleType: string
  children?: React.ReactNode
}

export function RoleInfoTooltip({ roleType, children }: RoleInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const role = ROLE_DESCRIPTIONS[roleType.toLowerCase()] || ROLE_DESCRIPTIONS.member

  return (
    <div className="relative inline-block group">
      {children || (
        <button
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(!isOpen)}
        >
          <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      )}

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-80 z-50 bg-gray-900 dark:bg-gray-950 text-white rounded-lg shadow-xl p-4 border border-gray-700"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <h4 className="font-semibold text-base mb-2">{role.name}</h4>
          <p className="text-sm text-gray-300 mb-3">{role.description}</p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Permissions:</p>
            <ul className="space-y-1">
              {role.permissions.map((perm, idx) => (
                <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
