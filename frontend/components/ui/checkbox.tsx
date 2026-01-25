import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <div className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        <div
          className={cn(
            'h-5 w-5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center transition-all',
            checked
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-600 dark:border-blue-600'
              : 'bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
