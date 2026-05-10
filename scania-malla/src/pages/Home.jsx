import { useState, useEffect } from 'react'
import { getModulos, getMaterial, getExamenes, getProgreso, guardarResultadoExamen } from '../lib/supabase'
import logoSrc    from '../assets/logo_scania.png'
import imgTruck1  from '../assets/Braasil.jpeg'
import imgTruck2  from '../assets/Brasilia.jpeg'
import imgBuilding from '../assets/BELGIUM.png'

export default function Home({ user, onLogout, onOpenMod, onGoAdmin }) {
  const [tab, setTab]           = useState('cap')
  const [modulos, setModulos]   = useState([])
  const [material, setMaterial] = useState([])
  const [examenes, setExamenes] = useState([])
  const [progreso, setProgreso] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    cargarTodo()
  }, [user.id])

  async function cargarTodo() {
    setLoading(true)
    const [mods, mats, exams, prog] = await Promise.all([
      getModulos(),
      getMaterial(),
      getExamenes(),
      getProgreso(user.id),
    ])
    setModulos(mods)
    setMaterial(mats)
    setExamenes(exams)
    setProgreso(prog)
    setLoading(false)
  }

  // Porcentaje de módulos completados
  function calcularProgresoGeneral() {
    if (modulos.length === 0) return 0
    const completados = progreso.filter(p => p.completado).length
    return Math.round((completados / modulos.length) * 100)
  }

  function getModProg(modId) {
    const p = progreso.find(x => x.modulo_id === modId)
    return p?.porcentaje || 0
  }

  function isModCompletado(modId) {
    const p = progreso.find(x => x.modulo_id === modId)
    return p?.completado || false
  }

  const colors = ['#041E42','#1a2f4a','#2D3340','#1f3a5c','#3D2B1F','#1C3A2A','#3A1C1C','#243347']

  const heroBg = {
    cap: imgTruck1,
    rec: imgTruck2,
    exa: imgTruck1,
    ava: imgBuilding,
  }

  const heroTitles = {
    cap: { ey: 'Scania Perú · Programa de Formación Técnica', h1: 'Malla de Capacitación\nde Almacenes' },
    rec: { ey: 'Biblioteca técnica', h1: 'Recursos y Material' },
    exa: { ey: 'Evaluaciones pendientes', h1: 'Exámenes' },
    ava: { ey: 'Seguimiento personal', h1: 'Mi Avance' },
  }

  const progresoGeneral = calcularProgresoGeneral()
  const modulosActivos = examenes.filter(e => !e.archivado && e.estado === 'activo')

  return (
    <>
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
          {['cap','rec','exa','ava'].map((t, i) => (
            <button key={t} className={'nb' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
              {['Capacitaciones','Recursos','Exámenes','Mi Avance'][i]}
              {t === 'exa' && modulosActivos.length > 0 && (
                <span className="nbadge">{modulosActivos.length}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)', fontSize:'10px', padding:'3px 9px', border:'1px solid rgba(255,255,255,.14)', fontWeight:500 }}>
            {user.sucursales?.nombre || user.region}
          </span>
          <button className="admin-btn" onClick={() => onGoAdmin && onGoAdmin()}>⬡ Panel Admin</button>
        </div>
      </nav>

      {/* USER BAR */}
      <div style={{ background:'var(--graphite)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'.5rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />
          <div>
            <div style={{ fontSize:'11px', fontWeight:700, color:'#fff' }}>{user.nombre}</div>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,.4)' }}>{user.sucursales?.nombre} · {user.region}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'9px', color:'rgba(255,255,255,.35)', letterSpacing:'.04em', textTransform:'uppercase' }}>
            Código: <span style={{ color:'rgba(255,255,255,.6)', fontWeight:700 }}>{user.codigo}</span>
          </span>
          <button onClick={onLogout} style={{ background:'none', border:'1px solid rgba(255,255,255,.18)', color:'rgba(255,255,255,.45)', padding:'3px 10px', cursor:'pointer', fontSize:'9px', fontFamily:'inherit', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position:'relative', overflow:'hidden', height: tab === 'cap' ? '240px' : '160px', flexShrink:0 }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4px', background:'var(--red)', zIndex:3 }} />
        <img
          src={heroBg[tab]}
          alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 35%' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, rgba(4,30,66,0.96) 0%, rgba(4,30,66,0.82) 40%, rgba(4,30,66,0.35) 75%, transparent 100%)' }} />
        <div style={{ position:'relative', zIndex:2, padding:'1.7rem 2rem', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--red)', marginBottom:'.4rem' }}>
            {heroTitles[tab].ey}
          </div>
          <h1 style={{ fontSize: tab === 'cap' ? '24px' : '20px', fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom: tab === 'cap' ? '.8rem' : 0, letterSpacing:'-.4px', whiteSpace:'pre-line' }}>
            {heroTitles[tab].h1}
          </h1>
          {tab === 'cap' && (
            <div style={{ display:'flex', gap:0 }}>
              {[
                { n: progresoGeneral + '%', l:'Tu progreso' },
                { n: modulos.length,        l:'Módulos' },
                { n: progreso.filter(p => p.completado).length, l:'Completados' },
              ].map((s, i) => (
                <div key={i} style={{ paddingRight: i < 2 ? '1.2rem' : 0, borderRight: i < 2 ? '1px solid rgba(255,255,255,.14)' : 'none', marginRight: i < 2 ? '1.2rem' : 0 }}>
                  <div style={{ fontSize:'20px', fontWeight:800, color:'#fff', lineHeight:1 }}>
                    {s.n}<span style={{ color:'var(--red)' }}>.</span>
                  </div>
                  <div style={{ fontSize:'8.5px', color:'rgba(255,255,255,.45)', marginTop:'2px', textTransform:'uppercase', letterSpacing:'.07em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CAPACITACIONES */}
      {tab === 'cap' && (
        <>
          <div style={{ background:'#fff', borderBottom:'1px solid var(--g100)', padding:'.65rem 1.5rem', display:'flex', alignItems:'center', gap:'9px' }}>
            <span style={{ color:'var(--g400)', fontSize:'14px' }}>⌕</span>
            <input style={{ flex:1, border:'none', fontSize:'12px', color:'var(--navy)', outline:'none', fontFamily:'inherit' }} placeholder="Buscar módulo o competencia..." />
          </div>
          <div className="sec">
            <div className="sec-lbl" style={{ marginBottom:'1rem' }}>Módulos de capacitación</div>
            {loading ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'var(--g400)', fontSize:'12px' }}>Cargando módulos...</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1px', background:'var(--g100)', border:'1px solid var(--g100)' }}>
                {modulos.map((m, i) => {
                  const p = getModProg(m.id)
                  const completado = isModCompletado(m.id)
                  return (
                    <div
                      key={m.id}
                      onClick={() => onOpenMod(m)}
                      style={{ position:'relative', height:'180px', overflow:'hidden', cursor:'pointer', background: m.color || colors[i % colors.length] }}>
                      {m.imagen_url && (
                        <img src={m.imagen_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      )}
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(4,30,66,0.97) 0%, rgba(4,30,66,0.65) 55%, rgba(4,30,66,0.18) 100%)' }} />
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:'var(--red)', transform: completado ? 'scaleX(1)' : 'scaleX(0)', transformOrigin:'left', transition:'transform .3s' }} />
                      {completado && (
                        <div style={{ position:'absolute', top:'10px', right:'10px', background:'#276749', color:'#fff', fontSize:'8px', fontWeight:700, padding:'2px 7px', letterSpacing:'.06em', zIndex:3 }}>COMPLETADO</div>
                      )}
                      <div style={{ position:'absolute', inset:0, padding:'1.1rem', display:'flex', flexDirection:'column', justifyContent:'flex-end', zIndex:2 }}>
                        <div style={{ fontSize:'28px', marginBottom:'auto', opacity:.9 }}>{m.icono}</div>
                        <div>
                          <div style={{ fontSize:'8px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:'4px' }}>{m.categoria}</div>
                          <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', lineHeight:1.25, marginBottom:'8px' }}>{m.titulo}</div>
                          <div style={{ height:'2px', background:'rgba(255,255,255,.18)' }}>
                            <div style={{ height:'100%', width: p + '%', background:'var(--red)', transition:'width .6s' }} />
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'5px' }}>
                            <span style={{ fontSize:'9px', color:'rgba(255,255,255,.75)', fontWeight:600 }}>{p}% completado</span>
                            <span style={{ fontSize:'9px', color:'rgba(255,255,255,.38)' }}>{(m.lecciones || []).length} lecciones</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {modulos.length === 0 && (
                  <div style={{ gridColumn:'1/-1', padding:'3rem', textAlign:'center', color:'var(--g400)', fontSize:'12px' }}>
                    No hay módulos publicados aún.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* RECURSOS */}
      {tab === 'rec' && (
        <div className="sec">
          <div className="sec-lbl" style={{ marginBottom:'1rem' }}>Documentos y videos disponibles</div>
          {material.filter(m => !m.archivado && m.estado === 'activo').map(m => (
            <div key={m.id} className="li">
              <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'14px' }}>
                {m.tipo === 'pdf' ? '📄' : '▶'}
              </div>
              <div className="lin">
                <div className="lt">{m.titulo}</div>
                <div className="lm">{m.modulos?.titulo} · {m.tipo.toUpperCase()}{m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}</div>
              </div>
              <a href={m.url} target="_blank" rel="noreferrer">
                <button className="btn-g btn-sm">{m.tipo === 'pdf' ? 'Descargar' : 'Ver video'}</button>
              </a>
            </div>
          ))}
          {material.filter(m => !m.archivado && m.estado === 'activo').length === 0 && (
            <div style={{ fontSize:'12px', color:'var(--g400)', padding:'1rem 0' }}>No hay material disponible aún.</div>
          )}
        </div>
      )}

      {/* EXÁMENES */}
      {tab === 'exa' && (
        <div className="sec">
          <div className="sec-lbl" style={{ marginBottom:'1rem' }}>Por rendir</div>
          {examenes.filter(e => !e.archivado && e.estado === 'activo').map(e => (
            <div key={e.id} className="li">
              <div className="lic lq" style={{ fontSize:'14px' }}>✎</div>
              <div className="lin">
                <div className="lt">{e.titulo}</div>
                <div className="lm">{e.modulos?.titulo} · {(e.preguntas || []).length} preguntas</div>
              </div>
              <button className="btn-p" style={{ padding:'7px 14px' }}>Rendir examen</button>
            </div>
          ))}
          {examenes.filter(e => !e.archivado && e.estado === 'activo').length === 0 && (
            <div style={{ fontSize:'12px', color:'var(--g400)', padding:'1rem 0' }}>No hay exámenes disponibles aún.</div>
          )}
        </div>
      )}

      {/* MI AVANCE */}
      {tab === 'ava' && (
        <div className="sec">
          {/* Resumen general */}
          <div style={{ background:'#fff', border:'1px solid var(--g200)', padding:'1.2rem 1.4rem', marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'1.5rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'36px', fontWeight:800, color:'var(--navy)', lineHeight:1 }}>{progresoGeneral}<span style={{ fontSize:'18px', color:'var(--red)' }}>%</span></div>
              <div style={{ fontSize:'9px', color:'var(--g400)', textTransform:'uppercase', letterSpacing:'.07em', marginTop:'3px' }}>Progreso general</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ height:'6px', background:'var(--g100)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width: progresoGeneral + '%', background:'var(--red)', borderRadius:'3px', transition:'width .6s' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ fontSize:'10px', color:'var(--g400)' }}>{progreso.filter(p => p.completado).length} módulos completados</span>
                <span style={{ fontSize:'10px', color:'var(--g400)' }}>{modulos.length} módulos totales</span>
              </div>
            </div>
          </div>

          <div className="sec-lbl" style={{ marginBottom:'.8rem' }}>Avance por módulo</div>
          {modulos.map(m => {
            const p = getModProg(m.id)
            const completado = isModCompletado(m.id)
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'.8rem 0', borderBottom:'1px solid var(--g100)' }}>
                <div style={{ fontSize:'20px', width:'28px', textAlign:'center', flexShrink:0 }}>{m.icono}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'var(--navy)' }}>{m.titulo}</div>
                    {completado && <span style={{ fontSize:'8px', fontWeight:700, padding:'2px 7px', background:'#F0FFF5', color:'#276749', letterSpacing:'.05em', textTransform:'uppercase' }}>Completado</span>}
                  </div>
                  <div style={{ height:'4px', background:'var(--g100)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width: p + '%', background: completado ? '#276749' : 'var(--red)', borderRadius:'2px', transition:'width .6s' }} />
                  </div>
                </div>
                <div style={{ fontSize:'12px', fontWeight:700, color: completado ? '#276749' : 'var(--g600)', minWidth:'36px', textAlign:'right' }}>{p}%</div>
              </div>
            )
          })}
          {modulos.length === 0 && (
            <div style={{ fontSize:'12px', color:'var(--g400)', padding:'1rem 0' }}>No hay módulos disponibles aún.</div>
          )}
        </div>
      )}
    </>
  )
}
