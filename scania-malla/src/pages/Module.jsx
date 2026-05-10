import { useState, useEffect } from 'react'
import { getMaterial, getExamenes, marcarLeccionVista, actualizarProgreso } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function ModulePage({ mod, user, onBack, onStartQuiz, onGoAdmin }) {
  const [tab, setTab]           = useState('lecciones')
  const [material, setMaterial] = useState([])
  const [examenes, setExamenes] = useState([])
  const [vistos, setVistos]     = useState(new Set())
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function cargar() {
      const [mats, exams] = await Promise.all([getMaterial(), getExamenes()])
      const matDelMod  = mats.filter(m => m.modulo_id === mod.id && !m.archivado && m.estado === 'activo')
      const examDelMod = exams.filter(e => e.modulo_id === mod.id && !e.archivado && e.estado === 'activo')
      setMaterial(matDelMod)
      setExamenes(examDelMod)
      setLoading(false)
    }
    cargar()
  }, [mod.id])

  async function handleAbrirMaterial(mat) {
    if (user && !vistos.has(mat.id)) {
      // Marcar lección como vista
      await marcarLeccionVista(user.id, mat.id)
      const nuevosVistos = new Set(vistos)
      nuevosVistos.add(mat.id)
      setVistos(nuevosVistos)
      // Calcular nuevo progreso: cada PDF/link = 50% si no hay examen, 25% si hay examen
      const tieneExamen = examenes.length > 0
      const porPDF = tieneExamen ? 25 : 50
      const totalPDFs = material.length
      const vistosCount = nuevosVistos.size
      const porcentajePDFs = totalPDFs > 0 ? Math.round((vistosCount / totalPDFs) * porPDF * totalPDFs / totalPDFs) : 0
      const porcentaje = Math.min(porcentajePDFs, tieneExamen ? 50 : 100)
      await actualizarProgreso(user.id, mod.id, porcentaje, false)
    }
    if (mat.url) window.open(mat.url, '_blank')
  }

  const tabs = [
    { key:'lecciones', label:'Lecciones' },
    { key:'evaluacion', label:'Evaluación' },
    { key:'recursos',   label:'Recursos'  },
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
          {/* Ícono grande */}
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
            {!loading && material.length === 0 && (
              <div style={{ fontSize:'12px', color:'var(--g400)', padding:'.5rem 0' }}>
                El administrador aún no ha cargado lecciones para este módulo.
              </div>
            )}
            {!loading && material.map(m => (
              <div key={m.id} className="li" onClick={() => handleAbrirMaterial(m)} style={{ cursor:'pointer' }}>
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'15px' }}>
                  {m.tipo === 'pdf' ? '📄' : '▶'}
                </div>
                <div className="lin">
                  <div className="lt">{m.titulo}</div>
                  <div className="lm">{m.tipo === 'pdf' ? 'PDF' : 'Video / Link'}{m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}</div>
                </div>
                <span className={'lst ' + (vistos.has(m.id) ? 'lst-ok' : 'lst-pend')}>
                  {vistos.has(m.id) ? 'Visto' : m.tipo === 'pdf' ? 'Descargar' : 'Ver'}
                </span>
              </div>
            ))}
            {!loading && examenes.length > 0 && (
              <div style={{ marginTop:'8px' }}>
                {examenes.map(e => (
                  <div key={e.id} className="li" onClick={() => onStartQuiz(e)} style={{ cursor:'pointer' }}>
                    <div className="lic lq" style={{ fontSize:'15px' }}>✎</div>
                    <div className="lin">
                      <div className="lt">{e.titulo}</div>
                      <div className="lm">{(e.preguntas || []).length} preguntas · Resultado guardado automáticamente</div>
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
            {loading && <div style={{ fontSize:'12px', color:'var(--g400)' }}>Cargando exámenes...</div>}
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
                    <div style={{ fontSize:'10px', color:'var(--g400)' }}>{(e.preguntas || []).length} preguntas · El resultado se guarda automáticamente</div>
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
            {loading && <div style={{ fontSize:'12px', color:'var(--g400)' }}>Cargando recursos...</div>}
            {!loading && material.length === 0 && (
              <div style={{ fontSize:'12px', color:'var(--g400)', padding:'.5rem 0' }}>No hay material disponible para este módulo.</div>
            )}
            {!loading && material.map(m => (
              <div key={m.id} className="li">
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'15px' }}>
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
          </>
        )}

      </div>
    </div>
  )
}
