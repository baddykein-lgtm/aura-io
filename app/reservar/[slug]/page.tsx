import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BookingFlow from './BookingFlow'

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: business } = await supabase
    .from('users')
    .select('id, business_name, business_bio')
    .eq('business_slug', slug)
    .single()

  if (!business) notFound()

  const [{ data: services }, { data: hours }] = await Promise.all([
    supabase.from('services').select('id, name, duration_minutes, price').eq('user_id', business.id).eq('active', true).order('created_at', { ascending: true }),
    supabase.from('business_hours').select('weekday').eq('user_id', business.id),
  ])

  const ready = (services?.length ?? 0) > 0 && (hours?.length ?? 0) > 0

  return (
    <main className="min-h-screen bg-bg text-text" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-lg mx-auto px-5 py-14 sm:py-20">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-sm">✦</div>
          <span className="text-xs text-faint">Reservas con Aura</span>
        </div>

        {!ready ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🗓️</div>
            <h1 className="text-xl font-bold mb-2">Reservas online próximamente</h1>
            <p className="text-muted text-sm">{business.business_name || 'Este negocio'} todavía está preparando su página de reservas.</p>
          </div>
        ) : (
          <BookingFlow
            slug={slug}
            businessName={business.business_name || 'Reservar cita'}
            businessBio={business.business_bio}
            services={services ?? []}
          />
        )}
      </div>
    </main>
  )
}
