import OpenAI from 'openai'
import { getMemory, getHistory, saveMessage, saveMemory } from './supabase'
import { sendWhatsApp } from './whatsapp'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildPrompt(memory: Record<string, string>) {
  const mem = Object.entries(memory)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'Sin datos aún'
  return `Eres Aura, asistente personal de WhatsApp.
Hablas siempre en español. Eres cercana y directa.
Recuerdas todo lo que el usuario te cuenta.

LO QUE SABES:
${mem}

REGLAS:
- Máximo 4 líneas por mensaje
- Confirma siempre cuando recuerdas algo`
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