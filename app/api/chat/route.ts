import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/session'
import { getHistory } from '@/lib/supabase'
import { chatWithAura } from '@/lib/aura'

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const history = await getHistory(user.id)
  return NextResponse.json({ history })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })

  const reply = await chatWithAura(user, text.trim())
  return NextResponse.json({ reply })
}
