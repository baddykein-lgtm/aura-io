'use client'
import { useEffect, useState } from 'react'

type Task = { id: string; text: string; done: boolean }

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/tasks').then(r => r.json()).then(d => setTasks(d.tasks ?? [])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!text.trim()) return
    setSaving(true)
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
    setText('')
    setSaving(false)
    load()
  }

  const toggleDone = async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: !task.done }) })
  }

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Tareas</h1>
      <p className="text-[#8887AA] text-sm mb-6">{pending.length} pendientes · {done.length} completadas</p>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 bg-[#0F0F1A] border border-white/20 text-[#F0EFF8] px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#7F77DD]"
          placeholder="Nueva tarea..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#7F77DD] to-[#C084FC] disabled:opacity-50">Añadir</button>
      </div>

      {loading ? (
        <p className="text-sm text-[#555570]">Cargando...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-[#555570]">No tienes tareas todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...pending, ...done].map(t => (
            <div key={t.id} className="bg-[#0F0F1A] border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
              <input type="checkbox" checked={t.done} onChange={() => toggleDone(t)} className="w-4 h-4 accent-[#7F77DD]" />
              <span className={`flex-1 text-sm ${t.done ? 'line-through text-[#555570]' : 'text-[#F0EFF8]'}`}>{t.text}</span>
              <button onClick={() => handleDelete(t.id)} className="text-xs text-[#8887AA] hover:text-[#FF6B6B]">Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
