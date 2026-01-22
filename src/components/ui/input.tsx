'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm uppercase tracking-wider mb-2 text-gray-400"
            style={{
              fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
              fontStyle: 'italic',
            }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Sharp corners
              'block w-full rounded-none px-4 py-3',
              'text-white placeholder-gray-600',
              // Transitions
              'transition-all duration-150',
              className
            )}
            style={{
              // Recessed metal appearance
              background: 'linear-gradient(180deg, #0A0A0A 0%, #151515 100%)',
              // Inset beveled border
              border: '2px solid',
              borderColor: error
                ? '#CC0000 #FF3030 #FF3030 #CC0000'
                : '#1A1A1A #3A3A3A #3A3A3A #1A1A1A',
              boxShadow: error
                ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(204, 0, 0, 0.3)'
                : 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
            {...props}
          />
        </div>
        {error && (
          <p
            className="mt-2 text-sm uppercase tracking-wide"
            style={{
              color: '#FF3030',
              fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
              fontStyle: 'italic',
            }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
