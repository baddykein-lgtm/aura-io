'use client'

export default function Home() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const d = await r.json()
    if (d.url) window.location.href = d.url
  }

  return (
    <main style={{fontFamily:'system-ui,sans-serif',color:'#1a1a1a',margin:0,padding:0}}>

      {/* NAV */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 32px',borderBottom:'0.5px solid #e5e5e5',background:'#fff',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:'#EEEDFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✨</div>
          <span style={{fontSize:16,fontWeight:500}}>aura<span style={{color:'#7F77DD'}}>.io</span></span>
        </div>
        <div style={{display:'flex',gap:24}}>
          <a href="#funciones" style={{fontSize:13,color:'#666',textDecoration:'none'}}>Funciones</a>
          <a href="#precio" style={{fontSize:13,color:'#666',textDecoration:'none'}}>Precio</a>
          <a href="#opiniones" style={{fontSize:13,color:'#666',textDecoration:'none'}}>Opiniones</a>
        </div>
        <a href="#precio" style={{background:'#7F77DD',color:'#fff',padding:'7px 18px',borderRadius:8,fontSize:13,fontWeight:500,textDecoration:'none'}}>Empezar gratis</a>
      </nav>

      {/* HERO */}
      <section style={{textAlign:'center',padding:'72px 24px 56px',borderBottom:'0.5px solid #e5e5e5'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#EEEDFE',border:'0.5px solid #AFA9EC',borderRadius:20,padding:'5px 14px',fontSize:12,color:'#534AB7',marginBottom:22}}>
          ✨ Todo incluido · solo €9,99 al mes
        </div>
        <h1 style={{fontSize:42,fontWeight:500,lineHeight:1.2,letterSpacing:'-0.8px',margin:'0 auto 16px'}}>
          Tu asistente personal<br/>vive en <span style={{color:'#7F77DD'}}>WhatsApp</span>
        </h1>
        <p style={{fontSize:16,color:'#666',lineHeight:1.6,maxWidth:480,margin:'16px auto 32px'}}>
          Aura recuerda tu agenda, actúa por ti y automatiza tu negocio. Solo habla con ella como con un amigo.
        </p>
        <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:32,flexWrap:'wrap'}}>
          <a href="#precio" style={{background:'#7F77DD',color:'#fff',padding:'13px 28px',borderRadius:12,fontSize:15,fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>
            💬 Probar gratis 14 días
          </a>
          <a href="#como-funciona" style={{background:'transparent',border:'1.5px solid #ddd',color:'#1a1a1a',padding:'12px 24px',borderRadius:12,fontSize:15,textDecoration:'none'}}>
            Ver cómo funciona →
          </a>
        </div>
        <div style={{fontSize:12,color:'#888'}}>
          Más de <strong style={{color:'#1a1a1a'}}>1.248 profesionales</strong> ya usan Aura
        </div>
      </section>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'0.5px solid #e5e5e5'}}>
        {[['1.248','profesionales activos'],['94%','tasa de apertura WA'],['0.8s','velocidad de respuesta'],['98%','renuevan cada mes']].map(([v,l])=>(
          <div key={l} style={{padding:'24px 16px',textAlign:'center',borderRight:'0.5px solid #e5e5e5'}}>
            <div style={{fontSize:26,fontWeight:500,color:'#534AB7',marginBottom:4}}>{v}</div>
            <div style={{fontSize:11,color:'#888'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* FUNCIONES */}
      <section id="funciones" style={{padding:'56px 32px',borderBottom:'0.5px solid #e5e5e5'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'#EEEDFE',border:'0.5px solid #AFA9EC',borderRadius:20,padding:'4px 12px',fontSize:11,color:'#534AB7',marginBottom:12}}>⚡ Funciones</div>
          <h2 style={{fontSize:28,fontWeight:500,letterSpacing:'-0.4px',marginBottom:10}}>Todo lo que <span style={{color:'#7F77DD'}}>Aura</span> hace por ti</h2>
          <p style={{fontSize:14,color:'#666',maxWidth:480,margin:'0 auto'}}>Un solo plan, sin límites. Por €9,99 al mes tienes acceso a todo.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,maxWidth:900,margin:'0 auto'}}>
          {[
            ['🧠','Memoria permanente','Recuerda tu nombre, trabajo y preferencias. Nunca repites lo mismo dos veces.'],
            ['☀️','Buenos días diarios','Cada mañana te manda un resumen de tu agenda y urgencias del día.'],
            ['📅','Agenda inteligente','Crea citas, confirma clientes y gestiona tu calendario con un mensaje.'],
            ['⚡','Automatizaciones','Flujos de bienvenida, recordatorios, cumpleaños y confirmaciones sin límite.'],
            ['🔔','Recordatorios que actúan','No solo te recuerda — envía el mensaje y programa el siguiente paso.'],
            ['🏛️','Social Club incluido','Comunidades exclusivas, eventos y networking con otros profesionales.'],
          ].map(([icon,title,desc])=>(
            <div key={title} style={{background:'#f9f9f9',borderRadius:12,padding:20,border:'0.5px solid #e5e5e5'}}>
              <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>{title}</div>
              <div style={{fontSize:12,color:'#666',lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{padding:'56px 32px',borderBottom:'0.5px solid #e5e5e5',background:'#fafafa'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',gap:5,background:'#EEEDFE',border:'0.5px solid #AFA9EC',borderRadius:20,padding:'4px 12px',fontSize:11,color:'#534AB7',marginBottom:12}}>🗺️ Cómo funciona</div>
          <h2 style={{fontSize:28,fontWeight:500,letterSpacing:'-0.4px'}}>En marcha en <span style={{color:'#7F77DD'}}>menos de 5 minutos</span></h2>
        </div>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          {[
            ['1','Te suscribes y Aura te escribe','Al registrarte recibes un primer mensaje de Aura en WhatsApp. Te guía en una conversación de 5 minutos para conocerte.'],
            ['2','Aura aprende cómo eres','Te pregunta tu nombre, trabajo, horario y prioridades. Guarda todo en su memoria permanente.'],
            ['3','Desde mañana, Aura actúa','Recibirás tu primer buenos días con tu agenda real. Solo habla con Aura y ella hace el resto.'],
            ['4','Automatiza tu negocio','Crea flujos para tus clientes sin límite. Todo desde WhatsApp o el panel web.'],
          ].map(([num,title,desc])=>(
            <div key={num} style={{display:'flex',gap:16,padding:'20px 0',borderBottom:'0.5px solid #e5e5e5'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#EEEDFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:500,color:'#534AB7',flexShrink:0,marginTop:2}}>{num}</div>
              <div>
                <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{title}</div>
                <div style={{fontSize:13,color:'#666',lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRECIO */}
      <section id="precio" style={{padding:'56px 32px',borderBottom:'0.5px solid #e5e5e5'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',gap:5,background:'#EEEDFE',border:'0.5px solid #AFA9EC',borderRadius:20,padding:'4px 12px',fontSize:11,color:'#534AB7',marginBottom:12}}>💎 Precio</div>
          <h2 style={{fontSize:28,fontWeight:500,letterSpacing:'-0.4px',marginBottom:10}}>Un solo plan.<br/><span style={{color:'#7F77DD'}}>Todo incluido.</span></h2>
          <p style={{fontSize:14,color:'#666'}}>Sin tiers, sin limitaciones, sin sorpresas.</p>
        </div>
        <div style={{maxWidth:360,margin:'0 auto',border:'2px solid #7F77DD',borderRadius:20,padding:32,textAlign:'center',position:'relative'}}>
          <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#EEEDFE',color:'#534AB7',fontSize:11,fontWeight:500,padding:'3px 14px',borderRadius:10,border:'0.5px solid #AFA9EC',whiteSpace:'nowrap'}}>PREMIUM</div>
          <div style={{fontSize:22,fontWeight:500,marginBottom:4}}>👑 Aura Premium</div>
          <div style={{fontSize:13,color:'#888',marginBottom:20}}>Tu asistente personal, sin límites</div>
          <div style={{fontSize:52,fontWeight:500,color:'#534AB7',lineHeight:1,letterSpacing:'-2px'}}>
            <sup style={{fontSize:22,fontWeight:400,verticalAlign:'super'}}>€</sup>9<span style={{fontSize:32,fontWeight:400}}>,99</span>
          </div>
          <div style={{fontSize:13,color:'#888',marginBottom:6}}>al mes · cancela cuando quieras</div>
          <div style={{fontSize:11,color:'#1D9E75',background:'#E1F5EE',padding:'3px 12px',borderRadius:10,display:'inline-block',marginBottom:24}}>🎁 14 días gratis · sin tarjeta</div>
          <div style={{height:'0.5px',background:'#e5e5e5',margin:'0 -32px 22px'}}></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,textAlign:'left',marginBottom:24}}>
            {['Aura en tu WhatsApp','Memoria permanente','Buenos días diarios','Agenda inteligente','Flujos ilimitados','Mensajes ilimitados','IA para redactar','CRM de contactos','Analytics completas','Social Club','Eventos exclusivos','Soporte prioritario'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#555'}}>
                <span style={{color:'#7F77DD'}}>✓</span>{f}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:8}}>
            <input name="email" type="email" placeholder="tu@email.com" required style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'0.5px solid #ddd',fontSize:13,fontFamily:'system-ui',boxSizing:'border-box'}}/>
            <button type="submit" style={{width:'100%',padding:14,background:'#7F77DD',border:'none',color:'#fff',borderRadius:12,fontSize:15,fontWeight:500,cursor:'pointer'}}>
              💬 Empezar gratis 14 días
            </button>
          </form>
          <div style={{fontSize:11,color:'#aaa',marginTop:10,display:'flex',justifyContent:'center',gap:14}}>
            <span>🔒 Sin compromiso</span>
            <span>❌ Cancela cuando quieras</span>
          </div>
        </div>
      </section>

      {/* OPINIONES */}
      <section id="opiniones" style={{padding:'56px 32px',borderBottom:'0.5px solid #e5e5e5',background:'#fafafa'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',gap:5,background:'#EEEDFE',border:'0.5px solid #AFA9EC',borderRadius:20,padding:'4px 12px',fontSize:11,color:'#534AB7',marginBottom:12}}>⭐ Opiniones</div>
          <h2 style={{fontSize:28,fontWeight:500,letterSpacing:'-0.4px'}}>Lo que dicen quienes ya <span style={{color:'#7F77DD'}}>usan Aura</span></h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,maxWidth:800,margin:'0 auto'}}>
          {[
            ['MR','María Rodríguez','Dentista · Madrid','"Aura me manda el buenos días con toda mi agenda. Ya no uso Google Calendar para nada."'],
            ['JL','Juan López','Fisioterapeuta · Barcelona','"Mis clientes reciben confirmación automática. Por €9,99 es una locura."'],
            ['AS','Ana Sánchez','E-commerce · Valencia','"Lancé mi colección y Aura avisó a 400 clientes en 2 minutos. Tasa del 96%."'],
            ['CP','Carlos Pérez','Consultor · Sevilla','"Le digo a Aura lo que necesito y lo hace. Como una secretaria por menos de €10."'],
          ].map(([initials,name,role,text])=>(
            <div key={name} style={{background:'#fff',borderRadius:12,padding:18,border:'0.5px solid #e5e5e5'}}>
              <div style={{marginBottom:10}}>⭐⭐⭐⭐⭐</div>
              <p style={{fontSize:13,color:'#1a1a1a',lineHeight:1.6,marginBottom:12,fontStyle:'italic'}}>{text}</p>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'#EEEDFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,color:'#534AB7'}}>{initials}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{name}</div>
                  <div style={{fontSize:11,color:'#888'}}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:'72px 32px',textAlign:'center',background:'#fafafa'}}>
        <h2 style={{fontSize:30,fontWeight:500,letterSpacing:'-0.4px',marginBottom:10}}>Aura te está esperando en <span style={{color:'#7F77DD'}}>WhatsApp</span></h2>
        <p style={{fontSize:14,color:'#666',marginBottom:28,lineHeight:1.6}}>14 días gratis. Sin tarjeta.<br/>Después solo <strong>€9,99 al mes</strong> con todo incluido.</p>
        <form onSubmit={handleSubmit} style={{display:'flex',gap:8,maxWidth:380,margin:'0 auto 10px'}}>
          <input name="email" type="email" placeholder="tu@email.com" required style={{flex:1,padding:'11px 16px',borderRadius:8,border:'0.5px solid #ddd',fontSize:13,fontFamily:'system-ui'}}/>
          <button type="submit" style={{padding:'11px 20px',background:'#7F77DD',border:'none',color:'#fff',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>Empezar gratis</button>
        </form>
        <div style={{fontSize:11,color:'#aaa'}}>Al registrarte, Aura te escribirá directamente a WhatsApp.</div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'24px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'0.5px solid #e5e5e5'}}>
        <span style={{fontSize:13,fontWeight:500}}>aura<span style={{color:'#7F77DD'}}>.io</span></span>
        <div style={{display:'flex',gap:16}}>
          <a href="#" style={{fontSize:12,color:'#888',textDecoration:'none'}}>Privacidad</a>
          <a href="#" style={{fontSize:12,color:'#888',textDecoration:'none'}}>Términos</a>
          <a href="#" style={{fontSize:12,color:'#888',textDecoration:'none'}}>Contacto</a>
        </div>
        <span style={{fontSize:11,color:'#aaa'}}>© 2025 aura.io</span>
      </footer>

    </main>
  )
}