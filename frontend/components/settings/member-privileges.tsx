'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Globe } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MemberPrivilege {
  id: string
  name: string
  description: string
}

interface MemberPrivilegesProps {
  organisationId: string
}

const availablePrivileges: MemberPrivilege[] = [
  {
    id: 'public_project_creation',
    name: 'Public project creation',
    description: 'You can restrict who can create public projects, which is visible to anyone on the internet.',
  },
]

export function MemberPrivileges({ organisationId }: MemberPrivilegesProps) {
  const [selectedPrivilege, setSelectedPrivilege] = useState<string>('only_admins')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPrivilegeSettings()
  }, [organisationId])

  const fetchPrivilegeSettings = async () => {
    try {
      // This would fetch from an API endpoint for member privileges
      // For now, we'll use a default value
      setLoading(false)
    } catch (error: any) {
      console.error('Failed to fetch privilege settings:', error)
      setLoading(false)
    }
  }

  const handlePrivilegeChange = async (newPrivilege: string) => {
    setIsSaving(true)
    try {
      setSelectedPrivilege(newPrivilege)
      toast.success('Member privilege updated successfully!')
    } catch (error: any) {
      console.error('Failed to update privilege:', error)
      toast.error('Failed to update member privilege')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Member Privileges
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Control what permissions team members have when creating projects
          </p>

        <div className="space-y-6">
          {/* Public Project Creation */}
          <div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {availablePrivileges[0].name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {availablePrivileges[0].description}
                </p>

                {/* Radio Options */}
                <div className="space-y-3">
                  {/* Only Admins */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="radio"
                      name="project_creation"
                      value="only_admins"
                      checked={selectedPrivilege === 'only_admins'}
                      onChange={(e) => handlePrivilegeChange(e.target.value)}
                      disabled={isSaving}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Only admins
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Only admins of this organization can create public projects.
                      </p>
                    </div>
                  </label>

                  {/* Any Member */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="radio"
                      name="project_creation"
                      value="any_member"
                      checked={selectedPrivilege === 'any_member'}
                      onChange={(e) => handlePrivilegeChange(e.target.value)}
                      disabled={isSaving}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Any member
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Anyone in this organization can create public projects.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Member Roles Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Organization Roles
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Members can have different roles within your organization:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Owner</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Full access to all organization settings, projects, and member management.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Can manage projects, members, and most settings except billing.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Member</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Can create and manage projects they own.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
