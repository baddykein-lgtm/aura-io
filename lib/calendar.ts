import { supabase } from './supabase'

export async function createCalendarEvent(
  userId: string,
  title: string,
  startsAt: string,
  notes?: string
) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token')
      .eq('id', userId)
      .single()

    if (!user?.google_access_token) {
      console.log('Calendar: no hay access token para usuario', userId)
      return null
    }

    const event = {
      summary: title,
      description: notes ?? '',
      start: { dateTime: startsAt, timeZone: 'Europe/Madrid' },
      end: { dateTime: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'Europe/Madrid' }
    }

    console.log('Calendar: creando evento', title, startsAt)

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.google_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    console.log('Calendar: respuesta Google status', res.status)

    if (res.status === 401) {
      console.log('Calendar: token expirado, refrescando...')
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: user.google_refresh_token!,
          grant_type: 'refresh_token'
        })
      })
      const newTokens = await refreshRes.json()
      console.log('Calendar: nuevo token obtenido', !!newTokens.access_token)
      
      await supabase.from('users').update({ google_access_token: newTokens.access_token }).eq('id', userId)

      const retryRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${newTokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
      const retryData = await retryRes.json()
      console.log('Calendar: retry resultado', retryData.id ?? retryData.error)
      return retryData
    }

    const data = await res.json()
    console.log('Calendar: resultado', data.id ?? data.error)
    return data
  } catch (e) {
    console.error('Error Google Calendar:', e)
    return null
  }
}