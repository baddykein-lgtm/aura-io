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
    <main style={{ background: '#0A0A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', color: '#F0EFF8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .input-field {
          background: #0F0F1A; border: 1px solid #ffffff22;
          color: #F0EFF8; padding: 13px 16px;
          border-radius: 10px; font-size: 15px; outline: none;
          transition: border-color 0.2s; width: 100%;
        }
        .input-field:focus { border-color: #7F77DD; }
        .btn {
          background: linear-gradient(135deg, #7F77DD, #C084FC);
          color: white; border: none; padding: 13px;
          border-radius: 10px; font-size: 15px; font-weight: 600;
          cursor: pointer; width: 100%; transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.88; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid #7F77DD33; border-top-color: #7F77DD;
          margin: 0 auto; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 16px' }}>✦</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>¡Bienvenido a Aura!</h1>
          <p style={{ color: '#8887AA', fontSize: 14, marginTop: 6 }}>Tu suscripción está activa</p>
        </div>

        <div style={{ background: '#0F0F1A', border: '1px solid #ffffff11', borderRadius: 16, padding: 28 }}>
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="spinner" />
              <p style={{ color: '#8887AA', fontSize: 13, marginTop: 16 }}>Confirmando tu pago...</p>
            </div>
          )}

          {status === 'error' && (
            <p style={{ color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{error}</p>
          )}

          {status === 'already' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#8887AA', fontSize: 14, marginBottom: 16 }}>Tu cuenta ya está configurada.</p>
              <a href="/login" style={{ color: '#A89EFF', fontSize: 14, textDecoration: 'none' }}>Ir a iniciar sesión →</a>
            </div>
          )}

          {status === 'ready' && (
            <>
              <p style={{ color: '#8887AA', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Crea tu contraseña para acceder al dashboard y confírmanos tu número de WhatsApp para que Aura pueda escribirte.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: '#B0AFCC', display: 'block', marginBottom: 6 }}>Contraseña</label>
                <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: '#B0AFCC', display: 'block', marginBottom: 6 }}>Repite la contraseña</label>
                <input className="input-field" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#B0AFCC', display: 'block', marginBottom: 6 }}>Tu WhatsApp</label>
                <input className="input-field" type="tel" placeholder="+34 600 000 000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              {error && <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button className="btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creando cuenta...' : 'Entrar al dashboard'}
              </button>
            </>
          )}
        </div>

        <div style={{
          background: '#0F0F1A', border: '1px solid #ffffff11', borderRadius: 12,
          padding: '16px 20px', fontSize: 13, color: '#8887AA', lineHeight: 1.6, marginTop: 20,
        }}>
          💬 En cuanto guardes tu número, recibirás un mensaje de Aura en WhatsApp para empezar.{' '}
          <a href="https://wa.me/14155238886" style={{ color: '#A89EFF' }}>Abrir WhatsApp</a>
        </div>
      </div>
    </main>
  )
}
