'use client'

import { useState, useEffect } from 'react'
import {
    FileJson, Download, RefreshCw, Package, AlertTriangle, Scale,
    ChevronDown, ChevronRight, Search, Filter, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface SBOM {
    id: string
    human_id: string
    name: string
    format: string
    total_components: number
    direct_dependencies: number
    high_risk_licenses: number
    generated_at: string
}

interface SBOMComponent {
    id: string
    name: string
    version: string
    ecosystem: string
    purl?: string
    license_id?: string
    is_direct: boolean
    is_vulnerable: boolean
}

interface SBOMProps {
    projectId: string
    apiUrl: string
}

export function SBOMPanel({ projectId, apiUrl }: SBOMProps) {
    const [sourcePath, setSourcePath] = useState('')
    const [format, setFormat] = useState('cyclonedx_json')
    const [generating, setGenerating] = useState(false)
    const [currentSBOM, setCurrentSBOM] = useState<SBOM | null>(null)
    const [components, setComponents] = useState<SBOMComponent[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLicenseRisk, setFilterLicenseRisk] = useState<string>('all')

    const getToken = () => localStorage.getItem('access_token')

    const generateSBOM = async () => {
        if (!sourcePath) {
            toast.error('Please enter a source path')
            return
        }

        setGenerating(true)

        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sbom/generate?project_id=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    name: `SBOM - ${new Date().toLocaleDateString()}`,
                    source_path: sourcePath,
                    format: format
                })
            })

            if (response.ok) {
                const sbom = await response.json()
                setCurrentSBOM(sbom)
                toast.success('SBOM generated successfully')
                fetchComponents(sbom.id)
            } else {
                throw new Error('Failed to generate SBOM')
            }
        } catch (error) {
            console.error('SBOM generation failed:', error)
            toast.error('Failed to generate SBOM')
        } finally {
            setGenerating(false)
        }
    }

    const fetchComponents = async (sbomId: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sbom/${sbomId}/components`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })

            if (response.ok) {
                setComponents(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch components:', error)
        }
    }

    const exportSBOM = async () => {
        if (!currentSBOM) return

        try {
            const response = await fetch(`${apiUrl}/api/v1/security-advanced/sbom/${currentSBOM.id}/export`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })

            if (response.ok) {
                const data = await response.json()
                const blob = new Blob([data.content], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${currentSBOM.name}.json`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('SBOM exported')
            }
        } catch (error) {
            toast.error('Failed to export SBOM')
        }
    }

    const getEcosystemColor = (ecosystem: string) => {
        switch (ecosystem?.toLowerCase()) {
            case 'npm': return 'bg-red-100 text-red-700'
            case 'pypi': return 'bg-blue-100 text-blue-700'
            case 'go': return 'bg-cyan-100 text-cyan-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const filteredComponents = components.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* SBOM Generation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-blue-600" />
                        SBOM Generator
                    </CardTitle>
                    <CardDescription>
                        Generate Software Bill of Materials in CycloneDX or SPDX format
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Source Path</Label>
                            <Input
                                placeholder="/path/to/project"
                                value={sourcePath}
                                onChange={(e) => setSourcePath(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Format</Label>
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cyclonedx_json">CycloneDX (JSON)</SelectItem>
                                    <SelectItem value="cyclonedx_xml">CycloneDX (XML)</SelectItem>
                                    <SelectItem value="spdx_json">SPDX (JSON)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={generateSBOM}
                        disabled={generating || !sourcePath}
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileJson className="w-4 h-4 mr-2" />
                                Generate SBOM
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* SBOM Overview */}
            {currentSBOM && (
                <>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">{currentSBOM.name}</CardTitle>
                                <CardDescription>
                                    Generated: {new Date(currentSBOM.generated_at).toLocaleString()}
                                </CardDescription>
                            </div>
                            <Button variant="outline" onClick={exportSBOM}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900">{currentSBOM.total_components}</p>
                                    <p className="text-sm text-gray-500">Total Components</p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{currentSBOM.direct_dependencies}</p>
                                    <p className="text-sm text-gray-500">Direct Dependencies</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-600">
                                        {currentSBOM.total_components - currentSBOM.direct_dependencies}
                                    </p>
                                    <p className="text-sm text-gray-500">Transitive</p>
                                </div>
                                <div className="text-center p-4 bg-amber-50 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-600">{currentSBOM.high_risk_licenses}</p>
                                    <p className="text-sm text-gray-500">License Risks</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Components List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Components ({filteredComponents.length})</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search components..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-64"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Component</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Version</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ecosystem</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">License</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredComponents.slice(0, 50).map((component) => (
                                            <tr key={component.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-gray-900">{component.name}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{component.version}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={getEcosystemColor(component.ecosystem)}>
                                                        {component.ecosystem}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {component.license_id || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">
                                                        {component.is_direct ? 'Direct' : 'Transitive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {component.is_vulnerable ? (
                                                        <Badge className="bg-red-100 text-red-700">Vulnerable</Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700">Secure</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
