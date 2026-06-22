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

async function generarYEnviarFactura(userId: string, clientName: string, concept: string, amount: number, iva: number, phone: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clientName, concept, amount, iva })
    })
    const data = await res.json()
    if (data.url) {
      await sendWhatsApp(phone, `🧾 Factura ${data.invoiceNumber} lista!\nDescárgala aquí: ${data.url}`)
    }
  } catch (e) {
    console.error('Error generando factura:', e)
  }
}

// Detecta si el mensaje es sobre facturas
function esIntentFactura(text: string): boolean {
  return /factura|invoice|factur/i.test(text)
}

// Detecta si el mensaje es una respuesta de IVA
function extraerIVA(text: string): number | null {
  const match = text.match(/(\d+)\s*%?/)
  if (match) {
    const num = parseInt(match[1])
    if ([0, 4, 10, 21].includes(num)) return num
  }
  if (/exento|sin iva|0%/i.test(text)) return 0
  return null
}

function buildConversationPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .filter(([k]) => k !== 'onboarding_step' && k !== 'factura_pendiente')
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Aún no sé nada de este usuario'

  const { fechaHoy, horaActual } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  if (onboardingStep && onboardingStep !== 'completado') {
    return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y cálida.
Estás conociendo a un nuevo usuario. PASO ACTUAL DEL ONBOARDING: ${onboardingStep}
LO QUE YA SABES: ${mem}

- Si paso es "nombre": salúdale por su nombre y pregúntale a qué se dedica.
- Si paso es "profesion": pregúntale su horario habitual.
- Si paso es "horario": pregúntale qué quiere gestionar.
- Si paso es "prioridades": dile que está listo y puede pedirte lo que necesite.

Responde natural y cálido, máximo 3 líneas.`
  }

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana, directa y cálida.

FECHA Y HORA ACTUAL EN ESPAÑA: ${fechaHoy}, ${horaActual}

MEMORIA PERMANENTE DEL USUARIO:
${mem}

Responde natural y útil, máximo 4 líneas. Usa la memoria para personalizar tus respuestas.`
}

async function extractStructuredData(userText: string, auraReply: string, memory: Record<string, string>) {
  const { fechaHoy, horaActual, yyyy, mm, dd, hh, min } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  const systemPrompt = `Analizas mensajes entre un usuario y su asistente Aura. Extrae datos estructurados en JSON.

FECHA Y HORA EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}
PASO ONBOARDING: ${onboardingStep ?? 'ninguno'}
MEMORIA ACTUAL: ${Object.entries(memory).filter(([k]) => k !== 'factura_pendiente').map(([k,v])=>`${k}:${v}`).join(', ')}

Devuelve SIEMPRE este JSON:
{
  "memoria": [{"clave": "nombre", "valor": "Carlos"}],
  "recordatorios": [{"texto": "texto", "fecha_hora": "YYYY-MM-DD HH:MM"}],
  "agenda": [{"titulo": "titulo", "fecha_hora": "YYYY-MM-DD HH:MM", "notas": null}],
  "tareas_nuevas": [{"texto": "texto"}],
  "tareas_completadas": [{"texto": "texto"}],
  "contactos": [{"nombre": "nombre", "info": "info"}],
  "factura_info": null,
  "siguiente_paso_onboarding": null
}

REGLAS:
- "memoria": datos personales duraderos. Claves en minúsculas. NIF usa "nif". Dirección usa "direccion_fiscal".
- "recordatorios": cuando pide recordar algo. Fecha/hora en HORA ESPAÑA.
- "agenda": citas con fecha y hora en HORA ESPAÑA.
- "tareas_nuevas": pendientes sin hora.
- "tareas_completadas": cuando dice que ya hizo algo.
- "contactos": personas con info relevante.
- "factura_info": si pide factura extrae {"cliente": "nombre", "concepto": "servicio", "importe": 50.00}. Si no, null.
- "siguiente_paso_onboarding": solo si hay onboarding activo. Si no, null.
- Arrays vacíos si no aplica.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `MENSAJE: "${userText}"\nRESPUESTA AURA: "${auraReply}"` }
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

  // ── FLUJO ESPECIAL: FACTURAS ─────────────────────────
  const facturaPendiente = memory['factura_pendiente']

  // Si hay factura pendiente esperando IVA
  if (facturaPendiente) {
    const fp = JSON.parse(facturaPendiente)
    const iva = extraerIVA(text)

    if (iva !== null) {
      await sendWhatsApp(user.phone, '🧾 Generando tu factura...')
      await generarYEnviarFactura(user.id, fp.cliente, fp.concepto, fp.importe, iva, user.phone)
      await supabase.from('memories').delete().eq('user_id', user.id).eq('key', 'factura_pendiente')
      await saveMessage(user.id, 'user', text)
      await saveMessage(user.id, 'assistant', `Factura generada con IVA ${iva}%`)
      return
    }
  }

  // Si pide una factura nueva
  if (esIntentFactura(text)) {
    // Extraer datos de la factura del mensaje
    const extraccion = await extractStructuredData(text, '', memory)
    const fi = extraccion.factura_info

    if (fi && fi.cliente && fi.concepto && fi.importe) {
      if (!memory['nif']) {
        // Pedir NIF primero — guardar factura pendiente
        await saveMemory(user.id, 'factura_pendiente', JSON.stringify({ ...fi, iva: null, esperando: 'nif' }))
        const msg = `¡Perfecto! Para generar la factura a ${fi.cliente} necesito tu NIF/CIF y dirección fiscal 📋`
        await sendWhatsApp(user.phone, msg)
        await saveMessage(user.id, 'user', text)
        await saveMessage(user.id, 'assistant', msg)
        return
      }

      // Tiene NIF — pedir IVA
      await saveMemory(user.id, 'factura_pendiente', JSON.stringify({ ...fi, iva: null }))
      const msg = `¡Perfecto! Factura a ${fi.cliente} por ${fi.importe}€ de "${fi.concepto}" 🧾\n¿Qué IVA aplico? 21%, 10%, 4% o exento (0%)`
      await sendWhatsApp(user.phone, msg)
      await saveMessage(user.id, 'user', text)
      await saveMessage(user.id, 'assistant', msg)
      return
    }
  }

  // ── FLUJO NORMAL ─────────────────────────────────────
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

  // Si dio NIF y hay factura pendiente esperando
  if (data.memoria?.some((m: any) => m.clave === 'nif') && facturaPendiente) {
    const fp = JSON.parse(facturaPendiente)
    const msg = `Perfecto, NIF guardado ✅\n¿Qué IVA aplico para la factura a ${fp.cliente}? 21%, 10%, 4% o exento (0%)`
    await sendWhatsApp(user.phone, msg)
    await saveMessage(user.id, 'user', text)
    await saveMessage(user.id, 'assistant', msg)
    return
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