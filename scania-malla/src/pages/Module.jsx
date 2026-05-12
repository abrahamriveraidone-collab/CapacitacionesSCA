import { useState, useEffect } from 'react'
import { getMaterial, getExamenes, getSubcarpetas, marcarLeccionVista, actualizarProgreso } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

function SubcarpetaItem({ sub, nivel, onAbrirArchivo }) {
  const [expandida, setExpandida] = useState(false)
  const archivos = sub.material_subcarpeta || []
  const subSubs  = sub.hijos || []
  const indent   = nivel * 16

  return (
    <div style={{ marginBottom:'4px' }}>
      {/* Cabecera de la carpeta */}
      <div
        onClick={() => setExpandida(!expandida)}
        style={{ display:'flex', alignItems:'center', gap:'8px', padding:'.6rem .9rem', background: nivel === 0 ? 'var(--g50)' : '#fff', border:'1px solid var(--g200)', borderLeft: '3px solid ' + (nivel === 0 ? 'var(--navy)' : 'var(--g200)'), cursor:'pointer', marginLeft: indent + 'px', transition:'background .15s' }}>
        <span style={{ fontSize:'13px', color: nivel === 0 ? 'var(--navy)' : 'var(--g400)', transition:'transform .2s', display:'inline-block', transform: expandida ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        <span style={{ fontSize:'13px' }}>📁</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:'var(--navy)' }}>{sub.nombre}</div>
          {sub.descripcion && (
            <div style={{ fontSize:'9.5px', color:'var(--g400)', marginTop:'1px' }}>{sub.descripcion}</div>
          )}
        </div>
        <span style={{ fontSize:'9.5px', color:'var(--g400)' }}>
          {archivos.length + subSubs.length} elemento{archivos.length + subSubs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contenido expandido */}
      {expandida && (
        <div style={{ marginLeft: (indent + 16) + 'px', marginTop:'2px' }}>
          {/* Archivos dentro de esta carpeta */}
          {archivos.map(mat => (
            <div
              key={mat.id}
              className="li"
              onClick={() => onAbrirArchivo(mat)}
              style={{ cursor:'pointer', borderLeft:'3px solid transparent' }}>
              <div className={'lic ' + (mat.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'13px' }}>
                {mat.tipo === 'pdf' ? '📄' : '🔗'}
              </div>
              <div className="lin">
                <div className="lt">{mat.titulo}</div>
                <div className="lm">
                  {mat.tipo === 'pdf' ? 'PDF' : 'Link'}
                  {mat.tamano_mb ? ' · ' + mat.tamano_mb + ' MB' : ''}
                </div>
              </div>
              <span style={{ fontSize:'9px', color:'var(--red)', fontWeight:600 }}>
                {mat.tipo === 'pdf' ? 'Descargar' : 'Ver'}
              </span>
            </div>
          ))}

          {/* Sub-subcarpetas recursivas */}
          {subSubs.map(subsub => (
            <SubcarpetaItem
              key={subsub.id}
              sub={subsub}
              nivel={nivel + 1}
              onAbrirArchivo={onAbrirArchivo}
            />
          ))}

          {archivos.length === 0 && subSubs.length === 0 && (
            <div style={{ fontSize:'10.5px', color:'var(--g400)', padding:'.5rem .9rem', fontStyle:'italic' }}>
              Carpeta vacía
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Construir árbol anidado de subcarpetas
function buildTree(flat) {
  const map = {}
  flat.forEach(s => { map[s.id] = { ...s, hijos: [] } })
  const roots = []
  flat.forEach(s => {
    if (s.parent_id && map[s.parent_id]) {
      map[s.parent_id].hijos.push(map[s.id])
    } else {
      roots.push(map[s.id])
    }
  })
  return roots
}

export default function ModulePage({ mod, user, onBack, onStartQuiz, onGoAdmin }) {
  const [tab, setTab]             = useState('lecciones')
  const [material, setMaterial]   = useState([])
  const [examenes, setExamenes]   = useState([])
  const [subcarpetas, setSubs]    = useState([])
  const [vistos, setVistos]       = useState(new Set())
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function cargar() {
      const [mats, exams, subs] = await Promise.all([
        getMaterial(),
        getExamenes(),
        getSubcarpetas(mod.id),
      ])
      setMaterial(mats.filter(m => m.modulo_id === mod.id && !m.archivado && m.estado === 'activo'))
      setExamenes(exams.filter(e => e.modulo_id === mod.id && !e.archivado && e.estado === 'activo'))
      setSubs(subs)
      setLoading(false)
    }
    cargar()
  }, [mod.id])

  async function handleAbrirArchivo(mat) {
    if (user && mat.id && !vistos.has(mat.id)) {
      await marcarLeccionVista(user.id, mat.id)
      const nuevos = new Set(vistos)
      nuevos.add(mat.id)
      setVistos(nuevos)
      const tieneExamen = examenes.length > 0
      const porcentaje  = tieneExamen ? 30 : 50
      await actualizarProgreso(user.id, mod.id, porcentaje, false)
    }
    if (mat.url) window.open(mat.url, '_blank')
  }

  const arbolSubs  = buildTree(subcarpetas)
  const hayContenido = material.length > 0 || arbolSubs.length > 0

  const tabs = [
    { key:'lecciones', label:'Lecciones'  },
    { key:'evaluacion', label:'Evaluación' },
    { key:'recursos',   label:'Recursos'   },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

      {/* NAV */}
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text">
            <span className="logo-main">Scania</span>
            <span className="logo-sub">Malla de Capacitación de Almacenes</span>
          </div>
        </div>
        <div />
        <button className="admin-btn" onClick={() => onGoAdmin && onGoAdmin()}>⬡ Panel Admin</button>
      </nav>

      {/* HEADER */}
      <div style={{ background:'var(--navy)', padding:'1.2rem 1.5rem', flexShrink:0, borderBottom:'2px solid var(--red)' }}>
        <button
          onClick={onBack}
          style={{ fontSize:'9.5px', color:'rgba(255,255,255,.45)', cursor:'pointer', marginBottom:'.7rem', display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', fontFamily:'inherit', letterSpacing:'.04em', textTransform:'uppercase', fontWeight:600 }}>
          ← Volver al inicio
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ fontSize:'48px', lineHeight:1, flexShrink:0 }}>{mod.icono}</div>
          <div>
            <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:'4px' }}>{mod.categoria}</div>
            <h2 style={{ fontSize:'18px', fontWeight:800, color:'#fff', marginBottom:'4px', letterSpacing:'-.3px' }}>{mod.titulo}</h2>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,.5)' }}>{mod.descripcion}</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', background:'#fff', borderBottom:'1px solid var(--g100)', padding:'0 1.4rem', flexShrink:0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'11px 14px',
              fontSize:'10px',
              fontWeight:600,
              cursor:'pointer',
              color: tab === t.key ? 'var(--red)' : 'var(--g400)',
              borderBottom: tab === t.key ? '2px solid var(--red)' : '2px solid transparent',
              letterSpacing:'.05em',
              textTransform:'uppercase',
              background:'none',
              border:'none',
              fontFamily:'inherit',
              transition:'all .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="sec" style={{ flex:1 }}>

        {/* LECCIONES */}
        {tab === 'lecciones' && (
          <>
            <div className="sec-lbl" style={{ marginBottom:'.9rem' }}>Contenido del módulo</div>

            {loading && <div style={{ fontSize:'12px', color:'var(--g400)' }}>Cargando contenido...</div>}

            {!loading && !hayContenido && (
              <div style={{ fontSize:'12px', color:'var(--g400)', padding:'.5rem 0' }}>
                El administrador aún no ha cargado contenido para este módulo.
              </div>
            )}

            {/* Material directo del módulo */}
            {!loading && material.map(m => (
              <div key={m.id} className="li" onClick={() => handleAbrirArchivo(m)} style={{ cursor:'pointer' }}>
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'13px' }}>
                  {m.tipo === 'pdf' ? '📄' : '▶'}
                </div>
                <div className="lin">
                  <div className="lt">{m.titulo}</div>
                  <div className="lm">{m.tipo === 'pdf' ? 'PDF' : 'Video / Link'}{m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}</div>
                </div>
                <span className={'lst ' + (vistos.has(m.id) ? 'lst-ok' : 'lst-pend')}>
                  {vistos.has(m.id) ? 'Visto ✓' : m.tipo === 'pdf' ? 'Descargar' : 'Ver'}
                </span>
              </div>
            ))}

            {/* Árbol de subcarpetas */}
            {!loading && arbolSubs.length > 0 && (
              <div style={{ marginTop: material.length > 0 ? '1rem' : 0 }}>
                {arbolSubs.map(sub => (
                  <SubcarpetaItem
                    key={sub.id}
                    sub={sub}
                    nivel={0}
                    onAbrirArchivo={handleAbrirArchivo}
                  />
                ))}
              </div>
            )}

            {/* Examen al final de lecciones */}
            {!loading && examenes.length > 0 && (
              <div style={{ marginTop:'1rem', borderTop:'1px solid var(--g100)', paddingTop:'1rem' }}>
                {examenes.map(e => (
                  <div key={e.id} className="li" onClick={() => onStartQuiz(e)} style={{ cursor:'pointer' }}>
                    <div className="lic lq" style={{ fontSize:'13px' }}>✎</div>
                    <div className="lin">
                      <div className="lt">{e.titulo}</div>
                      <div className="lm">{(e.preguntas || []).length} preguntas · Máx. {Math.floor((e.tiempo_limite || 600) / 60)} minutos</div>
                    </div>
                    <button className="btn-p" style={{ padding:'6px 14px', fontSize:'9.5px' }}>Iniciar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* EVALUACIÓN */}
        {tab === 'evaluacion' && (
          <>
            <div className="sec-lbl" style={{ marginBottom:'.9rem' }}>Evaluación de competencia</div>
            {loading && <div style={{ fontSize:'12px', color:'var(--g400)' }}>Cargando...</div>}
            {!loading && examenes.length === 0 && (
              <div style={{ fontSize:'12px', color:'var(--g400)', padding:'.5rem 0' }}>
                El administrador aún no ha publicado un examen para este módulo.
              </div>
            )}
            {!loading && examenes.map(e => (
              <div key={e.id} style={{ background:'#fff', border:'1px solid var(--g200)', padding:'1.2rem 1.4rem', marginBottom:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'var(--navy)', marginBottom:'4px' }}>{e.titulo}</div>
                    <div style={{ fontSize:'10px', color:'var(--g400)' }}>
                      {(e.preguntas || []).length} preguntas · {Math.floor((e.tiempo_limite || 600) / 60)} minutos · Máx. {e.intentos_max || 2} intentos · Nota mínima: {e.nota_minima || 14}/20
                    </div>
                  </div>
                  <button className="btn-p" style={{ padding:'9px 20px' }} onClick={() => onStartQuiz(e)}>
                    Iniciar examen
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* RECURSOS */}
        {tab === 'recursos' && (
          <>
            <div className="sec-lbl" style={{ marginBottom:'.9rem' }}>Material de referencia</div>
            {loading && <div style={{ fontSize:'12px', color:'var(--g400)' }}>Cargando...</div>}
            {!loading && material.length === 0 && arbolSubs.length === 0 && (
              <div style={{ fontSize:'12px', color:'var(--g400)', padding:'.5rem 0' }}>No hay material disponible.</div>
            )}
            {!loading && material.map(m => (
              <div key={m.id} className="li">
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'13px' }}>
                  {m.tipo === 'pdf' ? '📄' : '▶'}
                </div>
                <div className="lin">
                  <div className="lt">{m.titulo}</div>
                  <div className="lm">{m.tipo === 'pdf' ? 'PDF' : 'Video / Link'}{m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}</div>
                </div>
                <a href={m.url} target="_blank" rel="noreferrer">
                  <button className="btn-g btn-sm">{m.tipo === 'pdf' ? 'Descargar' : 'Ver'}</button>
                </a>
              </div>
            ))}
            {!loading && arbolSubs.length > 0 && (
              <div style={{ marginTop: material.length > 0 ? '1rem' : 0 }}>
                {arbolSubs.map(sub => (
                  <SubcarpetaItem
                    key={sub.id}
                    sub={sub}
                    nivel={0}
                    onAbrirArchivo={handleAbrirArchivo}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
