import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'chrome' | 'danger'
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Sharp corners - no rounded edges
        'relative p-4',
        className
      )}
      style={{
        // Dark background with subtle gradient
        background: 'linear-gradient(180deg, #1A1A1A 0%, #0F0F0F 100%)',
        // Chrome-style beveled border
        border: '2px solid',
        borderColor: '#3A3A3A #1A1A1A #0A0A0A #2A2A2A',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      {...props}
    >
      {/* Top chrome accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: variant === 'danger'
            ? 'linear-gradient(90deg, #880000, #CC0000, #880000)'
            : 'linear-gradient(90deg, #606060, #A0A0A0, #606060)',
        }}
      />
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'mb-4 pb-3',
        className
      )}
      style={{
        borderBottom: '1px solid #2A2A2A',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }) {
  return (
    <h3
      className={cn(
        'text-lg uppercase tracking-wide text-white',
        className
      )}
      style={{
        fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
        fontStyle: 'italic',
        textShadow: '2px 2px 0 #000',
      }}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'text-sm text-gray-400 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn('text-gray-300', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'mt-4 pt-3 flex items-center',
        className
      )}
      style={{
        borderTop: '1px solid #2A2A2A',
      }}
      {...props}
    >
      {children}
    </div>
  )
}
