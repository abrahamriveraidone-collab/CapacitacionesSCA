import { useState, useEffect, useRef } from 'react'
import {
  guardarResultadoExamen,
  actualizarProgreso,
  getIntentosPorExamen,
  crearSolicitudIntentos,
  getSolicitudesIntentos,
} from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

const AVISO_FALTANTE = 120

export default function QuizPage({ exam, user, mod, onBack }) {
  const preguntas   = exam?.preguntas || []
  const total       = preguntas.length
  const tiempoMax   = exam?.tiempo_limite || 600
  const intentosMax = exam?.intentos_max  || 2
  const notaMin     = exam?.nota_minima   || 14

  const [q, setQ]               = useState(0)
  const [respuestas, setResp]   = useState([])
  const [seleccion, setSel]     = useState(null)
  const [respondida, setRes]    = useState(false)
  const [terminado, setTerm]    = useState(false)
  const [guardado, setGuard]    = useState(false)
  const [tiempoLeft, setTime]   = useState(tiempoMax)
  const [aviso, setAviso]       = useState(false)
  const [intentosUsados, setIntentosUsados] = useState(0)
  const [intentosDisp, setIntentosDisp]     = useState(intentosMax)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)
  const [notaFinal, setNotaFinal] = useState(0)
  const [correctasFinal, setCorrectasFinal] = useState(0)
  const [aprobadoFinal, setAprobadoFinal] = useState(false)

  // refs para que el timer acceda a los valores actuales sin stale closure
  const respRef    = useRef([])
  const terminRef  = useRef(false)
  const timerRef   = useRef(null)
  const inicioRef  = useRef(Date.now())

  function calcularNota(correctas, tot) {
    if (tot === 0) return 0
    return Math.round((correctas / tot) * 20)
  }

  function formatTiempo(seg) {
    const m = Math.floor(seg / 60)
    const s = seg % 60
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  // Cargar intentos disponibles (base + extras aprobados)
  useEffect(() => {
    async function cargar() {
      if (!user || !exam) return
      const usados = await getIntentosPorExamen(user.id, exam.id)
      const todas  = await getSolicitudesIntentos()
      const aprobadas = todas.filter(s =>
        s.almacenero_id === user.id &&
        s.examen_id     === exam.id &&
        s.estado        === 'aprobado'
      )
      const extras = aprobadas.reduce((sum, s) => sum + (s.intentos_extra || 0), 0)
      setIntentosUsados(usados)
      setIntentosDisp(intentosMax + extras)
    }
    cargar()
  }, [user, exam])

  // Timer — usa ref para evitar stale closure
  useEffect(() => {
    if (total === 0) return
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (terminRef.current) {
          clearInterval(timerRef.current)
          return prev
        }
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Cerrar con lo que se haya respondido hasta ahora
          cerrarExamen(respRef.current)
          return 0
        }
        if (prev === AVISO_FALTANTE + 1) setAviso(true)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [total])

  async function cerrarExamen(resps) {
    if (terminRef.current) return  // evitar doble llamada
    terminRef.current = true
    clearInterval(timerRef.current)

    // Rellenar preguntas no respondidas con null para calcular correctamente
    const respsCompletas = preguntas.map((_, i) => resps[i] || null)
    const correctas      = respsCompletas.filter((r, i) => r !== null && r === preguntas[i]?.correcta).length
    const nota           = calcularNota(correctas, total)
    const aprobado       = nota >= notaMin
    const tiempoUsado    = Math.round((Date.now() - inicioRef.current) / 1000)

    setNotaFinal(nota)
    setCorrectasFinal(correctas)
    setAprobadoFinal(aprobado)

    if (user && exam) {
      await guardarResultadoExamen({
        almacenero_id:   user.id,
        examen_id:       exam.id,
        modulo_id:       mod?.id,
        puntaje:         Math.round((correctas / total) * 100),
        nota_vigesimal:  nota,
        aprobado,
        respuestas:      respsCompletas,
        tiempo_segundos: tiempoUsado,
        intento_numero:  intentosUsados + 1,
      })
      if (aprobado && mod?.id) {
        await actualizarProgreso(user.id, mod.id, 100, true)
      }
    }

    setResp(respsCompletas)
    setGuard(true)
    setTerm(true)
    setAviso(false)
  }

  function selOpt(opcion) {
    if (respondida) return
    setSel(opcion)
    setRes(true)
    const nuevas = [...respRef.current, opcion]
    respRef.current = nuevas
  }

  function siguientePregunta() {
    if (!respondida) return
    // Si es la última pregunta, cerrar el examen con las respuestas actuales
    if (q + 1 >= total) {
      cerrarExamen(respRef.current)
      return
    }
    setQ(prev => prev + 1)
    setSel(null)
    setRes(false)
  }

  // Colores del timer
  const pctTiempo  = (tiempoLeft / tiempoMax) * 100
  const colorTimer = tiempoLeft <= AVISO_FALTANTE ? 'var(--red)' : tiempoLeft <= 180 ? '#D97706' : '#276749'

  // ── PANTALLA DE RESULTADO ──
  if (terminado) {
    const bloqueado = intentosUsados + 1 >= intentosDisp

    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <nav>
          <div className="logo">
            <img src={logoSrc} alt="Scania" />
            <div className="logo-text">
              <span className="logo-main">Scania</span>
              <span className="logo-sub">Malla de Capacitación de Almacenes</span>
            </div>
          </div>
          <div />
          <button className="btn-gw" onClick={onBack}>Volver al módulo</button>
        </nav>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--g50)', padding:'2rem' }}>
          <div style={{ background:'#fff', border:'1px solid var(--g200)', width:'100%', maxWidth:'460px' }}>

            <div style={{ background:'var(--navy)', padding:'.9rem 1.2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.5)' }}>
                Resultado {guardado ? '· guardado ✓' : ''}
              </div>
              <div style={{ fontSize:'10.5px', fontWeight:600, color:'#fff' }}>{exam?.titulo}</div>
            </div>

            <div style={{ padding:'2rem', textAlign:'center' }}>
              <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: aprobadoFinal ? '#276749' : 'var(--red)', marginBottom:'.5rem' }}>
                {aprobadoFinal ? '✓ Aprobado' : '✕ Desaprobado'}
              </div>
              <div style={{ fontSize:'64px', fontWeight:800, color: aprobadoFinal ? '#276749' : 'var(--red)', lineHeight:1, marginBottom:'.2rem' }}>
                {notaFinal}
              </div>
              <div style={{ fontSize:'11px', color:'var(--g400)', marginBottom:'.3rem' }}>de 20 puntos</div>
              <div style={{ fontSize:'10px', color:'var(--g600)', marginBottom:'1.2rem' }}>
                {correctasFinal} de {total} preguntas correctas · Nota mínima: {notaMin}
              </div>

              <div style={{ height:'6px', background:'var(--g100)', borderRadius:'3px', overflow:'hidden', marginBottom:'1.5rem' }}>
                <div style={{ height:'100%', width: (notaFinal / 20 * 100) + '%', background: aprobadoFinal ? '#276749' : 'var(--red)', borderRadius:'3px', transition:'width .8s' }} />
              </div>

              {guardado && (
                <div style={{ fontSize:'10px', color:'#276749', fontWeight:600, marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                  ✓ Resultado guardado automáticamente
                </div>
              )}

              <div style={{ fontSize:'10px', color:'var(--g400)', marginBottom:'1.2rem', background:'var(--g50)', padding:'.6rem', border:'1px solid var(--g100)' }}>
                Intento {intentosUsados + 1} de {intentosDisp}
                {bloqueado ? ' · Intentos agotados' : ' · ' + (intentosDisp - intentosUsados - 1) + ' intento(s) restante(s)'}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'center' }}>
                <button className="btn-g" onClick={onBack}>Volver al módulo</button>

                {/* Reintentar si hay intentos disponibles */}
                {!aprobadoFinal && !bloqueado && (
                  <button className="btn-p" onClick={() => window.location.reload()}>
                    Reintentar ({intentosDisp - intentosUsados - 1} intento{intentosDisp - intentosUsados - 1 !== 1 ? 's' : ''} restante{intentosDisp - intentosUsados - 1 !== 1 ? 's' : ''})
                  </button>
                )}

                {/* Solicitar más intentos si están bloqueados */}
                {bloqueado && !solicitudEnviada && (
                  <button
                    className="btn-g"
                    style={{ borderColor:'var(--red)', color:'var(--red)' }}
                    onClick={async () => {
                      await crearSolicitudIntentos({ almacenero_id: user.id, examen_id: exam.id, mensaje: '' })
                      setSolicitudEnviada(true)
                    }}>
                    Solicitar más intentos al administrador
                  </button>
                )}

                {solicitudEnviada && (
                  <div style={{ fontSize:'10px', color:'#276749', fontWeight:600 }}>
                    ✓ Solicitud enviada. El administrador revisará tu caso.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── EXAMEN BLOQUEADO antes de empezar ──
  if (total > 0 && intentosUsados >= intentosDisp) {
    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <nav>
          <div className="logo">
            <img src={logoSrc} alt="Scania" />
            <div className="logo-text">
              <span className="logo-main">Scania</span>
              <span className="logo-sub">Malla de Capacitación de Almacenes</span>
            </div>
          </div>
          <div />
          <button className="btn-gw" onClick={onBack}>Volver al módulo</button>
        </nav>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--g50)', padding:'2rem' }}>
          <div style={{ background:'#fff', border:'1px solid var(--g200)', width:'100%', maxWidth:'420px', textAlign:'center', padding:'2rem' }}>
            <div style={{ fontSize:'36px', marginBottom:'1rem' }}>🔒</div>
            <div style={{ fontSize:'14px', fontWeight:800, color:'var(--navy)', marginBottom:'.5rem' }}>Examen bloqueado</div>
            <div style={{ fontSize:'11px', color:'var(--g400)', marginBottom:'1.5rem', lineHeight:1.6 }}>
              Has utilizado todos tus intentos disponibles ({intentosUsados} de {intentosDisp}). Puedes solicitar más intentos al administrador.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'center' }}>
              <button className="btn-g" onClick={onBack}>Volver al módulo</button>
              {!solicitudEnviada && (
                <button
                  className="btn-g"
                  style={{ borderColor:'var(--red)', color:'var(--red)' }}
                  onClick={async () => {
                    await crearSolicitudIntentos({ almacenero_id: user.id, examen_id: exam.id, mensaje: '' })
                    setSolicitudEnviada(true)
                  }}>
                  Solicitar más intentos
                </button>
              )}
              {solicitudEnviada && (
                <div style={{ fontSize:'10px', color:'#276749', fontWeight:600 }}>
                  ✓ Solicitud enviada al administrador.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── EXAMEN EN CURSO ──
  const curPregunta = preguntas[q]
  const opciones    = curPregunta
    ? ['a','b','c','d']
        .map(k => ({ key: k, texto: curPregunta['opcion_' + k] }))
        .filter(o => o.texto && o.texto.trim())
    : []

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <nav>
        <div className="logo">
          <img src={logoSrc} alt="Scania" />
          <div className="logo-text">
            <span className="logo-main">Scania</span>
            <span className="logo-sub">Malla de Capacitación de Almacenes</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'7px', background: aviso ? '#FFF5F5' : 'rgba(255,255,255,.1)', padding:'6px 14px', border:'1px solid ' + (aviso ? '#fed7d7' : 'rgba(255,255,255,.2)') }}>
            <span style={{ fontSize:'13px' }}>⏱</span>
            <span style={{ fontSize:'14px', fontWeight:800, color: aviso ? 'var(--red)' : '#fff', letterSpacing:'.05em', fontFamily:'monospace' }}>
              {formatTiempo(tiempoLeft)}
            </span>
          </div>
          <button className="btn-gw" onClick={onBack}>Salir</button>
        </div>
      </nav>

      <div style={{ height:'4px', background:'rgba(255,255,255,.1)', flexShrink:0 }}>
        <div style={{ height:'100%', width: pctTiempo + '%', background:colorTimer, transition:'width 1s linear' }} />
      </div>

      {aviso && (
        <div style={{ background:'#FFF5F5', borderBottom:'2px solid var(--red)', padding:'.6rem 1.4rem', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'16px' }}>⚠️</span>
          <span style={{ fontSize:'11px', fontWeight:700, color:'var(--red)' }}>
            ¡Quedan menos de 2 minutos! El examen se cerrará automáticamente.
          </span>
        </div>
      )}

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--g50)', padding:'1.5rem' }}>
        <div style={{ background:'#fff', border:'1px solid var(--g200)', width:'100%', maxWidth:'520px' }}>

          <div style={{ background:'var(--navy)', padding:'.85rem 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.5)' }}>
              Pregunta {q + 1} de {total} · {user?.nombre}
            </div>
            <div style={{ fontSize:'10.5px', fontWeight:600, color:'#fff' }}>
              {Math.round((q / total) * 100)}% completado
            </div>
          </div>

          <div style={{ height:'3px', background:'rgba(0,0,0,.06)' }}>
            <div style={{ height:'100%', width: ((q / total) * 100) + '%', background:'var(--red)', transition:'width .4s' }} />
          </div>

          <div style={{ padding:'1.3rem 1.2rem' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'var(--navy)', marginBottom:'1rem', lineHeight:1.5 }}>
              {curPregunta?.texto}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {opciones.map(o => {
                let borderColor = 'transparent'
                let bg          = '#fff'
                let color       = 'var(--navy)'
                if (respondida) {
                  if (o.key === curPregunta.correcta)  { borderColor = '#276749'; bg = '#F0FFF5'; color = '#276749' }
                  else if (o.key === seleccion)         { borderColor = 'var(--red)'; bg = '#FFF5F5'; color = 'var(--red)' }
                }
                return (
                  <button
                    key={o.key}
                    onClick={() => selOpt(o.key)}
                    disabled={respondida}
                    style={{ border:'1px solid var(--g200)', borderLeft:'3px solid ' + borderColor, padding:'9px 12px', cursor: respondida ? 'default' : 'pointer', fontSize:'11px', textAlign:'left', color, background:bg, fontFamily:'inherit', transition:'all .15s' }}>
                    <span style={{ fontWeight:700, marginRight:'8px' }}>{o.key.toUpperCase()}.</span>
                    {o.texto}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ padding:'.8rem 1.2rem', borderTop:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--g50)' }}>
            <span style={{ fontSize:'9.5px', color:'var(--g400)' }}>
              {respondida && q + 1 < total ? 'Continúa con la siguiente' : !respondida ? 'Selecciona una opción' : ''}
            </span>
            <button
              className="btn-p"
              disabled={!respondida}
              onClick={siguientePregunta}
              style={{ opacity: !respondida ? .35 : 1 }}>
              {q + 1 >= total ? 'Finalizar examen ✓' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
