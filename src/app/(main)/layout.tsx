import { BottomNav } from '@/components/ui/bottom-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen arena-bg">
      {/* Spotlight gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% -10%, rgba(196, 30, 58, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 40%)
          `,
        }}
      />

      {/* Main content */}
      <main className="relative z-10 pb-20">{children}</main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
