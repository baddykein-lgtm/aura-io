import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { supabase, getMemory } from '@/lib/supabase'

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
      <div className="text-xs text-[#8887AA] mb-2">{label}</div>
      <div className="text-2xl font-extrabold tracking-tight" style={{ color: accent ?? '#F0EFF8' }}>{value}</div>
    </div>
  )
}

export default async function DashboardHome() {
  const user = await requireUser()
  if (!user) redirect('/login')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [memory, agenda, tasks, reminders, invoices, bookings, reviews] = await Promise.all([
    getMemory(user.id),
    supabase.from('agenda').select().eq('user_id', user.id).gte('starts_at', now.toISOString()).order('starts_at', { ascending: true }).limit(5),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', false),
    supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('sent', false),
    supabase.from('invoices').select('amount').eq('user_id', user.id).gte('created_at', startOfMonth),
    supabase.from('bookings').select().eq('user_id', user.id).gte('starts_at', now.toISOString()).order('starts_at', { ascending: true }).limit(5),
    supabase.from('reviews').select('rating').eq('user_id', user.id),
  ])

  const facturadoMes = (invoices.data ?? []).reduce((sum, i: any) => sum + Number(i.amount ?? 0), 0)
  const avgRating = reviews.data?.length ? (reviews.data.reduce((s: number, r: any) => s + r.rating, 0) / reviews.data.length) : null
  const displayName = memory['nombre'] ?? user.email

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Hola, {displayName} 👋</h1>
      <p className="text-[#8887AA] text-sm mb-8">Esto es lo que Aura está gestionando por ti</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Tareas pendientes" value={tasks.count ?? 0} />
        <StatCard label="Recordatorios activos" value={reminders.count ?? 0} />
        <StatCard label="Facturado este mes" value={`${facturadoMes.toFixed(2)} €`} accent="#A89EFF" />
        <StatCard label="Próximas reservas" value={bookings.data?.length ?? 0} />
        <StatCard label="Valoración media" value={avgRating ? `${avgRating.toFixed(1)} ⭐` : '—'} />
        <StatCard label="Google Calendar" value={user.google_access_token ? 'Conectado' : 'Sin conectar'} accent={user.google_access_token ? '#7CD992' : '#FF6B6B'} />
      </div>

      {!user.google_access_token && user.phone && (
        <a
          href={`/api/calendar/auth?phone=${encodeURIComponent(user.phone)}`}
          className="inline-block mb-8 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC]"
        >
          Conectar Google Calendar
        </a>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">Próximos eventos</h2>
          {agenda.data?.length ? (
            <ul className="flex flex-col gap-3">
              {agenda.data.map((e: any) => (
                <li key={e.id} className="text-sm">
                  <div className="text-[#F0EFF8]">{e.title}</div>
                  <div className="text-xs text-[#8887AA]">{new Date(e.starts_at).toLocaleString('es-ES')}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-[#555570]">Sin eventos próximos</p>}
        </div>

        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">Próximas reservas</h2>
          {bookings.data?.length ? (
            <ul className="flex flex-col gap-3">
              {bookings.data.map((b: any) => (
                <li key={b.id} className="text-sm">
                  <div className="text-[#F0EFF8]">{b.client_name} {b.service ? `· ${b.service}` : ''}</div>
                  <div className="text-xs text-[#8887AA]">{new Date(b.starts_at).toLocaleString('es-ES')}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-[#555570]">Sin reservas próximas</p>}
        </div>
      </div>
    </div>
  )
}
