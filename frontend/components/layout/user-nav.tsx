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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Building2, Plus, LogOut, FolderKanban, Check, Trash2 } from 'lucide-react'
import axios from 'axios'
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

interface Project {
  id: string
  name: string
}

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [currentOrganisation, setCurrentOrganisation] = useState<Organisation | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchOrganisations = async () => {
    if (!user) return

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_URL}/api/v1/organisations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrganisations(response.data)

      // Check if there's a current org in localStorage
      const currentOrg = localStorage.getItem('current_organisation')
      if (currentOrg) {
        try {
          const parsedOrg = JSON.parse(currentOrg)
          // Verify this org still exists in the fetched list
          const orgExists = response.data.find((org: Organisation) => org.id === parsedOrg.id)
          if (orgExists) {
            setCurrentOrganisation(orgExists)
          } else if (response.data.length > 0) {
            // Set first org as current if the stored one doesn't exist
            setCurrentOrganisation(response.data[0])
            localStorage.setItem('current_organisation', JSON.stringify(response.data[0]))
          }
        } catch (error) {
          console.error('Failed to parse organisation from localStorage', error)
        }
      } else if (response.data.length > 0) {
        // Set first org as current if none is set
        setCurrentOrganisation(response.data[0])
        localStorage.setItem('current_organisation', JSON.stringify(response.data[0]))
      }
    } catch (error) {
      console.error('Failed to fetch organisations:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganisation = (org: Organisation) => {
    setCurrentOrganisation(org)
    localStorage.setItem('current_organisation', JSON.stringify(org))

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('organisationChanged', { detail: org }))

    // Only redirect if not already on dashboard
    if (window.location.pathname !== '/dashboard') {
      router.push('/dashboard')
    }
  }

  const handleDeleteOrganisation = async (org: Organisation, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the switch action

    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(`${API_URL}/api/v1/organisations/${org.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Remove from state
      setOrganisations(organisations.filter(o => o.id !== org.id))

      // If deleted org is current, switch to first available or clear
      if (currentOrganisation?.id === org.id) {
        const remainingOrgs = organisations.filter(o => o.id !== org.id)
        if (remainingOrgs.length > 0) {
          setCurrentOrganisation(remainingOrgs[0])
          localStorage.setItem('current_organisation', JSON.stringify(remainingOrgs[0]))
          // Dispatch event to update dashboard
          window.dispatchEvent(new CustomEvent('organisationChanged', { detail: remainingOrgs[0] }))
        } else {
          setCurrentOrganisation(null)
          localStorage.removeItem('current_organisation')
          router.push('/organisations/new')
        }
      }

      toast.success('Organisation deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete organisation:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete organisation')
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrganisations()
    }

    const currentProject = localStorage.getItem('current_project')
    if (currentProject) {
      try {
        setProject(JSON.parse(currentProject))
      } catch (error) {
        console.error('Failed to parse project from localStorage', error)
      }
    }
  }, [user])

  if (!user) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={user.avatar_url} alt={user.full_name || user.username} />
            <AvatarFallback>
              {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
               user.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-semibold leading-none text-gray-900 dark:text-white">
                {user.full_name || user.username}
              </p>
              <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Role: <span className="font-medium text-primary">ADMIN</span>
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Current Organisation */}
          {currentOrganisation && (
            <>
              <div className="px-2 py-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {currentOrganisation.name}
                    </p>
                  </div>
                </div>
                {project && (
                  <div className="flex items-center gap-2 px-2 py-1.5 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Organisations List */}
          {loading ? (
            <div className="px-4 py-3 text-center text-xs text-gray-500">
              Loading organisations...
            </div>
          ) : organisations.length > 0 ? (
            <>
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">
                  Organisations ({organisations.length})
                </p>
                <div className="max-h-48 overflow-y-auto">
                  {organisations.map((org) => (
                    <div
                      key={org.id}
                      className="group relative"
                    >
                      <DropdownMenuItem
                        onClick={() => switchOrganisation(org)}
                        className="cursor-pointer pr-8"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="text-sm truncate">{org.name}</span>
                          </div>
                          {currentOrganisation?.id === org.id && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </DropdownMenuItem>
                      <button
                        onClick={(e) => handleDeleteOrganisation(org, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                        title="Delete organisation"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-4 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No organisations found
              </p>
            </div>
          )}

          <DropdownMenuItem onSelect={() => router.push('/organisations/new')}>
            <Plus className="w-4 h-4 mr-2" />
            <span>Add Organisation</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
