'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Resumen', icon: '🏠', exact: true },
  { href: '/dashboard/chat', label: 'Chat', icon: '💬' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: '📅' },
  { href: '/dashboard/tareas', label: 'Tareas', icon: '✅' },
  { href: '/dashboard/facturas', label: 'Facturas', icon: '🧾' },
  { href: '/dashboard/contactos', label: 'Contactos', icon: '👥' },
  { href: '/dashboard/reservas', label: 'Reservas', icon: '🗓️' },
  { href: '/dashboard/resenas', label: 'Reseñas', icon: '⭐' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-[#0A0A0F] border-r border-white/10 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[#7F77DD] to-[#C084FC] flex items-center justify-center text-sm">✦</div>
        <span className="font-bold text-[15px] tracking-tight text-[#F0EFF8]">Aura</span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href, item.exact)
                ? 'bg-[#7F77DD22] text-[#A89EFF] border border-[#7F77DD44]'
                : 'text-[#8887AA] hover:bg-white/5 hover:text-[#F0EFF8] border border-transparent'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 pb-3 text-xs text-[#555570] truncate">{email}</div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#8887AA] hover:bg-white/5 hover:text-[#FF6B6B] transition-colors"
        >
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
