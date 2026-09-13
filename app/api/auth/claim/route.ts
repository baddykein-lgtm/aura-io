import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/session'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-05-27.dahlia' })
}

async function findUserBySessionId(sessionId: string) {
  const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId)
  const customerId = checkoutSession.customer as string | null
  if (!customerId) return null
  const { data: user } = await supabase.from('users').select().eq('stripe_id', customerId).single()
  return user
}

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Falta session_id' }, { status: 400 })

  try {
    const user = await findUserBySessionId(sessionId)
    if (!user) return NextResponse.json({ ready: false })
    return NextResponse.json({ ready: true, email: user.email, hasPassword: !!user.password_hash })
  } catch {
    return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  const { session_id, password, phone } = await req.json()

  if (!session_id || !password || password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  let user
  try {
    user = await findUserBySessionId(session_id)
  } catch {
    return NextResponse.json({ error: 'session_id inválido' }, { status: 400 })
  }
  if (!user) return NextResponse.json({ error: 'Todavía estamos procesando tu pago, espera unos segundos' }, { status: 404 })

  const password_hash = await bcrypt.hash(password, 10)
  await supabase.from('users').update({ password_hash, phone: phone || null }).eq('id', user.id)

  const token = await createSession(user.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set(setSessionCookie(token))
  return res
}
