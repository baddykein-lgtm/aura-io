import { supabase } from '@/lib/supabase'
import { respondAura } from '@/lib/aura'
import { NextResponse } from 'next/server'

export function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN)
    return new Response(challenge)
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: Request) {
  const body = await req.json()
  const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!msg) return NextResponse.json({ ok: true })
  const phone = msg.from
  const text = msg.text?.body
  if (!text) return NextResponse.json({ ok: true })
  const { data: user } = await supabase
    .from('users').select().eq('phone', phone).single()
  if (user) await respondAura(user, text)
  return NextResponse.json({ ok: true })
}