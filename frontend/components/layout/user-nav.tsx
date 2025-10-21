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
import { Building2, Plus, LogOut, FolderKanban, Check, Trash2, User, Settings, HelpCircle } from 'lucide-react'
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

  // Profile is now in the sidebar, so hide the top-right profile
  return null
}
