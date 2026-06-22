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

async function generarYEnviarFactura(userId: string, clientName: string, concept: string, amount: number, phone: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clientName, concept, amount })
    })

    if (!res.ok) return

    const pdfBuffer = Buffer.from(await res.arrayBuffer())
    const fileName = `factura-${userId}-${Date.now()}.pdf`

    const { error } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (error) { console.error('Error subiendo PDF:', error); return }

    const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName)

    await sendWhatsApp(phone, `🧾 Tu factura está lista! Descárgala aquí:\n${publicUrl}`)
  } catch (e) {
    console.error('Error generando factura:', e)
  }
}

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
- Si paso es "horario": pregúntale qué es lo más importante que quiere gestionar.
- Si paso es "prioridades": dile que ya está todo listo y que puede pedirte lo que necesite.

Responde de forma natural y cálida, máximo 3 líneas.`
  }

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana, directa y cálida.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

Responde de forma natural y útil, máximo 4 líneas. Usa la memoria para personalizar tus respuestas.
Si el usuario pide una factura, confirma que la estás generando. Si pregunta qué sabes de él, díselo.`
}

async function extractStructuredData(userText: string, auraReply: string, memory: Record<string, string>) {
  const { fechaHoy, horaActual, yyyy, mm, dd, hh, min } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  const systemPrompt = `Analizas mensajes entre un usuario y su asistente Aura. Extrae datos estructurados en JSON.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}
PASO DE ONBOARDING ACTUAL: ${onboardingStep ?? 'ninguno'}

Devuelve SIEMPRE este JSON exacto:
{
  "memoria": [{"clave": "nombre", "valor": "Carlos"}],
  "recordatorios": [{"texto": "Llamar al médico", "fecha_hora": "YYYY-MM-DD HH:MM"}],
  "agenda": [{"titulo": "Reunión cliente", "fecha_hora": "YYYY-MM-DD HH:MM", "notas": null}],
  "tareas_nuevas": [{"texto": "Comprar material"}],
  "tareas_completadas": [{"texto": "texto tarea existente"}],
  "contactos": [{"nombre": "María García", "info": "Clienta, martes"}],
  "factura": null,
  "siguiente_paso_onboarding": null
}

REGLAS:
- "memoria": datos personales duraderos (nombre, profesión, ciudad, gustos, horarios, cumpleaños). Claves en minúsculas.
- "recordatorios": cuando pide que le recuerden algo. Calcula fecha_hora en HORA DE ESPAÑA sumando desde ahora.
- "agenda": citas/reuniones con fecha y hora. Fecha en hora de España.
- "tareas_nuevas": cosas pendientes sin hora.
- "tareas_completadas": cuando dice que ya hizo algo.
- "contactos": personas con info relevante.
- "factura": Si el usuario pide generar una factura, pon: {"cliente": "nombre del cliente", "concepto": "descripción del servicio", "importe": 50.00}. Si no, pon null.
- "siguiente_paso_onboarding": solo si hay onboarding activo, indica el siguiente paso (nombre/profesion/horario/prioridades/completado). Si no hay onboarding, pon null.
- Arrays vacíos si no aplica. Sé generoso extrayendo memoria.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `MENSAJE DEL USUARIO: "${userText}"\nRESPUESTA DE AURA: "${auraReply}"` }
      ]
    })
    return JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('Error extrayendo datos:', e)
    return {}
  }
}

export async function respondAura(user: any, text: string) {
  const [memory, history] = await Promise.all([
    getMemory(user.id), getHistory(user.id)
  ])

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

  const data = await extractStructuredData(text, reply, memory)

  // Memoria
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

  // Tareas
  for (const t of data.tareas_nuevas ?? []) {
    if (t.texto) await supabase.from('tasks').insert({ user_id: user.id, text: t.texto.trim(), done: false })
  }
  for (const t of data.tareas_completadas ?? []) {
    if (t.texto) await supabase.from('tasks').update({ done: true }).eq('user_id', user.id).ilike('text', `%${t.texto.trim()}%`)
  }

  // Contactos
  for (const c of data.contactos ?? []) {
    if (c.nombre) await supabase.from('contacts').insert({ user_id: user.id, name: c.nombre.trim(), info: c.info ?? '' })
  }

  // Facturas
  if (data.factura && data.factura.cliente && data.factura.concepto && data.factura.importe) {
    await generarYEnviarFactura(user.id, data.factura.cliente, data.factura.concepto, data.factura.importe, user.phone)
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