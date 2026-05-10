import { useState, useEffect } from 'react'
import { getMaterial, getExamenes, marcarLeccionVista } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function ModulePage({ mod, user, onBack, onStartQuiz, onGoAdmin }) {
  const [tab, setTab]         = useState('lecciones')
  const [material, setMaterial] = useState([])
  const [examenes, setExamenes] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function cargar() {
      const [mats, exams] = await Promise.all([
        getMaterial(),
        getExamenes(),
      ])
      // Filtrar solo los asociados a este módulo
      const matDelModulo  = mats.filter(m => m.modulo_id === mod.id && !m.archivado && m.estado === 'activo')
      const examDelModulo = exams.filter(e => e.modulo_id === mod.id && !e.archivado && e.estado === 'activo')
      setMaterial(matDelModulo)
      setExamenes(examDelModulo)
      setLoading(false)
    }
    cargar()
  }, [mod.id])

  async function handleAbrirMaterial(mat) {
    if (user && mat.id) {
      await marcarLeccionVista(user.id, mat.id)
    }
    if (mat.url) {
      window.open(mat.url, '_blank')
    }
  }

  function handleIniciarExamen(examen) {
    onStartQuiz(examen)
  }

  const tabs = [
    { key: 'lecciones', label: 'Lecciones' },
    { key: 'evaluacion', label: 'Evaluación' },
    { key: 'recursos',   label: 'Recursos'   },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

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
        <button className="admin-btn" onClick={() => onGoAdmin && onGoAdmin()}>
          ⬡ Panel Admin
        </button>
      </nav>

      {/* HEADER DEL MÓDULO */}
      <div style={{ background: 'var(--navy)', padding: '.9rem 1.4rem', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ fontSize: '9.5px', color: 'rgba(255,255,255,.45)', cursor: 'pointer', marginBottom: '.6rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>
          ← Volver al inicio
        </button>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
          {mod.icono} {mod.titulo}
        </h2>
        <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,.5)' }}>
          {mod.categoria} · {mod.descripcion}
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid var(--g100)', padding: '0 1.3rem', flexShrink: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 13px',
              fontSize: '9.5px',
              fontWeight: 600,
              cursor: 'pointer',
              color: tab === t.key ? 'var(--red)' : 'var(--g400)',
              borderBottom: tab === t.key ? '2px solid var(--red)' : '2px solid transparent',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--red)' : '2px solid transparent',
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="sec" style={{ flex: 1 }}>

        {/* LECCIONES */}
        {tab === 'lecciones' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Contenido del módulo</div>

            {loading && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>Cargando contenido...</div>
            )}

            {!loading && material.length === 0 && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>
                El administrador aún no ha cargado lecciones para este módulo.
              </div>
            )}

            {!loading && material.map(m => (
              <div
                key={m.id}
                className="li"
                onClick={() => handleAbrirMaterial(m)}
                style={{ cursor: 'pointer' }}>
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize: '13px' }}>
                  {m.tipo === 'pdf' ? '📄' : '▶'}
                </div>
                <div className="lin">
                  <div className="lt">{m.titulo}</div>
                  <div className="lm">
                    {m.tipo === 'pdf' ? 'PDF' : 'Video / Link'}
                    {m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}
                  </div>
                </div>
                <span className="lst lst-pend">
                  {m.tipo === 'pdf' ? 'Descargar' : 'Ver'}
                </span>
              </div>
            ))}
          </>
        )}

        {/* EVALUACIÓN */}
        {tab === 'evaluacion' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Evaluación de competencia</div>

            {loading && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>Cargando exámenes...</div>
            )}

            {!loading && examenes.length === 0 && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>
                El administrador aún no ha publicado un examen para este módulo.
              </div>
            )}

            {!loading && examenes.map(e => (
              <div key={e.id} className="li" style={{ cursor: 'pointer' }} onClick={() => handleIniciarExamen(e)}>
                <div className="lic lq" style={{ fontSize: '13px' }}>✎</div>
                <div className="lin">
                  <div className="lt">{e.titulo}</div>
                  <div className="lm">
                    {(e.preguntas || []).length} preguntas · Resultado guardado automáticamente
                  </div>
                </div>
                <button className="btn-p" style={{ padding: '7px 14px', fontSize: '9.5px' }}>
                  Iniciar examen
                </button>
              </div>
            ))}
          </>
        )}

        {/* RECURSOS */}
        {tab === 'recursos' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Material de referencia</div>

            {loading && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>Cargando recursos...</div>
            )}

            {!loading && material.length === 0 && (
              <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>
                No hay material disponible para este módulo.
              </div>
            )}

            {!loading && material.map(m => (
              <div key={m.id} className="li">
                <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize: '13px' }}>
                  {m.tipo === 'pdf' ? '📄' : '▶'}
                </div>
                <div className="lin">
                  <div className="lt">{m.titulo}</div>
                  <div className="lm">
                    {m.tipo === 'pdf' ? 'PDF' : 'Video / Link'}
                    {m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}
                  </div>
                </div>
                <a href={m.url} target="_blank" rel="noreferrer">
                  <button className="btn-g btn-sm">
                    {m.tipo === 'pdf' ? 'Descargar' : 'Ver'}
                  </button>
                </a>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  )
}
