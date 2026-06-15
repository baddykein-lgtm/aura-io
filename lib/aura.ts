import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory, supabase } from './supabase'
import { sendWhatsApp } from './whatsapp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Sin datos aún'

  const now = new Date()
  const fechaHoy = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return `Eres Aura, asistente personal de WhatsApp.
Hablas siempre en español. Eres cercana y directa.

FECHA Y HORA ACTUAL: ${fechaHoy}, ${horaActual}

LO QUE SABES DEL USUARIO:
${mem}

REGLAS:
- Máximo 4 líneas por mensaje
- Si el usuario te pide que le recuerdes algo a una hora/fecha concreta, SIEMPRE responde EXACTAMENTE en este formato al final de tu mensaje, en una línea separada:
[RECORDATORIO: texto del recordatorio | YYYY-MM-DD HH:MM]
- Calcula la fecha/hora real basándote en la fecha y hora actual de arriba. Si dice "hoy", usa la fecha de hoy. Si dice "mañana", suma un día.
- Si NO es un recordatorio, no incluyas esa línea
- Confirma siempre de forma natural que lo recordarás`
}

export async function respondAura(user: any, text: string) {
  const [memory, history] = await Promise.all([
    getMemory(user.id), getHistory(user.id)
  ])

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 300,
    messages: [
      { role: 'system', content: buildPrompt(memory) },
      ...history,
      { role: 'user', content: text }
    ]
  })

  let reply = completion.choices[0].message.content ?? 'Lo gestiono ahora!'

  // Detectar si Aura quiere crear un recordatorio
  const match = reply.match(/\[RECORDATORIO:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/)
  if (match) {
    const [, recordatorioTexto, fechaHora] = match
    await supabase.from('reminders').insert({
      user_id: user.id,
      text: recordatorioTexto.trim(),
      scheduled_at: new Date(fechaHora.replace(' ', 'T') + ':00').toISOString(),
      sent: false
    })
    // Quitar la línea técnica de la respuesta visible
    reply = reply.replace(match[0], '').trim()
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