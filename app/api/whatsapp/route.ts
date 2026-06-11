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

  await sendWhatsApp(phone, `Recibí tu mensaje: "${body}" — Aura 💜`)

  return NextResponse.json({ ok: true })
}