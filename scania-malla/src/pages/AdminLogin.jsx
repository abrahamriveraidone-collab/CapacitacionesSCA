import { useState } from 'react'
import logoSrc from '../assets/logo_scania.png'

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'Admin123'
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || '123456'

export default function AdminLogin() {
  const [user, setUser]     = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')

  function handleLogin() {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem('scania_admin', '1')
      window.location.href = '/admin'
    } else {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--navy)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(4,30,66,.95),rgba(4,30,66,.7))' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: 'auto', paddingTop: '.5rem', marginBottom: '2rem' }}>
            <img src={logoSrc} alt="Scania" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '.4rem' }}>Acceso restringido</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>Scania —<br/>Malla de Capacitación<br/>de Almacenes</div>
          <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.12em', marginTop: '4px' }}>Panel de Administración</div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '265px', background: '#fff', padding: '1.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <img src={logoSrc} alt="Scania" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '3px' }}>Acceso Administrador</h2>
        <p style={{ fontSize: '9.5px', color: 'var(--g400)', marginBottom: '1.2rem' }}>Solo personal autorizado Scania Perú</p>

        <label className="fl">Usuario</label>
        <input className="fi" style={{ marginBottom: '9px' }} type="text" placeholder="Admin123" value={user} onChange={e => { setUser(e.target.value); setError('') }} />
        <label className="fl">Contraseña</label>
        <input className="fi" style={{ marginBottom: '4px' }} type="password" placeholder="••••••" value={pass} onChange={e => { setPass(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />

        {error && <div style={{ fontSize: '9.5px', color: 'var(--red)', fontWeight: 600, marginBottom: '5px' }}>{error}</div>}

        <button onClick={handleLogin}
          style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', padding: '11px', fontSize: '11px', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
          Ingresar al panel →
        </button>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button onClick={() => window.location.href = '/'}
            style={{ background: 'none', border: 'none', color: 'var(--g400)', fontSize: '9.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Volver a la plataforma
          </button>
        </div>
      </div>
    </div>
  )
}
