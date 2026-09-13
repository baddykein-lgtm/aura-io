import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <div className="w-full rounded-t-sm" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0, background: color }} title={`${d.label}: ${d.value}`} />
          <span className="text-[9px] text-[#555570] truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default async function AnalyticsPage() {
  const user = await requireUser()
  if (!user) redirect('/login')

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const since6mo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  const [messages30, messages14, tasksAll, invoices6mo, bookingsAll, reviewsAll] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('role', 'user').gte('created_at', since30),
    supabase.from('messages').select('created_at').eq('user_id', user.id).eq('role', 'user').gte('created_at', since14),
    supabase.from('tasks').select('done').eq('user_id', user.id),
    supabase.from('invoices').select('amount, created_at').eq('user_id', user.id).gte('created_at', since6mo),
    supabase.from('bookings').select('status').eq('user_id', user.id),
    supabase.from('reviews').select('rating').eq('user_id', user.id),
  ])

  const days: { label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const count = (messages14.data ?? []).filter((m: any) => m.created_at.slice(0, 10) === key).length
    days.push({ label: d.toLocaleDateString('es-ES', { day: 'numeric' }), value: count })
  }

  const months: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const total = (invoices6mo.data ?? [])
      .filter((inv: any) => inv.created_at.slice(0, 7) === monthKey)
      .reduce((s: number, inv: any) => s + Number(inv.amount ?? 0), 0)
    months.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), value: Math.round(total) })
  }

  const totalTasks = tasksAll.data?.length ?? 0
  const doneTasks = tasksAll.data?.filter((t: any) => t.done).length ?? 0
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  const bookingsByStatus = ['confirmada', 'pendiente', 'cancelada'].map(status => ({
    status,
    count: bookingsAll.data?.filter((b: any) => b.status === status).length ?? 0,
  }))

  const avgRating = reviewsAll.data?.length
    ? (reviewsAll.data.reduce((s: number, r: any) => s + r.rating, 0) / reviewsAll.data.length).toFixed(1)
    : '—'

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Analytics</h1>
      <p className="text-[#8887AA] text-sm mb-8">Cómo está funcionando Aura para ti</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <div className="text-xs text-[#8887AA] mb-2">Mensajes (30 días)</div>
          <div className="text-2xl font-extrabold">{messages30.count ?? 0}</div>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <div className="text-xs text-[#8887AA] mb-2">Tareas completadas</div>
          <div className="text-2xl font-extrabold text-[#A89EFF]">{completionRate}%</div>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <div className="text-xs text-[#8887AA] mb-2">Facturado (6 meses)</div>
          <div className="text-2xl font-extrabold">{months.reduce((s, m) => s + m.value, 0)} €</div>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <div className="text-xs text-[#8887AA] mb-2">Valoración media</div>
          <div className="text-2xl font-extrabold">{avgRating} {reviewsAll.data?.length ? '⭐' : ''}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-5">Mensajes por día (14 días)</h2>
          <BarChart data={days} color="#7F77DD" />
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-5">Facturación mensual</h2>
          <BarChart data={months} color="#C084FC" />
        </div>
      </div>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-4">Reservas por estado</h2>
        <div className="flex gap-6">
          {bookingsByStatus.map(b => (
            <div key={b.status}>
              <div className="text-xl font-extrabold">{b.count}</div>
              <div className="text-xs text-[#8887AA] capitalize">{b.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
