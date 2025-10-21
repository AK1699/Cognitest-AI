'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import axios from 'axios'
import { Building2, Plus, Edit2, Trash2, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default function OrganisationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)
  const [editName, setEditName] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchOrganisations()
  }, [user, router])

  const fetchOrganisations = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_URL}/api/v1/organisations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrganisations(response.data)
    } catch (error) {
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(`${API_URL}/api/v1/organisations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Remove from state
      setOrganisations(organisations.filter(org => org.id !== orgId))

      // If deleted org is current, clear it
      const currentOrg = localStorage.getItem('current_organisation')
      if (currentOrg) {
        const parsed = JSON.parse(currentOrg)
        if (parsed.id === orgId) {
          localStorage.removeItem('current_organisation')
        }
      }

      toast.success('Organization deleted successfully')
    } catch (error) {
      toast.error('Failed to delete organization')
    }
  }

  const handleEdit = (org: Organisation) => {
    setEditingOrg(org)
    setEditName(org.name)
    setEditWebsite(org.website || '')
  }

  const handleUpdate = async () => {
    if (!editingOrg || !editName.trim()) {
      toast.error('Organization name is required')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.put(
        `${API_URL}/api/v1/organisations/${editingOrg.id}`,
        {
          name: editName.trim(),
          website: editWebsite.trim() || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Update in state
      setOrganisations(organisations.map(org =>
        org.id === editingOrg.id ? response.data : org
      ))

      // Update current org if it's the one being edited
      const currentOrg = localStorage.getItem('current_organisation')
      if (currentOrg) {
        const parsed = JSON.parse(currentOrg)
        if (parsed.id === editingOrg.id) {
          localStorage.setItem('current_organisation', JSON.stringify(response.data))
        }
      }

      setEditingOrg(null)
      toast.success('Organization updated successfully')
    } catch (error) {
      toast.error('Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  const handleSwitch = (org: Organisation) => {
    localStorage.setItem('current_organisation', JSON.stringify(org))
    toast.success(`Switched to ${org.name}`)
    router.push('/projects')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/projects"
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-accent/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organizations</h1>
            </div>
            <Link
              href="/organisations/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-normal"
            >
              <Plus className="w-4 h-4" />
              New Organization
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 sm:px-8 lg:px-12 py-8">
        {organisations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No organizations yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-normal">
              Create your first organization to get started
            </p>
            <Link
              href="/organisations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-normal"
            >
              <Plus className="w-5 h-5" />
              Create Organization
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organisations.map((org) => (
              <div
                key={org.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {org.name}
                      </h3>
                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:opacity-80 flex items-center gap-1 mt-1 font-normal"
                        >
                          Visit website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleSwitch(org)}
                    className="flex-1 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg transition-all text-sm font-normal shadow-md hover:shadow-lg"
                  >
                    Switch
                  </button>
                  <button
                    onClick={() => handleEdit(org)}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent/10 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="p-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Edit Organization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white outline-none transition-all"
                  placeholder="Organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                  Website <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white outline-none transition-all"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-normal"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 shadow-md hover:shadow-lg font-normal"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
