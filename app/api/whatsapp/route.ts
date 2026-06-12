import { supabase } from '@/lib/supabase'
import { respondAura } from '@/lib/aura'
import { sendWhatsApp } from '@/lib/whatsapp'
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
  const text = await req.text()
  const params = new URLSearchParams(text)
  const fromRaw = params.get('From') ?? ''
  const phone = fromRaw.replace('whatsapp:', '')
  const body = params.get('Body') ?? ''

  if (!phone || !body) return NextResponse.json({ ok: true })

  const { data: user } = await supabase
    .from('users').select().eq('phone', phone).single()

  if (user) {
    await respondAura(user, body)
  } else {
    await sendWhatsApp(phone, 'Hola! Soy Aura 💜 Para acceder regístrate en: aura-io-2rgt.vercel.app')
  }

  return NextResponse.json({ ok: true })
}