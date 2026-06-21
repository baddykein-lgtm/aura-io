import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory, supabase } from './supabase'
import { sendWhatsApp } from './whatsapp'
import { createCalendarEvent } from './calendar'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function getMadridTimeInfo() {
  const now = new Date()
  const fechaHoy = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' })
  const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  const madridNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const yyyy = madridNow.getUTCFullYear()
  const mm = String(madridNow.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(madridNow.getUTCDate()).padStart(2, '0')
  const hh = String(madridNow.getUTCHours()).padStart(2, '0')
  const min = String(madridNow.getUTCMinutes()).padStart(2, '0')
  return { fechaHoy, horaActual, yyyy, mm, dd, hh, min }
}

function parseMadridToUTC(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ')
  const [h, m] = hora.split(':').map(Number)
  const date = new Date(`${fecha}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`)
  date.setHours(date.getHours() - 2)
  return date.toISOString()
}

// ── CONVERSACIÓN NATURAL ──────────────────────────────
function buildConversationPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .filter(([k]) => k !== 'onboarding_step')
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Aún no sé nada de este usuario'

  const { fechaHoy, horaActual } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  if (onboardingStep && onboardingStep !== 'completado') {
    return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y cálida.
Estás conociendo a un nuevo usuario. PASO ACTUAL DEL ONBOARDING: ${onboardingStep}
LO QUE YA SABES: ${mem}

- Si paso es "nombre": el usuario te acaba de decir su nombre. Salúdale y pregúntale a qué se dedica.
- Si paso es "profesion": pregúntale su horario habitual de trabajo.
- Si paso es "horario": pregúntale qué es lo más importante que quiere gestionar (agenda, clientes, tareas, recordatorios).
- Si paso es "prioridades": dile que ya está todo listo y que puede pedirte lo que necesite.

Responde de forma natural y cálida, máximo 3 líneas. NO uses corchetes ni formato técnico, solo conversa.`
  }

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana, directa y cálida.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

Responde de forma natural y útil, máximo 4 líneas. Usa la memoria para personalizar tus respuestas.
Si el usuario pregunta qué sabes de él, díselo basándote en la memoria de arriba.
NO uses corchetes ni formato técnico — solo conversa de forma natural y cálida.`
}

// ── EXTRACCIÓN ESTRUCTURADA (JSON mode, fiable) ──────
async function extractStructuredData(userText: string, auraReply: string, memory: Record<string, string>) {
  const { fechaHoy, horaActual, yyyy, mm, dd, hh, min } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  const systemPrompt = `Analizas un mensaje de WhatsApp entre un usuario y su asistente Aura. Tu única tarea es extraer datos estructurados que deben guardarse, en JSON.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}
PASO DE ONBOARDING ACTUAL: ${onboardingStep ?? 'ninguno'}

Devuelve SIEMPRE un JSON con esta forma exacta (usa arrays vacíos si no aplica):
{
  "memoria": [{"clave": "nombre", "valor": "Carlos"}],
  "recordatorios": [{"texto": "Llamar al médico", "fecha_hora": "YYYY-MM-DD HH:MM"}],
  "agenda": [{"titulo": "Reunión cliente", "fecha_hora": "YYYY-MM-DD HH:MM", "notas": "opcional o null"}],
  "tareas_nuevas": [{"texto": "Comprar material"}],
  "tareas_completadas": [{"texto": "texto que coincida con una tarea existente"}],
  "contactos": [{"nombre": "María García", "info": "Clienta, alergia ibuprofeno"}],
  "siguiente_paso_onboarding": "nombre|profesion|horario|prioridades|completado|null"
}

REGLAS DE EXTRACCIÓN:
- "memoria": cualquier dato personal duradero que el usuario comparta (nombre, profesión, ciudad, gustos, horarios habituales, cumpleaños, alergias propias, etc). Claves en minúsculas sin espacios.
- "recordatorios": SIEMPRE que el usuario pida que le recuerden algo a una hora/fecha. Calcula fecha_hora en HORA DE ESPAÑA (no UTC) sumando/restando desde la hora actual de arriba. Si dice "en X minutos/horas", suma a la hora actual. Si dice "mañana a las X", usa el día siguiente.
- "agenda": citas, reuniones o eventos con fecha/hora específica.
- "tareas_nuevas": cosas pendientes SIN hora específica ("apúntame que...", "tengo que...").
- "tareas_completadas": cuando el usuario dice que ya hizo algo que estaba pendiente.
- "contactos": personas mencionadas con información relevante de seguir (clientes, proveedores, etc).
- "siguiente_paso_onboarding": SOLO rellena esto si PASO DE ONBOARDING ACTUAL no es null. Indica a qué paso pasar después de esta respuesta del usuario, basándote en lo que Aura ya respondió.
- Si no hay nada que extraer en una categoría, deja el array vacío.
- Sé generoso extrayendo memoria — cualquier dato personal compartido cuenta, no solo si lo pide explícitamente.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `MENSAJE DEL USUARIO: "${userText}"\n\nRESPUESTA DE AURA: "${auraReply}"` }
      ]
    })
    return JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('Error extrayendo datos estructurados:', e)
    return {}
  }
}

export async function respondAura(user: any, text: string) {
  const [memory, history] = await Promise.all([
    getMemory(user.id), getHistory(user.id)
  ])

  // 1. Respuesta conversacional natural
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 300,
    messages: [
      { role: 'system', content: buildConversationPrompt(memory) },
      ...history,
      { role: 'user', content: text }
    ]
  })

  const reply = completion.choices[0].message.content ?? 'Lo gestiono ahora!'

  // 2. Extracción estructurada fiable (JSON mode)
  const data = await extractStructuredData(text, reply, memory)

  // Guardar memoria
  for (const item of data.memoria ?? []) {
    if (item.clave && item.valor) {
      await saveMemory(user.id, String(item.clave).toLowerCase().trim(), String(item.valor).trim())
    }
  }

  // Onboarding
  if (data.siguiente_paso_onboarding && data.siguiente_paso_onboarding !== 'null') {
    await saveMemory(user.id, 'onboarding_step', data.siguiente_paso_onboarding)
  }

  // Recordatorios
  for (const r of data.recordatorios ?? []) {
    if (r.texto && r.fecha_hora) {
      await supabase.from('reminders').insert({
        user_id: user.id,
        text: r.texto.trim(),
        scheduled_at: parseMadridToUTC(r.fecha_hora),
        sent: false
      })
    }
  }

  // Agenda + Google Calendar
  for (const a of data.agenda ?? []) {
    if (a.titulo && a.fecha_hora) {
      const utcTime = parseMadridToUTC(a.fecha_hora)
      await supabase.from('agenda').insert({
        user_id: user.id,
        title: a.titulo.trim(),
        starts_at: utcTime,
        notes: a.notas ?? null
      })
      await createCalendarEvent(user.id, a.titulo.trim(), utcTime, a.notas)
    }
  }

  // Tareas nuevas
  for (const t of data.tareas_nuevas ?? []) {
    if (t.texto) {
      await supabase.from('tasks').insert({ user_id: user.id, text: t.texto.trim(), done: false })
    }
  }

  // Tareas completadas
  for (const t of data.tareas_completadas ?? []) {
    if (t.texto) {
      await supabase.from('tasks').update({ done: true }).eq('user_id', user.id).ilike('text', `%${t.texto.trim()}%`)
    }
  }

  // Contactos
  for (const c of data.contactos ?? []) {
    if (c.nombre) {
      await supabase.from('contacts').insert({ user_id: user.id, name: c.nombre.trim(), info: c.info ?? '' })
    }
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