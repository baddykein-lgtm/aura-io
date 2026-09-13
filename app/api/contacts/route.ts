import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data } = await supabase.from('contacts').select().eq('user_id', user.id).order('name', { ascending: true })
  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, info } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })

  const { data, error } = await supabase
    .from('contacts')
    .insert({ user_id: user.id, name: name.trim(), info: info ?? '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}
