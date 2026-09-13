import { cookies } from 'next/headers'
import { cache } from 'react'
import { randomBytes } from 'crypto'
import { supabase } from './supabase'

export const SESSION_COOKIE = 'aura_session'
const SESSION_DAYS = 30

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('sessions').insert({ token, user_id: userId, expires_at: expiresAt })
  return token
}

export async function getUserFromToken(token: string | undefined | null) {
  if (!token) return null
  const { data } = await supabase
    .from('sessions')
    .select('expires_at, users(*)')
    .eq('token', token)
    .single()
  if (!data || new Date(data.expires_at) < new Date()) return null
  return (data as any).users ?? null
}

export const requireUser = cache(async () => {
  const store = await cookies()
  return getUserFromToken(store.get(SESSION_COOKIE)?.value)
})

export async function destroySession(token: string | undefined | null) {
  if (token) await supabase.from('sessions').delete().eq('token', token)
}

export function setSessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}
