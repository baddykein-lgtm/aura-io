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
      'Buenos días diarios',
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
    if (!email) {
      alert('Introduce tu email primero')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planIndex }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <main style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F0EFF8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #7F77DD33; }

        .chat-bubble-user {
          background: #7F77DD;
          color: white;
          padding: 10px 16px;
          border-radius: 18px 18px 4px 18px;
          max-width: 80%;
          align-self: flex-end;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        .chat-bubble-aura {
          background: #1A1A2E;
          color: #F0EFF8;
          padding: 10px 16px;
          border-radius: 18px 18px 18px 4px;
          max-width: 80%;
          align-self: flex-start;
          font-size: 14px;
          line-height: 1.5;
          border: 1px solid #7F77DD33;
          word-break: break-word;
        }
        .plan-card {
          background: #0F0F1A;
          border: 2px solid #ffffff11;
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .plan-card:hover { border-color: #7F77DD66; transform: translateY(-2px); }
        .plan-card.selected { border-color: #7F77DD !important; background: #0F0F22; }
        .plan-card.popular { border-color: #7F77DD55; }
        .input-field {
          background: #0F0F1A;
          border: 1px solid #ffffff22;
          color: #F0EFF8;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          min-width: 0;
        }
        .input-field:focus { border-color: #7F77DD; }
        .btn-primary {
          background: linear-gradient(135deg, #7F77DD, #C084FC);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .gradient-text {
          background: linear-gradient(135deg, #A89EFF, #E879F9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #B0AFCC;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .feature-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
        .hero-grid { display: flex; gap: 60px; align-items: center; }
        .plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .caps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .cta-row { display: flex; gap: 12px; }
        .nav-links { display: flex; gap: 28px; }

        @media (max-width: 900px) {
          .hero-grid { flex-direction: column; gap: 40px; }
          .plans-grid { grid-template-columns: repeat(2, 1fr); }
          .caps-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: 1fr; gap: 16px; }
          .nav-links { display: none; }
        }
        @media (max-width: 600px) {
          .plans-grid { grid-template-columns: 1fr; }
          .caps-grid { grid-template-columns: 1fr; }
          .cta-row { flex-direction: column; }
          .section { padding: 48px 16px; }
          .hero-title { font-size: 36px !important; letter-spacing: -1px !important; }
          .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #ffffff0A', position: 'sticky', top: 0, background: '#0A0A0Fee', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.5px' }}>Aura</span>
        </div>
        <div className="nav-links" style={{ fontSize: 14, color: '#B0AFCC' }}>
          <a href="#como-funciona" style={{ color: 'inherit', textDecoration: 'none' }}>Cómo funciona</a>
          <a href="#planes" style={{ color: 'inherit', textDecoration: 'none' }}>Planes</a>
        </div>
        <a href="#planes" style={{ background: '#7F77DD22', border: '1px solid #7F77DD44', color: '#A89EFF', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Empezar gratis</a>
      </nav>

      {/* HERO */}
      <section className="section">
        <div className="hero-grid">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-block', background: '#7F77DD18', border: '1px solid #7F77DD33', borderRadius: 100, padding: '5px 14px', fontSize: 13, color: '#A89EFF', marginBottom: 24 }}>
              Asistente personal con IA
            </div>
            <h1 className="hero-title" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 20 }}>
              Tu asistente personal<br />
              <span className="gradient-text">siempre disponible</span>
            </h1>
            <p style={{ fontSize: 17, color: '#8887AA', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              Aura gestiona tu agenda, recordatorios, facturas y contactos automáticamente. Habla con ella desde cualquier dispositivo.
            </p>
            <div className="cta-row" style={{ marginBottom: 12 }}>
              <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
                {loading ? 'Cargando...' : 'Probar 14 días gratis'}
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#555570' }}>Sin tarjeta de crédito · Cancela cuando quieras</p>
          </div>

          {/* CHAT DEMO */}
          <div style={{ flex: 1, maxWidth: 380, width: '100%' }}>
            <div style={{ background: '#0F0F1A', border: '1px solid #7F77DD33', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 60px #7F77DD15' }}>
              <div style={{ background: '#12122A', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #ffffff0A' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✦</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Aura</div>
                  <div style={{ fontSize: 11, color: '#7F77DD' }}>● En línea</div>
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-aura'}>
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, textAlign: 'center' }}>Cómo funciona</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 16, marginBottom: 48 }}>Tres pasos para tener tu asistente listo</p>
        <div className="steps-grid">
          {[
            { step: '1', title: 'Te suscribes', desc: 'Elige tu plan y crea tu cuenta en menos de 2 minutos.' },
            { step: '2', title: 'Aura te conoce', desc: 'Te hace unas preguntas para entender tu trabajo y prioridades.' },
            { step: '3', title: 'Ella se encarga', desc: 'Desde ese momento, Aura gestiona tu vida automáticamente.' },
          ].map((item) => (
            <div key={item.step} style={{ padding: '28px', background: '#0F0F1A', border: '1px solid #ffffff0A', borderRadius: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#7F77DD18', border: '1px solid #7F77DD33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#A89EFF', marginBottom: 16 }}>{item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: '#8887AA', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAPACIDADES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, textAlign: 'center' }}>Todo lo que hace Aura</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 16, marginBottom: 48 }}>Dile lo que necesitas — ella lo hace</p>
        <div className="caps-grid">
          {[
            { emoji: '⏰', title: 'Recordatorios', desc: 'Te avisa exactamente cuando lo necesitas.' },
            { emoji: '📅', title: 'Agenda', desc: 'Crea eventos en Google Calendar automáticamente.' },
            { emoji: '🧾', title: 'Facturas', desc: 'PDFs profesionales con IVA al instante.' },
            { emoji: '🧠', title: 'Memoria', desc: 'Recuerda todo sobre ti y tus clientes.' },
            { emoji: '✅', title: 'Tareas', desc: 'Apunta pendientes y márcalos como hechos.' },
            { emoji: '👥', title: 'Contactos', desc: 'Guarda información de cada persona.' },
          ].map((item) => (
            <div key={item.title} style={{ padding: '24px', background: '#0F0F1A', border: '1px solid #ffffff08', borderRadius: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{item.emoji}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
              <p style={{ color: '#8887AA', fontSize: 13, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, textAlign: 'center' }}>Elige tu plan</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 16, marginBottom: 48 }}>14 días gratis · Cancela cuando quieras</p>
        <div className="plans-grid" style={{ marginBottom: 40 }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`plan-card${i === selectedPlan ? ' selected' : ''}${plan.popular ? ' popular' : ''}`}
              onClick={() => setSelectedPlan(i)}
            >
              {plan.popular && (
                <div style={{ background: 'linear-gradient(135deg, #7F77DD, #C084FC)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, display: 'inline-block', marginBottom: 12, alignSelf: 'flex-start' }}>MÁS POPULAR</div>
              )}
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: plan.color }}>{plan.name}</h3>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>
                €{plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#8887AA' }}>/mes</span>
              </div>
              <p style={{ fontSize: 12, color: '#8887AA', marginBottom: 20, lineHeight: 1.4 }}>{plan.desc}</p>
              <div style={{ borderTop: '1px solid #ffffff0A', paddingTop: 16, flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} className="feature-item">
                    <div className="feature-dot" style={{ background: plan.color }} />
                    {f}
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '12px', fontSize: 14 }}
                onClick={(e) => { e.stopPropagation(); handleSubmit(i) }}
                disabled={loading}
              >
                {loading && selectedPlan === i ? 'Cargando...' : 'Empezar gratis'}
              </button>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div className="cta-row" style={{ marginBottom: 10 }}>
            <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
              {loading ? 'Cargando...' : 'Empezar gratis'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#555570' }}>Sin tarjeta · 14 días gratis · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #ffffff0A', padding: '28px 24px', marginTop: 40 }}>
        <div className="footer-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Aura</span>
          </div>
          <p style={{ fontSize: 12, color: '#555570' }}>© 2026 Aura. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#555570' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
          </div>
        </div>
      </footer>
    </main>
  )
}