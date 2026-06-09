import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory } from './supabase'
import { sendWhatsApp } from './whatsapp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Sin datos aún'
  return `Eres Aura, asistente personal de WhatsApp.
Eres cercana, directa y hablas siempre en español.
Recuerdas todo lo que el usuario te ha contado y actúas por él.

LO QUE SABES DEL USUARIO:
${mem}

REGLAS:
- Responde en español siempre
- Mensajes cortos como WhatsApp real, máximo 4 líneas
- Si mencionan cita o tarea confirma que la recuerdas
- Usa algún emoji ocasional para dar calidez`
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
  const reply = completion.choices[0].message.content ?? 'Lo gestiono ahora!'
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