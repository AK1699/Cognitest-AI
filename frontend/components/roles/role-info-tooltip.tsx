'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { ROLE_DISPLAY_MAP } from '@/lib/role-display-utils'

export interface RoleDescription {
  name: string
  description: string
  permissions: string[]
}

// Build role descriptions from centralized display map
const ROLE_DESCRIPTIONS: Record<string, RoleDescription> = {
  owner: {
    name: ROLE_DISPLAY_MAP.owner.displayName,
    description: ROLE_DISPLAY_MAP.owner.description,
    permissions: ['Manage billing and plans', 'Delete organization', 'Configure SSO', 'Full control']
  },
  admin: {
    name: ROLE_DISPLAY_MAP.admin.displayName,
    description: ROLE_DISPLAY_MAP.admin.description,
    permissions: ['Manage organization settings', 'Manage all users', 'Configure integrations', 'Manage operations']
  },
  qa_manager: {
    name: ROLE_DISPLAY_MAP.qa_manager.displayName,
    description: ROLE_DISPLAY_MAP.qa_manager.description,
    permissions: ['Manage QA teams', 'Assign testers', 'Oversee test execution', 'Review results']
  },
  qa_lead: {
    name: ROLE_DISPLAY_MAP.qa_lead.displayName,
    description: ROLE_DISPLAY_MAP.qa_lead.description,
    permissions: ['Lead QA engineers', 'Approve test cases', 'Validate AI fixes', 'Execute tests']
  },
  qa_engineer: {
    name: ROLE_DISPLAY_MAP.qa_engineer.displayName,
    description: ROLE_DISPLAY_MAP.qa_engineer.description,
    permissions: ['Create tests', 'Execute tests', 'Maintain test cases', 'Manage test data']
  },
  product_owner: {
    name: ROLE_DISPLAY_MAP.product_owner.displayName,
    description: ROLE_DISPLAY_MAP.product_owner.description,
    permissions: ['Review reports', 'View KPIs', 'Ensure alignment', 'Read-only access']
  },
  viewer: {
    name: ROLE_DISPLAY_MAP.viewer.displayName,
    description: ROLE_DISPLAY_MAP.viewer.description,
    permissions: ['View dashboards', 'View reports', 'View analytics', 'Read-only access']
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
