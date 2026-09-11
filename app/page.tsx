'use client'
import { useState } from 'react'

const plans = [
  {
    name: 'Personal',
    price: '9,99',
    desc: 'Para profesionales que quieren organizarse mejor',
    color: '#7F77DD',
    features: [
      'Aura en WhatsApp 24/7',
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
      'Respuesta automática a clientes 24/7',
      'Flujos personalizados',
      'Facturas completas con IVA',
      'Panel de administración',
      'Gmail integrado',
      'WhatsApp número propio',
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
      'WhatsApp API directa',
      'Formación del equipo',
    ],
  },
]

const chatMessages = [
  { from: 'user', text: 'Recuérdame llamar a María mañana a las 10:00' },
  { from: 'aura', text: '¡Anotado! Te recuerdo mañana a las 10:00 💜' },
  { from: 'user', text: 'Hazme una factura a Juan López por 150€ de consultoría' },
  { from: 'aura', text: '¡Perfecto! ¿Cuál es el NIF de Juan y su dirección? 🧾' },
  { from: 'user', text: 'Tengo reunión el viernes a las 16:00' },
  { from: 'aura', text: '¡Anotado en tu Google Calendar! 📅 Reunión el viernes a las 16:00' },
]

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(1)

  const handleSubmit = async (planIndex: number) => {
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
        .glow { box-shadow: 0 0 60px #7F77DD22; }
        .chat-bubble-user {
          background: #7F77DD;
          color: white;
          padding: 10px 16px;
          border-radius: 18px 18px 4px 18px;
          max-width: 80%;
          align-self: flex-end;
          font-size: 14px;
          line-height: 1.5;
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
        }
        .plan-card {
          background: #0F0F1A;
          border: 1px solid #ffffff11;
          border-radius: 16px;
          padding: 32px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .plan-card:hover { border-color: #7F77DD66; transform: translateY(-2px); }
        .plan-card.popular { border-color: #7F77DD; background: #0F0F20; }
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
        }
        .input-field:focus { border-color: #7F77DD; }
        .btn-primary {
          background: linear-gradient(135deg, #7F77DD, #C084FC);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .gradient-text {
          background: linear-gradient(135deg, #A89EFF, #E879F9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #B0AFCC;
          margin-bottom: 10px;
        }
        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 40px !important; }
          .cta-row { flex-direction: column !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #ffffff0A', position: 'sticky', top: 0, background: '#0A0A0Fcc', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>Aura</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 14, color: '#B0AFCC' }}>
          <a href="#como-funciona" style={{ color: 'inherit', textDecoration: 'none' }}>Cómo funciona</a>
          <a href="#planes" style={{ color: 'inherit', textDecoration: 'none' }}>Planes</a>
        </div>
        <a href="#planes" style={{ background: '#7F77DD22', border: '1px solid #7F77DD44', color: '#A89EFF', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Empezar gratis</a>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 60px', display: 'flex', gap: 80, alignItems: 'center' }} className="hero-grid">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-block', background: '#7F77DD18', border: '1px solid #7F77DD33', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#A89EFF', marginBottom: 28 }}>
            Asistente personal con IA
          </div>
          <h1 className="hero-title" style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 24 }}>
            Tu asistente personal<br />
            <span className="gradient-text">siempre disponible</span>
          </h1>
          <p style={{ fontSize: 18, color: '#8887AA', lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
            Aura gestiona tu agenda, recordatorios, facturas y contactos automáticamente. Habla con ella como si fuera una persona — ella se encarga del resto.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="cta-row">
            <input className="input-field" style={{ maxWidth: 280 }} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
              {loading ? 'Cargando...' : 'Probar 14 días gratis'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#555570', marginTop: 16 }}>Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>

        {/* CHAT DEMO */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          <div className="glow" style={{ background: '#0F0F1A', border: '1px solid #7F77DD33', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ background: '#12122A', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #ffffff0A' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Aura</div>
                <div style={{ fontSize: 12, color: '#7F77DD' }}>● En línea</div>
              </div>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={msg.from === 'user' ? 'chat-bubble-user' : 'chat-bubble-aura'}>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, textAlign: 'center' }}>Cómo funciona</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 17, marginBottom: 64 }}>Tres pasos para tener tu asistente personal listo</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { step: '1', title: 'Te suscribes', desc: 'Elige tu plan y crea tu cuenta en menos de 2 minutos. Sin complicaciones.' },
            { step: '2', title: 'Aura te conoce', desc: 'Te hace unas preguntas para entender tu trabajo, horario y prioridades.' },
            { step: '3', title: 'Ella se encarga', desc: 'Desde ese momento, Aura gestiona tu vida automáticamente. Tú solo habla con ella.' },
          ].map((item) => (
            <div key={item.step} style={{ padding: '32px', background: '#0F0F1A', border: '1px solid #ffffff0A', borderRadius: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7F77DD22, #C084FC22)', border: '1px solid #7F77DD44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#A89EFF', marginBottom: 20 }}>{item.step}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
              <p style={{ color: '#8887AA', fontSize: 15, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAPACIDADES */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 80px' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, textAlign: 'center' }}>Todo lo que hace Aura</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 17, marginBottom: 64 }}>Dile lo que necesitas en lenguaje natural — ella lo hace</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { emoji: '⏰', title: 'Recordatorios', desc: 'Te avisa exactamente cuando lo necesitas. "Recuérdame llamar a Juan en 2 horas."' },
            { emoji: '📅', title: 'Agenda', desc: 'Crea eventos en Google Calendar automáticamente. Sin abrir ninguna app.' },
            { emoji: '🧾', title: 'Facturas', desc: 'Genera PDFs profesionales con IVA y datos fiscales completos al instante.' },
            { emoji: '🧠', title: 'Memoria', desc: 'Recuerda todo sobre ti — tu trabajo, clientes, preferencias, alergias.' },
            { emoji: '✅', title: 'Tareas', desc: 'Apunta pendientes y márcalos como hechos con un mensaje.' },
            { emoji: '👥', title: 'Contactos', desc: 'Guarda información importante de cada persona con la que trabajas.' },
          ].map((item) => (
            <div key={item.title} style={{ padding: '28px', background: '#0F0F1A', border: '1px solid #ffffff08', borderRadius: 14 }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{item.emoji}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: '#8887AA', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 100px' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, textAlign: 'center' }}>Elige tu plan</h2>
        <p style={{ color: '#8887AA', textAlign: 'center', fontSize: 17, marginBottom: 64 }}>14 días gratis en todos los planes · Cancela cuando quieras</p>
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
          {plans.map((plan, i) => (
            <div key={plan.name} className={`plan-card${plan.popular ? ' popular' : ''}`} onClick={() => setSelectedPlan(i)}>
              {plan.popular && (
                <div style={{ background: 'linear-gradient(135deg, #7F77DD, #C084FC)', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 16 }}>MÁS POPULAR</div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: plan.color }}>{plan.name}</h3>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>€{plan.price}<span style={{ fontSize: 16, fontWeight: 400, color: '#8887AA' }}>/mes</span></div>
              <p style={{ fontSize: 13, color: '#8887AA', marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
              <div style={{ borderTop: '1px solid #ffffff0A', paddingTop: 20 }}>
                {plan.features.map((f) => (
                  <div key={f} className="feature-item">
                    <div className="feature-dot" style={{ background: plan.color }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }} className="cta-row">
            <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-primary" onClick={() => handleSubmit(selectedPlan)} disabled={loading}>
              {loading ? 'Cargando...' : 'Empezar gratis'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#555570' }}>Sin tarjeta · 14 días gratis · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #ffffff0A', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #7F77DD, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Aura</span>
        </div>
        <p style={{ fontSize: 13, color: '#555570' }}>© 2026 Aura. Todos los derechos reservados.</p>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#555570' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
        </div>
      </footer>
    </main>
  )
}