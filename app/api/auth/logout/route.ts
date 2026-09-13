import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, destroySession } from '@/lib/session'

export async function POST() {
  const store = await cookies()
  await destroySession(store.get(SESSION_COOKIE)?.value)
  const res = NextResponse.json({ success: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
