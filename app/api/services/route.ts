import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data } = await supabase.from('services').select().eq('user_id', user.id).order('created_at', { ascending: true })
  return NextResponse.json({ services: data ?? [] })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, duration_minutes, price } = await req.json()
  if (!name?.trim() || !duration_minutes) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data, error } = await supabase
    .from('services')
    .insert({ user_id: user.id, name: name.trim(), duration_minutes: Number(duration_minutes), price: price ? Number(price) : null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}
