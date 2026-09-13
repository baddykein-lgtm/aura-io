'use client'
import { useEffect, useState } from 'react'

type Event = { id: string; title: string; starts_at: string; notes: string | null }

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetch('/api/agenda').then(r => r.json()).then(d => setEvents(d.events ?? [])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!title.trim() || !startsAt) { setError('Título y fecha son obligatorios'); return }
    setError('')
    setSaving(true)
    const res = await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), starts_at: new Date(startsAt).toISOString(), notes: notes.trim() || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setTitle(''); setStartsAt(''); setNotes('')
    load()
  }

  const handleDelete = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Agenda</h1>
      <p className="text-[#8887AA] text-sm mb-6">Se sincroniza con Google Calendar automáticamente</p>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Título del evento" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        </div>
        <input className="w-full bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD] mb-3" placeholder="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />
        {error && <p className="text-[#FF6B6B] text-xs mb-3">{error}</p>}
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">
          {saving ? 'Guardando...' : '+ Añadir evento'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#555570]">Cargando...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-[#555570]">No tienes eventos todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map(e => (
            <div key={e.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{e.title}</div>
                <div className="text-xs text-[#8887AA] mt-0.5">{new Date(e.starts_at).toLocaleString('es-ES')}</div>
                {e.notes && <div className="text-xs text-[#555570] mt-1">{e.notes}</div>}
              </div>
              <button onClick={() => handleDelete(e.id)} className="text-xs text-[#8887AA] hover:text-[#FF6B6B] shrink-0">Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
