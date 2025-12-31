'use client'

import { useState, useEffect } from 'react'
import {
    Shield, Plus, Edit2, Trash2, Check, X, AlertTriangle,
    Settings, FileCheck, Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Policy {
    id: string
    name: string
    is_enabled: boolean
    is_default: boolean
    max_critical: number | null
    max_high: number | null
    max_medium: number | null
    fail_on_threshold_breach: boolean
    created_at: string
}

interface PolicyProps {
    projectId: string
    apiUrl: string
}

export function PolicyPanel({ projectId, apiUrl }: PolicyProps) {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [newPolicy, setNewPolicy] = useState({
        name: '',
        max_critical: 0,
        max_high: 5,
        max_medium: 20,
        fail_on_threshold_breach: true,
        block_high_risk_licenses: false
    })

    const getToken = () => localStorage.getItem('access_token')

    useEffect(() => {
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/policies`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })

            if (response.ok) {
                setPolicies(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch policies:', error)
        } finally {
            setLoading(false)
        }
    }

    const createPolicy = async () => {
        if (!newPolicy.name) {
            toast.error('Please enter a policy name')
            return
        }

        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/policies?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(newPolicy)
            })

            if (response.ok) {
                toast.success('Policy created successfully')
                setDialogOpen(false)
                setNewPolicy({
                    name: '',
                    max_critical: 0,
                    max_high: 5,
                    max_medium: 20,
                    fail_on_threshold_breach: true,
                    block_high_risk_licenses: false
                })
                fetchPolicies()
            } else {
                throw new Error('Failed to create policy')
            }
        } catch (error) {
            console.error('Failed to create policy:', error)
            toast.error('Failed to create policy')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-teal-600" />
                                Security Policies
                            </CardTitle>
                            <CardDescription>
                                Configure quality gates and severity thresholds for your scans
                            </CardDescription>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Policy
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create Security Policy</DialogTitle>
                                    <DialogDescription>
                                        Define severity thresholds and quality gates
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Policy Name</Label>
                                        <Input
                                            placeholder="e.g., Production Policy"
                                            value={newPolicy.name}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Max Critical</Label>
                                            <Input
                                                type="number"
                                                value={newPolicy.max_critical}
                                                onChange={(e) => setNewPolicy({ ...newPolicy, max_critical: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max High</Label>
                                            <Input
                                                type="number"
                                                value={newPolicy.max_high}
                                                onChange={(e) => setNewPolicy({ ...newPolicy, max_high: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max Medium</Label>
                                            <Input
                                                type="number"
                                                value={newPolicy.max_medium}
                                                onChange={(e) => setNewPolicy({ ...newPolicy, max_medium: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Fail on Threshold Breach</Label>
                                            <p className="text-xs text-gray-500">Block deployments when thresholds exceeded</p>
                                        </div>
                                        <Switch
                                            checked={newPolicy.fail_on_threshold_breach}
                                            onCheckedChange={(checked) => setNewPolicy({ ...newPolicy, fail_on_threshold_breach: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Block High-Risk Licenses</Label>
                                            <p className="text-xs text-gray-500">Fail on GPL/AGPL dependencies</p>
                                        </div>
                                        <Switch
                                            checked={newPolicy.block_high_risk_licenses}
                                            onCheckedChange={(checked) => setNewPolicy({ ...newPolicy, block_high_risk_licenses: checked })}
                                        />
                                    </div>

                                    <Button
                                        className="w-full bg-teal-600 hover:bg-teal-700"
                                        onClick={createPolicy}
                                    >
                                        Create Policy
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            {/* Policies List */}
            {policies.length === 0 && !loading ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No security policies configured</p>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Policy
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {policies.map((policy) => (
                        <Card key={policy.id} className={policy.is_default ? 'border-teal-200 bg-teal-50/30' : ''}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{policy.name}</CardTitle>
                                        {policy.is_default && (
                                            <Badge className="bg-teal-100 text-teal-700">Default</Badge>
                                        )}
                                    </div>
                                    <Badge className={policy.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                        {policy.is_enabled ? 'Active' : 'Disabled'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                            <p className="text-lg font-bold text-red-600">
                                                {policy.max_critical ?? '∞'}
                                            </p>
                                            <p className="text-xs text-gray-500">Max Critical</p>
                                        </div>
                                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                                            <p className="text-lg font-bold text-orange-600">
                                                {policy.max_high ?? '∞'}
                                            </p>
                                            <p className="text-xs text-gray-500">Max High</p>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-lg font-bold text-yellow-600">
                                                {policy.max_medium ?? '∞'}
                                            </p>
                                            <p className="text-xs text-gray-500">Max Medium</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        {policy.fail_on_threshold_breach ? (
                                            <div className="flex items-center gap-1 text-sm text-red-600">
                                                <Ban className="w-4 h-4" />
                                                Blocks on breach
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <AlertTriangle className="w-4 h-4" />
                                                Warns only
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
