'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface RoleOption {
  id: string
  name: string
  description: string
}

const DEFAULT_ROLES: RoleOption[] = [
  { id: 'viewer', name: 'Viewer', description: 'Can see projects assigned to their teams' },
  { id: 'member', name: 'Member', description: 'Can create projects and manage configuration' },
  { id: 'team_admin', name: 'Team admin', description: 'Can manage projects and team members' },
  { id: 'org_admin', name: 'Org admin', description: 'Can manage organization and teams' },
  { id: 'owner', name: 'Owner', description: 'Full administrative access' }
]

interface RoleFilterProps {
  selectedRoles: string[]
  onRolesChange: (roles: string[]) => void
  roles?: RoleOption[]
}

export function RoleFilter({ selectedRoles, onRolesChange, roles = DEFAULT_ROLES }: RoleFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      onRolesChange(selectedRoles.filter(r => r !== roleId))
    } else {
      onRolesChange([...selectedRoles, roleId])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      >
        <span className="text-sm font-medium">Roles</span>
        {selectedRoles.length > 0 && (
          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedRoles.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {role.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
