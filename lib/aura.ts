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

  return `Eres Aura, asistente personal de WhatsApp. Hablas en español, eres cercana y directa.

FECHA Y HORA ACTUAL: ${fechaHoy}, ${horaActual}

LO QUE SABES DEL USUARIO:
${mem}

CAPACIDAD ESPECIAL - RECORDATORIOS:
Si el usuario te pide que le recuerdes algo (usa palabras como "recuérdame", "avísame", "no dejes que olvide"), DEBES:
1. Responder confirmando de forma natural y cálida
2. Añadir SIEMPRE al final, en una línea nueva, exactamente este formato:
[RECORDATORIO: <descripción corta> | <YYYY-MM-DD HH:MM>]

Ejemplo de petición: "recuérdame beber agua en 5 minutos" (asumiendo ahora son las ${horaActual} del ${fechaHoy})
Ejemplo de respuesta correcta:
Vale! Te recuerdo beber agua en 5 minutitos 💜
[RECORDATORIO: Beber agua | ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+5).padStart(2,'0')}]

Calcula siempre la fecha/hora exacta sumando a la hora actual indicada arriba. "en 5 minutos" = hora actual + 5 min. "mañana a las 9" = fecha de mañana a las 09:00.

OTRAS REGLAS:
- Máximo 4 líneas de texto visible (sin contar la línea de RECORDATORIO)
- Si NO te piden recordar nada, no incluyas la línea [RECORDATORIO...]`
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

  const match = reply.match(/\[RECORDATORIO:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/)
  if (match) {
    const [, recordatorioTexto, fechaHora] = match
    await supabase.from('reminders').insert({
      user_id: user.id,
      text: recordatorioTexto.trim(),
      scheduled_at: new Date(fechaHora.replace(' ', 'T') + ':00').toISOString(),
      sent: false
    })
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