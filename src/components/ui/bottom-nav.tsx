'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Dumbbell, TrendingUp, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/log', label: 'Log', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/social', label: 'Social', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // If clicking on current page (or subpage), force a fresh navigation
    const isCurrentPage = pathname === href || (href !== '/' && pathname.startsWith(href))
    if (isCurrentPage) {
      e.preventDefault()
      // Force refresh by navigating to the base route
      router.push(href)
      // Dispatch custom event for pages to reset their state
      window.dispatchEvent(new CustomEvent('nav-reset', { detail: { href } }))
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Dark base bar */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 50%, #0A0A0A 100%)',
          borderTop: '1px solid #3A3A3A',
          // Increased bottom padding for skewed button corners + iOS safe areas
          padding: '8px 8px calc(20px + env(safe-area-inset-bottom, 0px)) 8px',
        }}
      >
        {/* Nav items container */}
        <div className="mx-auto flex max-w-lg items-center justify-around gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="relative flex-1"
              >
                {/* Chrome parallelogram button */}
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center py-2 transition-all duration-150',
                    'transform -skew-x-6',
                    // Bigger on desktop
                    'min-h-[52px] md:min-h-[70px] md:py-3'
                  )}
                  style={{
                    // Chrome gradient - bright silver like SmackDown vs Raw menus
                    background: isActive
                      ? 'linear-gradient(180deg, #FF3030 0%, #EE0000 15%, #CC0000 50%, #AA0000 85%, #880000 100%)'
                      : 'linear-gradient(180deg, #D8D8D8 0%, #F0F0F0 15%, #C8C8C8 35%, #D0D0D0 50%, #B0B0B0 70%, #C0C0C0 85%, #989898 100%)',
                    // Beveled border - light top/left, dark bottom/right
                    border: '2px solid',
                    borderColor: isActive
                      ? '#FF5050 #660000 #550000 #FF2020'
                      : '#FFFFFF #707070 #606060 #E8E8E8',
                    // Outer glow for active
                    boxShadow: isActive
                      ? '0 0 12px rgba(255, 0, 0, 0.6), 0 0 24px rgba(204, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }}
                >
                  {/* Horizontal brushed metal texture */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,255,255,0.08) 1px, rgba(255,255,255,0.08) 2px)',
                    }}
                  />

                  {/* Content - counter-skew to straighten */}
                  <div className="transform skew-x-6 flex flex-col items-center gap-0.5 md:gap-1 relative z-10">
                    <Icon
                      className={cn(
                        'h-5 w-5 md:h-6 md:w-6 transition-colors',
                        isActive
                          ? 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                          : 'text-gray-700'
                      )}
                      strokeWidth={2.5}
                    />
                    <span
                      className={cn(
                        'text-[11px] md:text-sm uppercase tracking-wider transition-colors font-wwe',
                        isActive
                          ? 'text-white'
                          : 'text-gray-800'
                      )}
                      style={{
                        textShadow: isActive ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Corner rivets for active state */}
                  {isActive && (
                    <>
                      <div
                        className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #FFaaaa 0%, #CC0000 60%, #880000 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.5)',
                        }}
                      />
                      <div
                        className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #FFaaaa 0%, #CC0000 60%, #880000 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.5)',
                        }}
                      />
                      <div
                        className="absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #FFaaaa 0%, #CC0000 60%, #880000 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.5)',
                        }}
                      />
                      <div
                        className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #FFaaaa 0%, #CC0000 60%, #880000 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.5)',
                        }}
                      />
                    </>
                  )}

                  {/* Chrome rivets for inactive state */}
                  {!isActive && (
                    <>
                      <div
                        className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #F0F0F0 0%, #A0A0A0 50%, #606060 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.3)',
                        }}
                      />
                      <div
                        className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full skew-x-6"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #F0F0F0 0%, #A0A0A0 50%, #606060 100%)',
                          boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.3)',
                        }}
                      />
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Decorative rivets on the bar itself */}
        <div
          className="absolute bottom-2 left-3 w-2 h-2 rounded-full hidden sm:block"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #D0D0D0 0%, #808080 50%, #404040 100%)',
            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute bottom-2 right-3 w-2 h-2 rounded-full hidden sm:block"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #D0D0D0 0%, #808080 50%, #404040 100%)',
            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </nav>
  )
}
