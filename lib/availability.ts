// Igual que parseMadridToUTC en lib/aura.ts: aproxima España como UTC+2 siempre
// (no distingue CET/CEST). Se mantiene la misma convención en todo el proyecto
// a propósito, para que las horas mostradas cuadren entre agenda/reservas.
export function madridToUTC(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  date.setHours(date.getHours() - 2)
  return date
}

type ExistingBooking = { starts_at: string; duration_minutes: number }

export function computeAvailableSlots(opts: {
  dateStr: string
  openTime: string // 'HH:MM:SS' desde Postgres
  closeTime: string
  durationMinutes: number
  existing: ExistingBooking[]
  now?: Date
}): { start: string; end: string }[] {
  const { dateStr, openTime, closeTime, durationMinutes, existing, now = new Date() } = opts

  const open = madridToUTC(dateStr, openTime.slice(0, 5))
  const close = madridToUTC(dateStr, closeTime.slice(0, 5))

  const busy = existing.map(b => {
    const start = new Date(b.starts_at)
    const end = new Date(start.getTime() + b.duration_minutes * 60000)
    return { start, end }
  })

  const slots: { start: string; end: string }[] = []
  const stepMs = durationMinutes * 60000

  for (let t = open.getTime(); t + stepMs <= close.getTime(); t += stepMs) {
    const slotStart = new Date(t)
    const slotEnd = new Date(t + stepMs)
    if (slotStart < now) continue

    const overlaps = busy.some(b => slotStart < b.end && b.start < slotEnd)
    if (!overlaps) slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
  }

  return slots
}
