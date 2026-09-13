import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data } = await supabase.from('reviews').select().eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ reviews: data ?? [] })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { client_name, rating, comment } = await req.json()
  const ratingNum = Number(rating)
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'La valoración debe ser de 1 a 5' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ user_id: user.id, client_name: client_name || null, rating: ratingNum, comment: comment || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ review: data })
}
