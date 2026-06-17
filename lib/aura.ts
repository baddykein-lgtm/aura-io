import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory, supabase } from './supabase'
import { sendWhatsApp } from './whatsapp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Aún no sé nada de este usuario'

  const now = new Date()
  const fechaHoy = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y directa.

FECHA Y HORA ACTUAL: ${fechaHoy}, ${horaActual}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

TIENES 5 CAPACIDADES. Úsalas detectando la intención del usuario:

1. MEMORIA PERMANENTE
Si el usuario comparte datos personales (nombre, profesión, ciudad, gustos, horarios, cumpleaños, etc), guárdalos añadiendo al final:
[MEMORIA: clave | valor]
Ejemplo: [MEMORIA: nombre | Carlos]

2. RECORDATORIOS
Si pide que le recuerdes algo a una hora concreta:
[RECORDATORIO: descripción | YYYY-MM-DD HH:MM]
Ejemplo: [RECORDATORIO: Llamar al médico | ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+10).padStart(2,'0')}]

3. AGENDA
Si menciona una cita, reunión, evento o compromiso con fecha/hora:
[AGENDA: título | YYYY-MM-DD HH:MM | notas opcionales]
Ejemplo: [AGENDA: Reunión con cliente | 2026-06-20 10:00 | Llevar presentación]

4. TAREAS
Si quiere apuntar algo pendiente sin hora exacta, o completar una tarea:
Para añadir: [TAREA: descripción]
Para completar: [TAREA_HECHA: descripción]
Ejemplo añadir: [TAREA: Comprar material de oficina]
Ejemplo completar: [TAREA_HECHA: Comprar material de oficina]

5. CONTACTOS
Si menciona una persona con información relevante (cliente, proveedor, familiar, etc):
[CONTACTO: nombre | información]
Ejemplo: [CONTACTO: María García | Clienta de fisioterapia, alérgica al ibuprofeno]

REGLAS GENERALES:
- Responde de forma natural y cálida, máximo 4 líneas visibles
- Las líneas técnicas [MEMORIA...], [RECORDATORIO...], etc son invisibles para el usuario
- Puedes usar varias capacidades en una misma respuesta
- Si el usuario pregunta "qué tareas tengo", "qué tengo en agenda", "qué sabes de mí", responde usando la memoria y los datos que tienes
- Calcula fechas/horas exactas a partir de la hora actual indicada arriba`
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
      scheduled_at: new Date(fechaHora.replace(' ', 'T') + ':00').toISOString(),
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
      starts_at: new Date(fechaHora.replace(' ', 'T') + ':00').toISOString(),
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