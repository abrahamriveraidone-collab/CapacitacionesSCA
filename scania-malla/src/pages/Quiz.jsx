import { useState } from 'react'
import { guardarResultadoExamen } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function QuizPage({ exam, user, mod, onBack }) {
  const preguntas = exam?.preguntas || []
  const [q, setQ]           = useState(0)
  const [respuestas, setResp] = useState([])
  const [seleccion, setSel]  = useState(null)
  const [guardado, setGuardado] = useState(false)

  const total = preguntas.length

  async function handleSiguiente() {
    if (seleccion === null) return
    const nuevas = [...respuestas, seleccion]
    setResp(nuevas)
    setSel(null)
    if (q + 1 < total) {
      setQ(q + 1)
    } else {
      // Calcular resultado y guardar automáticamente
      const correctas = nuevas.filter((r, i) => r === preguntas[i].correcta).length
      const puntaje   = Math.round((correctas / total) * 100)
      const aprobado  = puntaje >= 70
      if (user && exam) {
        await guardarResultadoExamen({
          almacenero_id: user.id,
          examen_id:     exam.id,
          modulo_id:     mod?.id,
          puntaje,
          aprobado,
          respuestas:    nuevas,
        })
      }
      setGuardado(true)
      setQ(total) // trigger result screen
    }
  }

  const correctas  = respuestas.filter((r, i) => r === preguntas[i]?.correcta).length
  const puntaje    = total > 0 ? Math.round((correctas / total) * 100) : 0
  const aprobado   = puntaje >= 70
  const curPregunta = preguntas[q]
  const opts = curPregunta ? ['a','b','c','d'].map(k => ({ key: k, texto: curPregunta[`opcion_${k}`] })) : []

  return (
    <>
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text"><span className="logo-main">Scania</span><span className="logo-sub">Malla de Capacitación de Almacenes</span></div>
        </div>
        <div />
        <button className="btn-gw" onClick={onBack}>Salir del examen</button>
      </nav>

      <div style={{ padding: '1.2rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--g50)', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ background: '#fff', border: '1px solid var(--g200)', maxWidth: '480px', width: '100%' }}>

          {q < total && !guardado ? (
            <>
              <div style={{ background: 'var(--navy)', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                  Pregunta {q + 1} de {total}{user ? ` · ${user.nombre}` : ''}
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#fff' }}>{Math.round((q / total) * 100)}% completado</div>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,.1)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(q / total) * 100}%`, background: 'var(--red)', transition: 'width .4s' }} />
              </div>

              <div style={{ padding: '1.1rem' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)', marginBottom: '.85rem', lineHeight: 1.4 }}>
                  {curPregunta?.texto}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {opts.map(o => (
                    <button key={o.key} className="qopt" style={{ borderLeftColor: seleccion === o.key ? 'var(--navy)' : 'transparent', background: seleccion === o.key ? 'var(--g50)' : '#fff' }} onClick={() => setSel(o.key)}>
                      {o.key.toUpperCase()}.&nbsp;&nbsp;{o.texto}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '.75rem 1.1rem', borderTop: '1px solid var(--g100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--g50)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--g400)' }}>Selecciona una opción para continuar</span>
                <button className="btn-p" disabled={seleccion === null} onClick={handleSiguiente}>
                  {q + 1 < total ? 'Siguiente pregunta' : 'Ver resultado'}
                </button>
              </div>
            </>
          ) : (
            // Resultado
            <>
              <div style={{ background: 'var(--navy)', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                  Resultado · {guardado ? 'guardado automáticamente ✓' : ''}
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#fff' }}>{mod?.titulo || 'Examen'}</div>
              </div>
              <div style={{ padding: '1.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: aprobado ? '#276749' : 'var(--red)', marginBottom: '.4rem' }}>
                  {aprobado ? 'Aprobado' : 'No aprobado'}
                </div>
                <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--navy)', lineHeight: 1, marginBottom: '.25rem' }}>
                  {puntaje}<span style={{ fontSize: '18px' }}>%</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--g400)', marginBottom: '.5rem' }}>
                  {correctas} de {total} respuestas correctas
                </div>
                {guardado && (
                  <div style={{ fontSize: '9.5px', color: '#276749', fontWeight: 600, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>✓</span> Resultado guardado en tu perfil automáticamente
                  </div>
                )}
                <div style={{ display: 'flex', gap: '7px', justifyContent: 'center' }}>
                  <button className="btn-g" onClick={onBack}>Volver al módulo</button>
                  {!aprobado && <button className="btn-p" onClick={() => { setQ(0); setResp([]); setSel(null); setGuardado(false); }}>Reintentar</button>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
