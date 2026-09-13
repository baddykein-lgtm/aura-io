'use client'
import { useEffect, useState } from 'react'
import { Card, Button, Input } from '../ui'

type Service = { id: string; name: string; duration_minutes: number; price: number | null }
type Day = { weekday: number; open: boolean; start_time: string; end_time: string }

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DEFAULT_DAYS: Day[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday, open: weekday >= 1 && weekday <= 5, start_time: '09:00', end_time: '18:00',
}))

export default function BusinessSettingsPanel() {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessError, setBusinessError] = useState('')
  const [copied, setCopied] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('30')
  const [servicePrice, setServicePrice] = useState('')

  const [days, setDays] = useState<Day[]>(DEFAULT_DAYS)
  const [savingHours, setSavingHours] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/business').then(r => r.json()),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/business-hours').then(r => r.json()),
    ]).then(([b, s, h]) => {
      setSlug(b.business?.business_slug ?? '')
      setSavedSlug(b.business?.business_slug ?? null)
      setName(b.business?.business_name ?? '')
      setBio(b.business?.business_bio ?? '')
      setServices(s.services ?? [])
      if (h.hours?.length) {
        setDays(DEFAULT_DAYS.map(d => {
          const found = h.hours.find((x: any) => x.weekday === d.weekday)
          return found ? { weekday: d.weekday, open: true, start_time: found.start_time.slice(0, 5), end_time: found.end_time.slice(0, 5) } : { ...d, open: false }
        }))
      }
    }).finally(() => setLoading(false))
  }, [])

  const saveBusiness = async () => {
    setBusinessError('')
    setSavingBusiness(true)
    const res = await fetch('/api/settings/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_slug: slug, business_name: name, business_bio: bio }),
    })
    const data = await res.json()
    setSavingBusiness(false)
    if (data.error) { setBusinessError(data.error); return }
    setSavedSlug(data.business?.business_slug ?? null)
    setSlug(data.business?.business_slug ?? '')
  }

  const addService = async () => {
    if (!serviceName.trim() || !serviceDuration) return
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: serviceName, duration_minutes: Number(serviceDuration), price: servicePrice || null }),
    })
    const data = await res.json()
    if (data.service) {
      setServices(prev => [...prev, data.service])
      setServiceName(''); setServiceDuration('30'); setServicePrice('')
    }
  }

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
  }

  const updateDay = (weekday: number, patch: Partial<Day>) => {
    setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, ...patch } : d))
  }

  const saveHours = async () => {
    setSavingHours(true)
    await fetch('/api/business-hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    })
    setSavingHours(false)
  }

  const publicUrl = savedSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reservar/${savedSlug}` : null

  const copyLink = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p className="text-sm text-faint">Cargando...</p>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card className="p-5">
        <h2 className="text-sm font-bold mb-1">Tu enlace de reservas</h2>
        <p className="text-xs text-muted mb-4">Compártelo con tus clientes para que reserven cita ellos mismos, sin hablar contigo.</p>

        <div className="mb-3">
          <label className="text-xs text-muted block mb-1.5">Enlace</label>
          <div className="flex items-center gap-0 rounded-lg border border-white/15 bg-bg overflow-hidden focus-within:border-accent">
            <span className="pl-3.5 py-2.5 text-sm text-faint whitespace-nowrap">auraioapp.site/reservar/</span>
            <input
              className="flex-1 min-w-0 bg-transparent text-text px-1 py-2.5 text-sm outline-none"
              placeholder="tu-negocio"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted block mb-1.5">Nombre del negocio</label>
            <Input className="w-full" placeholder="Peluquería Ana" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Descripción (opcional)</label>
            <Input className="w-full" placeholder="Cortes, color y peinados" value={bio} onChange={e => setBio(e.target.value)} />
          </div>
        </div>
        {businessError && <p className="text-danger text-xs mb-3">{businessError}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={saveBusiness} disabled={savingBusiness}>{savingBusiness ? 'Guardando...' : 'Guardar'}</Button>
          {publicUrl && (
            <button onClick={copyLink} className="text-sm text-accent-3 hover:underline">
              {copied ? '¡Copiado!' : `${publicUrl} · copiar`}
            </button>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold mb-4">Servicios</h2>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 mb-3">
          <Input placeholder="Nombre del servicio" value={serviceName} onChange={e => setServiceName(e.target.value)} />
          <Input className="sm:w-28" type="number" placeholder="Minutos" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} />
          <Input className="sm:w-28" type="number" placeholder="Precio €" value={servicePrice} onChange={e => setServicePrice(e.target.value)} />
        </div>
        <Button variant="ghost" className="border border-white/15 mb-4" onClick={addService}>+ Añadir servicio</Button>

        {services.length === 0 ? (
          <p className="text-sm text-faint">Añade al menos un servicio para activar tu página pública</p>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm bg-bg rounded-lg px-3.5 py-2.5">
                <span>{s.name} · {s.duration_minutes} min{s.price ? ` · ${s.price}€` : ''}</span>
                <button onClick={() => deleteService(s.id)} className="text-xs text-muted hover:text-danger">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold mb-1">Horario semanal</h2>
        <p className="text-xs text-muted mb-4">Cuándo pueden reservar tus clientes</p>
        <div className="flex flex-col gap-2 mb-4">
          {days.map(d => (
            <div key={d.weekday} className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 w-28 shrink-0">
                <input type="checkbox" checked={d.open} onChange={e => updateDay(d.weekday, { open: e.target.checked })} className="accent-accent w-4 h-4" />
                {WEEKDAY_LABELS[d.weekday]}
              </label>
              {d.open ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={d.start_time} onChange={e => updateDay(d.weekday, { start_time: e.target.value })} className="bg-bg border border-white/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent" />
                  <span className="text-faint">–</span>
                  <input type="time" value={d.end_time} onChange={e => updateDay(d.weekday, { end_time: e.target.value })} className="bg-bg border border-white/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent" />
                </div>
              ) : (
                <span className="text-faint">Cerrado</span>
              )}
            </div>
          ))}
        </div>
        <Button onClick={saveHours} disabled={savingHours}>{savingHours ? 'Guardando...' : 'Guardar horario'}</Button>
      </Card>
    </div>
  )
}
