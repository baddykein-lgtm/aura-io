import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/calendar'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data } = await supabase.from('agenda').select().eq('user_id', user.id).order('starts_at', { ascending: true })
  return NextResponse.json({ events: data ?? [] })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { title, starts_at, notes } = await req.json()
  if (!title || !starts_at) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data, error } = await supabase
    .from('agenda')
    .insert({ user_id: user.id, title, starts_at, notes: notes ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await createCalendarEvent(user.id, title, starts_at, notes)

  return NextResponse.json({ event: data })
}
