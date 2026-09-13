'use client'
import { useEffect, useState } from 'react'

type Contact = { id: string; name: string; info: string | null }

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/contacts').then(r => r.json()).then(d => setContacts(d.contacts ?? [])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, info }) })
    setName(''); setInfo('')
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Contactos</h1>
      <p className="text-[#8887AA] text-sm mb-6">Personas que Aura recuerda por ti</p>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
          <input className="bg-[#0A0A0F] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]" placeholder="Info (teléfono, notas...)" value={info} onChange={e => setInfo(e.target.value)} />
        </div>
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">
          {saving ? 'Guardando...' : '+ Añadir contacto'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#555570]">Cargando...</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-[#555570]">No tienes contactos todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map(c => (
            <div key={c.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{c.name}</div>
                {c.info && <div className="text-xs text-[#8887AA] mt-0.5">{c.info}</div>}
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-[#8887AA] hover:text-[#FF6B6B] shrink-0">Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
