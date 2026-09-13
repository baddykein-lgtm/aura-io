import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabase
    .from('bookings')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  await supabase.from('bookings').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
