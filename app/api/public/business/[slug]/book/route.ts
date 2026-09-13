import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { serviceId, startsAt, clientName, clientPhone } = await req.json()

  if (!serviceId || !startsAt || !clientName?.trim()) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: user } = await supabase.from('users').select('id, phone, business_name').eq('business_slug', slug).single()
  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: service } = await supabase
    .from('services')
    .select('id, name, duration_minutes')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .eq('active', true)
    .single()
  if (!service) return NextResponse.json({ error: 'Servicio no válido' }, { status: 400 })

  if (new Date(startsAt) < new Date()) {
    return NextResponse.json({ error: 'Ese horario ya no está disponible' }, { status: 409 })
  }

  const startWindow = new Date(new Date(startsAt).getTime() - service.duration_minutes * 60000).toISOString()
  const endWindow = new Date(new Date(startsAt).getTime() + service.duration_minutes * 60000).toISOString()
  const { data: clashing } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .neq('status', 'cancelada')
    .gt('starts_at', startWindow)
    .lt('starts_at', endWindow)

  if (clashing?.length) {
    return NextResponse.json({ error: 'Justo se acaba de reservar ese horario, elige otro' }, { status: 409 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      client_name: clientName.trim(),
      client_phone: clientPhone || null,
      service_id: service.id,
      service: service.name,
      duration_minutes: service.duration_minutes,
      starts_at: startsAt,
      status: 'confirmada',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Justo se acaba de reservar ese horario, elige otro' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (user.phone) {
    const when = new Date(startsAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' })
    await sendWhatsApp(user.phone, `📅 Nueva reserva: ${clientName.trim()} — ${service.name}\n${when}${clientPhone ? `\nTel: ${clientPhone}` : ''}`)
  }

  return NextResponse.json({ booking })
}
