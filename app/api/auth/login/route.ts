import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/session'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Rellena todos los campos' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash')
    .ilike('email', email)
    .single()

  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  const token = await createSession(user.id)
  const res = NextResponse.json({ success: true })
  res.cookies.set(setSessionCookie(token))
  return res
}
