'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import { toast } from 'sonner'
import { GeneralSettings } from '@/components/settings/general-settings'
import { LogoSettings } from '@/components/settings/logo-settings'
import { MemberPrivileges } from '@/components/settings/member-privileges'
import { DeleteOrganization } from '@/components/settings/delete-organization'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Organisation {
  id: string
  name: string
  website?: string
  description?: string
  logo?: string
  owner_id: string
  created_at: string
  updated_at?: string
}

interface PageParams {
  uuid: string
}

export default function SettingsPage({ params }: { params: Promise<PageParams> }) {
  const { uuid } = use(params)
  const router = useRouter()
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchOrganisation()
  }, [uuid])

  const fetchOrganisation = async () => {
    try {
      const response = await api.get(`/api/v1/organisations/${uuid}`)
      setOrganisation(response.data)
    } catch (error: any) {
      console.error('Failed to fetch organisation:', error)
      toast.error('Failed to load organisation settings')
    } finally {
      setLoading(false)
    }
  }

  const updateOrganisation = async (data: Partial<Organisation>) => {
    setIsSaving(true)
    try {
      const response = await api.put(`/api/v1/organisations/${uuid}`, data)
      setOrganisation(response.data)
      localStorage.setItem('current_organisation', JSON.stringify(response.data))
      toast.success('Organisation updated successfully!')
      return response.data
    } catch (error: any) {
      console.error('Failed to update organisation:', error)
      toast.error(error.response?.data?.detail || 'Failed to update organisation')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const deleteOrganisation = async () => {
    try {
      await api.delete(`/api/v1/organisations/${uuid}`)
      localStorage.removeItem('current_organisation')
      toast.success('Organisation deleted successfully')
      router.push('/organizations')
    } catch (error: any) {
      console.error('Failed to delete organisation:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete organisation')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar organisationId={uuid} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="flex min-h-screen">
        <Sidebar organisationId={uuid} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Organisation not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar organisationId={uuid} />
      <main className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Organization Settings
                  </h1>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-15 text-lg">
                Manage your organization's profile, branding, and member permissions
              </p>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
                <TabsTrigger value="general" className="text-sm font-semibold">General</TabsTrigger>
                <TabsTrigger value="logo" className="text-sm font-semibold">Logo</TabsTrigger>
                <TabsTrigger value="members" className="text-sm font-semibold">Members</TabsTrigger>
                <TabsTrigger value="danger" className="text-sm font-semibold">Danger</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-8 animate-in fade-in duration-300">
                <GeneralSettings
                  organisation={organisation}
                  onUpdate={updateOrganisation}
                  isSaving={isSaving}
                />
              </TabsContent>

              <TabsContent value="logo" className="mt-8 animate-in fade-in duration-300">
                <LogoSettings
                  logo={organisation.logo || null}
                  organisationName={organisation.name}
                  onLogoChange={(logo) => updateOrganisation({ logo })}
                  isSaving={isSaving}
                />
              </TabsContent>

              <TabsContent value="members" className="mt-8 animate-in fade-in duration-300">
                <MemberPrivileges organisationId={uuid} />
              </TabsContent>

              <TabsContent value="danger" className="mt-8 animate-in fade-in duration-300">
                <DeleteOrganization
                  organisationName={organisation.name}
                  onDelete={deleteOrganisation}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
