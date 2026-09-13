'use client'
import { useEffect, useState } from 'react'

type Review = { id: string; client_name: string | null; rating: number; comment: string | null; created_at: string }

export default function ResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetch('/api/reviews').then(r => r.json()).then(d => setReviews(d.reviews ?? [])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    setSaving(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: clientName, rating, comment }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setClientName(''); setRating(5); setComment('')
    load()
  }

  const handleDelete = async (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id))
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Reseñas</h1>
      <p className="text-[#8887AA] text-sm mb-6">Valoración media: {avg} {reviews.length > 0 && '⭐'} ({reviews.length})</p>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Cliente (opcional)" value={clientName} onChange={e => setClientName(e.target.value)} />
          <select value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none">
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
          </select>
        </div>
        <textarea className="w-full bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD] mb-3" rows={3} placeholder="Comentario (opcional)" value={comment} onChange={e => setComment(e.target.value)} />
        {error && <p className="text-[#FF6B6B] text-xs mb-3">{error}</p>}
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">
          {saving ? 'Guardando...' : '+ Añadir reseña'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#555570]">Cargando...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#555570]">No tienes reseñas todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.map(r => (
            <div key={r.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{'⭐'.repeat(r.rating)} {r.client_name && `· ${r.client_name}`}</div>
                {r.comment && <div className="text-xs text-[#8887AA] mt-1">{r.comment}</div>}
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-xs text-[#8887AA] hover:text-[#FF6B6B] shrink-0">Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
