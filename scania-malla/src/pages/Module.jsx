// ============================================================
// Module.jsx — Detalle de módulo
// ============================================================
import { useState } from 'react'
import { marcarLeccionVista } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export function ModulePage({ mod, user, onBack, onStartQuiz }) {
  const [tab, setTab] = useState('lecciones')

  async function handleLeccion(lec) {
    if (user) await marcarLeccionVista(user.id, lec.id)
    window.open(lec.url, '_blank')
  }

  return (
    <>
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text"><span className="logo-main">Scania</span><span className="logo-sub">Malla de Capacitación de Almacenes</span></div>
        </div>
        <div />
        <button className="admin-btn" onClick={() => window.location.href = '/admin/login'}>⬡ Panel Admin</button>
      </nav>

      <div style={{ background: 'var(--navy)', padding: '.9rem 1.4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} style={{ fontSize: '9.5px', color: 'rgba(255,255,255,.4)', cursor: 'pointer', marginBottom: '.6rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>
            ← Volver al inicio
          </button>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{mod.titulo}</h2>
          <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,.5)' }}>{mod.categoria} · {mod.lecciones?.length || 0} lecciones · {mod.descripcion}</p>
        </div>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid var(--g100)', padding: '0 1.3rem' }}>
        {['lecciones','evaluacion','recursos'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 13px', fontSize: '9.5px', fontWeight: 600, cursor: 'pointer', borderBottom: `2px solid ${tab === t ? 'var(--red)' : 'transparent'}`, color: tab === t ? 'var(--red)' : 'var(--g400)', letterSpacing: '.05em', textTransform: 'uppercase', transition: 'all .15s', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--red)' : 'transparent'}`, fontFamily: 'inherit' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="sec">
        {tab === 'lecciones' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Contenido del módulo</div>
            {mod.lecciones?.length > 0
              ? mod.lecciones.sort((a,b) => a.orden - b.orden).map(l => (
                <div key={l.id} className="li" onClick={() => handleLeccion(l)}>
                  <div className={`lic ${l.tipo === 'pdf' ? 'lp' : l.tipo === 'video' ? 'lv' : 'lg'}`} style={{ fontSize: '11px' }}>
                    {l.tipo === 'pdf' ? '📄' : l.tipo === 'video' ? '▶' : '🔗'}
                  </div>
                  <div className="lin"><div className="lt">{l.titulo}</div><div className="lm">{l.tipo.toUpperCase()}</div></div>
                  <span className="lst lst-pend">Pendiente</span>
                </div>
              ))
              : <div style={{ fontSize: '11px', color: 'var(--g400)', padding: '.5rem 0' }}>Sin lecciones aún. El administrador está preparando el contenido.</div>
            }
            <div className="li li-clickable" onClick={onStartQuiz} style={{ marginTop: '6px', cursor: 'pointer' }}>
              <div className="lic lq" style={{ fontSize: '11px' }}>✎</div>
              <div className="lin"><div className="lt">Evaluación de competencia</div><div className="lm">Quiz · resultado guardado automáticamente</div></div>
              <span className="lst lst-pend">Pendiente</span>
            </div>
          </>
        )}
        {tab === 'evaluacion' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Evaluación</div>
            <p style={{ fontSize: '11px', color: 'var(--g400)', marginBottom: '.9rem' }}>Completa la evaluación para certificar tu competencia. El resultado se guarda automáticamente.</p>
            <button className="btn-p" onClick={onStartQuiz}>Iniciar evaluación</button>
          </>
        )}
        {tab === 'recursos' && (
          <>
            <div className="sec-lbl" style={{ marginBottom: '.8rem' }}>Material de referencia</div>
            <p style={{ fontSize: '11px', color: 'var(--g400)' }}>El material relacionado a este módulo está disponible en la pestaña Recursos.</p>
          </>
        )}
      </div>
    </>
  )
}

export default ModulePage
