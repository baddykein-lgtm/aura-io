'use client'
import { useEffect, useState } from 'react'

type Booking = { id: string; client_name: string; client_phone: string | null; service: string | null; starts_at: string; status: string; notes: string | null }

const STATUSES = ['confirmada', 'pendiente', 'cancelada']
const STATUS_COLOR: Record<string, string> = { confirmada: '#7CD992', pendiente: '#F2C879', cancelada: '#FF6B6B' }

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [service, setService] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetch('/api/bookings').then(r => r.json()).then(d => setBookings(d.bookings ?? [])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!clientName.trim() || !startsAt) { setError('Cliente y fecha son obligatorios'); return }
    setError('')
    setSaving(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: clientName, client_phone: clientPhone, service, starts_at: new Date(startsAt).toISOString() }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setClientName(''); setClientPhone(''); setService(''); setStartsAt('')
    load()
  }

  const updateStatus = async (booking: Booking, status: string) => {
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b))
    await fetch(`/api/bookings/${booking.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  }

  const handleDelete = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id))
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Reservas</h1>
      <p className="text-[#8887AA] text-sm mb-6">Citas y reservas de tus clientes</p>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Teléfono (opcional)" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Servicio (opcional)" value={service} onChange={e => setService(e.target.value)} />
        </div>
        <input className="w-full bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD] mb-3" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        {error && <p className="text-[#FF6B6B] text-xs mb-3">{error}</p>}
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">
          {saving ? 'Guardando...' : '+ Añadir reserva'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#555570]">Cargando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-[#555570]">No tienes reservas todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map(b => (
            <div key={b.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold">{b.client_name} {b.service ? `· ${b.service}` : ''}</div>
                <div className="text-xs text-[#8887AA] mt-0.5">{new Date(b.starts_at).toLocaleString('es-ES')}{b.client_phone ? ` · ${b.client_phone}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={b.status}
                  onChange={e => updateStatus(b, e.target.value)}
                  className="bg-[#0A0A0F] border border-white/20 rounded-lg text-xs px-2 py-1.5 outline-none"
                  style={{ color: STATUS_COLOR[b.status] ?? '#F0EFF8' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(b.id)} className="text-xs text-[#8887AA] hover:text-[#FF6B6B]">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
