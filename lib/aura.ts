import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory, supabase } from './supabase'
import { sendWhatsApp } from './whatsapp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Aún no sé nada de este usuario'

  const now = new Date()
  const fechaHoy = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' })
  const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  const madridNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const yyyy = madridNow.getUTCFullYear()
  const mm = String(madridNow.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(madridNow.getUTCDate()).padStart(2, '0')
  const hh = String(madridNow.getUTCHours()).padStart(2, '0')
  const min = String(madridNow.getUTCMinutes()).padStart(2, '0')

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y directa.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

CAPACIDADES:

1. MEMORIA PERMANENTE
Si el usuario comparte datos personales guárdalos:
[MEMORIA: clave | valor]

2. RECORDATORIOS - MUY IMPORTANTE
Si el usuario pide que le recuerdes algo, SIEMPRE debes incluir esta línea al final:
[RECORDATORIO: descripción exacta | YYYY-MM-DD HH:MM]
La fecha/hora DEBE estar en UTC (resta 2 horas a la hora de España).
Si dice "en X minutos", suma X minutos a ${hh}:${min} UTC.
Si dice "a las HH:MM", resta 2 horas a esa hora.
NUNCA omitas esta línea cuando te pidan un recordatorio. Es obligatoria.

Ejemplo — son las ${horaActual} en España (${hh}:${min} UTC):
Usuario: "recuérdame en 5 minutos llamar al médico"
Respuesta: "¡Anotado! Te recuerdo llamar al médico a las ${horaActual} 💜\n[RECORDATORIO: Llamar al médico | ${yyyy}-${mm}-${dd} ${String(parseInt(hh) + Math.floor((parseInt(min) + 5) / 60)).padStart(2,'0')}:${String((parseInt(min) + 5) % 60).padStart(2,'0')}]"

3. AGENDA
[AGENDA: título | YYYY-MM-DD HH:MM | notas]

4. TAREAS
Añadir: [TAREA: descripción]
Completar: [TAREA_HECHA: descripción]

5. CONTACTOS
[CONTACTO: nombre | información]

REGLAS:
- Máximo 4 líneas visibles
- Las líneas técnicas [RECORDATORIO...], [MEMORIA...] etc NO las ve el usuario
- Para recordatorios, la línea [RECORDATORIO...] es OBLIGATORIA siempre`
}

export async function respondAura(user: any, text: string) {
  const [memory, history] = await Promise.all([
    getMemory(user.id), getHistory(user.id)
  ])

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      { role: 'system', content: buildPrompt(memory) },
      ...history,
      { role: 'user', content: text }
    ]
  })

  let reply = completion.choices[0].message.content ?? 'Lo gestiono ahora!'

  // RECORDATORIOS
  const reminderMatch = reply.match(/\[RECORDATORIO:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/)
  if (reminderMatch) {
    const [, texto, fechaHora] = reminderMatch
    await supabase.from('reminders').insert({
      user_id: user.id,
      text: texto.trim(),
      scheduled_at: new Date(fechaHora.replace(' ', 'T') + ':00Z').toISOString(),
      sent: false
    })
    reply = reply.replace(reminderMatch[0], '').trim()
  }

  // AGENDA
  const agendaMatch = reply.match(/\[AGENDA:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*(?:\|\s*(.+?))?\]/)
  if (agendaMatch) {
    const [, titulo, fechaHora, notas] = agendaMatch
    await supabase.from('agenda').insert({
      user_id: user.id,
      title: titulo.trim(),
      starts_at: new Date(fechaHora.replace(' ', 'T') + ':00Z').toISOString(),
      notes: notas?.trim() ?? null
    })
    reply = reply.replace(agendaMatch[0], '').trim()
  }

  // TAREAS NUEVAS
  const taskMatches = [...reply.matchAll(/\[TAREA:\s*(.+?)\]/g)]
  for (const m of taskMatches) {
    await supabase.from('tasks').insert({ user_id: user.id, text: m[1].trim(), done: false })
    reply = reply.replace(m[0], '').trim()
  }

  // TAREAS COMPLETADAS
  const taskDoneMatches = [...reply.matchAll(/\[TAREA_HECHA:\s*(.+?)\]/g)]
  for (const m of taskDoneMatches) {
    await supabase.from('tasks').update({ done: true }).eq('user_id', user.id).ilike('text', `%${m[1].trim()}%`)
    reply = reply.replace(m[0], '').trim()
  }

  // CONTACTOS
  const contactMatches = [...reply.matchAll(/\[CONTACTO:\s*(.+?)\s*\|\s*(.+?)\]/g)]
  for (const m of contactMatches) {
    await supabase.from('contacts').insert({ user_id: user.id, name: m[1].trim(), info: m[2].trim() })
    reply = reply.replace(m[0], '').trim()
  }

  // MEMORIA PERMANENTE
  const memoryMatches = [...reply.matchAll(/\[MEMORIA:\s*(.+?)\s*\|\s*(.+?)\]/g)]
  for (const m of memoryMatches) {
    await saveMemory(user.id, m[1].trim().toLowerCase(), m[2].trim())
    reply = reply.replace(m[0], '').trim()
  }

  await saveMessage(user.id, 'user', text)
  await saveMessage(user.id, 'assistant', reply)
  await sendWhatsApp(user.phone, reply)
}

export async function startOnboarding(user: any) {
  if (!user.phone) return
  await sendWhatsApp(user.phone,
    `Hola! Soy Aura, tu asistente personal 💜\n\n¿Cómo te llamas?`
  )
  await saveMemory(user.id, 'onboarding_step', 'nombre')
}