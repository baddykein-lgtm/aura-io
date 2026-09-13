import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data } = await supabase.from('bookings').select().eq('user_id', user.id).order('starts_at', { ascending: true })
  return NextResponse.json({ bookings: data ?? [] })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { client_name, client_phone, service, starts_at, status, notes } = await req.json()
  if (!client_name?.trim() || !starts_at) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      client_name: client_name.trim(),
      client_phone: client_phone || null,
      service: service || null,
      starts_at,
      status: status || 'confirmada',
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data })
}
