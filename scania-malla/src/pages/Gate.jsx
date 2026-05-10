import { useState } from 'react'
import { getAlmaeneroByCodigo } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'
import imgTruck from '../assets/Braasil.jpeg'

export default function Gate({ onLogin, onGoAdmin }) {
  const [codigo, setCodigo]   = useState('')
  const [error, setError]     = useState('')
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
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* NAV */}
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
            <button key={l} className="nb locked" disabled>{l}</button>
          )}
        </div>
        <button className="admin-btn" onClick={() => onGoAdmin && onGoAdmin()}>⬡ Panel Admin</button>
      </nav>

      {/* BODY — two columns */}
      <div style={{ flex:1, display:'flex' }}>

        {/* LEFT — imagen del camión */}
        <div style={{ flex:1, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'2rem' }}>
          <img
            src={imgTruck}
            alt="Scania"
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%' }}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, rgba(4,30,66,0.92) 0%, rgba(4,30,66,0.7) 50%, rgba(4,30,66,0.2) 100%)' }} />
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4px', background:'var(--red)' }} />
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.4rem' }}>
              Scania Perú · Programa de Formación
            </div>
            <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'.4rem', letterSpacing:'-.4px' }}>
              Malla de Capacitación<br/>de Almacenes
            </div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)' }}>
              Capacitación técnica en gestión de almacenes y repuestos industriales
            </div>
          </div>
        </div>

        {/* RIGHT — formulario de acceso */}
        <div style={{ width:'300px', background:'#fff', padding:'2rem', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ marginBottom:'1.5rem', textAlign:'center' }}>
            <img src={logoSrc} alt="Scania" style={{ width:'48px', height:'48px', objectFit:'contain' }} />
          </div>

          <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.4rem', textAlign:'center' }}>
            Identificación requerida
          </div>
          <h1 style={{ fontSize:'18px', fontWeight:800, color:'var(--navy)', marginBottom:'.3rem', letterSpacing:'-.3px', textAlign:'center' }}>
            Ingresa tu código<br/>de usuario
          </h1>
          <p style={{ fontSize:'10.5px', color:'var(--g400)', marginBottom:'1.5rem', lineHeight:1.5, textAlign:'center' }}>
            Para acceder y registrar tu progreso necesitas el código asignado por tu administrador.
          </p>

          <input
            style={{ width:'100%', padding:'13px 16px', border: '1.5px solid ' + (error ? 'var(--red)' : 'var(--g200)'), fontSize:'17px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', textAlign:'center', color:'var(--navy)', outline:'none', fontFamily:'inherit', marginBottom:'.5rem', background:'#fff' }}
            type="text"
            placeholder="Ej: AFL9FU"
            maxLength={8}
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="off"
          />

          {error && (
            <div style={{ fontSize:'10px', color:'var(--red)', fontWeight:600, marginBottom:'.6rem', textAlign:'center' }}>{error}</div>
          )}

          <button
            className="btn-p"
            style={{ width:'100%', padding:'12px', fontSize:'11px', marginBottom:'1rem' }}
            onClick={handleLogin}
            disabled={loading}>
            {loading ? 'Verificando...' : 'Acceder a la plataforma →'}
          </button>

          <div style={{ fontSize:'9px', color:'var(--g400)', lineHeight:1.6, borderTop:'1px solid var(--g100)', paddingTop:'.9rem', textAlign:'center' }}>
            Tu código está en el correo de bienvenida de Scania Perú.
          </div>

          <button
            onClick={() => onGoAdmin && onGoAdmin()}
            style={{ fontSize:'9.5px', color:'var(--g400)', cursor:'pointer', background:'none', border:'none', fontFamily:'inherit', marginTop:'.8rem', display:'block', width:'100%' }}>
            ¿Eres administrador? Ingresa aquí →
          </button>
        </div>
      </div>
    </div>
  )
}
