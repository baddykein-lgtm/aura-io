'use client'
import { useEffect, useState } from 'react'
import { Card, Button, Input } from '../ui'

type Booking = { id: string; client_name: string; client_phone: string | null; service: string | null; starts_at: string; status: string; notes: string | null }

const STATUSES = ['confirmada', 'pendiente', 'cancelada']
const STATUS_COLOR: Record<string, string> = { confirmada: 'var(--color-success)', pendiente: 'var(--color-warning)', cancelada: 'var(--color-danger)' }

export default function BookingsList() {
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
    <div>
      <Card className="p-5 mb-6">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <Input placeholder="Cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
          <Input placeholder="Teléfono (opcional)" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          <Input placeholder="Servicio (opcional)" value={service} onChange={e => setService(e.target.value)} />
        </div>
        <Input className="w-full mb-3" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        {error && <p className="text-danger text-xs mb-3">{error}</p>}
        <Button onClick={handleCreate} disabled={saving}>{saving ? 'Guardando...' : '+ Añadir reserva'}</Button>
      </Card>

      {loading ? (
        <p className="text-sm text-faint">Cargando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-faint">No tienes reservas todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map(b => (
            <Card key={b.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold">{b.client_name} {b.service ? `· ${b.service}` : ''}</div>
                <div className="text-xs text-muted mt-0.5">{new Date(b.starts_at).toLocaleString('es-ES')}{b.client_phone ? ` · ${b.client_phone}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={b.status}
                  onChange={e => updateStatus(b, e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg text-xs px-2 py-1.5 outline-none"
                  style={{ color: STATUS_COLOR[b.status] }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(b.id)} className="text-xs text-muted hover:text-danger">Eliminar</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
