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
import { Building2, Plus, LogOut } from 'lucide-react'

interface Organisation {
  id: string
  name: string
}

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [organisation, setOrganisation] = useState<Organisation | null>(null)

  useEffect(() => {
    const currentOrg = localStorage.getItem('current_organisation')
    if (currentOrg) {
      try {
        setOrganisation(JSON.parse(currentOrg))
      } catch (error) {
        console.error('Failed to parse organisation from localStorage', error)
      }
    }
  }, [])

  if (!user) {
    return null
  }

  return (
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
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name || user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organisation && (
          <DropdownMenuItem>
            <Building2 className="w-4 h-4 mr-2" />
            <span>{organisation.name}</span>
          </DropdownMenuItem>
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
  )
}
