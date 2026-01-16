import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'

export interface KeyValuePair {
    id: string
    key: string
    value: string
    description?: string
    enabled: boolean
}

interface KeyValueEditorProps {
    type: 'params' | 'headers' | 'formData' | 'pathVariables'
    pairs: KeyValuePair[]
    onUpdate: (type: 'params' | 'headers' | 'formData' | 'pathVariables', id: string, updates: Partial<KeyValuePair>) => void
    onAdd: (type: 'params' | 'headers' | 'formData' | 'pathVariables') => void
    onRemove: (type: 'params' | 'headers' | 'formData' | 'pathVariables', id: string) => void
    onBulkUpdate: (type: 'params' | 'headers' | 'formData' | 'pathVariables', pairs: KeyValuePair[]) => void
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

export const KeyValueEditor = ({ type, pairs, onUpdate, onAdd, onRemove, onBulkUpdate }: KeyValueEditorProps) => {
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
                    {type}
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
                    <div className="grid grid-cols-[36px_1fr_1.5fr_1fr_40px] gap-0 text-[10px] font-black text-gray-500 px-1 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">
                        <div className="flex justify-center"></div>
                        <div className="pl-2">Key</div>
                        <div className="pl-2">Value</div>
                        <div className="pl-2">Description</div>
                        <div></div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {pairs.map(pair => {
                            const suggestions = type === 'headers' && activeRowId === pair.id ? getSuggestions(pair.key) : []
                            const valueSuggestions = type === 'headers' && activeValueRowId === pair.id ? getValueSuggestions(pair.key, pair.value) : []

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
