'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'chrome' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  skewed?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, skewed = false, children, ...props }, ref) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center uppercase tracking-wider',
      'transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Sharp corners - no rounded edges
      'rounded-none',
      // WWE font
      'font-[Impact,Haettenschweiler,sans-serif] font-normal italic',
      // Skewed parallelogram option
      skewed && '-skew-x-6'
    )

    const variantStyles = {
      // Red primary - WWE signature
      primary: cn(
        'text-white',
        'border-2',
        'hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]',
        'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
        'focus:ring-red-500'
      ),
      // Chrome/silver secondary
      secondary: cn(
        'text-gray-800',
        'border-2',
        'hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]',
        'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
        'focus:ring-gray-400'
      ),
      // Pure chrome plate
      chrome: cn(
        'text-gray-800',
        'border-2',
        'hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]',
        'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
        'focus:ring-gray-400'
      ),
      // Ghost variant
      ghost: cn(
        'bg-transparent text-gray-400 border-2 border-transparent',
        'hover:bg-gray-900 hover:text-white',
        'active:bg-gray-800',
        'focus:ring-gray-500'
      ),
      // Danger variant
      danger: cn(
        'text-white',
        'border-2',
        'hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]',
        'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]',
        'focus:ring-red-500'
      ),
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
    }

    // Inline styles for gradients (can't do these well in Tailwind)
    const getVariantStyle = () => {
      switch (variant) {
        case 'primary':
        case 'danger':
          return {
            background: 'linear-gradient(180deg, #FF3030 0%, #EE0000 15%, #CC0000 50%, #AA0000 85%, #880000 100%)',
            borderColor: '#FF5050 #660000 #550000 #FF2020',
          }
        case 'secondary':
        case 'chrome':
          return {
            background: 'linear-gradient(180deg, #D8D8D8 0%, #F0F0F0 15%, #C8C8C8 35%, #D0D0D0 50%, #B0B0B0 70%, #C0C0C0 85%, #989898 100%)',
            borderColor: '#FFFFFF #707070 #606060 #E8E8E8',
          }
        default:
          return {}
      }
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizes[size], className)}
        style={getVariantStyle()}
        disabled={disabled || loading}
        {...props}
      >
        {/* Brushed metal texture overlay */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,255,255,0.06) 1px, rgba(255,255,255,0.06) 2px)',
          }}
        />

        {/* Content wrapper for skewed buttons */}
        <span className={cn('relative flex items-center gap-2 z-10', skewed && 'skew-x-6')}>
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </span>

        {/* Top highlight */}
        <span
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
