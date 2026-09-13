'use client'
import { useEffect, useMemo, useState } from 'react'

type Service = { id: string; name: string; duration_minutes: number; price: number | null }
type Slot = { start: string; end: string }

function nextDays(count: number) {
  const days: { dateStr: string; label: string; dayNum: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    days.push({
      dateStr,
      label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNum: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    })
  }
  return days
}

export default function BookingFlow({ slug, businessName, businessBio, services }: {
  slug: string
  businessName: string
  businessBio: string | null
  services: Service[]
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [service, setService] = useState<Service | null>(null)
  const [dateStr, setDateStr] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const days = useMemo(() => nextDays(14), [])

  useEffect(() => {
    if (!service || !dateStr) return
    setLoadingSlots(true)
    setSlot(null)
    fetch(`/api/public/business/${slug}/availability?date=${dateStr}&serviceId=${service.id}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [service, dateStr, slug])

  const handleConfirm = async () => {
    if (!service || !slot || !clientName.trim()) return
    setError('')
    setSubmitting(true)
    const res = await fetch(`/api/public/business/${slug}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: service.id, startsAt: slot.start, clientName, clientPhone }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.error) { setError(data.error); return }
    setStep(4)
  }

  if (step === 4) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center text-2xl mx-auto mb-5">✓</div>
        <h1 className="text-xl font-bold mb-2">¡Reserva confirmada!</h1>
        <p className="text-muted text-sm mb-1">{service?.name} con {businessName}</p>
        {slot && (
          <p className="text-text text-sm font-medium">
            {new Date(slot.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las{' '}
            {new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{businessName}</h1>
      {businessBio && <p className="text-muted text-sm mb-8">{businessBio}</p>}

      <div className="flex items-center gap-1.5 mb-8">
        {[1, 2, 3].map(n => (
          <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-accent' : 'bg-white/10'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted mb-1">Elige un servicio</h2>
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => { setService(s); setStep(2) }}
              className="text-left bg-surface border border-white/10 hover:border-accent/50 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{s.name}</span>
                {s.price != null && <span className="text-sm text-accent-3">{s.price}€</span>}
              </div>
              <span className="text-xs text-faint">{s.duration_minutes} min</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && service && (
        <div>
          <button onClick={() => setStep(1)} className="text-xs text-muted hover:text-text mb-4">← Cambiar servicio</button>
          <h2 className="text-sm font-semibold text-muted mb-3">Elige un día</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {days.map(d => (
              <button
                key={d.dateStr}
                onClick={() => setDateStr(d.dateStr)}
                className={`shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-colors ${
                  dateStr === d.dateStr ? 'bg-accent/15 border-accent text-accent-3' : 'bg-surface border-white/10 text-muted hover:border-white/20'
                }`}
              >
                <span className="text-[10px] uppercase">{d.label}</span>
                <span className="text-sm font-semibold">{d.dayNum.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {dateStr && (
            <>
              <h2 className="text-sm font-semibold text-muted mb-3">Elige una hora</h2>
              {loadingSlots ? (
                <p className="text-sm text-faint">Buscando huecos...</p>
              ) : !slots?.length ? (
                <p className="text-sm text-faint">No hay huecos libres ese día, prueba otro</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {slots.map(s => (
                    <button
                      key={s.start}
                      onClick={() => setSlot(s)}
                      className={`py-2.5 rounded-lg text-sm border transition-colors ${
                        slot?.start === s.start ? 'bg-accent border-accent text-white' : 'bg-surface border-white/10 hover:border-white/20'
                      }`}
                    >
                      {new Date(s.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}
              {slot && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-accent to-accent-2"
                >
                  Continuar
                </button>
              )}
            </>
          )}
        </div>
      )}

      {step === 3 && service && slot && (
        <div>
          <button onClick={() => setStep(2)} className="text-xs text-muted hover:text-text mb-4">← Cambiar hora</button>
          <div className="bg-surface border border-white/10 rounded-xl p-4 mb-6">
            <div className="text-sm font-medium">{service.name}</div>
            <div className="text-xs text-muted">
              {new Date(slot.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">Tu nombre</label>
              <input
                className="w-full bg-surface border border-white/15 text-text placeholder:text-faint px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-accent"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Tu WhatsApp (opcional)</label>
              <input
                className="w-full bg-surface border border-white/15 text-text placeholder:text-faint px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-accent"
                placeholder="+34 600 000 000"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-danger text-xs mb-4">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting || !clientName.trim()}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-accent to-accent-2 disabled:opacity-50"
          >
            {submitting ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
        </div>
      )}
    </div>
  )
}
