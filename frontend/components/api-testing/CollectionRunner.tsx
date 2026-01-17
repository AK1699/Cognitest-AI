import React, { useState, useMemo, useEffect } from 'react';
import {
    X,
    ChevronRight,
    Play,
    Clock,
    FileText,
    Settings,
    Info,
    CheckSquare,
    Square,
    ArrowRight,
    RotateCcw,
    Plus,
    Terminal,
    ChevronDown,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from '@/components/ui/select';
import { type Environment } from './EnvironmentManager';

interface CollectionRunnerProps {
    target: any; // Collection or Folder
    onClose: () => void;
    onRun: (config: any) => void;
    environments: Environment[];
    selectedEnvironmentId: string | null;
    onEnvironmentChange?: (id: string | null) => void;
}

export function CollectionRunner({
    target,
    onClose,
    onRun,
    environments,
    selectedEnvironmentId,
    onEnvironmentChange
}: CollectionRunnerProps) {
    const [view, setView] = useState<'config' | 'results'>('config');
    const [runResults, setRunResults] = useState<any>(null);

    // Flatten requests from the target (recursively if it's a collection/folder)
    const allRequests = useMemo(() => {
        const requests: any[] = [];
        const extractRequests = (item: any) => {
            if (item.requests) {
                requests.push(...item.requests);
            }
            if (item.folders) {
                item.folders.forEach((f: any) => extractRequests(f));
            }
        };
        extractRequests(target);
        return requests;
    }, [target]);

    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>(allRequests.map(r => r.id));
    const [config, setConfig] = useState({
        iterations: 1,
        delay: 0,
        saveResponses: true,
        stopOnError: false
    });
    const [activeTab, setActiveTab] = useState<'functional' | 'performance'>('functional');
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(selectedEnvironmentId);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setSelectedEnvId(selectedEnvironmentId);
    }, [selectedEnvironmentId]);

    const toggleRequest = (id: string) => {
        setSelectedRequestIds(prev =>
            prev.includes(id)
                ? prev.filter(rId => rId !== id)
                : [...prev, id]
        );
    };

    const toggleAll = (select: boolean) => {
        setSelectedRequestIds(select ? allRequests.map(r => r.id) : []);
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-green-600 bg-green-100 border-green-200';
            case 'POST': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'PUT': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'DELETE': return 'text-red-600 bg-red-100 border-red-200';
            case 'PATCH': return 'text-purple-600 bg-purple-100 border-purple-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const handleRun = () => {
        // Find selected environment name
        const env = environments.find(e => e.id === selectedEnvId);

        // Mock run execution for immediate feedback
        const mockResults = {
            id: crypto.randomUUID(),
            startTime: new Date(),
            duration: 790,
            iterations: config.iterations,
            total: selectedRequestIds.length * config.iterations,
            failed: 1,
            avgResponseTime: 625,
            environment: env?.name || 'No Environment',
            executed: allRequests
                .filter(r => selectedRequestIds.includes(r.id))
                .map(r => ({
                    ...r,
                    status: Math.random() > 0.8 ? 403 : 200,
                    responseTime: Math.floor(Math.random() * 500) + 100,
                    size: Math.floor(Math.random() * 2000) + 500
                }))
        };
        setRunResults(mockResults);
        setView('results');
        onRun({ selectedRequestIds, environmentId: selectedEnvId, ...config });
    };

    if (view === 'results' && runResults) {
        return (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Results Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-900">{target.name} - Run results</h2>
                            {runResults.failed > 0 && (
                                <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 font-bold px-2 py-0.5 rounded text-[10px]">ERROR</Badge>
                            )}
                        </div>
                        <div className="h-4 w-[1px] bg-gray-300 mx-2" />
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 gap-2" onClick={handleRun}>
                            <RotateCcw className="w-4 h-4" /> Run Again
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 gap-2" onClick={() => setView('config')}>
                            <Plus className="w-4 h-4" /> New Run
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            Share
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-6 gap-8 p-8 border-b border-gray-200 bg-white">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Source</span>
                            <span className="text-sm font-medium text-gray-900">Runner</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Environment</span>
                            <span className="text-sm font-medium text-gray-900">{runResults.environment}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Iterations</span>
                            <span className="text-sm font-medium text-gray-900">{runResults.iterations}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">Duration</span>
                            <span className="text-sm font-medium text-gray-900">{runResults.duration}ms</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">All tests</span>
                            <span className="text-sm font-medium text-gray-900">{runResults.total}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-red-500 block uppercase tracking-wider">Errors</span>
                            <span className="text-xl font-bold text-red-500">{runResults.failed}</span>
                        </div>
                    </div>

                    {/* Avg Response Time Big Display */}
                    <div className="px-8 pb-4 bg-white border-b border-gray-200">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 block">Avg. Resp. Time</span>
                            <span className="text-2xl font-black text-gray-900">{runResults.avgResponseTime} ms</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-8 pt-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <div className="flex gap-8">
                            {['All Tests', 'Passed', 'Failed', 'Skipped', 'Errors'].map(tab => (
                                <button
                                    key={tab}
                                    className="pb-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-all hover:border-gray-300 first:border-primary first:text-primary"
                                >
                                    {tab}
                                </button>
                            ))}
                            <button className="pb-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-all ml-auto flex items-center gap-2">
                                Console Log
                            </button>
                        </div>
                    </div>

                    {/* Results List */}
                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-2 flex items-center justify-between">
                                    <span>Iteration 1</span>
                                    <span className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-500">1</span>
                                </h3>

                                <div className="space-y-1">
                                    {runResults.executed.map((req: any) => (
                                        <div key={req.id} className="group relative">
                                            {/* Request Row */}
                                            <div className="flex items-center py-2 px-2 hover:bg-gray-100 rounded-lg group-hover:bg-gray-50 transition-colors cursor-pointer select-none">
                                                {/* Method */}
                                                <div className="w-16 flex-shrink-0">
                                                    <span className={`text-[10px] font-bold ${req.method === 'GET' ? 'text-green-600' :
                                                        req.method === 'POST' ? 'text-yellow-600' :
                                                            req.method === 'DELETE' ? 'text-red-600' :
                                                                req.method === 'PUT' ? 'text-blue-600' : 'text-gray-600'
                                                        }`}>
                                                        {req.method}
                                                    </span>
                                                </div>

                                                {/* Name */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900 truncate">{req.name}</span>
                                                    </div>
                                                </div>

                                                {/* URL (Faded) - shown on hover or constant */}
                                                <div className="flex-1 hidden md:block text-xs text-gray-400 truncate pr-4">
                                                    {req.url || 'https://restful-booker.herokuapp.com/booking/1'}
                                                </div>

                                                {/* Status Code */}
                                                <div className="w-20 text-right flex-shrink-0">
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${req.status >= 200 && req.status < 300
                                                        ? 'text-green-700 bg-green-100'
                                                        : 'text-red-700 bg-red-100'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </div>

                                                {/* Time */}
                                                <div className="w-20 text-right text-xs font-mono text-gray-500 flex-shrink-0">
                                                    {req.responseTime} ms
                                                </div>

                                                {/* Size */}
                                                <div className="w-20 text-right text-xs font-mono text-gray-500 flex-shrink-0">
                                                    {req.size} B
                                                </div>

                                                {/* Dots */}
                                                <div className="w-6 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                                </div>
                                            </div>

                                            {/* Expanded Status/Tests (simplified) */}
                                            <div className="pl-16 pl-2 pb-2">
                                                {req.status >= 400 ? (
                                                    <div className="text-xs text-gray-400 italic">No tests found</div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic">No tests found</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Play className="w-4 h-4 text-primary fill-current" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-900">Runner</span>
                        <ChevronRight className="w-4 h-4" />
                        <span>{target.name}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Run Sequence */}
                <div className="w-[40%] border-r border-gray-200 flex flex-col bg-gray-50/30">
                    <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 text-sm">Run Sequence</h3>
                            <span className="text-xs font-medium text-gray-500">{selectedRequestIds.length} requests selected</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            <button
                                onClick={() => toggleAll(true)}
                                className="hover:text-primary transition-colors hover:underline"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => toggleAll(false)}
                                className="hover:text-primary transition-colors hover:underline"
                            >
                                Deselect All
                            </button>
                            <button
                                onClick={() => setSelectedRequestIds(allRequests.map(r => r.id))}
                                className="hover:text-primary transition-colors hover:underline ml-auto"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-1">
                            {allRequests.map((req, index) => (
                                <div
                                    key={req.id}
                                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${selectedRequestIds.includes(req.id)
                                        ? 'bg-white border-gray-200 shadow-sm'
                                        : 'bg-transparent border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    <span className="text-xs font-medium text-gray-400 w-4 text-center">{index + 1}</span>
                                    <Checkbox
                                        checked={selectedRequestIds.includes(req.id)}
                                        onCheckedChange={() => toggleRequest(req.id)}
                                        className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] h-5 px-1.5 font-bold border-0 ${getMethodColor(req.method)}`}
                                    >
                                        {req.method}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-700 truncate">{req.name}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Panel: Configuration */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Tabs */}
                    <div className="px-8 pt-6 border-b border-gray-200">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('functional')}
                                className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'functional'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Functional
                            </button>
                            <button
                                onClick={() => setActiveTab('performance')}
                                className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'performance'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Performance
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-8 overflow-auto">
                        <div className="max-w-xl space-y-8">
                            {/* Run Mode */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900">Choose how to run your collection</h3>
                                <RadioGroup defaultValue="manual" className="space-y-3">
                                    <div className="flex items-start space-x-3 rouded-lg p-3 -ml-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                        <RadioGroupItem value="manual" id="manual" className="mt-1 border-gray-300 text-primary" />
                                        <div className="space-y-1">
                                            <Label htmlFor="manual" className="font-semibold text-gray-900 cursor-pointer">Run manually</Label>
                                            <p className="text-xs text-gray-500">Run this collection in the Collection Runner.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 rouded-lg p-3 -ml-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer opacity-60">
                                        <RadioGroupItem value="schedule" id="schedule" disabled className="mt-1 border-gray-300" />
                                        <div className="space-y-1">
                                            <Label htmlFor="schedule" className="font-semibold text-gray-900 cursor-pointer">Schedule runs</Label>
                                            <p className="text-xs text-gray-500">Periodically run collection at a specified time.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 rouded-lg p-3 -ml-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer opacity-60">
                                        <RadioGroupItem value="cli" id="cli" disabled className="mt-1 border-gray-300" />
                                        <div className="space-y-1">
                                            <Label htmlFor="cli" className="font-semibold text-gray-900 cursor-pointer">Automate runs via CLI</Label>
                                            <p className="text-xs text-gray-500">Configure CLI command to run on your build pipeline.</p>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-900">Environment</h3>
                                </div>
                                <Select
                                    value={selectedEnvId || "no-environment"}
                                    onValueChange={(val) => {
                                        const id = val === "no-environment" ? null : val;
                                        setSelectedEnvId(id);
                                        onEnvironmentChange?.(id);
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 border-gray-200 rounded-xl bg-white shadow-sm ring-offset-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-gray-400" />
                                            <SelectValue placeholder="No Environment" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-environment" className="font-medium text-gray-500 italic">No Environment</SelectItem>
                                        <SelectSeparator className="my-1" />
                                        {environments.map((env) => (
                                            <SelectItem key={env.id} value={env.id} className="font-medium">
                                                {env.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Configuration */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-900">Run configuration</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-semibold text-gray-700">Iterations</Label>
                                            <Info className="w-3 h-3 text-gray-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={config.iterations}
                                            onChange={(e) => setConfig({ ...config, iterations: parseInt(e.target.value) || 1 })}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-semibold text-gray-700">Delay</Label>
                                            <Info className="w-3 h-3 text-gray-400" />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={config.delay}
                                                onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) || 0 })}
                                                className="font-mono text-sm pr-8"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-medium bg-white pl-1">ms</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-semibold text-gray-700">Test data file</Label>
                                        <Info className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">Only JSON and CSV files are accepted.</p>
                                    <Button variant="outline" className="w-full justify-start h-10 text-gray-600 font-medium">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Select File
                                    </Button>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                        Advanced settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500">Total Requests</span>
                            <span className="text-lg font-bold text-gray-900">{selectedRequestIds.length}</span>
                        </div>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 text-base shadow-xl shadow-primary/20 rounded-xl transition-all hover:-translate-y-0.5"
                            onClick={handleRun}
                            disabled={selectedRequestIds.length === 0}
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" />
                            Run {target.name}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
