import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HighlightedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    resolveVariable?: (variable: string) => string;
    variables?: { key: string; value: string }[];
    pathVariables?: { key: string; value: string }[];
}

export const HighlightedInput: React.FC<HighlightedInputProps> = ({
    value,
    onChange,
    resolveVariable,
    variables = [],
    pathVariables = [],
    className,
    ...props
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [cursorPosition, setCursorPosition] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Regex to match {{variable}} or :pathVariable
    const tokenRegex = /(\{\{[^}]+\}\})|(:[a-zA-Z0-9_]+)/g;

    // Split value into segments
    const getSegments = (text: string) => {
        const segments = [];
        let lastIndex = 0;
        let match;
        tokenRegex.lastIndex = 0;

        while ((match = tokenRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ type: 'text', content: text.slice(lastIndex, match.index), start: lastIndex });
            }

            // Determine type
            const isEnvVar = match[1] !== undefined;
            const content = match[0];
            const name = isEnvVar ? match[1].slice(2, -2).trim() : match[2].slice(1); // {{name}} -> name, :name -> name

            segments.push({
                type: isEnvVar ? 'variable' : 'pathVariable',
                content,
                name,
                start: match.index
            });
            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            segments.push({ type: 'text', content: text.slice(lastIndex), start: lastIndex });
        }
        return segments;
    };

    const segments = getSegments(value);

    // Measure text width for dropdown positioning
    const measureTextWidth = (text: string) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context && inputRef.current) {
            const computedStyle = window.getComputedStyle(inputRef.current);
            context.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
            return context.measureText(text).width;
        }
        return 0;
    };

    const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        setCursorPosition(target.selectionStart || 0);
    };

    const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
        const left = e.currentTarget.scrollLeft;
        setScrollLeft(left);
        if (overlayRef.current) {
            overlayRef.current.scrollLeft = left;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const newCursorPos = e.target.selectionStart || 0;

        onChange(e);
        setCursorPosition(newCursorPos);

        // Check for trigger
        const textBeforeCursor = newValue.slice(0, newCursorPos);
        const match = textBeforeCursor.match(/\{\{([a-zA-Z0-9_]*)$/);

        if (match) {
            setShowSuggestions(true);
            setSuggestionQuery(match[1]);
            setSuggestionIndex(0);

            // Calculate position
            const prefix = textBeforeCursor.slice(0, match.index);
            const left = measureTextWidth(prefix);
            const scrollAdjLeft = Math.max(0, left - (inputRef.current?.scrollLeft || 0));
            setDropdownLeft(scrollAdjLeft + 20);
        } else {
            setShowSuggestions(false);
        }
    };

    const filteredVariables = variables.filter(v =>
        v.key.toLowerCase().includes(suggestionQuery.toLowerCase())
    );

    const insertVariable = (variableKey: string) => {
        if (!inputRef.current) return;

        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);

        const match = textBeforeCursor.match(/\{\{([a-zA-Z0-9_]*)$/);
        if (match) {
            const prefix = textBeforeCursor.slice(0, match.index);
            const newValue = `${prefix}{{${variableKey}}}${textAfterCursor}`;

            // Create a synthetic event to call onChange
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(inputRef.current, newValue);
                const event = new Event('input', { bubbles: true });
                inputRef.current.dispatchEvent(event);
            }

            setShowSuggestions(false);

            // Restore focus and move cursor
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const newCursorPos = prefix.length + variableKey.length + 4; // {{ + }} = 4 chars
                    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev + 1) % filteredVariables.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev - 1 + filteredVariables.length) % filteredVariables.length);
        } else if (e.key === 'Enter') {
            if (filteredVariables.length > 0) {
                e.preventDefault();
                insertVariable(filteredVariables[suggestionIndex].key);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleVariableClick = (start: number, end: number) => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(start, end);
        }
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {/* The actual input - gives height to container */}
            <input
                ref={inputRef}
                {...props}
                value={value}
                onChange={handleChange}
                onSelect={handleInputSelect}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="w-full bg-transparent text-transparent caret-gray-900 border-none outline-none px-2 relative z-0 placeholder:text-gray-400 focus:ring-0 text-base font-medium"
                style={{ color: 'transparent' }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
            />

            {/* Overlay for highlighting */}
            <div
                className="absolute inset-0 flex items-center pointer-events-none overflow-hidden px-2 z-10"
                aria-hidden="true"
            >
                {/* Scrollable content wrapper that syncs with input scroll - REMOVED Transform */}
                <div
                    ref={overlayRef}
                    className="flex items-center whitespace-pre text-base font-medium h-full overflow-hidden w-full"
                >
                    {segments.map((segment, i) => {
                        if (segment.type === 'variable') {
                            const resolved = resolveVariable ? resolveVariable(segment.content) : null;
                            return (
                                <TooltipProvider key={i}>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="text-amber-600 relative inline-block transition-colors cursor-text pointer-events-auto"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    let offset = segment.content.length;

                                                    if (document.caretRangeFromPoint) {
                                                        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                                                        if (range && range.startContainer.textContent === segment.content) {
                                                            offset = range.startOffset;
                                                        }
                                                    }

                                                    const cursorPos = segment.start + offset;
                                                    if (inputRef.current) {
                                                        inputRef.current.focus();
                                                        inputRef.current.setSelectionRange(cursorPos, cursorPos);
                                                    }
                                                }}
                                            >
                                                {segment.content}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                            <div className="text-xs">
                                                <span className="font-bold text-amber-500">Variable:</span> {segment.name}
                                            </div>
                                            <div className="text-xs mt-1 border-t border-gray-700 pt-1">
                                                <span className="opacity-70">Value:</span> {resolved || <span className="text-red-400 italic">Not found</span>}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        } else if (segment.type === 'pathVariable') {
                            return (
                                <TooltipProvider key={i}>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="text-amber-600 relative inline-block transition-colors cursor-text pointer-events-auto"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    let offset = segment.content.length;

                                                    // Webkit/Standard
                                                    if (document.caretRangeFromPoint) {
                                                        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                                                        // Verify we clicked the right node text
                                                        if (range && range.startContainer.textContent === segment.content) {
                                                            offset = range.startOffset;
                                                        }
                                                    }

                                                    const cursorPos = segment.start + offset;
                                                    if (inputRef.current) {
                                                        inputRef.current.focus();
                                                        inputRef.current.setSelectionRange(cursorPos, cursorPos);
                                                    }
                                                }}
                                            >
                                                {segment.content}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                            <div className="text-xs">
                                                <span className="font-bold text-amber-500">Path Variable:</span> {segment.name}
                                            </div>
                                            <div className="text-xs mt-1 border-t border-gray-700 pt-1">
                                                <span className="opacity-70">Value:</span> {pathVariables.find(v => v.key === segment.name)?.value || <span className="text-red-400 italic">Not found</span>}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }
                        return <span key={i} className="text-gray-900 dark:text-gray-100 pointer-events-none">{segment.content}</span>;
                    })}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredVariables.length > 0 && (
                <div
                    className="absolute top-full z-50 mt-1 w-64 bg-gray-900 rounded-md border border-gray-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: Math.min(dropdownLeft, (containerRef.current?.clientWidth || 300) - 200) }}
                >
                    <div className="py-1">
                        {filteredVariables.map((v, idx) => (
                            <button
                                key={v.key}
                                onClick={() => insertVariable(v.key)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between group ${idx === suggestionIndex ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-mono font-bold truncate ${idx === suggestionIndex ? 'text-amber-400' : 'text-gray-300 group-hover:text-amber-400'}`}>
                                        {v.key}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                        {v.value}
                                    </span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${idx === suggestionIndex ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-600'}`}>
                                    ENV
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
