import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const phone = decodeURIComponent(url.searchParams.get('state') ?? '')

  console.log('Calendar callback - phone:', phone)
  console.log('Calendar callback - code:', code ? 'exists' : 'missing')

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
  console.log('Tokens recibidos:', tokens.access_token ? 'OK' : 'ERROR', tokens.error ?? '')

  if (tokens.access_token) {
    // Buscar usuario por teléfono con ilike
    const { data: users } = await supabase
      .from('users')
      .select()
      .ilike('phone', `%${phone.replace('+', '')}%`)

    console.log('Usuarios encontrados:', users?.length)

    const user = users?.[0]
    if (user) {
      await supabase.from('users').update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token
      }).eq('id', user.id)
      console.log('Token guardado para usuario:', user.id)
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/bienvenida?calendar=conectado`)
}