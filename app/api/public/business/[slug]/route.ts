import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: user } = await supabase
    .from('users')
    .select('id, business_name, business_bio, business_slug')
    .eq('business_slug', slug)
    .single()

  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  const { data: hours } = await supabase.from('business_hours').select('weekday').eq('user_id', user.id)

  const ready = (services?.length ?? 0) > 0 && (hours?.length ?? 0) > 0

  return NextResponse.json({
    business: { name: user.business_name || 'Reservas', bio: user.business_bio || null },
    services: services ?? [],
    ready,
  })
}
