import { useState } from 'react'
import { getAlmaeneroByCodigo } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function Gate({ onLogin }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!codigo.trim()) { setError('Ingresa tu código de usuario'); return }
    setLoading(true)
    setError('')
    const user = await getAlmaeneroByCodigo(codigo.trim())
    setLoading(false)
    if (!user) {
      setError('Código no encontrado. Verifica con tu administrador.')
      return
    }
    onLogin(user)
  }

  return (
    <>
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text">
            <span className="logo-main">Scania</span>
            <span className="logo-sub">Malla de Capacitación de Almacenes</span>
          </div>
        </div>
        <div className="nav-links">
          {['Capacitaciones','Recursos','Exámenes','Mi Avance'].map(l =>
            <button key={l} className="nb locked">{l}</button>
          )}
        </div>
        <button className="admin-btn" onClick={() => window.location.href = '/admin/login'}>⬡ Panel Admin</button>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g50)', padding: '2rem', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ background: '#fff', border: '1px solid var(--g200)', borderTop: '3px solid var(--red)', padding: '2.2rem 1.8rem', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <img src={logoSrc} alt="Scania" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '.4rem' }}>
            Identificación requerida
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--navy)', marginBottom: '.3rem', letterSpacing: '-.3px' }}>
            Ingresa tu código<br/>de usuario
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--g400)', marginBottom: '1.6rem', lineHeight: 1.5 }}>
            Para acceder a las capacitaciones y registrar tu progreso necesitas el código asignado por tu administrador.
          </p>

          <input
            style={{ width: '100%', padding: '13px 16px', border: `1.5px solid ${error ? 'var(--red)' : 'var(--g200)'}`, fontSize: '17px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', textAlign: 'center', color: 'var(--navy)', outline: 'none', fontFamily: 'inherit', marginBottom: '.5rem' }}
            type="text"
            placeholder="Ej: AFL9FU"
            maxLength={8}
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="off"
          />
          {error && <div style={{ fontSize: '10px', color: 'var(--red)', fontWeight: 600, marginBottom: '.6rem' }}>{error}</div>}

          <button className="btn-p" style={{ width: '100%', padding: '12px', fontSize: '11px', marginBottom: '1rem' }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Verificando...' : 'Acceder a la plataforma →'}
          </button>

          <div style={{ fontSize: '9.5px', color: 'var(--g400)', lineHeight: 1.6, borderTop: '1px solid var(--g100)', paddingTop: '.9rem' }}>
            Tu código está en el correo de bienvenida de Scania Perú.
          </div>
          <button onClick={() => window.location.href = '/admin/login'}
            style={{ fontSize: '10px', color: 'var(--g400)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', marginTop: '.8rem', display: 'block', width: '100%' }}>
            ¿Eres administrador? Ingresa aquí →
          </button>
        </div>
      </div>
    </>
  )
}
