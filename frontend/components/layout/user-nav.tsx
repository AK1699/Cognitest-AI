'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { Building2, Plus, LogOut, Check, User, Settings, HelpCircle, ChevronDown } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [currentOrganisation, setCurrentOrganisation] = useState<Organisation | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
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

      // Check if there's a current org ID in localStorage
      const currentOrgId = localStorage.getItem('current_organization_id')
      if (currentOrgId) {
        // Find the org in the fetched list
        const orgExists = response.data.find((org: Organisation) => org.id === currentOrgId)
        if (orgExists) {
          setCurrentOrganisation(orgExists)
        } else if (response.data.length > 0) {
          // Set first org as current if the stored one doesn't exist
          setCurrentOrganisation(response.data[0])
          localStorage.setItem('current_organization_id', response.data[0].id)
        }
      } else if (response.data.length > 0) {
        // Set first org as current if none is set
        setCurrentOrganisation(response.data[0])
        localStorage.setItem('current_organization_id', response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    }
  }

  const switchOrganisation = (org: Organisation) => {
    setCurrentOrganisation(org)
    localStorage.setItem('current_organization_id', org.id)
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))
    setIsOpen(false)
    router.push(`/organizations/${org.id}/projects`)
  }

  if (!user || !currentOrganisation) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">
                {currentOrganisation.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            {/* Role Badge */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${isOwner ? 'bg-amber-500' : 'bg-blue-500'
              }`}>
              <User className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
              {currentOrganisation.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isOwner
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
                }`}>
                {isOwner ? 'Owner' : 'Member'}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''
            }`} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {/* User Info */}
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold text-gray-900">{user.username}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        {/* Organisations Section */}
        <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-3 py-2">
          Organisations ({organisations.length})
        </DropdownMenuLabel>
        <div className="max-h-48 overflow-y-auto px-2 pb-2">
          {organisations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrganisation(org)}
              className="flex items-center gap-2 px-2 py-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-900 flex-1 truncate">
                {org.name}
              </span>
              {currentOrganisation?.id === org.id && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        {/* Add Organisation - Only show for owners */}
        {isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push('/organizations/new')
                setIsOpen(false)
              }}
              className="px-3 py-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm">Add Organisation</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Edit Profile */}
        <DropdownMenuItem
          onClick={() => {
            router.push('/profile/edit')
            setIsOpen(false)
          }}
          className="px-3 py-2 cursor-pointer"
        >
          <User className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm">Edit profile</span>
        </DropdownMenuItem>

        {/* Account Settings */}
        <DropdownMenuItem
          onClick={() => {
            router.push('/account/settings')
            setIsOpen(false)
          }}
          className="px-3 py-2 cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm">Account settings</span>
        </DropdownMenuItem>

        {/* Support */}
        <DropdownMenuItem
          onClick={() => {
            router.push('/support')
            setIsOpen(false)
          }}
          className="px-3 py-2 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm">Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={() => {
            logout()
            setIsOpen(false)
          }}
          className="px-3 py-2 cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
