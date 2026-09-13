import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabase.from('business_hours').select().eq('user_id', user.id)
  return NextResponse.json({ hours: data ?? [] })
}

// Recibe siempre la semana completa: [{ weekday, open, start_time, end_time }, ...] (7 entradas)
export async function PUT(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { days } = await req.json()
  if (!Array.isArray(days)) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const openDays = days.filter((d: any) => d.open && d.start_time && d.end_time)
  const closedWeekdays = days.filter((d: any) => !d.open).map((d: any) => d.weekday)

  if (closedWeekdays.length) {
    await supabase.from('business_hours').delete().eq('user_id', user.id).in('weekday', closedWeekdays)
  }

  if (openDays.length) {
    const { error } = await supabase.from('business_hours').upsert(
      openDays.map((d: any) => ({ user_id: user.id, weekday: d.weekday, start_time: d.start_time, end_time: d.end_time })),
      { onConflict: 'user_id,weekday' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = await supabase.from('business_hours').select().eq('user_id', user.id)
  return NextResponse.json({ hours: data ?? [] })
}
