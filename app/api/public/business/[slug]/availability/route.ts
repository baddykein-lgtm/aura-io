import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computeAvailableSlots } from '@/lib/availability'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const url = new URL(req.url)
  const dateStr = url.searchParams.get('date')
  const serviceId = url.searchParams.get('serviceId')

  if (!dateStr || !serviceId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const { data: user } = await supabase.from('users').select('id').eq('business_slug', slug).single()
  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .eq('active', true)
    .single()
  if (!service) return NextResponse.json({ error: 'Servicio no válido' }, { status: 400 })

  const weekday = new Date(`${dateStr}T12:00:00Z`).getUTCDay()
  const { data: hours } = await supabase
    .from('business_hours')
    .select('start_time, end_time')
    .eq('user_id', user.id)
    .eq('weekday', weekday)
    .maybeSingle()

  if (!hours) return NextResponse.json({ slots: [] })

  const dayStart = `${dateStr}T00:00:00`
  const dayEnd = `${dateStr}T23:59:59`
  const { data: existing } = await supabase
    .from('bookings')
    .select('starts_at, duration_minutes')
    .eq('user_id', user.id)
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .neq('status', 'cancelada')

  const slots = computeAvailableSlots({
    dateStr,
    openTime: hours.start_time,
    closeTime: hours.end_time,
    durationMinutes: service.duration_minutes,
    existing: existing ?? [],
  })

  return NextResponse.json({ slots })
}
