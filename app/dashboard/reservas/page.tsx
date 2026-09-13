'use client'
import { useState } from 'react'
import BookingsList from './BookingsList'
import BusinessSettingsPanel from './BusinessSettingsPanel'

export default function ReservasPage() {
  const [tab, setTab] = useState<'reservas' | 'config'>('reservas')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Reservas</h1>
      <p className="text-muted text-sm mb-6">Citas de tus clientes y tu página de reservas online</p>

      <div className="flex gap-1 mb-6 border-b border-white/10">
        {[
          { id: 'reservas' as const, label: 'Reservas' },
          { id: 'config' as const, label: 'Mi página pública' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reservas' ? <BookingsList /> : <BusinessSettingsPanel />}
    </div>
  )
}
