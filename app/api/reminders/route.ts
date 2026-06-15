import { supabase } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/whatsapp'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('Unauthorized', { status: 401 })

  const now = new Date().toISOString()

  // Buscar recordatorios pendientes que ya tocan
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, users(phone)')
    .eq('sent', false)
    .lte('scheduled_at', now)

  let sent = 0

  for (const r of reminders ?? []) {
    const phone = (r as any).users?.phone
    if (!phone) continue

    await sendWhatsApp(phone, `⏰ Recordatorio: ${r.text}`)
    await supabase.from('reminders').update({ sent: true }).eq('id', r.id)
    sent++
  }

  return NextResponse.json({ sent })
}