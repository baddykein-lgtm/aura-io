'use client'
import { useState } from 'react'

const plans = [
  {
    name: 'Personal',
    price: '9,99',
    desc: 'Para profesionales que quieren organizarse mejor',
    color: '#7F77DD',
    features: [
      'Aura disponible 24/7',
      'Memoria permanente',
      'Recordatorios automáticos',
      'Agenda + Google Calendar',
      'Tareas y contactos',
      'Facturas básicas en PDF',
      'Resumen diario',
      '500 mensajes/mes',
    ],
  },
  {
    name: 'Pro',
    price: '19,99',
    desc: 'Para negocios: hoteles, clínicas, restaurantes',
    color: '#A89EFF',
    popular: true,
    features: [
      'Todo lo de Personal',
      'Mensajes ilimitados',
      'Hasta 5 usuarios',
      'Respuesta automática 24/7',
      'Flujos personalizados',
      'Facturas completas con IVA',
      'Panel de administración',
      'Gmail integrado',
      'CRM de clientes',
    ],
  },
  {
    name: 'Premium',
    price: '49,99',
    desc: 'Para negocios que quieren automatización total',
    color: '#C084FC',
    features: [
      'Todo lo de Pro',
      'Hasta 15 usuarios',
      'Flujos ilimitados',
      'Analytics y reportes',
      'Integraciones avanzadas',
      'Aura multiidioma',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Enterprise',
    price: '99,99',
    desc: 'Para grandes empresas y cadenas',
    color: '#E879F9',
    features: [
      'Todo lo de Premium',
      'Usuarios ilimitados',
      'Onboarding personalizado',
      'Integraciones a medida',
      'Account manager dedicado',
      'SLA garantizado',
      'Formación del equipo',
    ],
  },
]

const chatMessages = [
  { from: 'user', text: 'Recuérdame llamar a María mañana a las 10:00' },
  { from: 'aura', text: '¡Anotado! Te recuerdo mañana a las 10:00 💜' },
  { from: 'user', text: 'Hazme una factura a Juan por 150€ de consultoría' },
  { from: 'aura', text: '¡Perfecto! ¿Cuál es el NIF de Juan y su dirección? 🧾' },
  { from: 'user', text: 'Tengo reunión el viernes a las 16:00' },
  { from: 'aura', text: '¡Anotado en tu Google Calendar! 📅' },
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(1)

  const handleSubmit = async (planIndex: number) => {
    if (!email) { alert('Introduce tu email primero'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planIndex }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <main style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F0EFF8', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; }
        ::selection { background: #7F77DD33; }
        .chat-bubble-user {
          background: #7F77DD; color: white;
          padding: 10px 14px; border-radius: 16px 16px 4px 16px;
          max-width: 78%; align-self: flex-end;
          font-size: 13px; line-height: 1.5; word-break: break-word;
        }
        .chat-bubble-aura {
          background: #1A1A2E; color: #F0EFF8;
          padding: 10px 14px; border-radius: 16px 16px 16px 4px;
          max-width: 78%; align-self: flex-start;
          font-size: 13px; line-height: 1.5;
          border: 1px solid #7F77DD33; word-break: break-word;
        }
        .plan-card {
          background: #0F0F1A; border: 2px solid #ffffff11;
          border-radius: 16px; padding: 24px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer; display: flex; flex-direction: column;
        }
        .plan-card:hover { border-color: #7F77DD55; transform: translateY(-2px); }
        .plan-card.selected { border-color: #7F77DD !important; background: #0F0F22; }
        .input-field {
          background: #0F0F1A; border: 1px solid #ffffff22;
          color: #F0EFF8; padding: 13px 18px;
          border-radius: 10px; font-size: 15px; outline: none;
          transition: border-color 0.2s; width: 100%; min-width: 0;
        }
        .input-field:focus { border-color: #7F77DD; }
        .btn-primary {
          background: linear-gradient(135deg, #7F77DD, #C084FC);
          color: white; border: none; padding: 13px 22px;
          border-radius: 10px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s;
          white-space: nowrap; flex-shrink: 0;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .gradient-text {
          background: linear-gradient(135deg, #A89EFF, #E879F9);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .feature-item {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13px; color: #B0AFCC; margin-bottom: 8px; line-height: 1.4;
        }
        .feature-dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* Desktop */
        .hero-inner { display: flex; gap: 60px; align-items: center; padding: 80px 0; }
        .plans-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .caps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .cta-row { display: flex; gap: 12px; }
        .nav-inner { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; }
        .nav-links { display: flex; gap: 24px; font-size: 14px; color: #B0AFCC; }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

        /* Mobile */
        @media (max-width: 768px) {
          .hero-inner { flex-direction: column; gap: 32px; padding: 40px 0; }
          .plans-grid { grid-template-columns: 1fr; }
          .caps-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .steps-grid { grid-template-columns: 1fr; gap: 12px; }
          .cta-row { flex-direction: column; }
          .nav-links { display: none; }
          .nav-btn-text { display: none; }
          .hero-title { font-size: 34px !important; letter-spacing: -1px !important; }
          .footer-inner { flex-direction: column; text-align: center; }
          .section-pad { padding: 40px 0; }
        }
        @media (max-width: 400px) {
          .caps-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #ffffff0A', position: 'sticky', top: 0, background: '#0A0A0Fee', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div className="nav-inner wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.5px' }}>Aura</span>
          </div>
          <div className="nav-links">
            <a href="#como-funciona" style={{ color: 'inherit', textDecoration: 'none' }}>Cómo funciona</a>
            <a href="#planes" style={{ color: 'inherit', textDecoration: 'none' }}>Planes</a>
          </div>
          <a href="#planes" style={{ background: '#7F77DD22', border: '1px solid #7F77DD44', color: '#A89EFF', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <span className="nav-btn-text">Suscribirse</span>
            <span style={{ display: 'none' }} className="nav-btn-short">→</span>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div className="wrap">
        <div className="hero-inner">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-block', background: '#7F77DD18', border: '1px solid #7F77DD33', borderRadius: 100, padding: '5px 14px', fontSize: 12, color: '#A89EFF', marginBottom: 20 }}>
              Asistente personal con IA
            </div>
            <h1 className="hero-title" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 18 }}>
              Tu asistente personal<br />
              <span className="gradient-text">siempre disponible</span>
            </h1>
            <p style={{ fontSize: 16, color: '#8887AA', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Aura gestiona tu agenda, recordatorios, facturas y contactos automáticamente. Habla con ella desde cualquier dispositivo.
            </p>
            <div className="cta-row" style={{ marginBottom: 10 }}>
              <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
                {loading ? 'Cargando...' : 'Suscribirse'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#555570' }}>Pago seguro · Cancela cuando quieras</p>
          </div>

          <div style={{ flex: 1, maxWidth: 360, width: '100%' }}>
            <div style={{ background: '#0F0F1A', border: '1px solid #7F77DD33', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 50px #7F77DD12' }}>
              <div style={{ background: '#12122A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #ffffff0A' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Aura</div>
                  <div style={{ fontSize: 11, color: '#7F77DD' }}>● En línea</div>
                </div>
              </div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-aura'}>{msg.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ borderTop: '1px solid #ffffff08' }}>
        <div className="wrap section-pad" style={{ padding: '64px 20px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10, textAlign: 'center' }}>Cómo funciona</h2>
          <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 15, marginBottom: 40 }}>Tres pasos para tener tu asistente listo</p>
          <div className="steps-grid">
            {[
              { step: '1', title: 'Te suscribes', desc: 'Elige tu plan y crea tu cuenta en menos de 2 minutos.' },
              { step: '2', title: 'Aura te conoce', desc: 'Te hace unas preguntas para entender tu trabajo y prioridades.' },
              { step: '3', title: 'Ella se encarga', desc: 'Desde ese momento, Aura gestiona todo automáticamente.' },
            ].map(item => (
              <div key={item.step} style={{ padding: '24px', background: '#0F0F1A', border: '1px solid #ffffff0A', borderRadius: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#7F77DD18', border: '1px solid #7F77DD33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#A89EFF', marginBottom: 14 }}>{item.step}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ color: '#8887AA', fontSize: 13, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPACIDADES */}
      <section>
        <div className="wrap section-pad" style={{ padding: '48px 20px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10, textAlign: 'center' }}>Todo lo que hace Aura</h2>
          <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 15, marginBottom: 40 }}>Dile lo que necesitas — ella lo hace</p>
          <div className="caps-grid">
            {[
              { emoji: '⏰', title: 'Recordatorios', desc: 'Te avisa exactamente cuando lo necesitas.' },
              { emoji: '📅', title: 'Agenda', desc: 'Crea eventos en Google Calendar automáticamente.' },
              { emoji: '🧾', title: 'Facturas', desc: 'PDFs profesionales con IVA al instante.' },
              { emoji: '🧠', title: 'Memoria', desc: 'Recuerda todo sobre ti y tus clientes.' },
              { emoji: '✅', title: 'Tareas', desc: 'Apunta pendientes y márcalos como hechos.' },
              { emoji: '👥', title: 'Contactos', desc: 'Guarda información de cada persona.' },
            ].map(item => (
              <div key={item.title} style={{ padding: '20px', background: '#0F0F1A', border: '1px solid #ffffff08', borderRadius: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.emoji}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{item.title}</h3>
                <p style={{ color: '#8887AA', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" style={{ borderTop: '1px solid #ffffff08' }}>
        <div className="wrap section-pad" style={{ padding: '64px 20px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10, textAlign: 'center' }}>Elige tu plan</h2>
          <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 15, marginBottom: 40 }}>Cancela cuando quieras</p>
          <div className="plans-grid" style={{ marginBottom: 36 }}>
            {plans.map((plan, i) => (
              <div key={plan.name} className={`plan-card${i === selectedPlan ? ' selected' : ''}`} onClick={() => setSelectedPlan(i)}>
                {plan.popular && (
                  <div style={{ background: 'linear-gradient(135deg, #7F77DD, #C084FC)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, display: 'inline-block', marginBottom: 10, alignSelf: 'flex-start' }}>MÁS POPULAR</div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: plan.color }}>{plan.name}</h3>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>
                  €{plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#8887AA' }}>/mes</span>
                </div>
                <p style={{ fontSize: 12, color: '#8887AA', marginBottom: 16, lineHeight: 1.4 }}>{plan.desc}</p>
                <div style={{ borderTop: '1px solid #ffffff0A', paddingTop: 14, flex: 1 }}>
                  {plan.features.map(f => (
                    <div key={f} className="feature-item">
                      <div className="feature-dot" style={{ background: plan.color }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 16, padding: '11px', fontSize: 14 }}
                  onClick={e => { e.stopPropagation(); handleSubmit(i) }}
                  disabled={loading}
                >
                  {loading && selectedPlan === i ? 'Cargando...' : 'Suscribirse'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
            <div className="cta-row" style={{ marginBottom: 8 }}>
              <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
                {loading ? 'Cargando...' : 'Suscribirse'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#555570' }}>Pago seguro · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #ffffff0A', padding: '24px 20px' }}>
        <div className="wrap">
          <div className="footer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✦</div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Aura</span>
            </div>
            <p style={{ fontSize: 12, color: '#555570' }}>© 2026 Aura. Todos los derechos reservados.</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555570' }}>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}