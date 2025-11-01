'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface GroupType {
  id: string
  code: string
  name: string
  description?: string
  roles: Array<{
    id: string
    role_name: string
    description?: string
    is_default: boolean
  }>
  access_level: 'organization' | 'project'
}

interface CreateGroupWithTypeModalProps {
  isOpen: boolean
  onClose: () => void
  organisationId: string
  onSuccess?: () => void
}

/**
 * Create Group Modal with Predefined Group Types
 * Allows creating groups of type ADMIN, QA, DEV, PRODUCT
 */
export function CreateGroupWithTypeModal({
  isOpen,
  onClose,
  organisationId,
  onSuccess,
}: CreateGroupWithTypeModalProps) {
  const [step, setStep] = useState<'type-select' | 'details'>('type-select')
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([])
  const [selectedType, setSelectedType] = useState<GroupType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupTypesLoading, setGroupTypesLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load group types
  useEffect(() => {
    if (isOpen) {
      loadGroupTypes()
    }
  }, [isOpen, organisationId])

  const loadGroupTypes = async () => {
    try {
      setGroupTypesLoading(true)
      const response = await api.get(`/api/v1/group-types/`, {
        params: { organisation_id: organisationId },
      })
      setGroupTypes(response.data)
    } catch (error) {
      console.error('Error loading group types:', error)
      toast.error('Failed to load group types')
    } finally {
      setGroupTypesLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Group name is required'
    } else if (name.length > 100) {
      newErrors.name = 'Group name must be less than 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm() || !selectedType) {
      return
    }

    try {
      setLoading(true)

      const groupData = {
        name: name.trim(),
        description: description.trim() || undefined,
        organisation_id: organisationId,
        group_type_id: selectedType.id,
      }

      await api.post('/api/v1/groups/', groupData)

      toast.success(`Group "${name}" created successfully`, {
        description: `Type: ${selectedType.name}`,
      })

      // Reset
      setStep('type-select')
      setName('')
      setDescription('')
      setSelectedType(null)
      setErrors({})
      onClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group', {
        description: error.response?.data?.detail || 'Please try again',
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'organization':
        return 'bg-red-100 text-red-700'
      case 'project':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'type-select' ? 'Select Group Type' : 'Create New Group'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type-select'
              ? 'Choose a predefined group type for your team'
              : `Create a ${selectedType?.name} group`}
          </DialogDescription>
        </DialogHeader>

        {step === 'type-select' ? (
          // Step 1: Type Selection
          <div className="space-y-4 py-4">
            {groupTypesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading group types...</div>
            ) : groupTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No group types available</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {groupTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 text-left border rounded-lg transition-colors ${
                      selectedType?.id === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        )}

                        {/* Show roles for this type */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {type.roles.map(role => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role.role_name}
                              {role.is_default && ' (default)'}
                            </Badge>
                          ))}
                        </div>

                        {/* Access level indicator */}
                        <div className="mt-3">
                          <Badge className={getRoleColor(type.access_level)}>
                            {type.access_level === 'organization'
                              ? '🏢 Organization Level'
                              : '📁 Project Level'}
                          </Badge>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {selectedType?.id === type.id && (
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 ml-4 mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Step 2: Group Details
          <form className="space-y-6 py-4">
            {/* Display selected type info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <p>
                <strong>Group Type:</strong> {selectedType?.name}
              </p>
              {selectedType?.description && (
                <p className="mt-1 text-sm opacity-90">{selectedType.description}</p>
              )}
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">
                Group Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., QA Team Alpha"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (errors.name) setErrors({ ...errors, name: '' })
                }}
                disabled={loading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and responsibilities of this group"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
              <p className="font-medium mb-1">Roles in this group:</p>
              <ul className="text-xs space-y-1">
                {selectedType?.roles.map(role => (
                  <li key={role.id}>
                    • <strong>{role.role_name}</strong>
                    {role.is_default && ' (default role for members)'}
                    {role.description && ` - ${role.description}`}
                  </li>
                ))}
              </ul>
            </div>
          </form>
        )}

        <DialogFooter className="gap-2">
          {step === 'type-select' ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedType || loading}
                className="bg-primary hover:bg-primary/90"
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('type-select')}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
