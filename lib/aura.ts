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

async function generarYEnviarFactura(userId: string, fp: any, phone: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        clientName: fp.cliente,
        clientNif: fp.cliente_nif ?? '',
        clientAddress: fp.cliente_direccion ?? '',
        clientPostal: fp.cliente_postal ?? '',
        concept: fp.concepto,
        amount: fp.importe,
        iva: fp.iva
      })
    })
    const data = await res.json()
    if (data.url) {
      await sendWhatsApp(phone, `🧾 Factura ${data.invoiceNumber} lista!\nDescárgala aquí: ${data.url}`)
    }
  } catch (e) {
    console.error('Error generando factura:', e)
  }
}

function esIntentFactura(text: string): boolean {
  return /factura|invoice/i.test(text)
}

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

CAPACIDADES QUE TIENES (TODAS FUNCIONAN AL 100% — NUNCA DIGAS QUE NO PUEDES):
- RECORDATORIOS AUTOMÁTICOS: cuando piden "recuérdame X a las Y" o "avísame en X minutos", confirma con "¡Anotado! Te recuerdo a las HH:MM 💜". El sistema lo enviará automáticamente.
- AGENDA Y GOOGLE CALENDAR: cuando dicen "tengo una reunión/cita el X a las Y", responde "¡Anotado en tu calendario! 📅". El evento se crea automáticamente en Google Calendar. NUNCA digas que no tienes acceso a Google Calendar.
- TAREAS: apuntar pendientes y marcarlos como hechos.
- CONTACTOS: guardar datos de personas importantes.
- FACTURAS: generar PDFs profesionales con IVA y datos completos.

REGLA MÁS IMPORTANTE: NUNCA digas que no puedes hacer algo de la lista de arriba. Siempre confirma que lo estás haciendo.

Responde siempre positivo y confirmando lo que haces. Máximo 4 líneas.`
}

async function extractStructuredData(userText: string, auraReply: string, memory: Record<string, string>) {
  const { fechaHoy, horaActual, yyyy, mm, dd, hh, min } = getMadridTimeInfo()
  const onboardingStep = memory['onboarding_step']

  const systemPrompt = `Analizas mensajes entre un usuario y su asistente Aura. Extrae datos estructurados en JSON.

FECHA Y HORA EN ESPAÑA: ${fechaHoy}, ${horaActual}
HORA ISO MADRID: ${yyyy}-${mm}-${dd}T${hh}:${min}
PASO ONBOARDING: ${onboardingStep ?? 'ninguno'}
FACTURA PENDIENTE: ${memory['factura_pendiente'] ?? 'ninguna'}
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
  "datos_cliente_factura": null,
  "siguiente_paso_onboarding": null
}

REGLAS:
- "memoria": datos personales duraderos. Claves en minúsculas. NIF usa "nif". Dirección usa "direccion_fiscal".
- "recordatorios": SIEMPRE que pida ser recordado. Fecha/hora en HORA ESPAÑA.
- "agenda": citas/reuniones con fecha y hora. "mañana" = día siguiente. "el lunes/martes/..." = próximo día de esa semana. Fecha en HORA ESPAÑA.
- "tareas_nuevas": pendientes sin hora.
- "tareas_completadas": cuando dice que ya hizo algo.
- "contactos": personas con info relevante.
- "factura_info": si pide factura, {"cliente": "nombre", "concepto": "servicio", "importe": 50.00}. Si no, null.
- "datos_cliente_factura": si hay factura pendiente y el usuario da NIF/dirección/postal del cliente, {"nif": "...", "direccion": "...", "postal": "..."}. Si no, null.
- "siguiente_paso_onboarding": solo si hay onboarding activo. Si no, null.
- Arrays vacíos si no aplica. Sé muy generoso extrayendo agenda y recordatorios.`

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

  const facturaPendiente = memory['factura_pendiente']

  // ── FLUJO FACTURAS: respuesta datos cliente ──────────
  if (facturaPendiente) {
    const fp = JSON.parse(facturaPendiente)

    if (fp.esperando === 'datos_cliente') {
      const data = await extractStructuredData(text, '', memory)
      const dc = data.datos_cliente_factura
      if (dc) {
        fp.cliente_nif = dc.nif ?? ''
        fp.cliente_direccion = dc.direccion ?? ''
        fp.cliente_postal = dc.postal ?? ''
        fp.esperando = 'iva'
        await saveMemory(user.id, 'factura_pendiente', JSON.stringify(fp))
        const msg = `Perfecto, datos guardados ✅\n¿Qué IVA aplico? 21%, 10%, 4% o exento (0%)`
        await sendWhatsApp(user.phone, msg)
        await saveMessage(user.id, 'user', text)
        await saveMessage(user.id, 'assistant', msg)
        return
      }
    }

    if (fp.esperando === 'iva') {
      const iva = extraerIVA(text)
      if (iva !== null) {
        fp.iva = iva
        await sendWhatsApp(user.phone, '🧾 Generando tu factura...')
        await generarYEnviarFactura(user.id, fp, user.phone)
        await supabase.from('memories').delete().eq('user_id', user.id).eq('key', 'factura_pendiente')
        await saveMessage(user.id, 'user', text)
        await saveMessage(user.id, 'assistant', `Factura generada con IVA ${iva}%`)
        return
      }
    }

    const iva = extraerIVA(text)
    if (iva !== null && !fp.esperando) {
      fp.iva = iva
      await sendWhatsApp(user.phone, '🧾 Generando tu factura...')
      await generarYEnviarFactura(user.id, fp, user.phone)
      await supabase.from('memories').delete().eq('user_id', user.id).eq('key', 'factura_pendiente')
      await saveMessage(user.id, 'user', text)
      await saveMessage(user.id, 'assistant', `Factura generada con IVA ${iva}%`)
      return
    }
  }

  // ── FLUJO FACTURAS: nueva petición ──────────────────
  if (esIntentFactura(text)) {
    const extraccion = await extractStructuredData(text, '', memory)
    const fi = extraccion.factura_info

    if (fi && fi.cliente && fi.concepto && fi.importe) {
      if (!memory['nif']) {
        await saveMemory(user.id, 'factura_pendiente', JSON.stringify({ ...fi, iva: null, esperando: 'nif_emisor' }))
        const msg = `¡Perfecto! Para generar la factura necesito primero tu NIF/CIF y dirección fiscal 📋`
        await sendWhatsApp(user.phone, msg)
        await saveMessage(user.id, 'user', text)
        await saveMessage(user.id, 'assistant', msg)
        return
      }

      await saveMemory(user.id, 'factura_pendiente', JSON.stringify({ ...fi, iva: null, esperando: 'datos_cliente' }))
      const msg = `¡Perfecto! Factura a ${fi.cliente} por ${fi.importe}€ 🧾\n¿Cuál es el NIF/DNI de ${fi.cliente}, su dirección y código postal?`
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

  // Si dio NIF emisor y hay factura pendiente
  if (data.memoria?.some((m: any) => m.clave === 'nif') && facturaPendiente) {
    const fp = JSON.parse(facturaPendiente)
    if (fp.esperando === 'nif_emisor') {
      fp.esperando = 'datos_cliente'
      await saveMemory(user.id, 'factura_pendiente', JSON.stringify(fp))
      const msg = `NIF guardado ✅\n¿Cuál es el NIF/DNI de ${fp.cliente}, su dirección y código postal?`
      await sendWhatsApp(user.phone, msg)
      await saveMessage(user.id, 'user', text)
      await saveMessage(user.id, 'assistant', msg)
      return
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