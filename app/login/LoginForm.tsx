'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) { setError('Rellena todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error ?? 'Email o contraseña incorrectos')
      }
    } catch (e) {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <main style={{ background: '#0A0A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
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
      `}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 16px' }}>✦</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0EFF8', letterSpacing: '-0.5px' }}>Bienvenido a Aura</h1>
          <p style={{ color: '#8887AA', fontSize: 14, marginTop: 6 }}>Accede a tu asistente personal</p>
        </div>

        <div style={{ background: '#0F0F1A', border: '1px solid #ffffff11', borderRadius: 16, padding: '28px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#B0AFCC', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: '#B0AFCC', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#555570', marginTop: 20 }}>
          ¿No tienes cuenta? <a href="/" style={{ color: '#A89EFF', textDecoration: 'none' }}>Suscríbete aquí</a>
        </p>
      </div>
    </main>
  )
}
