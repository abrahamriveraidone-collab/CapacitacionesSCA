import { useState, useEffect } from 'react'
import { getModulos, getMaterial, getExamenes, getProgreso } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function Home({ user, onLogout, onOpenMod }) {
  const [tab, setTab]         = useState('cap')
  const [modulos, setModulos] = useState([])
  const [material, setMaterial] = useState([])
  const [examenes, setExamenes] = useState([])
  const [progreso, setProgreso] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getModulos(), getMaterial(), getExamenes(), getProgreso(user.id)])
      .then(([mods, mats, exams, prog]) => {
        setModulos(mods); setMaterial(mats); setExamenes(exams); setProgreso(prog)
        setLoading(false)
      })
  }, [user.id])

  function getModProg(modId) {
    const p = progreso.find(x => x.modulo_id === modId)
    return p?.porcentaje || 0
  }

  const colors = ['#041E42','#1a2f4a','#2D3340','#1f3a5c','#3D2B1F','#1C3A2A','#3A1C1C','#243347']

  return (
    <>
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text"><span className="logo-main">Scania</span><span className="logo-sub">Malla de Capacitación de Almacenes</span></div>
        </div>
        <div className="nav-links">
          {['cap','rec','exa','ava'].map((t, i) => (
            <button key={t} className={`nb${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {['Capacitaciones','Recursos','Exámenes','Mi Avance'][i]}
              {t === 'exa' && <span className="nbadge">{examenes.length}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)', fontSize: '10px', padding: '3px 9px', border: '1px solid rgba(255,255,255,.14)', fontWeight: 500 }}>
            {user.sucursales?.nombre || user.region}
          </span>
          <button className="admin-btn" onClick={() => window.location.href = '/admin/login'}>⬡ Panel Admin</button>
        </div>
      </nav>

      {/* User active bar */}
      <div style={{ background: 'var(--graphite)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '.5rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{user.nombre}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.4)' }}>{user.sucursales?.nombre} · {user.region}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.35)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Código: <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{user.codigo}</span>
          </span>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.45)', padding: '3px 10px', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* CAPACITACIONES */}
      {tab === 'cap' && (
        <>
          <div className="hero">
            <div className="hero-rbar" />
            <div className="hero-bg-solid" />
            <div className="hero-overlay" />
            <div className="hero-c">
              <div className="hero-ey">Scania Perú · Programa de Formación Técnica</div>
              <h1>Malla de Capacitación<br/>de Almacenes</h1>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.14)', padding: '5px 10px', marginBottom: '.9rem' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600 }}>{user.nombre} · {user.sucursales?.nombre}</span>
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {[
                  { n: progreso.length ? Math.round(progreso.reduce((a,b) => a + b.porcentaje, 0) / progreso.length) : 0, l: 'Tu progreso', suf: '%' },
                  { n: modulos.length, l: 'Módulos', suf: '.' },
                  { n: 29, l: 'Competencias', suf: '.' },
                ].map((s, i) => (
                  <div key={i} style={{ paddingRight: i < 2 ? '1.2rem' : 0, borderRight: i < 2 ? '1px solid rgba(255,255,255,.14)' : 'none', marginRight: i < 2 ? '1.2rem' : 0 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.n}<span style={{ color: 'var(--red)' }}>{s.suf}</span></div>
                    <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,.4)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', borderBottom: '1px solid var(--g100)', padding: '.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ color: 'var(--g400)', fontSize: '14px' }}>⌕</span>
            <input style={{ flex: 1, border: 'none', fontSize: '11.5px', color: 'var(--navy)', outline: 'none', fontFamily: 'inherit' }} placeholder="Buscar módulo o competencia..." />
          </div>
          <div className="sec">
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Módulos de capacitación</div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--g400)' }}>Cargando módulos...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '1px', background: 'var(--g100)', border: '1px solid var(--g100)' }}>
                {modulos.map((m, i) => {
                  const p = getModProg(m.id)
                  return (
                    <div key={m.id} className="mcard" onClick={() => onOpenMod(m)}>
                      {m.imagen_url
                        ? <img style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} src={m.imagen_url} alt="" />
                        : <div style={{ position: 'absolute', inset: 0, background: m.color || colors[i % colors.length] }} />
                      }
                      <div className="mcard-overlay" />
                      <div className="mcard-red" />
                      <div className="mcard-body">
                        <div style={{ fontSize: '16px', marginBottom: 'auto', opacity: .85, color: '#fff' }}>{m.icono}</div>
                        <div>
                          <div style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '3px' }}>{m.categoria}</div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: '5px' }}>{m.titulo}</div>
                          <div style={{ height: '2px', background: 'rgba(255,255,255,.18)' }}>
                            <div style={{ height: '100%', width: `${p}%`, background: 'var(--red)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{p}% completado</span>
                            <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,.38)' }}>{m.lecciones?.length || 0} lecciones</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* RECURSOS */}
      {tab === 'rec' && (
        <>
          <div className="hero" style={{ height: '180px' }}>
            <div className="hero-rbar" /><div className="hero-bg-solid" /><div className="hero-overlay" />
            <div className="hero-c"><div className="hero-ey">Biblioteca técnica</div><h1>Recursos y Material</h1></div>
          </div>
          <div className="sec">
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Disponibles</div>
            {material.filter(m => !m.archivado && m.estado === 'activo').map(m => (
              <div key={m.id} className="li">
                <div className={`lic ${m.tipo === 'pdf' ? 'lp' : 'lq'}`} style={{ fontSize: '12px' }}>{m.tipo === 'pdf' ? '📄' : '▶'}</div>
                <div className="lin"><div className="lt">{m.titulo}</div><div className="lm">{m.modulos?.titulo} · {m.tipo.toUpperCase()}{m.tamano_mb ? ` · ${m.tamano_mb} MB` : ''}</div></div>
                <a href={m.url} target="_blank" rel="noreferrer"><button className="btn-g btn-sm">{m.tipo === 'pdf' ? 'Descargar' : 'Ver video'}</button></a>
              </div>
            ))}
          </div>
        </>
      )}

      {/* EXÁMENES */}
      {tab === 'exa' && (
        <>
          <div className="hero" style={{ height: '180px' }}>
            <div className="hero-rbar" /><div className="hero-bg-solid" /><div className="hero-overlay" />
            <div className="hero-c"><div className="hero-ey">Evaluaciones pendientes</div><h1>Exámenes</h1></div>
          </div>
          <div className="sec">
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Por rendir</div>
            {examenes.filter(e => !e.archivado && e.estado === 'activo').map(e => (
              <div key={e.id} className="li">
                <div className="lic lq" style={{ fontSize: '12px' }}>✎</div>
                <div className="lin"><div className="lt">{e.titulo}</div><div className="lm">{e.modulos?.titulo} · {e.preguntas?.length || 0} preguntas</div></div>
                <button className="btn-p" style={{ padding: '7px 14px' }} onClick={() => alert('Ir al examen: ' + e.titulo)}>Rendir examen</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MI AVANCE */}
      {tab === 'ava' && (
        <>
          <div className="hero" style={{ height: '180px' }}>
            <div className="hero-rbar" /><div className="hero-bg-solid" /><div className="hero-overlay" />
            <div className="hero-c"><div className="hero-ey">Seguimiento personal</div><h1>Mi Avance</h1></div>
          </div>
          <div className="sec">
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Avance por competencia</div>
            {modulos.map(m => {
              const p = getModProg(m.id)
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '.7rem 0', borderBottom: '1px solid var(--g100)' }}>
                  <div style={{ fontSize: '15px', width: '22px', textAlign: 'center' }}>{m.icono}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy)', marginBottom: '3px' }}>{m.titulo}</div>
                    <div style={{ height: '3px', background: 'var(--g100)' }}><div style={{ height: '100%', width: `${p}%`, background: 'var(--red)' }} /></div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--g600)', minWidth: '32px', textAlign: 'right' }}>{p}%</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
