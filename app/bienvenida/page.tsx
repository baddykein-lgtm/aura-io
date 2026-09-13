'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Bienvenida() {
  return (
    <Suspense fallback={null}>
      <BienvenidaForm />
    </Suspense>
  )
}

function BienvenidaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'ready' | 'already' | 'error'>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!sessionId) { setStatus('error'); setError('Falta información del pago'); return }

    let cancelled = false
    let attempts = 0

    const poll = async () => {
      attempts++
      try {
        const res = await fetch(`/api/auth/claim?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (cancelled) return
        if (data.error) { setStatus('error'); setError(data.error); return }
        if (data.ready) { setStatus(data.hasPassword ? 'already' : 'ready'); return }
        if (attempts >= 15) { setStatus('error'); setError('Esto está tardando más de lo normal. Escríbenos si el problema persiste.'); return }
        setTimeout(poll, 2000)
      } catch {
        if (!cancelled) { setStatus('error'); setError('Error de conexión') }
      }
    }
    poll()
    return () => { cancelled = true }
  }, [sessionId])

  const handleSubmit = async () => {
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, password, phone }),
      })
      const data = await res.json()
      if (data.success) router.push('/dashboard')
      else setError(data.error ?? 'No se pudo completar el registro')
    } catch {
      setError('Error de conexión')
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center px-5 py-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-2xl mx-auto mb-6">✦</div>
          <h1 className="text-[28px] font-extrabold tracking-tight mb-2">¡Bienvenido a Aura!</h1>
          <p className="text-muted text-[15px]">Tu suscripción está activa — solo falta un paso</p>
        </div>

        {(status === 'ready' || status === 'already') && (
          <div className="flex items-center gap-2 mb-8 px-1">
            <div className="h-1 flex-1 rounded-full bg-accent" />
            <div className={`h-1 flex-1 rounded-full ${status === 'ready' ? 'bg-white/10' : 'bg-accent'}`} />
          </div>
        )}

        <div className="bg-surface border border-white/10 rounded-2xl p-8 sm:p-10">
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-9 h-9 rounded-full border-[3px] border-accent/20 border-t-accent mx-auto animate-spin" />
              <p className="text-muted text-sm mt-5">Confirmando tu pago...</p>
            </div>
          )}

          {status === 'error' && (
            <p className="text-danger text-sm text-center leading-relaxed">{error}</p>
          )}

          {status === 'already' && (
            <div className="text-center py-2">
              <p className="text-muted text-sm mb-5">Tu cuenta ya está configurada.</p>
              <a href="/login" className="text-accent-3 text-sm hover:underline">Ir a iniciar sesión →</a>
            </div>
          )}

          {status === 'ready' && (
            <>
              <p className="text-muted text-sm leading-relaxed mb-8">
                Crea tu contraseña para acceder al dashboard y confírmanos tu número de WhatsApp para que Aura pueda escribirte.
              </p>

              <div className="mb-8">
                <h2 className="text-xs font-semibold text-faint uppercase tracking-wide mb-4">Tu cuenta</h2>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="text-sm text-muted block mb-2">Contraseña</label>
                    <input
                      className="w-full bg-bg border border-white/15 text-text placeholder:text-faint px-4 py-3.5 rounded-xl text-[15px] outline-none focus:border-accent transition-colors"
                      type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted block mb-2">Repite la contraseña</label>
                    <input
                      className="w-full bg-bg border border-white/15 text-text placeholder:text-faint px-4 py-3.5 rounded-xl text-[15px] outline-none focus:border-accent transition-colors"
                      type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xs font-semibold text-faint uppercase tracking-wide mb-4">Tu WhatsApp</h2>
                <input
                  className="w-full bg-bg border border-white/15 text-text placeholder:text-faint px-4 py-3.5 rounded-xl text-[15px] outline-none focus:border-accent transition-colors"
                  type="tel" placeholder="+34 600 000 000" value={phone} onChange={e => setPhone(e.target.value)}
                />
                <p className="text-faint text-xs mt-2 leading-relaxed">Aura te escribirá aquí en cuanto termines este paso.</p>
              </div>

              {error && <p className="text-danger text-sm mb-6">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-br from-accent to-accent-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creando cuenta...' : 'Entrar al dashboard'}
              </button>
            </>
          )}
        </div>

        <div className="flex items-start gap-3 bg-surface border border-white/10 rounded-2xl px-6 py-5 mt-6">
          <span className="text-lg leading-none mt-0.5">💬</span>
          <p className="text-muted text-sm leading-relaxed">
            En cuanto guardes tu número, recibirás un mensaje de Aura en WhatsApp para empezar.{' '}
            <a href="https://wa.me/14155238886" className="text-accent-3 hover:underline">Abrir WhatsApp</a>
          </p>
        </div>
      </div>
    </main>
  )
}
