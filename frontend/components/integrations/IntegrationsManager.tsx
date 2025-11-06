'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Settings, Zap, Check, AlertTriangle, Loader2, ExternalLink, RefreshCw, Trash2, Edit, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { integrationsAPI, Integration, IntegrationType, IntegrationStatus } from '@/lib/api/integrations'

interface IntegrationsManagerProps {
  organisationId: string
  projectId?: string
  onClose: () => void
}

const INTEGRATION_TYPES = [
  { value: 'jira' as IntegrationType, label: 'JIRA', icon: '🔷', color: 'blue' },
  { value: 'github' as IntegrationType, label: 'GitHub', icon: '🐙', color: 'gray' },
  { value: 'testrail' as IntegrationType, label: 'TestRail', icon: '🚄', color: 'green' },
  { value: 'gitlab' as IntegrationType, label: 'GitLab', icon: '🦊', color: 'orange' },
  { value: 'azure_devops' as IntegrationType, label: 'Azure DevOps', icon: '☁️', color: 'blue' },
  { value: 'custom' as IntegrationType, label: 'Custom', icon: '🔧', color: 'purple' },
]

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  testing: 'bg-yellow-100 text-yellow-800',
}

export default function IntegrationsManager({ organisationId, projectId, onClose }: IntegrationsManagerProps) {
  const [step, setStep] = useState<'list' | 'create' | 'edit' | 'logs'>('list')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    integration_type: 'jira' as IntegrationType,
    base_url: '',
    username: '',
    api_token: '',
    api_key: '',
    sync_direction: 'bi_directional' as 'one_way_to_external' | 'one_way_from_external' | 'bi_directional',
    auto_sync_enabled: false,
    sync_interval_minutes: '60',
  })

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      const result = await integrationsAPI.list({
        organisation_id: organisationId,
        project_id: projectId,
      })
      setIntegrations(result)
    } catch (err: any) {
      setError('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setError('')
    setSuccess('')

    try {
      const result = await integrationsAPI.testConnection({
        integration_type: formData.integration_type,
        base_url: formData.base_url,
        username: formData.username || undefined,
        api_token: formData.api_token,
        api_key: formData.api_key || undefined,
      })

      if (result.success) {
        setSuccess('Connection successful!')
      } else {
        setError(result.message || 'Connection failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const newIntegration = await integrationsAPI.create({
        organisation_id: organisationId,
        project_id: projectId,
        name: formData.name,
        description: formData.description,
        integration_type: formData.integration_type,
        status: 'active',
        base_url: formData.base_url,
        username: formData.username || undefined,
        api_token: formData.api_token,
        api_key: formData.api_key || undefined,
        config: {},
        sync_direction: formData.sync_direction,
        auto_sync_enabled: formData.auto_sync_enabled,
        sync_interval_minutes: formData.sync_interval_minutes,
        sync_filters: {},
        field_mappings: {},
        last_sync_details: {},
        total_synced_items: '0',
        total_sync_errors: '0',
        tags: [],
        meta_data: {},
        created_by: 'current-user', // Replace with actual user ID
      })

      setSuccess('Integration created successfully!')
      await loadIntegrations()
      setStep('list')

      // Reset form
      setFormData({
        name: '',
        description: '',
        integration_type: 'jira',
        base_url: '',
        username: '',
        api_token: '',
        api_key: '',
        sync_direction: 'bi_directional',
        auto_sync_enabled: false,
        sync_interval_minutes: '60',
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create integration')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    setError('')
    setSuccess('')

    try {
      const result = await integrationsAPI.sync(integrationId)
      setSuccess(`Synced ${result.items_synced} items successfully!`)
      await loadIntegrations()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sync')
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      await integrationsAPI.delete(integrationId)
      setSuccess('Integration deleted successfully')
      await loadIntegrations()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete integration')
    }
  }

  const getTypeInfo = (type: IntegrationType) => {
    return INTEGRATION_TYPES.find(t => t.value === type) || INTEGRATION_TYPES[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">Integrations</h2>
              <p className="text-indigo-100 text-sm">Connect with JIRA, GitHub, TestRail, and more</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List View */}
        {step === 'list' && (
          <div className="p-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Integrations</h3>
                <p className="text-sm text-gray-500">{integrations.length} integration(s) configured</p>
              </div>
              <button
                onClick={() => setStep('create')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Integration
              </button>
            </div>

            {/* Integrations Grid */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading integrations...</p>
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Integrations Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connect your external tools to sync issues, test cases, and requirements
                </p>
                <button
                  onClick={() => setStep('create')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Add Your First Integration
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => {
                  const typeInfo = getTypeInfo(integration.integration_type)
                  return (
                    <div
                      key={integration.id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{typeInfo.icon}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                            <p className="text-sm text-gray-500">{typeInfo.label}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[integration.status]}`}>
                          {integration.status}
                        </span>
                      </div>

                      {/* Description */}
                      {integration.description && (
                        <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-gray-500 text-xs">Synced Items</div>
                          <div className="font-semibold text-gray-900">{integration.total_synced_items || 0}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-gray-500 text-xs">Sync Errors</div>
                          <div className="font-semibold text-gray-900">{integration.total_sync_errors || 0}</div>
                        </div>
                      </div>

                      {/* Last Sync */}
                      {integration.last_sync_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Clock className="w-3 h-3" />
                          Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSync(integration.id)}
                          disabled={syncing === integration.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {syncing === integration.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Sync Now
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(integration.id)}
                          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Integration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Create View */}
        {step === 'create' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Integration</h3>
              <p className="text-sm text-gray-500">Connect an external tool to sync data</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              {/* Integration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {INTEGRATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, integration_type: type.value })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.integration_type === type.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Production JIRA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="https://your-instance.atlassian.net"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.api_token}
                    onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                    placeholder="Your API token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sync Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Direction
                </label>
                <select
                  value={formData.sync_direction}
                  onChange={(e) => setFormData({ ...formData, sync_direction: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="bi_directional">Bi-Directional (Both Ways)</option>
                  <option value="one_way_to_external">One Way → External Tool</option>
                  <option value="one_way_from_external">One Way ← External Tool</option>
                </select>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.auto_sync_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Enable Auto Sync (every {formData.sync_interval_minutes} minutes)
                </label>
              </div>

              {/* Test Connection */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.base_url || !formData.api_token}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Integration'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
