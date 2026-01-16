import React, { useState, useMemo } from 'react';
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
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface CollectionRunnerProps {
    target: any; // Collection or Folder
    onClose: () => void;
    onRun: (config: any) => void;
}

export function CollectionRunner({ target, onClose, onRun }: CollectionRunnerProps) {
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
    const [showAdvanced, setShowAdvanced] = useState(false);

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

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
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
                            onClick={() => onRun({ selectedRequestIds, ...config })}
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


