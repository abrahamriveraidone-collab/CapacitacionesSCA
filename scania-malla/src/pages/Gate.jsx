import { useState } from 'react'
import { getAlmaeneroByCodigo } from '../lib/supabase'
import logoSrc     from '../assets/logo_scania.png'
import imgRojo     from '../assets/Brasilia.jpeg'
import imgBlanco   from '../assets/Braasil.jpeg'

// tipo: 'distribuidor' | 'sucursal' | null
export default function Gate({ onLogin, onGoAdmin }) {
  const [tipo, setTipo]       = useState(null)
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
    // Validar que el tipo seleccionado coincida con el tipo del almacenero
    const esDistribuidor = user.region === 'Distribuidor'
    if (tipo === 'distribuidor' && !esDistribuidor) {
      setError('Este código no corresponde al distribuidor.')
      return
    }
    if (tipo === 'sucursal' && esDistribuidor) {
      setError('Este código corresponde al distribuidor, no a una sucursal.')
      return
    }
    onLogin(user)
  }

  // ── PANTALLA SELECCIÓN DE TIPO ──
  if (!tipo) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
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

        <div style={{ flex:1, display:'flex' }}>

          {/* LADO IZQUIERDO — Distribuidor */}
          <div
            onClick={() => setTipo('distribuidor')}
            style={{ flex:1, position:'relative', overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'2.5rem' }}>
            <img
              src={imgRojo}
              alt="Distribuidor"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%' }}
            />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(4,30,66,0.95) 0%, rgba(4,30,66,0.6) 50%, rgba(4,30,66,0.2) 100%)' }} />
            <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'4px', background:'var(--red)' }} />
            <div style={{ position:'relative', zIndex:2 }}>
              <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.5rem' }}>
                Almacén Distribuidor
              </div>
              <div style={{ fontSize:'26px', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'.6rem', letterSpacing:'-.4px' }}>
                ¿Eres del<br/>distribuidor?
              </div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,.6)', marginBottom:'1.4rem', lineHeight:1.5 }}>
                Accede a los procedimientos y capacitaciones del almacén del distribuidor Scania.
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'var(--red)', color:'#fff', padding:'11px 22px', fontWeight:700, fontSize:'11px', letterSpacing:'.07em', textTransform:'uppercase' }}>
                Ingresa aquí →
              </div>
            </div>
            {/* Hover overlay */}
            <div style={{ position:'absolute', inset:0, background:'rgba(206,17,38,0.08)', opacity:0, transition:'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='1'}
              onMouseLeave={e => e.currentTarget.style.opacity='0'} />
          </div>

          {/* DIVISOR */}
          <div style={{ width:'3px', background:'rgba(255,255,255,.08)', flexShrink:0, position:'relative', zIndex:2 }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,.3)' }}>
              <img src={logoSrc} alt="S" style={{ width:'20px', height:'20px', objectFit:'contain' }} />
            </div>
          </div>

          {/* LADO DERECHO — Sucursal */}
          <div
            onClick={() => setTipo('sucursal')}
            style={{ flex:1, position:'relative', overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'2.5rem' }}>
            <img
              src={imgBlanco}
              alt="Sucursal"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 35%' }}
            />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(4,30,66,0.95) 0%, rgba(4,30,66,0.6) 50%, rgba(4,30,66,0.2) 100%)' }} />
            <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'4px', background:'var(--red)' }} />
            <div style={{ position:'relative', zIndex:2 }}>
              <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.5rem' }}>
                Sucursal / Minería
              </div>
              <div style={{ fontSize:'26px', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:'.6rem', letterSpacing:'-.4px' }}>
                ¿Eres de alguna<br/>sucursal?
              </div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,.6)', marginBottom:'1.4rem', lineHeight:1.5 }}>
                Accede a las capacitaciones técnicas para almacenes de sucursales y operaciones mineras.
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'var(--navy)', border:'2px solid rgba(255,255,255,.3)', color:'#fff', padding:'11px 22px', fontWeight:700, fontSize:'11px', letterSpacing:'.07em', textTransform:'uppercase' }}>
                Ingresa aquí →
              </div>
            </div>
            <div style={{ position:'absolute', inset:0, background:'rgba(4,30,66,0.08)', opacity:0, transition:'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='1'}
              onMouseLeave={e => e.currentTarget.style.opacity='0'} />
          </div>

        </div>
      </div>
    )
  }

  // ── PANTALLA INGRESO DE CÓDIGO ──
  const esDistribuidor = tipo === 'distribuidor'

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
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

      <div style={{ flex:1, display:'flex' }}>
        {/* Imagen de fondo */}
        <div style={{ flex:1, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'2.5rem' }}>
          <img
            src={esDistribuidor ? imgRojo : imgBlanco}
            alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 40%' }}
          />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, rgba(4,30,66,0.95) 0%, rgba(4,30,66,0.75) 50%, rgba(4,30,66,0.25) 100%)' }} />
          <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'4px', background:'var(--red)' }} />
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.5rem' }}>
              {esDistribuidor ? 'Almacén Distribuidor' : 'Sucursal / Minería'}
            </div>
            <div style={{ fontSize:'24px', fontWeight:800, color:'#fff', lineHeight:1.2, letterSpacing:'-.4px' }}>
              Malla de Capacitación<br/>de Almacenes
            </div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', marginTop:'.5rem' }}>
              Scania Perú · Programa de Formación Técnica
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ width:'310px', background:'#fff', padding:'2rem', display:'flex', flexDirection:'column', justifyContent:'center', flexShrink:0 }}>
          <button
            onClick={() => { setTipo(null); setCodigo(''); setError('') }}
            style={{ background:'none', border:'none', color:'var(--g400)', fontSize:'9.5px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'.04em', textTransform:'uppercase', fontWeight:600, marginBottom:'1.5rem', textAlign:'left', padding:0 }}>
            ← Cambiar tipo
          </button>

          <div style={{ marginBottom:'1.2rem', textAlign:'center' }}>
            <img src={logoSrc} alt="Scania" style={{ width:'44px', height:'44px', objectFit:'contain' }} />
          </div>

          <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.4rem', textAlign:'center' }}>
            {esDistribuidor ? 'Distribuidor' : 'Sucursal / Minería'}
          </div>
          <h1 style={{ fontSize:'18px', fontWeight:800, color:'var(--navy)', marginBottom:'.3rem', letterSpacing:'-.3px', textAlign:'center' }}>
            Ingresa tu código<br/>de usuario
          </h1>
          <p style={{ fontSize:'10.5px', color:'var(--g400)', marginBottom:'1.5rem', lineHeight:1.5, textAlign:'center' }}>
            El código fue asignado por tu administrador en el correo de bienvenida.
          </p>

          <input
            style={{ width:'100%', padding:'13px 16px', border:'1.5px solid ' + (error ? 'var(--red)' : 'var(--g200)'), fontSize:'17px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', textAlign:'center', color:'var(--navy)', outline:'none', fontFamily:'inherit', marginBottom:'.5rem', background:'#fff' }}
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
            ¿Problemas para acceder? Contacta a tu administrador Scania.
          </div>

          <button
            onClick={() => onGoAdmin && onGoAdmin()}
            style={{ fontSize:'9.5px', color:'var(--g400)', cursor:'pointer', background:'none', border:'none', fontFamily:'inherit', marginTop:'.8rem', display:'block', width:'100%', textAlign:'center' }}>
            ¿Eres administrador? Ingresa aquí →
          </button>
        </div>
      </div>
    </div>
  )
}
