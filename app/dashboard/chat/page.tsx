'use client'
import { useEffect, useRef, useState } from 'react'

type Message = { role: string; content: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chat')
      .then(r => r.json())
      .then(d => setMessages(d.history ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const value = text.trim()
    if (!value || sending) return
    setText('')
    setMessages(prev => [...prev, { role: 'user', content: value }])
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Lo siento, algo falló.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión, inténtalo de nuevo.' }])
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Chat con Aura</h1>
      <p className="text-[#8887AA] text-sm mb-6">La misma Aura que te escribe por WhatsApp, con tu memoria y tu historial</p>

      <div className="flex-1 bg-[#0F0F1A] border border-white/10 rounded-2xl p-4 overflow-y-auto flex flex-col gap-2">
        {loading && <p className="text-sm text-[#555570]">Cargando conversación...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-[#555570]">Escríbele a Aura para empezar — recordatorios, agenda, tareas, facturas...</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[78%] text-sm leading-relaxed whitespace-pre-wrap px-3.5 py-2.5 rounded-2xl ${
              m.role === 'user'
                ? 'self-end bg-[#7F77DD] text-white rounded-br-[4px]'
                : 'self-start bg-[#1A1A2E] border border-[#7F77DD33] text-[#F0EFF8] rounded-bl-[4px]'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="self-start text-xs text-[#8887AA] px-1">Aura está escribiendo...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 bg-[#0F0F1A] border border-white/20 text-[#F0EFF8] px-4 py-3 rounded-lg text-sm outline-none focus:border-[#7F77DD]"
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-5 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
