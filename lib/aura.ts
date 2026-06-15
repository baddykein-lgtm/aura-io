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

MEMORIA PERMANENTE QUE TIENES DE ESTE USUARIO:
${mem}

CAPACIDAD 1 - MEMORIA PERMANENTE:
Si el usuario comparte información personal relevante (su nombre, profesión, ciudad, gustos, horarios habituales, nombres de familiares/clientes, preferencias, fecha de cumpleaños, etc), DEBES guardarlo.
Añade al final de tu respuesta, en líneas separadas, una línea por cada dato nuevo con este formato EXACTO:
[MEMORIA: clave | valor]

Usa claves simples en minúsculas sin espacios: nombre, profesion, ciudad, cumpleanos, etc.
Ejemplo: si dice "soy Carlos, fisio en Madrid":
[MEMORIA: nombre | Carlos]
[MEMORIA: profesion | fisioterapeuta]
[MEMORIA: ciudad | Madrid]

Si el usuario pregunta "qué sabes de mí" o similar, responde con la información de tu memoria permanente de forma natural y cálida.

CAPACIDAD 2 - RECORDATORIOS:
Si el usuario te pide que le recuerdes algo (usa palabras como "recuérdame", "avísame", "no dejes que olvide"), añade SIEMPRE al final, en una línea nueva, este formato:
[RECORDATORIO:  | ]

Ejemplo: "recuérdame beber agua en 5 minutos" (ahora son las ${horaActual} del ${fechaHoy}):
[RECORDATORIO: Beber agua | ${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()+5).padStart(2,'0')}]

Calcula siempre la fecha/hora real sumando a la hora actual de arriba.

OTRAS REGLAS:
- Máximo 4 líneas de texto visible (sin contar las líneas técnicas [MEMORIA...] y [RECORDATORIO...])
- Las líneas [MEMORIA...] y [RECORDATORIO...] son invisibles para el usuario, solo las usas tú internamente
- Si no hay nada que recordar ni guardar, no incluyas esas líneas`
}

export async function respondAura(user: any, text: string) {
  const [memory, history] = await Promise.all([
    getMemory(user.id), getHistory(user.id)
  ])

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 400,
    messages: [
      { role: 'system', content: buildPrompt(memory) },
      ...history,
      { role: 'user', content: text }
    ]
  })

  let reply = completion.choices[0].message.content ?? 'Lo gestiono ahora!'

  // Detectar y guardar recordatorios
  const reminderMatch = reply.match(/\[RECORDATORIO:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/)
  if (reminderMatch) {
    const [, recordatorioTexto, fechaHora] = reminderMatch
    await supabase.from('reminders').insert({
      user_id: user.id,
      text: recordatorioTexto.trim(),
      scheduled_at: new Date(fechaHora.replace(' ', 'T') + ':00').toISOString(),
      sent: false
    })
    reply = reply.replace(reminderMatch[0], '').trim()
  }

  // Detectar y guardar datos de memoria permanente (pueden ser varios)
  const memoryMatches = [...reply.matchAll(/\[MEMORIA:\s*(.+?)\s*\|\s*(.+?)\]/g)]
  for (const m of memoryMatches) {
    const [, clave, valor] = m
    await saveMemory(user.id, clave.trim().toLowerCase(), valor.trim())
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