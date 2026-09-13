import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/whatsapp'
import { NextResponse } from 'next/server'

// Ventana de tolerancia: cubre el hueco entre dos ejecuciones del cron
// (evita que un booking se cuele entre dos pasadas sin recibir aviso).
const WINDOW_MINUTES = 20

async function sendWindowReminders(offsetHours: number, column: 'reminder_24h_sent' | 'reminder_2h_sent', label: string) {
  const now = Date.now()
  const from = new Date(now + offsetHours * 60 * 60 * 1000).toISOString()
  const to = new Date(now + offsetHours * 60 * 60 * 1000 + WINDOW_MINUTES * 60 * 1000).toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, client_name, client_phone, service, starts_at, user_id, users(business_name)')
    .eq(column, false)
    .neq('status', 'cancelada')
    .not('client_phone', 'is', null)
    .gte('starts_at', from)
    .lt('starts_at', to)

  if (error) {
    console.error(`Error buscando recordatorios (${column}):`, error.message)
    return { sent: 0, error: error.message }
  }

  let sent = 0
  for (const b of bookings ?? []) {
    const businessName = (b as any).users?.business_name || 'tu cita'
    const when = new Date(b.starts_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' })
    await sendWhatsApp(b.client_phone!, `⏰ Recordatorio: tienes cita ${label} con ${businessName}${b.service ? ` (${b.service})` : ''}\n${when}`)
    await supabase.from('bookings').update({ [column]: true }).eq('id', b.id)
    sent++
  }
  return { sent }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('Unauthorized', { status: 401 })

  const [r24h, r2h] = await Promise.all([
    sendWindowReminders(24, 'reminder_24h_sent', 'mañana'),
    sendWindowReminders(2, 'reminder_2h_sent', 'en 2 horas'),
  ])

  return NextResponse.json({ sent24h: r24h.sent, sent2h: r2h.sent, error24h: r24h.error, error2h: r2h.error })
}
