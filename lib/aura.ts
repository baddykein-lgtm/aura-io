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

  const onboardingStep = memory['onboarding_step']

  // Si está en onboarding, usar prompt específico
  if (onboardingStep && onboardingStep !== 'completado') {
    return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y cálida.
Estás conociendo a un nuevo usuario. Sigue el onboarding paso a paso.

PASO ACTUAL: ${onboardingStep}
LO QUE YA SABES: ${mem}

INSTRUCCIONES SEGÚN EL PASO:
- Si paso es "nombre": El usuario acaba de decirte su nombre. Salúdale por su nombre, guarda [MEMORIA: nombre | <nombre>] y pregúntale a qué se dedica. Luego pon [ONBOARDING: profesion]
- Si paso es "profesion": Guarda [MEMORIA: profesion | <profesion>] y pregúntale su horario habitual de trabajo. Luego pon [ONBOARDING: horario]
- Si paso es "horario": Guarda [MEMORIA: horario | <horario>] y pregúntale qué es lo más importante que quiere gestionar (agenda, clientes, tareas, recordatorios). Luego pon [ONBOARDING: prioridades]
- Si paso es "prioridades": Guarda [MEMORIA: prioridades | <prioridades>] y dile que ya está todo listo, que desde mañana a las 8:00 recibirá su resumen diario y que puede pedirle lo que necesite. Luego pon [ONBOARDING: completado]

REGLAS:
- Máximo 3 líneas visibles por mensaje
- Las líneas [MEMORIA...] y [ONBOARDING...] son invisibles para el usuario`
  }

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y directa.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

CAPACIDADES:

1. MEMORIA PERMANENTE
Si el usuario comparte datos personales guárdalos:
[MEMORIA: clave | valor]

2. RECORDATORIOS
Si el usuario pide un recordatorio, responde confirmando y añade OBLIGATORIAMENTE:
[RECORDATORIO: descripción | YYYY-MM-DD HH:MM]
La hora debe estar en hora de España.

3. AGENDA
[AGENDA: título | YYYY-MM-DD HH:MM | notas]

4. TAREAS
Añadir: [TAREA: descripción]
Completar: [TAREA_HECHA: descripción]

5. CONTACTOS
[CONTACTO: nombre | información]

REGLAS:
- Máximo 4 líneas visibles
- Las líneas técnicas son invisibles para el usuario
- Para recordatorios la línea [RECORDATORIO...] es OBLIGATORIA`
}

function parseMadridToUTC(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ')
  const [h, m] = hora.split(':').map(Number)
  const date = new Date(`${fecha}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
  date.setHours(date.getHours() - 2)
  return date.toISOString()
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

  // ONBOARDING STEP
  const onboardingMatch = reply.match(/\[ONBOARDING:\s*(.+?)\]/)
  if (onboardingMatch) {
    await saveMemory(user.id, 'onboarding_step', onboardingMatch[1].trim())
    reply = reply.replace(onboardingMatch[0], '').trim()
  }

  // RECORDATORIOS
  const reminderMatch = reply.match(/\[RECORDATORIO:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/)
  if (reminderMatch) {
    const [, texto, fechaHora] = reminderMatch
    await supabase.from('reminders').insert({
      user_id: user.id,
      text: texto.trim(),
      scheduled_at: parseMadridToUTC(fechaHora),
      sent: false
    })
    reply = reply.replace(reminderMatch[0], '').trim()
  } else {
    const esRecordatorio = /recuérdame|recuerda|avísame|avisa|remind/i.test(text)
    if (esRecordatorio) {
      const horaEnRespuesta = reply.match(/a las (\d{1,2}):(\d{2})/)
      if (horaEnRespuesta) {
        const now = new Date()
        const madridNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
        const yyyy = madridNow.getUTCFullYear()
        const mm = String(madridNow.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(madridNow.getUTCDate()).padStart(2, '0')
        const h = horaEnRespuesta[1].padStart(2, '0')
        const m = horaEnRespuesta[2]
        const fechaHora = `${yyyy}-${mm}-${dd} ${h}:${m}`
        await supabase.from('reminders').insert({
          user_id: user.id,
          text: text.replace(/recuérdame|recuerda|avísame/i, '').trim(),
          scheduled_at: parseMadridToUTC(fechaHora),
          sent: false
        })
      }
    }
  }

  // AGENDA
  const agendaMatch = reply.match(/\[AGENDA:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*(?:\|\s*(.+?))?\]/)
  if (agendaMatch) {
    const [, titulo, fechaHora, notas] = agendaMatch
    await supabase.from('agenda').insert({
      user_id: user.id,
      title: titulo.trim(),
      starts_at: parseMadridToUTC(fechaHora),
      notes: notas?.trim() ?? null
    })
    reply = reply.replace(agendaMatch[0], '').trim()
  }

  // TAREAS
  const taskMatches = [...reply.matchAll(/\[TAREA:\s*(.+?)\]/g)]
  for (const m of taskMatches) {
    await supabase.from('tasks').insert({ user_id: user.id, text: m[1].trim(), done: false })
    reply = reply.replace(m[0], '').trim()
  }

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

  // MEMORIA
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
    `¡Hola! 👋 Soy Aura, tu asistente personal de WhatsApp 💜\n\nEstoy aquí para organizarte la vida — agenda, recordatorios, tareas, contactos y mucho más.\n\n¿Cómo te llamas?`
  )
  await saveMemory(user.id, 'onboarding_step', 'nombre')
}