'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      // Fetch user info using httpOnly cookies
      const response = await api.get(`/api/v1/auth/me`)
      setUser(response.data)
    } catch (error: any) {
      // 401 is expected when user is not logged in - don't log it as an error
      if (error.response?.status !== 401) {
        console.error('Auth check failed:', error)
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(`/api/v1/auth/login`, {
        email,
        password
      })

      // Tokens are set as httpOnly cookies by the server, no need to store in localStorage

      // Fetch user data after successful login
      const userResponse = await api.get(`/api/v1/auth/me`)
      setUser(userResponse.data)

      // Fetch organizations to determine redirect
      try {
        const orgsResponse = await api.get(`/api/v1/organisations/`)
        const organisations = orgsResponse.data

        if (organisations.length === 0) {
          // No organizations - redirect to create first one
          router.push('/organizations/new')
        } else if (organisations.length === 1) {
          // One organization - auto-select and go to projects
          localStorage.setItem('current_organization', JSON.stringify(organisations[0]))
          router.push(`/organizations/${organisations[0].id}/projects`)
        } else {
          // Multiple organizations - show selection page
          router.push('/organizations')
        }
      } catch (orgError) {
        console.error('Failed to fetch organisations:', orgError)
        // Fallback if org fetch fails
        router.push('/organizations')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const signup = async (email: string, username: string, password: string, fullName?: string) => {
    try {
      const response = await api.post(`/api/v1/auth/signup`, {
        email,
        username,
        password,
        full_name: fullName
      })

      // Tokens are set as httpOnly cookies by the server, no need to store in localStorage

      // Fetch user data after successful signup
      const userResponse = await api.get(`/api/v1/auth/me`)
      setUser(userResponse.data)

      // Fetch organizations to determine redirect
      try {
        const orgsResponse = await api.get(`/api/v1/organisations/`)
        const organisations = orgsResponse.data

        if (organisations.length === 0) {
          // No organizations - redirect to create first one
          router.push('/organizations/new')
        } else if (organisations.length === 1) {
          // One organization - auto-select and go to projects
          localStorage.setItem('current_organization', JSON.stringify(organisations[0]))
          router.push(`/organizations/${organisations[0].id}/projects`)
        } else {
          // Multiple organizations - show selection page
          router.push('/organizations')
        }
      } catch (orgError) {
        console.error('Failed to fetch organisations:', orgError)
        // Fallback if org fetch fails
        router.push('/organizations')
      }
    } catch (error: any) {
      console.error('Signup failed:', error)
      throw new Error(error.response?.data?.detail || 'Signup failed')
    }
  }

  const logout = () => {
    // Clear organization and project preferences
    localStorage.removeItem('current_organization')
    localStorage.removeItem('current_project')
    setUser(null)
    // Note: httpOnly cookies are cleared by the server on logout
    router.push('/auth/signin')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
