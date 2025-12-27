'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Mail, AlertCircle, CheckCircle2, X, AlertTriangle, ArrowUpRight } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { listGroups, type Group } from '@/lib/api/groups'
import { listRoles, type ProjectRole } from '@/lib/api/roles'
import { checkResourceLimit, type ResourceLimitCheck } from '@/lib/api/subscription'
import Link from 'next/link'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  organisationId: string
  onSuccess?: () => void
}

/**
 * Modal to invite a user to the organisation
 * - Enter email and optional full name
 * - Select a role (optional, for organization-level roles)
 * - Select groups to add user to
 * - System sends invitation email
 * - User receives link to accept invitation
 */
export function InviteUserModal({ isOpen, onClose, organisationId, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<ProjectRole[]>([])
  const [expiryDays, setExpiryDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [limitCheck, setLimitCheck] = useState<ResourceLimitCheck | null>(null)
  const [isCheckingLimit, setIsCheckingLimit] = useState(false)

  // Load groups, roles, and check limits
  useEffect(() => {
    if (isOpen) {
      loadGroups()
      loadRoles()
      checkLimit()
    }
  }, [organisationId, isOpen])

  const checkLimit = async () => {
    setIsCheckingLimit(true)
    try {
      const result = await checkResourceLimit(organisationId, 'users')
      setLimitCheck(result)
    } catch (error) {
      console.error('Error checking user limit:', error)
      setLimitCheck(null)
    } finally {
      setIsCheckingLimit(false)
    }
  }

  const loadGroups = async () => {
    try {
      setGroupsLoading(true)
      const groupsData = await listGroups(organisationId)
      setGroups(groupsData.groups)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setGroupsLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      setRolesLoading(true)
      const rolesData = await listRoles(organisationId)
      setRoles(rolesData.roles)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setRolesLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate full name (optional but if provided, should be valid)
    if (fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters'
    }

    // Validate expiry
    if (expiryDays < 1 || expiryDays > 90) {
      newErrors.expiryDays = 'Expiry must be between 1 and 90 days'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // Create invitation
      const invitationData = {
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        organisation_id: organisationId,
        expiry_days: expiryDays,
        group_ids: selectedGroups.length > 0 ? selectedGroups : undefined,
        role_id: selectedRole || undefined,
      }

      const response = await api.post('/api/v1/invitations/', invitationData)

      // Success
      toast.success(`Invitation sent to ${email}`, {
        description: `User has ${expiryDays} days to accept the invitation`,
      })

      // Reset form
      setEmail('')
      setFullName('')
      setSelectedRole('')
      setSelectedGroups([])
      setExpiryDays(7)
      setErrors({})

      // Close modal
      onClose()

      // Refresh user list if callback provided
      onSuccess?.()
    } catch (error: any) {
      console.error('Error inviting user:', error)

      if (error.response?.status === 400) {
        // Email already exists
        setErrors({ email: 'User with this email already exists' })
        toast.error('User already exists', {
          description: 'This email is already registered in the system',
        })
      } else {
        toast.error('Failed to send invitation', {
          description: error.response?.data?.detail || 'Please try again',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite User to Organisation
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new user. They'll receive an email to set up their account.
          </DialogDescription>
        </DialogHeader>

        {/* Limit Reached Banner */}
        {limitCheck?.limit_reached && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">
                  User Limit Reached
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  You&apos;ve reached the maximum number of users ({limitCheck.current}/{limitCheck.limit})
                  allowed on your current plan. Upgrade to invite more users.
                </p>
                <Link
                  href={`/organizations/${organisationId}/billing`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  Upgrade Plan
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isCheckingLimit && (
          <div className="p-4 text-center text-gray-500">
            Checking plan limits...
          </div>
        )}

        {/* Form - only show if limit not reached */}
        {!limitCheck?.limit_reached && !isCheckingLimit && (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: '' })
                }}
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-semibold">
                Full Name (Optional)
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value)
                  if (errors.fullName) setErrors({ ...errors, fullName: '' })
                }}
                disabled={loading}
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="font-semibold">
                Assign Role (Optional)
              </Label>
              {rolesLoading ? (
                <div className="text-sm text-gray-600">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-sm text-gray-600">No roles available</div>
              ) : (
                <select
                  id="role"
                  value={selectedRole}
                  onChange={e => {
                    setSelectedRole(e.target.value)
                    if (errors.role) setErrors({ ...errors, role: '' })
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Expiry Days */}
            <div className="space-y-2">
              <Label htmlFor="expiryDays" className="font-semibold">
                Invitation Expiry (Days)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  max="90"
                  value={expiryDays}
                  onChange={e => {
                    setExpiryDays(parseInt(e.target.value) || 7)
                    if (errors.expiryDays) setErrors({ ...errors, expiryDays: '' })
                  }}
                  disabled={loading}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">days (1-90)</span>
              </div>
              {errors.expiryDays && (
                <p className="text-sm text-red-600">{errors.expiryDays}</p>
              )}
            </div>

            {/* Groups Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">
                Add to Groups (Optional)
              </Label>

              {groupsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading groups...</div>
              ) : groups.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No groups available. Create a group first.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        disabled={loading}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-sm">{group.name}</div>
                        {group.description && (
                          <div className="text-xs text-gray-600">{group.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGroups
                    .map(id => groups.find(g => g.id === id))
                    .filter(Boolean)
                    .map(group => (
                      <Badge
                        key={group?.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {group?.name}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => toggleGroup(group!.id)}
                        />
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 flex gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="text-xs space-y-1">
                  <li>• Invitation email sent to {email || 'user'}</li>
                  <li>• User has {expiryDays} days to accept</li>
                  <li>• User creates password and account</li>
                  <li>• Automatically added to {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}</li>
                  <li>• User can access resources based on group roles</li>
                </ul>
              </div>
            </div>
          </form>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {limitCheck?.limit_reached ? 'Close' : 'Cancel'}
          </Button>
          {!limitCheck?.limit_reached && !isCheckingLimit && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
