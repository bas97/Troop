import { BottomNav } from '@/components/ui/bottom-nav'
import { SyncProvider } from '@/components/SyncProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-28">
      <SyncProvider />
      {children}
      <BottomNav />
    </div>
  )
}
