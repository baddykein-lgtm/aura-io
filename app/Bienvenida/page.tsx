export default function Bienvenida() {
  return (
    <main style={{
      fontFamily: 'system-ui,sans-serif',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 24,
      background: '#fff',
      color: '#1a1a1a'
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#EEEDFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto 20px'
        }}>✨</div>

        <h1 style={{ fontSize: 26, fontWeight: 500, marginBottom: 12, letterSpacing: '-0.4px' }}>
          ¡Bienvenido a <span style={{ color: '#7F77DD' }}>Aura</span>!
        </h1>

        <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
          Tu suscripción está activa con <strong style={{color:'#1a1a1a'}}>14 días gratis</strong>.
          En unos segundos recibirás un mensaje de Aura en tu WhatsApp para empezar.
        </p>

        <div style={{
          background: '#f9f9f9',
          border: '0.5px solid #e5e5e5',
          borderRadius: 12,
          padding: '16px 20px',
          fontSize: 13,
          color: '#666',
          lineHeight: 1.6,
          marginBottom: 24
        }}>
          💬 Si no recibes el mensaje en 1 minuto, comprueba que tu número de WhatsApp es correcto o escríbenos.
        </div>

        <a href="https://wa.me/14155238886" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#7F77DD',
          color: '#fff',
          padding: '13px 28px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none'
        }}>
          💬 Abrir WhatsApp con Aura
        </a>

        <div style={{ marginTop: 28, fontSize: 12, color: '#aaa' }}>
          aura<span style={{ color: '#7F77DD' }}>.io</span>
        </div>
      </div>
    </main>
  )
}