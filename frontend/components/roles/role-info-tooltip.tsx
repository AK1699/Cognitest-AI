'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export interface RoleDescription {
  name: string
  description: string
  permissions: string[]
}

const ROLE_DESCRIPTIONS: Record<string, RoleDescription> = {
  viewer: {
    name: 'Viewer',
    description: 'Can see projects assigned to their teams.',
    permissions: ['View projects', 'View test results', 'Read-only access']
  },
  member: {
    name: 'Member',
    description: 'Can create new projects and manage App Quality configuration.',
    permissions: ['Create projects', 'Manage configuration', 'View & edit test cases']
  },
  team_admin: {
    name: 'Team admin',
    description: 'Can manage projects and members limited to their teams.',
    permissions: ['Manage projects', 'Manage team members', 'Assign roles within team']
  },
  org_admin: {
    name: 'Org admin',
    description: 'Can manage organization, teams and billing.',
    permissions: ['Manage organization', 'Manage all teams', 'Manage billing']
  },
  owner: {
    name: 'Owner',
    description: 'Can configure SSO integration and delete organization.',
    permissions: ['Configure SSO', 'Delete organization', 'Full admin access']
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
