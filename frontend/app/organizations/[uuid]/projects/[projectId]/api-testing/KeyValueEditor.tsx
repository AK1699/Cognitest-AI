import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, ChevronDown, FileText, Type } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface KeyValuePair {
    id: string
    key: string
    value: string
    description?: string
    enabled: boolean
    valueType?: 'text' | 'file'  // For form-data: text or file
    file?: File | null  // Temporary file object (not persisted)
    // Persistent file references (stored in database)
    fileId?: string | null  // UUID of uploaded file
    fileName?: string | null  // Original filename
    fileContentType?: string | null  // MIME type
    uploading?: boolean  // Upload in progress
}

interface KeyValueEditorProps {
    type: 'params' | 'headers' | 'formData' | 'urlencoded' | 'pathVariables'
    pairs: KeyValuePair[]
    onUpdate: (type: 'params' | 'headers' | 'formData' | 'urlencoded' | 'pathVariables', id: string, updates: Partial<KeyValuePair>) => void
    onAdd: (type: 'params' | 'headers' | 'formData' | 'urlencoded' | 'pathVariables') => void
    onRemove: (type: 'params' | 'headers' | 'formData' | 'urlencoded' | 'pathVariables', id: string) => void
    onBulkUpdate: (type: 'params' | 'headers' | 'formData' | 'urlencoded' | 'pathVariables', pairs: KeyValuePair[]) => void
    projectId?: string  // For file uploads
    onFileUpload?: (pairId: string, file: File) => Promise<void>  // Callback to upload file
}

// Common HTTP Headers for autocomplete
const COMMON_HEADERS = [
    'Accept', 'Accept-Charset', 'Accept-Encoding', 'Accept-Language', 'Accept-Datetime',
    'Authorization', 'Cache-Control', 'Connection', 'Cookie', 'Content-Length',
    'Content-MD5', 'Content-Type', 'Date', 'Expect', 'Forwarded', 'From', 'Host',
    'If-Match', 'If-Modified-Since', 'If-None-Match', 'If-Range', 'If-Unmodified-Since',
    'Max-Forwards', 'Origin', 'Pragma', 'Proxy-Authorization', 'Range', 'Referer',
    'TE', 'User-Agent', 'Upgrade', 'Via', 'Warning', 'X-Requested-With',
    'X-Do-Not-Track', 'DNT', 'x-api-key', 'X-CSRF-Token'
].sort();

const HEADER_VALUES: Record<string, string[]> = {
    'Content-Type': ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain', 'text/html', 'application/xml'],
    'Accept': ['application/json', '*/*', 'text/html', 'text/plain', 'application/xml'],
    'Authorization': ['Bearer ', 'Basic ', 'Digest '],
    'Cache-Control': ['no-cache', 'no-store', 'max-age=0', 'private', 'public'],
    'Connection': ['keep-alive', 'close'],
    'Accept-Encoding': ['gzip', 'deflate', 'br'],
    'Accept-Language': ['en-US', 'en-GB', 'fr', 'de', 'es'],
    'Access-Control-Allow-Origin': ['*', 'http://localhost:3000'],
}

export const KeyValueEditor = ({ type, pairs, onUpdate, onAdd, onRemove, onBulkUpdate, projectId, onFileUpload }: KeyValueEditorProps) => {
    const [isBulkEdit, setIsBulkEdit] = useState(false)
    const [bulkValue, setBulkValue] = useState('')
    const [activeRowId, setActiveRowId] = useState<string | null>(null)
    const [activeValueRowId, setActiveValueRowId] = useState<string | null>(null)

    const toggleBulkEdit = () => {
        if (isBulkEdit) {
            // Parse bulk text back to pairs (Key: Value // Description)
            const lines = bulkValue.split('\n')
            const newPairs: KeyValuePair[] = lines
                .filter(line => line.trim())
                .map(line => {
                    const [content, description] = line.split('//')
                    const [key, ...valueParts] = content.split(':')
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        key: key?.trim() || '',
                        value: valueParts.join(':')?.trim() || '',
                        description: description?.trim() || '',
                        enabled: true
                    }
                })

            onBulkUpdate(type, newPairs)
        } else {
            // Convert pairs to bulk text
            const text = pairs.map(p => `${p.key}: ${p.value}${p.description ? ` // ${p.description}` : ''}`).join('\n')
            setBulkValue(text)
        }
        setIsBulkEdit(!isBulkEdit)
    }

    const getSuggestions = (input: string) => {
        if (!input) return COMMON_HEADERS
        const lowerInput = input.toLowerCase()
        return COMMON_HEADERS.filter(h => h.toLowerCase().includes(lowerInput) && h.toLowerCase() !== lowerInput)
    }

    const getValueSuggestions = (key: string, input: string) => {
        const values = HEADER_VALUES[Object.keys(HEADER_VALUES).find(k => k.toLowerCase() === key.toLowerCase()) || '']
        if (!values) return []
        if (!input) return values
        const lowerInput = input.toLowerCase()
        return values.filter(v => v.toLowerCase().includes(lowerInput) && v.toLowerCase() !== lowerInput)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    {type === 'urlencoded' ? 'x-www-form-urlencoded' : type}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleBulkEdit}
                    className="h-7 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/5 uppercase tracking-wider px-2"
                >
                    {isBulkEdit ? 'Show Table' : 'Bulk Edit'}
                </Button>
            </div>

            {isBulkEdit ? (
                <Textarea
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="key: value // description"
                    className="font-mono text-sm min-h-[200px] resize-y bg-white border-gray-300 focus:border-primary/40 transition-all p-4 rounded-xl shadow-sm"
                />
            ) : (
                <div className="space-y-0 relative">
                    {/* Header Row - Different for form-data */}
                    {type === 'formData' ? (
                        <div className="grid grid-cols-[36px_1fr_70px_1.5fr_1fr_40px] gap-0 text-[10px] font-black text-gray-500 px-1 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">
                            <div className="flex justify-center"></div>
                            <div className="pl-2">Key</div>
                            <div className="pl-2"></div>
                            <div className="pl-2">Value</div>
                            <div className="pl-2">Description</div>
                            <div></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[36px_1fr_1.5fr_1fr_40px] gap-0 text-[10px] font-black text-gray-500 px-1 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">
                            <div className="flex justify-center"></div>
                            <div className="pl-2">Key</div>
                            <div className="pl-2">Value</div>
                            <div className="pl-2">Description</div>
                            <div></div>
                        </div>
                    )}
                    <div className="divide-y divide-gray-200">
                        {pairs.map(pair => {
                            const suggestions = type === 'headers' && activeRowId === pair.id ? getSuggestions(pair.key) : []
                            const valueSuggestions = type === 'headers' && activeValueRowId === pair.id ? getValueSuggestions(pair.key, pair.value) : []
                            const valueType = pair.valueType || 'text'

                            // Form-data layout with type selector
                            if (type === 'formData') {
                                return (
                                    <div key={pair.id} className="grid grid-cols-[36px_1fr_70px_1.5fr_1fr_40px] gap-0 items-center group/kv hover:bg-gray-50 transition-colors py-0.5">
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                checked={pair.enabled}
                                                onChange={(e) => onUpdate(type, pair.id, { enabled: e.target.checked })}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                                            />
                                        </div>
                                        {/* Key Input */}
                                        <div className="relative">
                                            <input
                                                value={pair.key}
                                                onChange={(e) => onUpdate(type, pair.id, { key: e.target.value })}
                                                placeholder="Key"
                                                className="h-9 w-full text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-800 font-medium placeholder:text-gray-300 placeholder:font-normal"
                                            />
                                        </div>
                                        {/* Type Selector Dropdown */}
                                        <div className="flex items-center justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-7 px-2 text-[11px] font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded flex items-center gap-1 transition-colors border border-gray-200">
                                                        {valueType === 'file' ? (
                                                            <>
                                                                <FileText className="w-3 h-3" />
                                                                File
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Type className="w-3 h-3" />
                                                                Text
                                                            </>
                                                        )}
                                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-28">
                                                    <DropdownMenuItem
                                                        onClick={() => onUpdate(type, pair.id, { valueType: 'text', file: null, value: '' })}
                                                        className="text-xs"
                                                    >
                                                        <Type className="w-3.5 h-3.5 mr-2" />
                                                        Text
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onUpdate(type, pair.id, { valueType: 'file', value: '' })}
                                                        className="text-xs"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 mr-2" />
                                                        File
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        {/* Value Input or File Selector */}
                                        <div className="relative">
                                            {valueType === 'file' ? (
                                                <div className="flex items-center h-9 px-2">
                                                    <input
                                                        type="file"
                                                        id={`file-input-${pair.id}`}
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0] || null
                                                            if (file && onFileUpload) {
                                                                // Set uploading state
                                                                onUpdate(type, pair.id, {
                                                                    uploading: true,
                                                                    value: file.name
                                                                })
                                                                // Upload file
                                                                await onFileUpload(pair.id, file)
                                                            } else if (file) {
                                                                // Fallback: store file locally (won't persist)
                                                                onUpdate(type, pair.id, {
                                                                    file,
                                                                    value: file.name
                                                                })
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`file-input-${pair.id}`}
                                                        className="cursor-pointer text-[13px] text-gray-500 hover:text-primary transition-colors flex items-center gap-2"
                                                    >
                                                        {pair.uploading ? (
                                                            <span className="text-blue-500 animate-pulse">Uploading...</span>
                                                        ) : pair.fileId ? (
                                                            <span className="text-green-600 font-medium truncate max-w-[200px]">✓ {pair.fileName || pair.value}</span>
                                                        ) : pair.value ? (
                                                            <span className="text-gray-700 font-medium truncate max-w-[200px]">{pair.value}</span>
                                                        ) : (
                                                            <span className="text-gray-400">Select files</span>
                                                        )}
                                                    </label>

                                                </div>
                                            ) : (
                                                <input
                                                    value={pair.value}
                                                    onChange={(e) => onUpdate(type, pair.id, { value: e.target.value })}
                                                    placeholder="Value"
                                                    className="h-9 w-full text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-600 font-mono placeholder:text-gray-300 placeholder:font-normal"
                                                />
                                            )}
                                        </div>
                                        {/* Description */}
                                        <input
                                            value={pair.description}
                                            onChange={(e) => onUpdate(type, pair.id, { description: e.target.value })}
                                            placeholder="Add description..."
                                            className="h-9 text-[12px] bg-transparent border-none focus:ring-0 px-2 text-gray-400 italic placeholder:text-gray-200"
                                        />
                                        {/* Delete Button */}
                                        <div className="flex items-center justify-center opacity-0 group-hover/kv:opacity-100 transition-all">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => onRemove(type, pair.id)}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }

                            // Default layout for other types (params, headers, pathVariables)
                            return (
                                <div key={pair.id} className="grid grid-cols-[36px_1fr_1.5fr_1fr_40px] gap-0 items-center group/kv hover:bg-gray-50 transition-colors py-0.5">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={pair.enabled}
                                            onChange={(e) => onUpdate(type, pair.id, { enabled: e.target.checked })}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            value={pair.key}
                                            onChange={(e) => onUpdate(type, pair.id, { key: e.target.value })}
                                            onFocus={() => setActiveRowId(pair.id)}
                                            onBlur={() => setTimeout(() => setActiveRowId(null), 200)}
                                            placeholder="Key"
                                            className="h-9 w-full text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-800 font-medium placeholder:text-gray-300 placeholder:font-normal"
                                        />
                                        {suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {suggestions.map(header => (
                                                    <div
                                                        key={header}
                                                        className="px-3 py-1.5 text-xs text-gray-700 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onUpdate(type, pair.id, { key: header })
                                                            setActiveRowId(null)
                                                        }}
                                                    >
                                                        {header}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            value={pair.value}
                                            onChange={(e) => onUpdate(type, pair.id, { value: e.target.value })}
                                            onFocus={() => setActiveValueRowId(pair.id)}
                                            onBlur={() => setTimeout(() => setActiveValueRowId(null), 200)}
                                            placeholder="Value"
                                            className="h-9 w-full text-[13px] bg-transparent border-none focus:ring-0 px-2 text-gray-600 font-mono placeholder:text-gray-300 placeholder:font-normal"
                                        />
                                        {valueSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {valueSuggestions.map(value => (
                                                    <div
                                                        key={value}
                                                        className="px-3 py-1.5 text-xs text-gray-700 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onUpdate(type, pair.id, { value })
                                                            setActiveValueRowId(null)
                                                        }}
                                                    >
                                                        {value}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        value={pair.description}
                                        onChange={(e) => onUpdate(type, pair.id, { description: e.target.value })}
                                        placeholder="Add description..."
                                        className="h-9 text-[12px] bg-transparent border-none focus:ring-0 px-2 text-gray-400 italic placeholder:text-gray-200"
                                    />
                                    <div className="flex items-center justify-center opacity-0 group-hover/kv:opacity-100 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => onRemove(type, pair.id)}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAdd(type)}
                            className="h-8 text-[12px] font-semibold text-primary/60 hover:text-primary hover:bg-primary/5 pl-2 pr-4 rounded-lg group/add"
                        >
                            <Plus className="w-4 h-4 mr-2 text-primary/40 group-hover/add:text-primary transition-colors" />
                            Add Row
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
