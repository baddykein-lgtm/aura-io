import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import Sidebar from './Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0A0A0F] text-[#F0EFF8]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar email={user.email} />
      <main className="flex-1 min-w-0 p-5 lg:p-8">{children}</main>
    </div>
  )
}
