import { useState, useEffect, useRef } from 'react'
import { guardarResultadoExamen, actualizarProgreso, getIntentosPorExamen, crearSolicitudIntentos } from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

const TIEMPO_LIMITE   = 600  // 10 minutos en segundos
const AVISO_FALTANTE  = 120  // aviso cuando faltan 2 minutos

export default function QuizPage({ exam, user, mod, onBack }) {
  const preguntas   = exam?.preguntas || []
  const total       = preguntas.length
  const tiempoMax   = exam?.tiempo_limite || TIEMPO_LIMITE
  const intentosMax = exam?.intentos_max  || 2
  const notaMin     = exam?.nota_minima   || 14

  const [q, setQ]             = useState(0)
  const [respuestas, setResp] = useState([])
  const [seleccion, setSel]   = useState(null)
  const [respondida, setRes]  = useState(false)
  const [terminado, setTerm]  = useState(false)
  const [guardado, setGuard]  = useState(false)
  const [tiempoLeft, setTime] = useState(tiempoMax)
  const [aviso, setAviso]     = useState(false)
  const [intentosUsados, setIntentosUsados] = useState(0)
  const [puedeReintentar, setPuedeReintentar] = useState(false)
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  const timerRef    = useRef(null)
  const inicioRef   = useRef(Date.now())
  const respFinal   = useRef([])

  // Calcular nota vigesimal
  function calcularNota(correctas, totalPregs) {
    if (totalPregs === 0) return 0
    return Math.round((correctas / totalPregs) * 20)
  }

  // Formato mm:ss
  function formatTiempo(seg) {
    const m = Math.floor(seg / 60)
    const s = seg % 60
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  // Cargar intentos usados al iniciar
  useEffect(() => {
    async function cargar() {
      if (user && exam) {
        const intentos = await getIntentosPorExamen(user.id, exam.id)
        setIntentosUsados(intentos)
        // Puede reintentar si tiene intentos disponibles
        setPuedeReintentar(intentos < intentosMax)
      }
    }
    cargar()
  }, [user, exam])

  // Timer
  useEffect(() => {
    if (terminado) return
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          cerrarExamen(respFinal.current)
          return 0
        }
        if (prev === AVISO_FALTANTE + 1) setAviso(true)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [terminado])

  async function cerrarExamen(resps) {
    clearInterval(timerRef.current)
    const correctas = resps.filter((r, i) => r === preguntas[i]?.correcta).length
    const nota      = calcularNota(correctas, total)
    const aprobado  = nota >= notaMin
    const tiempoUsado = Math.round((Date.now() - inicioRef.current) / 1000)

    if (user && exam) {
      await guardarResultadoExamen({
        almacenero_id:  user.id,
        examen_id:      exam.id,
        modulo_id:      mod?.id,
        puntaje:        Math.round((correctas / total) * 100),
        nota_vigesimal: nota,
        aprobado,
        respuestas:     resps,
        tiempo_segundos: tiempoUsado,
        intento_numero: intentosUsados + 1,
      })
      if (aprobado && mod?.id) {
        await actualizarProgreso(user.id, mod.id, 100, true)
      }
    }
    setResp(resps)
    setTerm(true)
    setGuard(true)
    setAviso(false)
  }

  function selOpt(opcion) {
    if (respondida) return
    setSel(opcion)
    setRes(true)
    const nuevas = [...respuestas, opcion]
    respFinal.current = nuevas
    if (q + 1 >= total) {
      setTimeout(() => cerrarExamen(nuevas), 800)
    }
  }

  function siguientePregunta() {
    setQ(q + 1)
    setSel(null)
    setRes(false)
  }

  async function enviarSolicitud() {
    if (!mensajeSolicitud.trim()) return
    await crearSolicitudIntentos({
      almacenero_id: user.id,
      examen_id:     exam.id,
      mensaje:       mensajeSolicitud,
    })
    setSolicitudEnviada(true)
    setMostrarSolicitud(false)
  }

  // ── RESULTADO FINAL ──
  if (terminado) {
    const correctas = respuestas.filter((r, i) => r === preguntas[i]?.correcta).length
    const nota      = calcularNota(correctas, total)
    const aprobado  = nota >= notaMin
    const colorNota = aprobado ? '#276749' : 'var(--red)'

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
                Resultado del examen {guardado ? '· guardado ✓' : ''}
              </div>
              <div style={{ fontSize:'10.5px', fontWeight:600, color:'#fff' }}>{exam?.titulo}</div>
            </div>

            <div style={{ padding:'2rem', textAlign:'center' }}>
              {/* Nota vigesimal grande */}
              <div style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:colorNota, marginBottom:'.5rem' }}>
                {aprobado ? '✓ Aprobado' : '✕ Desaprobado'}
              </div>
              <div style={{ fontSize:'64px', fontWeight:800, color:colorNota, lineHeight:1, marginBottom:'.2rem' }}>
                {nota}
              </div>
              <div style={{ fontSize:'11px', color:'var(--g400)', marginBottom:'.3rem' }}>
                de 20 puntos
              </div>
              <div style={{ fontSize:'10px', color:'var(--g600)', marginBottom:'1.5rem' }}>
                {correctas} de {total} preguntas correctas · Nota mínima: {notaMin}
              </div>

              {/* Barra visual */}
              <div style={{ height:'6px', background:'var(--g100)', borderRadius:'3px', overflow:'hidden', marginBottom:'1.5rem' }}>
                <div style={{ height:'100%', width: (nota / 20 * 100) + '%', background:colorNota, borderRadius:'3px', transition:'width .8s' }} />
              </div>

              {guardado && (
                <div style={{ fontSize:'10px', color:'#276749', fontWeight:600, marginBottom:'1.2rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                  ✓ Resultado guardado automáticamente en tu perfil
                </div>
              )}

              {/* Intentos restantes */}
              <div style={{ fontSize:'10px', color:'var(--g400)', marginBottom:'1.2rem', background:'var(--g50)', padding:'.6rem', border:'1px solid var(--g100)' }}>
                Intentos usados: {intentosUsados + 1} de {intentosMax}
                {intentosUsados + 1 >= intentosMax && ' · Sin intentos restantes'}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'center' }}>
                <button className="btn-g" onClick={onBack}>Volver al módulo</button>

                {/* Puede reintentar directamente */}
                {!aprobado && intentosUsados + 1 < intentosMax && (
                  <button className="btn-p" onClick={() => window.location.reload()}>
                    Reintentar examen ({intentosMax - intentosUsados - 1} intento{intentosMax - intentosUsados - 1 !== 1 ? 's' : ''} restante{intentosMax - intentosUsados - 1 !== 1 ? 's' : ''})
                  </button>
                )}

                {/* Solicitar más intentos al admin */}
                {!aprobado && intentosUsados + 1 >= intentosMax && !solicitudEnviada && (
                  <button
                    className="btn-g"
                    onClick={() => setMostrarSolicitud(true)}
                    style={{ borderColor:'var(--red)', color:'var(--red)' }}>
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

            {/* Modal solicitud */}
            {mostrarSolicitud && (
              <div style={{ borderTop:'1px solid var(--g100)', padding:'1.2rem' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'var(--navy)', marginBottom:'.5rem' }}>
                  Solicitud de intentos adicionales
                </div>
                <textarea
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--g200)', fontSize:'11px', fontFamily:'inherit', resize:'vertical', minHeight:'70px', outline:'none', marginBottom:'8px' }}
                  placeholder="Explica brevemente por qué necesitas más intentos..."
                  value={mensajeSolicitud}
                  onChange={e => setMensajeSolicitud(e.target.value)}
                />
                <div style={{ display:'flex', gap:'7px', justifyContent:'flex-end' }}>
                  <button className="btn-g" onClick={() => setMostrarSolicitud(false)}>Cancelar</button>
                  <button className="btn-p" onClick={enviarSolicitud}>Enviar solicitud</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── EXAMEN EN CURSO ──
  const curPregunta = preguntas[q]
  const opciones    = curPregunta
    ? ['a','b','c','d'].map(k => ({ key: k, texto: curPregunta['opcion_' + k] })).filter(o => o.texto)
    : []

  const pctTiempo   = (tiempoLeft / tiempoMax) * 100
  const colorTimer  = tiempoLeft <= AVISO_FALTANTE ? 'var(--red)' : tiempoLeft <= 180 ? '#D97706' : '#276749'

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
          {/* Timer */}
          <div style={{ display:'flex', alignItems:'center', gap:'7px', background: aviso ? '#FFF5F5' : 'rgba(255,255,255,.1)', padding:'6px 14px', border:'1px solid ' + (aviso ? '#fed7d7' : 'rgba(255,255,255,.2)') }}>
            <span style={{ fontSize:'13px' }}>⏱</span>
            <span style={{ fontSize:'14px', fontWeight:800, color: aviso ? 'var(--red)' : '#fff', letterSpacing:'.05em', fontFamily:'monospace' }}>
              {formatTiempo(tiempoLeft)}
            </span>
          </div>
          <button className="btn-gw" onClick={onBack}>Salir del examen</button>
        </div>
      </nav>

      {/* Barra de tiempo */}
      <div style={{ height:'4px', background:'rgba(255,255,255,.1)', flexShrink:0 }}>
        <div style={{ height:'100%', width: pctTiempo + '%', background:colorTimer, transition:'width 1s linear' }} />
      </div>

      {/* Aviso 2 minutos */}
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

          {/* Header */}
          <div style={{ background:'var(--navy)', padding:'.85rem 1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'8.5px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.5)' }}>
              Pregunta {q + 1} de {total} · {user?.nombre}
            </div>
            <div style={{ fontSize:'10.5px', fontWeight:600, color:'#fff' }}>
              {Math.round((q / total) * 100)}% completado
            </div>
          </div>

          {/* Barra progreso preguntas */}
          <div style={{ height:'3px', background:'rgba(0,0,0,.06)' }}>
            <div style={{ height:'100%', width: ((q / total) * 100) + '%', background:'var(--red)', transition:'width .4s' }} />
          </div>

          {/* Pregunta */}
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
                  if (o.key === curPregunta.correcta) { borderColor = '#276749'; bg = '#F0FFF5'; color = '#276749' }
                  else if (o.key === seleccion)       { borderColor = 'var(--red)'; bg = '#FFF5F5'; color = 'var(--red)' }
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

          {/* Footer */}
          <div style={{ padding:'.8rem 1.2rem', borderTop:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--g50)' }}>
            <span style={{ fontSize:'9.5px', color:'var(--g400)' }}>
              {respondida ? 'Continúa con la siguiente pregunta' : 'Selecciona una opción para continuar'}
            </span>
            <button
              className="btn-p"
              disabled={!respondida || q + 1 >= total}
              onClick={siguientePregunta}
              style={{ opacity: (!respondida || q + 1 >= total) ? .35 : 1 }}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
