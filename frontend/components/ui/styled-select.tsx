'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

interface StyledSelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function StyledSelect({
    value,
    onChange,
    options,
    placeholder = 'Select an option...',
    className = '',
    disabled = false
}: StyledSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    const selectedOption = options.find(opt => opt.value === value)

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full px-3 py-2 text-left
          border border-gray-300 rounded-lg
          bg-white text-gray-900
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          flex items-center justify-between
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:border-gray-400'}
        `}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => !option.disabled && handleSelect(option.value)}
                            disabled={option.disabled}
                            className={`
                w-full px-3 py-2 text-left text-sm
                flex items-center justify-between
                ${option.value === value
                                    ? 'bg-teal-50 text-teal-700 font-medium'
                                    : 'text-gray-900 hover:bg-gray-50'
                                }
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                first:rounded-t-lg last:rounded-b-lg
              `}
                        >
                            <span>{option.label}</span>
                            {option.value === value && (
                                <Check className="w-4 h-4 text-teal-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
