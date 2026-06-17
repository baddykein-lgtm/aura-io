import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state') ?? ''
  const phone = '+' + stateRaw.replace(/^\+?\s*/, '').replace(/\s/g, '')

  console.log('Phone recibido:', JSON.stringify(stateRaw))
  console.log('Phone limpio:', phone)

  if (!code) return new Response('Error: no code', { status: 400 })

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const tokens = await tokenRes.json()
  console.log('Token OK:', !!tokens.access_token)

  if (tokens.access_token) {
    const { data: users } = await supabase
      .from('users')
      .select()
      .eq('phone', phone)

    console.log('Usuarios encontrados:', users?.length, 'para phone:', phone)

    const user = users?.[0]
    if (user) {
      await supabase.from('users').update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token
      }).eq('id', user.id)
      console.log('Token guardado!')
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bienvenida?calendar=conectado`)
}