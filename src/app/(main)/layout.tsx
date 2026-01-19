import { BottomNav } from '@/components/ui/bottom-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
