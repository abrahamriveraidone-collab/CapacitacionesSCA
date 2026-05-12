import { useState, useEffect } from 'react'
import {
  getDashboardData,
  getAllModulos,
  upsertModulo,
  archivarModulo,
  getMaterial,
  upsertMaterial,
  archivarMaterial,
  uploadPDF,
  getExamenes,
  upsertExamen,
  upsertPregunta,
  archivarExamen,
  getSucursales,
  upsertSucursal,
  archivarSucursal,
  getAllAlmaceneros,
  upsertAlmacenero,
  archivarAlmacenero,
  getSolicitudesIntentos,
  aprobarSolicitudIntentos,
  getReporteNotas,
  getSubcarpetas,
  upsertSubcarpeta,
  deleteSubcarpeta,
  upsertMaterialSubcarpeta,
  deleteMaterialSubcarpeta,
  uploadPDFSubcarpeta,
} from '../lib/supabase'
import logoSrc from '../assets/logo_scania.png'

export default function Admin({ onGoPlataforma, onLogout }) {
  const [tab, setTab]         = useState('dash')
  const [notifMsg, setNotif]  = useState('')
  const [data, setData]       = useState({})
  const [modulos, setModulos] = useState([])
  const [material, setMaterial] = useState([])
  const [examenes, setExamenes] = useState([])
  const [sucursales, setSucs]   = useState([])
  const [almaceneros, setAlms]  = useState([])
  const [loading, setLoading]   = useState(true)

  // Modal states
  const [showSucModal,  setShowSucModal]  = useState(false)
  const [showAlmModal,  setShowAlmModal]  = useState(false)
  const [showMatModal,  setShowMatModal]  = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)

  // Form states
  const [modForm, setModForm] = useState(null)
  const [modData, setModData] = useState({ titulo:'', categoria:'Operaciones', descripcion:'', icono:'⚙', color:'#041E42', estado:'borrador' })
  const [lecciones, setLecs]  = useState([])
  const [selColor, setSelColor] = useState('#041E42')

  const [sucForm, setSucForm] = useState({ codigo:'', nombre:'', region:'Norte', ciudad:'', tipo:'Taller' })
  const [almForm, setAlmForm] = useState({ codigo:'', nombre:'', email:'', telefono:'', puesto:'Técnico de Almacén', region:'Norte' })
  const [matForm, setMatForm] = useState({ titulo:'', tipo:'pdf', estado:'borrador', modulo_id:'' })
  const [pdfFile, setPdfFile] = useState(null)
  const [examForm, setExamForm] = useState({ titulo:'', modulo_id:'', estado:'borrador' })
  const [preguntas, setPregs] = useState([{ texto:'', opcion_a:'', opcion_b:'', opcion_c:'', opcion_d:'', correcta:'a' }])

  const [modFlt, setModFlt] = useState('all')
  const [matFlt, setMatFlt] = useState('all')
  const [almFlt, setAlmFlt] = useState('act')
  const [editingMod, setEditingMod] = useState(null)
  const [qcMod, setQcMod] = useState(1)
  const [solicitudes, setSolicitudes] = useState([])
  const [reporte, setReporte] = useState([])
  const [reporteFlt, setReporteFlt] = useState('all')
  const [subcarpetas, setSubcarpetas] = useState([])
  const [subcExpandida, setSubcExpandida] = useState(null)
  const [newSubcNombre, setNewSubcNombre] = useState('')
  const [newSubcDesc, setNewSubcDesc] = useState('')
  const [newSubcParent, setNewSubcParent] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  function showNotif(msg) {
    setNotif(msg)
    setTimeout(() => setNotif(''), 2800)
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [dash, mods, mats, exams, sucs, alms, sols, rep] = await Promise.all([
      getDashboardData(), getAllModulos(), getMaterial(),
      getExamenes(), getSucursales(), getAllAlmaceneros(),
      getSolicitudesIntentos(), getReporteNotas(),
    ])
    setData(dash); setModulos(mods); setMaterial(mats)
    setExamenes(exams); setSucs(sucs); setAlms(alms)
    setSolicitudes(sols); setReporte(rep)
    setLoading(false)
  }

  function logout() {
    if (onLogout) onLogout()
  }

  function exportarExcel(filtroExamen) {
    const datos = filtroExamen
      ? reporte.filter(r => r.examenes?.titulo === filtroExamen)
      : reporte
    if (datos.length === 0) { showNotif('No hay datos para exportar.'); return }

    const encabezados = ['Nombre','Código','Sucursal / Distribuidor','Región','Módulo','Examen','Nota (1-20)','Aprobado','Fecha','Intentos usados']
    const filas = datos.map(r => [
      r.almaceneros?.nombre || '',
      r.almaceneros?.codigo || '',
      r.almaceneros?.sucursales?.nombre || r.almaceneros?.region || '',
      r.almaceneros?.region || '',
      r.examenes?.modulos?.titulo || '',
      r.examenes?.titulo || '',
      r.nota_vigesimal || 0,
      r.aprobado ? 'Aprobado' : 'Desaprobado',
      r.created_at ? new Date(r.created_at).toLocaleDateString('es-PE') : '',
      r.intento_numero || 1,
    ])

    const csvContent = [encabezados, ...filas]
      .map(fila => fila.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = filtroExamen
      ? 'Reporte_' + filtroExamen.replace(/\s+/g,'_') + '.csv'
      : 'Reporte_General_Scania.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showNotif('✓ Excel exportado correctamente.')
  }

  // ── MÓDULOS ──
  const modsFlt = modulos.filter(m =>
    modFlt === 'pub'  ? !m.archivado && m.estado === 'publicado' :
    modFlt === 'bor'  ? !m.archivado && m.estado === 'borrador' :
    modFlt === 'arch' ? m.archivado : !m.archivado
  )

  function openNewMod() {
    setEditingMod(null)
    setLecs([])
    setSelColor('#041E42')
    setModData({ titulo:'', categoria:'Operaciones', descripcion:'', icono:'⚙', color:'#041E42', estado:'borrador' })
    setModForm('new')
  }

  function openEditMod(m) {
    setEditingMod(m)
    setLecs(m.lecciones || [])
    setSelColor(m.color || '#041E42')
    setModData({ titulo: m.titulo, categoria: m.categoria, descripcion: m.descripcion, icono: m.icono, color: m.color, estado: m.estado })
    setSubcarpetas([])
    setSubcExpandida(null)
    setNewSubcNombre('')
    setNewSubcDesc('')
    cargarSubcarpetas(m.id)
    setModForm(m.id)
  }

  async function saveMod(estado) {
    if (!modData.titulo.trim()) { showNotif('Escribe el título del módulo.'); return }
    const payload = { ...modData, color: selColor, estado, archivado: false }
    if (editingMod) payload.id = editingMod.id
    await upsertModulo(payload)
    await loadAll()
    setModForm(null)
    showNotif(estado === 'publicado' ? '✓ Módulo publicado.' : 'Borrador guardado.')
  }

  async function handleArchivarMod(id, v) {
    await archivarModulo(id, v)
    await loadAll()
    showNotif(v ? 'Módulo archivado.' : 'Módulo restaurado.')
  }

  async function cargarSubcarpetas(modId) {
    const subs = await getSubcarpetas(modId)
    setSubcarpetas(subs)
  }

  async function crearSubcarpeta(modId) {
    if (!newSubcNombre.trim()) { showNotif('Escribe el nombre de la subcarpeta.'); return }
    const { error } = await upsertSubcarpeta({
      modulo_id:   modId,
      parent_id:   newSubcParent || null,
      nombre:      newSubcNombre.trim(),
      descripcion: newSubcDesc.trim(),
      orden:       subcarpetas.length,
    })
    if (error) { showNotif('Error al crear subcarpeta.'); return }
    setNewSubcNombre('')
    setNewSubcDesc('')
    setNewSubcParent(null)
    await cargarSubcarpetas(modId)
    showNotif('Subcarpeta creada.')
  }

  async function eliminarSubcarpeta(id, modId) {
    await deleteSubcarpeta(id)
    await cargarSubcarpetas(modId)
    showNotif('Subcarpeta eliminada.')
  }

  async function handleDropEnSubcarpeta(e, subcId, modId) {
    e.preventDefault()
    setDragOver(null)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    for (const file of files) {
      const isLink = false
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const path = 'subcarpetas/' + subcId + '/' + Date.now() + '_' + file.name
        const { url, error } = await uploadPDFSubcarpeta(file, path)
        if (error) { showNotif('Error al subir ' + file.name); continue }
        await upsertMaterialSubcarpeta({
          subcarpeta_id: subcId,
          titulo:        file.name.replace('.pdf',''),
          tipo:          'pdf',
          url,
          storage_path:  path,
          tamano_mb:     (file.size / 1024 / 1024).toFixed(1),
          estado:        'activo',
        })
      }
    }
    await cargarSubcarpetas(modId)
    showNotif(files.length + ' archivo(s) subido(s) a la subcarpeta.')
  }

  async function agregarLinkSubcarpeta(subcId, titulo, url, modId) {
    if (!titulo.trim() || !url.trim()) { showNotif('Completa título y URL.'); return }
    await upsertMaterialSubcarpeta({
      subcarpeta_id: subcId,
      titulo:        titulo.trim(),
      tipo:          'link',
      url:           url.trim(),
      estado:        'activo',
    })
    await cargarSubcarpetas(modId)
    showNotif('Link agregado.')
  }

  async function eliminarMatSubc(id, modId) {
    await deleteMaterialSubcarpeta(id)
    await cargarSubcarpetas(modId)
    showNotif('Archivo eliminado.')
  }

  // ── MATERIAL ──
  const matsFlt = material.filter(m =>
    matFlt === 'pdf'  ? !m.archivado && m.tipo === 'pdf' :
    matFlt === 'lnk'  ? !m.archivado && m.tipo === 'link' :
    matFlt === 'arch' ? m.archivado : !m.archivado
  )

  async function saveMat() {
    if (!matForm.titulo.trim()) { showNotif('Escribe el título.'); return }
    let url = matForm.url || ''
    if (matForm.tipo === 'pdf' && pdfFile) {
      const path = 'pdfs/' + Date.now() + '_' + pdfFile.name
      const { url: uploadedUrl, error } = await uploadPDF(pdfFile, path)
      if (error) { showNotif('Error al subir PDF.'); return }
      url = uploadedUrl
    }
    await upsertMaterial({ ...matForm, url, tamano_mb: pdfFile ? (pdfFile.size / 1024 / 1024).toFixed(1) : null })
    await loadAll()
    setShowMatModal(false)
    setMatForm({ titulo:'', tipo:'pdf', estado:'borrador', modulo_id:'' })
    setPdfFile(null)
    showNotif('Material guardado.')
  }

  async function handleArchivarMat(id, v) {
    await archivarMaterial(id, v)
    await loadAll()
    showNotif(v ? 'Material archivado.' : 'Material restaurado.')
  }

  // ── EXÁMENES ──
  async function saveExam(estado) {
    if (!examForm.titulo.trim()) { showNotif('Escribe el título.'); return }
    // 1. Guardar examen y obtener su id
    const { data: ex, error: exError } = await upsertExamen({ ...examForm, estado, archivado: false })
    if (exError || !ex) {
      showNotif('Error al guardar el examen.')
      console.error('upsertExamen error:', exError)
      return
    }
    // 2. Guardar cada pregunta con el examen_id
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i]
      if (!p.texto.trim()) continue
      const { error: pError } = await upsertPregunta({
        texto:    p.texto,
        opcion_a: p.opcion_a,
        opcion_b: p.opcion_b,
        opcion_c: p.opcion_c,
        opcion_d: p.opcion_d,
        correcta: p.correcta,
        examen_id: ex.id,
        orden: i,
      })
      if (pError) {
        console.error('upsertPregunta error:', pError)
      }
    }
    await loadAll()
    setShowExamModal(false)
    setExamForm({ titulo:'', modulo_id:'', estado:'borrador' })
    setPregs([{ texto:'', opcion_a:'', opcion_b:'', opcion_c:'', opcion_d:'', correcta:'a' }])
    setQcMod(1)
    showNotif(estado === 'activo' ? 'Examen publicado con ' + preguntas.length + ' preguntas.' : 'Borrador guardado.')
  }

  async function handleArchivarExam(id, v) {
    await archivarExamen(id, v)
    await loadAll()
    showNotif(v ? 'Examen archivado.' : 'Examen restaurado.')
  }

  // ── SUCURSALES ──
  async function saveSuc() {
    if (!sucForm.codigo.trim() || !sucForm.nombre.trim()) { showNotif('Completa código y nombre.'); return }
    await upsertSucursal({ ...sucForm, codigo: sucForm.codigo.toUpperCase(), archivada: false })
    await loadAll()
    setShowSucModal(false)
    setSucForm({ codigo:'', nombre:'', region:'Norte', ciudad:'', tipo:'Taller' })
    showNotif('Sucursal guardada.')
  }

  // ── ALMACENEROS ──
  const almsFlt = almFlt === 'arch' ? almaceneros.filter(a => a.archivado) : almaceneros.filter(a => !a.archivado)

  async function saveAlm() {
    if (!almForm.codigo.trim() || !almForm.nombre.trim()) { showNotif('Completa código y nombre.'); return }
    await upsertAlmacenero({ ...almForm, codigo: almForm.codigo.toUpperCase(), archivado: false })
    await loadAll()
    setShowAlmModal(false)
    setAlmForm({ codigo:'', nombre:'', email:'', telefono:'', puesto:'Técnico de Almacén', region:'Norte' })
    showNotif('Almacenero guardado. Código: ' + almForm.codigo.toUpperCase())
  }

  const sideItems = [
    { k:'dash',   ic:'▦',  label:'Dashboard' },
    { k:'prog',   ic:'◉',  label:'Progreso',        sect:'General' },
    { k:'sols',   ic:'🔔', label:'Solicitudes',      badge: solicitudes.length },
    { k:'reporte',ic:'📊', label:'Reporte Excel' },
    { k:'mods',   ic:'≡',  label:'Módulos',          sect:'Contenido' },
    { k:'mat',    ic:'📁', label:'Material' },
    { k:'exam',   ic:'✎',  label:'Exámenes' },
    { k:'suc',    ic:'⬡',  label:'Sucursales',       sect:'Organización' },
    { k:'alm',    ic:'◈',  label:'Almaceneros' },
  ]

  const colors = ['#041E42','#1a2f4a','#2D3340','#1f3a5c','#3D2B1F','#1C3A2A','#3A1C1C','#243347']

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

      {/* TOP BAR */}
      <div style={{ background:'var(--graphite)', height:'48px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.3rem', borderBottom:'2px solid var(--red)', flexShrink:0 }}>
        <div style={{ color:'#fff', fontSize:'11.5px', fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}>
          <img src={logoSrc} alt="S" style={{ width:'19px', height:'19px', objectFit:'contain' }} />
          Panel de Administración · Scania — Malla de Capacitación de Almacenes
        </div>
        <div style={{ display:'flex', gap:'7px', alignItems:'center' }}>
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:'9.5px' }}>Admin123</span>
          <button onClick={() => onGoPlataforma && onGoPlataforma()} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.14)', color:'#fff', padding:'4px 10px', cursor:'pointer', fontSize:'8.5px', fontFamily:'inherit', letterSpacing:'.05em', textTransform:'uppercase' }}>Ver plataforma</button>
          <button onClick={logout} style={{ background:'var(--red)', border:'none', color:'#fff', padding:'4px 10px', cursor:'pointer', fontSize:'8.5px', fontFamily:'inherit', letterSpacing:'.05em', textTransform:'uppercase' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* SIDENAV */}
        <div style={{ width:'185px', background:'var(--navy)', flexShrink:0, display:'flex', flexDirection:'column', padding:'.6rem 0', overflowY:'auto' }}>
          {sideItems.map((item) => (
            <div key={item.k}>
              {item.sect && (
                <div style={{ fontSize:'7.5px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.22)', padding:'.45rem 1rem', marginTop:'.35rem' }}>
                  {item.sect}
                </div>
              )}
              <button
                onClick={() => { setTab(item.k); if (item.k !== 'mods') setModForm(null) }}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'.55rem 1rem', cursor:'pointer', fontSize:'10.5px', fontWeight:500, color: tab === item.k ? '#fff' : 'rgba(255,255,255,.5)', borderLeft: tab === item.k ? '3px solid var(--red)' : '3px solid transparent', background: tab === item.k ? 'rgba(255,255,255,.08)' : 'none', fontFamily:'inherit', width:'100%', textAlign:'left' }}>
                <span style={{ fontSize:'12px', width:'15px', textAlign:'center', opacity:.7 }}>{item.ic}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ background:'var(--red)', color:'#fff', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'2px' }}>{item.badge}</span>}
              </button>
            </div>
          ))}
          <div style={{ marginTop:'auto', padding:'.8rem 1rem', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize:'8.5px', color:'rgba(255,255,255,.2)' }}>Scania Perú · v1.0</div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex:1, overflowY:'auto', background:'var(--g50)' }}>

          {/* DASHBOARD */}
          {tab === 'dash' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, borderBottom:'1px solid var(--g200)' }}>
                {[
                  { n: data.totalAlmaceneros || 0, l:'Almaceneros activos' },
                  { n: data.totalModulos || 0,     l:'Módulos publicados' },
                  { n: (data.promedioProgreso || 0) + '%', l:'Progreso promedio' },
                  { n: data.totalExamenes || 0,    l:'Exámenes publicados' },
                ].map((k, i) => (
                  <div key={i} style={{ padding:'1rem 1.2rem', borderRight: i < 3 ? '1px solid var(--g200)' : 'none', background:'#fff' }}>
                    <div style={{ fontSize:'24px', fontWeight:800, color:'var(--navy)', lineHeight:1 }}>{k.n}<span style={{ color:'var(--red)' }}>.</span></div>
                    <div style={{ fontSize:'8.5px', color:'var(--g400)', marginTop:'3px', textTransform:'uppercase', letterSpacing:'.07em', fontWeight:600 }}>{k.l}</div>
                    <div style={{ height:'2px', background:'var(--g100)', marginTop:'.6rem' }}><div style={{ height:'100%', width:'70%', background:'var(--red)' }} /></div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'1.2rem 1.3rem' }}>
                <div className="sec-lbl" style={{ marginBottom:'.8rem' }}>Bienvenido al panel de administración</div>
                <p style={{ fontSize:'11px', color:'var(--g400)', lineHeight:1.6 }}>
                  Usa el menú izquierdo para gestionar módulos, material, exámenes, sucursales y almaceneros.<br/>
                  Los resultados de exámenes se guardan automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* PROGRESO */}
          {tab === 'prog' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Progreso individual</div>
                <button className="btn-g btn-sm">Exportar CSV</button>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                <div className="dtbl">
                  <div className="dtbl-head" style={{ gridTemplateColumns:'80px 1.4fr 1fr 1fr 90px' }}>
                    {['Código','Colaborador','Región','Sitio','Estado'].map(c => <div key={c} className="dtbl-col">{c}</div>)}
                  </div>
                  {almaceneros.filter(a => !a.archivado).map(a => (
                    <div key={a.id} className="drow" style={{ gridTemplateColumns:'80px 1.4fr 1fr 1fr 90px' }}>
                      <div style={{ fontWeight:700, color:'var(--red)', fontSize:'10.5px', letterSpacing:'.05em' }}>{a.codigo}</div>
                      <div className="dn">{a.nombre}</div>
                      <div className="ds">{a.region}</div>
                      <div className="ds">{a.sucursales?.nombre}</div>
                      <div><span className="stag st-ok">Activo</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MÓDULOS — listado */}
          {tab === 'mods' && !modForm && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Módulos de capacitación</div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <div style={{ display:'flex', gap:0 }}>
                    {[['all','Todos'],['pub','Publicados'],['bor','Borradores'],['arch','Archivados']].map(([f,l]) => (
                      <button key={f} className="btn-g btn-sm" onClick={() => setModFlt(f)} style={{ background: modFlt === f ? 'var(--navy)' : '', color: modFlt === f ? '#fff' : '', borderColor: modFlt === f ? 'var(--navy)' : '' }}>{l}</button>
                    ))}
                  </div>
                  <button className="btn-p btn-sm" onClick={openNewMod}>+ Nuevo módulo</button>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'9px', padding:'1.1rem 1.3rem' }}>
                {modsFlt.map((m) => (
                  <div key={m.id} style={{ background:'#fff', border:'1px solid var(--g200)', position:'relative', overflow:'hidden' }}>
                    <div style={{ height:'80px', background: m.color || '#041E42', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(4,30,66,.85),rgba(4,30,66,.25))' }} />
                      <span style={{ position:'relative', zIndex:2, fontSize:'22px' }}>{m.icono}</span>
                    </div>
                    <span className={'stag ' + (m.archivado ? 'st-arch' : m.estado === 'publicado' ? 'st-pub' : 'st-bor')} style={{ position:'absolute', top:'7px', right:'7px', zIndex:3 }}>
                      {m.archivado ? 'Archivado' : m.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                    <div style={{ padding:'.7rem' }}>
                      <div style={{ fontSize:'7.5px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:'2px' }}>{m.categoria}</div>
                      <div style={{ fontSize:'11px', fontWeight:700, color:'var(--navy)', marginBottom:'3px' }}>{m.titulo}</div>
                      <div style={{ fontSize:'9.5px', color:'var(--g400)', marginBottom:'.6rem', lineHeight:1.4 }}>{(m.descripcion || '').substring(0,60)}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'.5rem', borderTop:'1px solid var(--g100)' }}>
                        <span style={{ fontSize:'9.5px', color:'var(--g600)', fontWeight:600 }}>{(m.lecciones || []).length} lecc.</span>
                        <div style={{ display:'flex', gap:'4px' }}>
                          {m.archivado
                            ? <button className="btn-rest" onClick={() => handleArchivarMod(m.id, false)}>Restaurar</button>
                            : <>
                                <button className="btn-g btn-sm" onClick={() => openEditMod(m)}>Editar</button>
                                <button className="btn-arch" onClick={() => handleArchivarMod(m.id, true)}>Archivar</button>
                              </>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {modsFlt.length === 0 && (
                  <div style={{ gridColumn:'1/-1', padding:'1.5rem', textAlign:'center', color:'var(--g400)', fontSize:'11px' }}>No hay módulos en esta categoría.</div>
                )}
              </div>
            </div>
          )}

          {/* MÓDULO FORM */}
          {tab === 'mods' && modForm && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>{modForm === 'new' ? 'Nuevo módulo' : 'Editar módulo'}</div>
                <button className="btn-g btn-sm" onClick={() => setModForm(null)}>← Volver a módulos</button>
              </div>
              <div style={{ padding:'1rem 1.3rem' }}>
                <div style={{ background:'#fff', border:'1px solid var(--g200)', marginBottom:'1rem' }}>
                  <div style={{ padding:'.8rem 1.1rem', borderBottom:'1px solid var(--g100)' }}>
                    <span style={{ fontSize:'12px', fontWeight:800, color:'var(--navy)' }}>Información del módulo</span>
                  </div>
                  <div style={{ padding:'1.1rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'9px' }}>
                      <div>
                        <label className="fl">Título</label>
                        <input className="fi" value={modData.titulo} onChange={e => setModData({...modData, titulo: e.target.value})} placeholder="Ej: Control de Temperatura" />
                      </div>
                      <div>
                        <label className="fl">Categoría</label>
                        <select className="fsel" value={modData.categoria} onChange={e => setModData({...modData, categoria: e.target.value})}>
                          {['Operaciones','Sistema','Inventario','Calidad','Compras','Reportes','Servicios','Seguridad'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom:'9px' }}>
                      <label className="fl">Descripción</label>
                      <textarea className="ftxt" value={modData.descripcion} onChange={e => setModData({...modData, descripcion: e.target.value})} placeholder="Breve descripción del módulo..." />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'9px' }}>
                      <div>
                        <label className="fl">Ícono</label>
                        <select className="fsel" value={modData.icono} onChange={e => setModData({...modData, icono: e.target.value})}>
                          {['⚙','📦','🔍','📋','♻️','📊','🛢️','🔄','🔒','🚛','🛠️'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="fl">Color de fondo</label>
                        <select className="fsel" value={selColor} onChange={e => setSelColor(e.target.value)}>
                          {[['#041E42','Azul naval'],['#1a2f4a','Azul oscuro'],['#2D3340','Grafito'],['#1f3a5c','Índigo'],['#3D2B1F','Tierra'],['#1C3A2A','Verde'],['#3A1C1C','Borgoña'],['#243347','Acero']].map(([v,l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="fl">Estado</label>
                        <select className="fsel" value={modData.estado} onChange={e => setModData({...modData, estado: e.target.value})}>
                          <option value="borrador">Borrador</option>
                          <option value="publicado">Publicado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {/* SUBCARPETAS — solo visible al editar */}
                {modForm !== 'new' && (
                  <div style={{ marginTop:'1rem', borderTop:'1px solid var(--g100)', paddingTop:'1rem' }}>
                    <div style={{ fontSize:'11px', fontWeight:800, color:'var(--navy)', marginBottom:'.7rem' }}>
                      📁 Subcarpetas del módulo
                    </div>

                    {/* Lista de subcarpetas existentes */}
                    {subcarpetas.map(sub => (
                      <div key={sub.id} style={{ marginBottom:'6px' }}>
                        {/* Cabecera de subcarpeta */}
                        <div
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'var(--g50)', border:'1px solid var(--g200)', borderLeft:'3px solid var(--navy)', padding:'.6rem .9rem', cursor:'pointer' }}
                          onClick={() => setSubcExpandida(subcExpandida === sub.id ? null : sub.id)}>
                          <span style={{ fontSize:'11px', color:'var(--navy)', fontWeight:700, flex:1 }}>
                            {subcExpandida === sub.id ? '▼' : '▶'} {sub.nombre}
                          </span>
                          {sub.descripcion && (
                            <span style={{ fontSize:'9.5px', color:'var(--g400)' }}>{sub.descripcion}</span>
                          )}
                          <span style={{ fontSize:'9px', color:'var(--g400)' }}>{(sub.material_subcarpeta || []).length} archivo(s)</span>
                          <button
                            onClick={e => { e.stopPropagation(); eliminarSubcarpeta(sub.id, modForm) }}
                            style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'13px', padding:'0 4px' }}>✕</button>
                        </div>

                        {/* Contenido expandido */}
                        {subcExpandida === sub.id && (
                          <div style={{ border:'1px solid var(--g200)', borderTop:'none', padding:'.8rem' }}>

                            {/* Archivos existentes */}
                            {(sub.material_subcarpeta || []).map(mat => (
                              <div key={mat.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'.45rem 0', borderBottom:'1px solid var(--g100)' }}>
                                <span style={{ fontSize:'13px' }}>{mat.tipo === 'pdf' ? '📄' : '🔗'}</span>
                                <span style={{ flex:1, fontSize:'11px', color:'var(--navy)' }}>{mat.titulo}</span>
                                <span style={{ fontSize:'9px', color:'var(--g400)' }}>{mat.tipo === 'pdf' ? 'PDF' + (mat.tamano_mb ? ' · ' + mat.tamano_mb + ' MB' : '') : 'Link'}</span>
                                <button
                                  onClick={() => eliminarMatSubc(mat.id, modForm)}
                                  style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'12px' }}>✕</button>
                              </div>
                            ))}

                            {/* Zona drag & drop */}
                            <div
                              onDragOver={e => { e.preventDefault(); setDragOver(sub.id) }}
                              onDragLeave={() => setDragOver(null)}
                              onDrop={e => handleDropEnSubcarpeta(e, sub.id, modForm)}
                              style={{ border:'2px dashed ' + (dragOver === sub.id ? 'var(--red)' : 'var(--g200)'), background: dragOver === sub.id ? '#FFF5F5' : 'var(--g50)', padding:'1rem', textAlign:'center', cursor:'pointer', marginTop:'8px', transition:'all .15s' }}>
                              <div style={{ fontSize:'18px', marginBottom:'3px', opacity:.5 }}>📂</div>
                              <div style={{ fontSize:'10.5px', color:'var(--g400)', fontWeight:500 }}>
                                Arrastra y suelta PDFs aquí
                              </div>
                              <div style={{ fontSize:'9px', color:'var(--g400)', marginTop:'2px' }}>Máx. 20 MB por archivo</div>
                            </div>

                            {/* Agregar link */}
                            <div style={{ marginTop:'8px', display:'flex', gap:'6px' }}>
                              <input
                                id={'link-tit-' + sub.id}
                                className="fi"
                                style={{ flex:1 }}
                                placeholder="Título del link"
                              />
                              <input
                                id={'link-url-' + sub.id}
                                className="fi"
                                style={{ flex:2 }}
                                placeholder="https://..."
                              />
                              <button
                                className="btn-p btn-sm"
                                onClick={() => {
                                  const t = document.getElementById('link-tit-' + sub.id)?.value || ''
                                  const u = document.getElementById('link-url-' + sub.id)?.value || ''
                                  agregarLinkSubcarpeta(sub.id, t, u, modForm)
                                  if (document.getElementById('link-tit-' + sub.id)) document.getElementById('link-tit-' + sub.id).value = ''
                                  if (document.getElementById('link-url-' + sub.id)) document.getElementById('link-url-' + sub.id).value = ''
                                }}>
                                + Link
                              </button>
                            </div>

                            {/* Sub-subcarpeta */}
                            <div style={{ marginTop:'8px', display:'flex', gap:'6px', alignItems:'center' }}>
                              <span style={{ fontSize:'10px', color:'var(--g400)', whiteSpace:'nowrap' }}>Sub-carpeta:</span>
                              <input
                                id={'subsubc-' + sub.id}
                                className="fi"
                                style={{ flex:1 }}
                                placeholder="Nombre de sub-carpeta"
                              />
                              <button
                                className="btn-g btn-sm"
                                onClick={async () => {
                                  const nom = document.getElementById('subsubc-' + sub.id)?.value || ''
                                  if (!nom.trim()) return
                                  await upsertSubcarpeta({ modulo_id: modForm, parent_id: sub.id, nombre: nom.trim(), orden: 0 })
                                  document.getElementById('subsubc-' + sub.id).value = ''
                                  await cargarSubcarpetas(modForm)
                                  showNotif('Sub-carpeta creada.')
                                }}>
                                + Crear
                              </button>
                            </div>

                            {/* Sub-subcarpetas */}
                            {subcarpetas.filter(s => s.parent_id === sub.id).map(subsub => (
                              <div key={subsub.id} style={{ marginTop:'6px', marginLeft:'16px', border:'1px solid var(--g100)', borderLeft:'3px solid var(--g200)', padding:'.5rem .8rem', background:'#fff' }}>
                                <div style={{ fontSize:'10.5px', fontWeight:700, color:'var(--navy)', marginBottom:'5px' }}>📁 {subsub.nombre}</div>
                                <div
                                  onDragOver={e => { e.preventDefault(); setDragOver(subsub.id) }}
                                  onDragLeave={() => setDragOver(null)}
                                  onDrop={e => handleDropEnSubcarpeta(e, subsub.id, modForm)}
                                  style={{ border:'2px dashed ' + (dragOver === subsub.id ? 'var(--red)' : 'var(--g200)'), background: dragOver === subsub.id ? '#FFF5F5' : 'var(--g50)', padding:'.7rem', textAlign:'center', fontSize:'10px', color:'var(--g400)', cursor:'pointer' }}>
                                  📂 Arrastra PDFs aquí
                                </div>
                                {(subsub.material_subcarpeta || []).map(mat => (
                                  <div key={mat.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'.4rem 0', borderBottom:'1px solid var(--g100)', marginTop:'4px' }}>
                                    <span style={{ fontSize:'12px' }}>{mat.tipo === 'pdf' ? '📄' : '🔗'}</span>
                                    <span style={{ flex:1, fontSize:'10.5px', color:'var(--navy)' }}>{mat.titulo}</span>
                                    <button onClick={() => eliminarMatSubc(mat.id, modForm)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'11px' }}>✕</button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Crear nueva subcarpeta */}
                    <div style={{ background:'var(--g50)', border:'1px dashed var(--g200)', padding:'.8rem', marginTop:'6px' }}>
                      <div style={{ fontSize:'9.5px', fontWeight:700, color:'var(--g600)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'7px' }}>+ Nueva subcarpeta</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'7px' }}>
                        <div>
                          <label className="fl">Nombre</label>
                          <input className="fi" placeholder="Ej: Módulo 1 — Introducción" value={newSubcNombre} onChange={e => setNewSubcNombre(e.target.value)} />
                        </div>
                        <div>
                          <label className="fl">Descripción (opcional)</label>
                          <input className="fi" placeholder="Breve descripción" value={newSubcDesc} onChange={e => setNewSubcDesc(e.target.value)} />
                        </div>
                      </div>
                      <button className="btn-p btn-sm" onClick={() => crearSubcarpeta(modForm)}>Crear subcarpeta</button>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'1rem' }}>
                  <button className="btn-g" onClick={() => setModForm(null)}>Cancelar</button>
                  <button className="btn-g" onClick={() => saveMod('borrador')}>Guardar borrador</button>
                  <button className="btn-p" onClick={() => saveMod('publicado')}>Publicar módulo</button>
                </div>
              </div>
            </div>
          )}

          {/* MATERIAL */}
          {tab === 'mat' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Material de capacitación</div>
                <button className="btn-p btn-sm" onClick={() => setShowMatModal(true)}>+ Agregar material</button>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                <div style={{ display:'flex', gap:'5px', marginBottom:'.9rem' }}>
                  {[['all','Todos'],['pdf','PDFs'],['lnk','Links'],['arch','Archivados']].map(([f,l]) => (
                    <button key={f} className="btn-g btn-sm" onClick={() => setMatFlt(f)} style={{ background: matFlt === f ? 'var(--navy)' : '', color: matFlt === f ? '#fff' : '', borderColor: matFlt === f ? 'var(--navy)' : '' }}>{l}</button>
                  ))}
                </div>
                {matsFlt.map(m => (
                  <div key={m.id} className="li">
                    <div className={'lic ' + (m.tipo === 'pdf' ? 'lp' : 'lq')} style={{ fontSize:'11px' }}>{m.tipo === 'pdf' ? '📄' : '▶'}</div>
                    <div className="lin">
                      <div className="lt">{m.titulo}</div>
                      <div className="lm">{m.modulos?.titulo} · {m.tipo.toUpperCase()}{m.tamano_mb ? ' · ' + m.tamano_mb + ' MB' : ''}</div>
                    </div>
                    <span className={'stag ' + (m.estado === 'activo' ? 'st-ok' : 'st-bor')} style={{ marginRight:'7px' }}>{m.estado === 'activo' ? 'Publicado' : 'Borrador'}</span>
                    {m.archivado
                      ? <button className="btn-rest" onClick={() => handleArchivarMat(m.id, false)}>Restaurar</button>
                      : <button className="btn-arch" onClick={() => handleArchivarMat(m.id, true)}>Archivar</button>
                    }
                  </div>
                ))}
                {matsFlt.length === 0 && <div style={{ fontSize:'11px', color:'var(--g400)', padding:'.5rem 0' }}>Sin material en esta categoría.</div>}
              </div>
            </div>
          )}

          {/* EXÁMENES */}
          {tab === 'exam' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Exámenes</div>
                <button className="btn-p btn-sm" onClick={() => setShowExamModal(true)}>+ Nuevo examen</button>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                {examenes.map(e => (
                  <div key={e.id} className="li">
                    <div className="lic lq" style={{ fontSize:'11px' }}>✎</div>
                    <div className="lin">
                      <div className="lt">{e.titulo}</div>
                      <div className="lm">{e.modulos?.titulo} · {(e.preguntas || []).length} preguntas</div>
                    </div>
                    <span className={'stag ' + (e.estado === 'activo' ? 'st-ok' : 'st-bor')} style={{ marginRight:'7px' }}>{e.estado === 'activo' ? 'Publicado' : 'Borrador'}</span>
                    {e.archivado
                      ? <button className="btn-rest" onClick={() => handleArchivarExam(e.id, false)}>Restaurar</button>
                      : <button className="btn-arch" onClick={() => handleArchivarExam(e.id, true)}>Archivar</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUCURSALES */}
          {tab === 'suc' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Sucursales — Red Scania Perú</div>
                <button className="btn-p btn-sm" onClick={() => setShowSucModal(true)}>+ Nueva sucursal</button>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                <div className="dtbl">
                  <div className="dtbl-head" style={{ gridTemplateColumns:'65px 1fr 90px 80px 110px' }}>
                    {['Código','Nombre','Región','Estado','Acciones'].map(c => <div key={c} className="dtbl-col">{c}</div>)}
                  </div>
                  {sucursales.map(s => (
                    <div key={s.id} className="drow" style={{ gridTemplateColumns:'65px 1fr 90px 80px 110px' }}>
                      <div style={{ fontWeight:700, color:'var(--red)', fontSize:'10.5px', letterSpacing:'.04em' }}>{s.codigo}</div>
                      <div className="dn">{s.nombre}</div>
                      <div className="ds">{s.region}</div>
                      <div><span className={'stag ' + (s.archivada ? 'st-arch' : 'st-ok')}>{s.archivada ? 'Archivada' : 'Activa'}</span></div>
                      <div>
                        {s.archivada
                          ? <button className="btn-rest" onClick={async () => { await archivarSucursal(s.id, false); await loadAll(); showNotif('Sucursal restaurada.') }}>Restaurar</button>
                          : <button className="btn-arch" onClick={async () => { await archivarSucursal(s.id, true); await loadAll(); showNotif('Sucursal archivada.') }}>Archivar</button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* SOLICITUDES DE INTENTOS */}
          {tab === 'sols' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div>
                  <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Solicitudes de intentos adicionales</div>
                  <div style={{ fontSize:'9.5px', color:'var(--g400)', marginTop:'2px' }}>Almaceneros que han agotado sus intentos y solicitan más</div>
                </div>
                <button className="btn-g btn-sm" onClick={loadAll}>Actualizar</button>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                {solicitudes.length === 0 && (
                  <div style={{ fontSize:'11px', color:'var(--g400)', padding:'.5rem 0' }}>No hay solicitudes pendientes.</div>
                )}
                {solicitudes.map(s => (
                  <div key={s.id} style={{ background:'#fff', border:'1px solid var(--g200)', borderLeft:'3px solid var(--red)', padding:'1rem 1.1rem', marginBottom:'8px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'11.5px', fontWeight:700, color:'var(--navy)', marginBottom:'2px' }}>
                          {s.almaceneros?.nombre} <span style={{ color:'var(--red)', fontWeight:800 }}>({s.almaceneros?.codigo})</span>
                        </div>
                        <div style={{ fontSize:'10px', color:'var(--g400)', marginBottom:'6px' }}>Examen: {s.examenes?.titulo}</div>
                        {s.mensaje && (
                          <div style={{ fontSize:'10.5px', color:'var(--g600)', background:'var(--g50)', padding:'.5rem .7rem', borderLeft:'2px solid var(--g200)', fontStyle:'italic' }}>
                            "{s.mensaje}"
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-end', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <label style={{ fontSize:'9px', fontWeight:700, color:'var(--g600)', textTransform:'uppercase', letterSpacing:'.05em' }}>Intentos extra:</label>
                          <select
                            defaultValue="1"
                            id={'intentos-' + s.id}
                            style={{ padding:'4px 7px', border:'1px solid var(--g200)', fontSize:'11px', fontFamily:'inherit', color:'var(--navy)', background:'#fff' }}>
                            {[1,2,3,5].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <button
                          className="btn-p btn-sm"
                          onClick={async () => {
                            const sel = document.getElementById('intentos-' + s.id)
                            const n   = parseInt(sel?.value || '1')
                            await aprobarSolicitudIntentos(s.id, n)
                            await loadAll()
                            showNotif('Solicitud aprobada · ' + n + ' intento(s) extra habilitados.')
                          }}>
                          Aprobar solicitud
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* REPORTE EXCEL */}
          {tab === 'reporte' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div>
                  <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Reporte de notas</div>
                  <div style={{ fontSize:'9.5px', color:'var(--g400)', marginTop:'2px' }}>Mejor intento de cada almacenero por examen</div>
                </div>
                <div style={{ display:'flex', gap:'7px' }}>
                  <button className="btn-g btn-sm" onClick={() => exportarExcel(null)}>⬇ Exportar todo</button>
                </div>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                {/* Filtro por examen */}
                <div style={{ display:'flex', gap:'5px', marginBottom:'.9rem', flexWrap:'wrap' }}>
                  <button className="btn-g btn-sm" onClick={() => setReporteFlt('all')} style={{ background: reporteFlt === 'all' ? 'var(--navy)' : '', color: reporteFlt === 'all' ? '#fff' : '', borderColor: reporteFlt === 'all' ? 'var(--navy)' : '' }}>Todos</button>
                  {[...new Set(reporte.map(r => r.examenes?.titulo).filter(Boolean))].map(titulo => (
                    <button key={titulo} className="btn-g btn-sm" onClick={() => setReporteFlt(titulo)} style={{ background: reporteFlt === titulo ? 'var(--navy)' : '', color: reporteFlt === titulo ? '#fff' : '', borderColor: reporteFlt === titulo ? 'var(--navy)' : '' }}>
                      {titulo}
                    </button>
                  ))}
                </div>
                {/* Tabla */}
                <div className="dtbl">
                  <div className="dtbl-head" style={{ gridTemplateColumns:'1.3fr 80px 1fr 1.2fr 60px 80px 90px 80px' }}>
                    {['Nombre','Código','Sucursal/Dist.','Examen','Nota','Estado','Fecha','Intentos'].map(c => (
                      <div key={c} className="dtbl-col">{c}</div>
                    ))}
                  </div>
                  {reporte
                    .filter(r => reporteFlt === 'all' || r.examenes?.titulo === reporteFlt)
                    .map(r => (
                      <div key={r.id} className="drow" style={{ gridTemplateColumns:'1.3fr 80px 1fr 1.2fr 60px 80px 90px 80px' }}>
                        <div className="dn">{r.almaceneros?.nombre}</div>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'var(--red)', letterSpacing:'.05em' }}>{r.almaceneros?.codigo}</div>
                        <div className="ds">{r.almaceneros?.sucursales?.nombre || r.almaceneros?.region}</div>
                        <div className="ds">{r.examenes?.titulo}</div>
                        <div style={{ fontSize:'13px', fontWeight:800, color: r.aprobado ? '#276749' : 'var(--red)' }}>{r.nota_vigesimal || 0}</div>
                        <div><span className={'stag ' + (r.aprobado ? 'st-ok' : 'st-low')}>{r.aprobado ? 'Aprobado' : 'Desaprobado'}</span></div>
                        <div className="ds">{r.created_at ? new Date(r.created_at).toLocaleDateString('es-PE') : '—'}</div>
                        <div className="ds">{r.intento_numero || 1}</div>
                      </div>
                    ))
                  }
                  {reporte.filter(r => reporteFlt === 'all' || r.examenes?.titulo === reporteFlt).length === 0 && (
                    <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--g400)', fontSize:'11px' }}>Sin resultados aún.</div>
                  )}
                </div>
                {/* Exportar por examen individual */}
                <div style={{ marginTop:'1.2rem' }}>
                  <div className="sec-lbl" style={{ marginBottom:'.7rem' }}>Exportar por examen individual</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                    {[...new Set(reporte.map(r => r.examenes?.titulo).filter(Boolean))].map(titulo => (
                      <button key={titulo} className="btn-g btn-sm" onClick={() => exportarExcel(titulo)}>
                        ⬇ {titulo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALMACENEROS */}
          {tab === 'alm' && (
            <div>
              <div style={{ padding:'.9rem 1.3rem .45rem', background:'#fff', borderBottom:'1px solid var(--g200)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
                <div>
                  <div style={{ fontSize:'12.5px', fontWeight:800, color:'var(--navy)' }}>Almaceneros</div>
                  <div style={{ fontSize:'9.5px', color:'var(--g400)', marginTop:'2px' }}>El código es el acceso a la plataforma</div>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {[['act','Activos'],['arch','Archivados']].map(([f,l]) => (
                    <button key={f} className="btn-g btn-sm" onClick={() => setAlmFlt(f)} style={{ background: almFlt === f ? 'var(--navy)' : '', color: almFlt === f ? '#fff' : '', borderColor: almFlt === f ? 'var(--navy)' : '' }}>{l}</button>
                  ))}
                  <button className="btn-p btn-sm" onClick={() => setShowAlmModal(true)}>+ Nuevo almacenero</button>
                </div>
              </div>
              <div style={{ padding:'1.1rem 1.3rem' }}>
                <div className="dtbl">
                  <div className="dtbl-head" style={{ gridTemplateColumns:'75px 1.4fr 1fr 1fr 80px 110px' }}>
                    {['Código','Nombre','Sitio','Puesto','Estado','Acciones'].map(c => <div key={c} className="dtbl-col">{c}</div>)}
                  </div>
                  {almsFlt.map(a => (
                    <div key={a.id} className="drow" style={{ gridTemplateColumns:'75px 1.4fr 1fr 1fr 80px 110px' }}>
                      <div style={{ fontWeight:700, color:'var(--red)', fontSize:'10.5px', letterSpacing:'.05em' }}>{a.codigo}</div>
                      <div className="dn">{a.nombre}</div>
                      <div className="ds">{a.sucursales?.nombre}</div>
                      <div style={{ fontSize:'10.5px', color:'var(--g600)' }}>{a.puesto}</div>
                      <div><span className={'stag ' + (a.archivado ? 'st-arch' : 'st-ok')}>{a.archivado ? 'Archivado' : 'Activo'}</span></div>
                      <div>
                        {a.archivado
                          ? <button className="btn-rest" onClick={async () => { await archivarAlmacenero(a.id, false); await loadAll(); showNotif('Almacenero restaurado.') }}>Restaurar</button>
                          : <button className="btn-arch" onClick={async () => { await archivarAlmacenero(a.id, true); await loadAll(); showNotif('Almacenero archivado.') }}>Archivar</button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL SUCURSAL */}
      {showSucModal && (
        <div className="modal-bg">
          <div className="modal" style={{ width:'400px' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'12px', fontWeight:800, color:'var(--navy)' }}>Nueva sucursal</span>
              <button onClick={() => setShowSucModal(false)} style={{ background:'none', border:'none', fontSize:'17px', cursor:'pointer', color:'var(--g400)' }}>×</button>
            </div>
            <div style={{ padding:'1.1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'9px' }}>
                <div>
                  <label className="fl">Código</label>
                  <input className="fi" placeholder="S40" value={sucForm.codigo} onChange={e => setSucForm({...sucForm, codigo: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="fl">Región</label>
                  <select className="fsel" value={sucForm.region} onChange={e => setSucForm({...sucForm, region: e.target.value})}>
                    {['Norte','Sur','Centro','Minería','Distribuidor'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:'9px' }}>
                <label className="fl">Nombre completo</label>
                <input className="fi" placeholder="Ej: S40 — Chiclayo" value={sucForm.nombre} onChange={e => setSucForm({...sucForm, nombre: e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px' }}>
                <div>
                  <label className="fl">Ciudad</label>
                  <input className="fi" placeholder="Chiclayo" value={sucForm.ciudad} onChange={e => setSucForm({...sucForm, ciudad: e.target.value})} />
                </div>
                <div>
                  <label className="fl">Tipo</label>
                  <select className="fsel" value={sucForm.tipo} onChange={e => setSucForm({...sucForm, tipo: e.target.value})}>
                    {['Taller','CWS','Minería','Tienda'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding:'.75rem 1.1rem', borderTop:'1px solid var(--g100)', display:'flex', gap:'7px', justifyContent:'flex-end' }}>
              <button className="btn-g" onClick={() => setShowSucModal(false)}>Cancelar</button>
              <button className="btn-p" onClick={saveSuc}>Guardar sucursal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALMACENERO */}
      {showAlmModal && (
        <div className="modal-bg">
          <div className="modal" style={{ width:'420px' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:2 }}>
              <span style={{ fontSize:'12px', fontWeight:800, color:'var(--navy)' }}>Nuevo almacenero</span>
              <button onClick={() => setShowAlmModal(false)} style={{ background:'none', border:'none', fontSize:'17px', cursor:'pointer', color:'var(--g400)' }}>×</button>
            </div>
            <div style={{ padding:'1.1rem' }}>
              <div style={{ background:'var(--g50)', borderLeft:'3px solid var(--red)', padding:'.6rem .8rem', marginBottom:'.9rem', fontSize:'10.5px', color:'var(--g600)' }}>
                El <strong>código de usuario</strong> será el acceso del almacenero a la plataforma.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'9px' }}>
                <div>
                  <label className="fl">Código de usuario</label>
                  <input className="fi" placeholder="AFL9FU" style={{ textTransform:'uppercase', letterSpacing:'.08em' }} value={almForm.codigo} onChange={e => setAlmForm({...almForm, codigo: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="fl">Región</label>
                  <select className="fsel" value={almForm.region} onChange={e => setAlmForm({...almForm, region: e.target.value})}>
                    {['Norte','Sur','Centro','Minería','Distribuidor'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:'9px' }}>
                <label className="fl">Nombre completo</label>
                <input className="fi" placeholder="Nombres y apellidos" value={almForm.nombre} onChange={e => setAlmForm({...almForm, nombre: e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'9px' }}>
                <div>
                  <label className="fl">Correo corporativo</label>
                  <input className="fi" placeholder="nombre@scania.com" value={almForm.email} onChange={e => setAlmForm({...almForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="fl">Puesto</label>
                  <select className="fsel" value={almForm.puesto} onChange={e => setAlmForm({...almForm, puesto: e.target.value})}>
                    {['Técnico de Almacén','Asesor de Repuestos','Asesor Interno de Servicios','Asistente de Servicio','Supervisor de Servicios','Practicante'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="fl">Teléfono</label>
                <input className="fi" placeholder="9XXXXXXXX" value={almForm.telefono} onChange={e => setAlmForm({...almForm, telefono: e.target.value})} />
              </div>
            </div>
            <div style={{ padding:'.75rem 1.1rem', borderTop:'1px solid var(--g100)', display:'flex', gap:'7px', justifyContent:'flex-end' }}>
              <button className="btn-g" onClick={() => setShowAlmModal(false)}>Cancelar</button>
              <button className="btn-p" onClick={saveAlm}>Guardar almacenero</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATERIAL */}
      {showMatModal && (
        <div className="modal-bg">
          <div className="modal" style={{ width:'400px' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'12px', fontWeight:800, color:'var(--navy)' }}>Agregar material</span>
              <button onClick={() => setShowMatModal(false)} style={{ background:'none', border:'none', fontSize:'17px', cursor:'pointer', color:'var(--g400)' }}>×</button>
            </div>
            <div style={{ padding:'1.1rem' }}>
              <div style={{ display:'flex', gap:0, marginBottom:'9px' }}>
                {[['pdf','PDF'],['link','Link externo']].map(([t,l]) => (
                  <button key={t} style={{ background: matForm.tipo === t ? 'var(--navy)' : '#fff', color: matForm.tipo === t ? '#fff' : 'var(--g400)', border:'1px solid var(--g200)', padding:'6px 12px', fontSize:'9.5px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => setMatForm({...matForm, tipo: t})}>{l}</button>
                ))}
              </div>
              <div style={{ marginBottom:'9px' }}>
                <label className="fl">Módulo asociado</label>
                <select className="fsel" value={matForm.modulo_id} onChange={e => setMatForm({...matForm, modulo_id: e.target.value})}>
                  <option value="">General</option>
                  {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'9px' }}>
                <label className="fl">Título del material</label>
                <input className="fi" placeholder="Ej: Manual Automaster v4.0" value={matForm.titulo} onChange={e => setMatForm({...matForm, titulo: e.target.value})} />
              </div>
              {matForm.tipo === 'pdf' ? (
                <div className="upload-zone">
                  <label style={{ cursor:'pointer', display:'block' }}>
                    📄 {pdfFile ? pdfFile.name : 'Seleccionar PDF (máx. 20 MB)'}
                    <input type="file" accept=".pdf" style={{ display:'none' }} onChange={e => setPdfFile(e.target.files[0])} />
                  </label>
                </div>
              ) : (
                <div style={{ marginBottom:'9px' }}>
                  <label className="fl">URL del recurso</label>
                  <input className="fi" placeholder="https://youtube.com/..." value={matForm.url || ''} onChange={e => setMatForm({...matForm, url: e.target.value})} />
                </div>
              )}
              <div style={{ marginTop:'9px' }}>
                <label className="fl">Estado</label>
                <select className="fsel" value={matForm.estado} onChange={e => setMatForm({...matForm, estado: e.target.value})}>
                  <option value="borrador">Borrador (no visible)</option>
                  <option value="activo">Publicar inmediatamente</option>
                </select>
              </div>
            </div>
            <div style={{ padding:'.75rem 1.1rem', borderTop:'1px solid var(--g100)', display:'flex', gap:'7px', justifyContent:'flex-end' }}>
              <button className="btn-g" onClick={() => setShowMatModal(false)}>Cancelar</button>
              <button className="btn-p" onClick={saveMat}>Guardar material</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXAMEN */}
      {showExamModal && (
        <div className="modal-bg">
          <div className="modal" style={{ width:'440px' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid var(--g100)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:2 }}>
              <span style={{ fontSize:'12px', fontWeight:800, color:'var(--navy)' }}>Nuevo examen</span>
              <button onClick={() => setShowExamModal(false)} style={{ background:'none', border:'none', fontSize:'17px', cursor:'pointer', color:'var(--g400)' }}>×</button>
            </div>
            <div style={{ padding:'1.1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'9px' }}>
                <div>
                  <label className="fl">Módulo</label>
                  <select className="fsel" value={examForm.modulo_id} onChange={e => setExamForm({...examForm, modulo_id: e.target.value})}>
                    <option value="">General</option>
                    {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fl">Estado</label>
                  <select className="fsel" value={examForm.estado} onChange={e => setExamForm({...examForm, estado: e.target.value})}>
                    <option value="borrador">Borrador</option>
                    <option value="activo">Publicar</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:'9px' }}>
                <label className="fl">Título del examen</label>
                <input className="fi" placeholder="Ej: Evaluación Recepción — Nivel 1" value={examForm.titulo} onChange={e => setExamForm({...examForm, titulo: e.target.value})} />
              </div>
              <div className="sec-lbl" style={{ marginBottom:'6px' }}>Preguntas</div>
              {preguntas.map((p, i) => (
                <div key={i} style={{ background:'var(--g50)', borderLeft:'3px solid var(--g200)', padding:'.85rem', marginBottom:'6px' }}>
                  <div style={{ fontSize:'8.5px', fontWeight:700, color:'var(--g400)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'5px' }}>Pregunta {i + 1}</div>
                  <input style={{ width:'100%', padding:'7px 9px', border:'1px solid var(--g200)', fontSize:'11px', marginBottom:'5px', background:'#fff', outline:'none', fontFamily:'inherit' }} placeholder="Escribe la pregunta..." value={p.texto} onChange={e => { const n = [...preguntas]; n[i].texto = e.target.value; setPregs(n) }} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                    {['a','b','c','d'].map(k => (
                      <div key={k} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <input type="radio" name={'correcta-' + i} checked={p.correcta === k} onChange={() => { const n = [...preguntas]; n[i].correcta = k; setPregs(n) }} style={{ accentColor:'var(--red)', cursor:'pointer' }} />
                        <input style={{ flex:1, padding:'4px 6px', border:'1px solid var(--g200)', fontSize:'10px', background:'#fff', outline:'none', fontFamily:'inherit' }} placeholder={'Opción ' + k.toUpperCase()} value={p['opcion_' + k]} onChange={e => { const n = [...preguntas]; n[i]['opcion_' + k] = e.target.value; setPregs(n) }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button style={{ width:'100%', background:'none', border:'1px dashed var(--g200)', padding:'6px', fontSize:'10px', color:'var(--g400)', cursor:'pointer', fontFamily:'inherit', letterSpacing:'.04em' }} onClick={() => { setPregs([...preguntas, { texto:'', opcion_a:'', opcion_b:'', opcion_c:'', opcion_d:'', correcta:'a' }]); setQcMod(qcMod + 1) }}>+ Agregar pregunta</button>
            </div>
            <div style={{ padding:'.75rem 1.1rem', borderTop:'1px solid var(--g100)', display:'flex', gap:'7px', justifyContent:'flex-end', position:'sticky', bottom:0, background:'#fff', zIndex:2 }}>
              <button className="btn-g" onClick={() => setShowExamModal(false)}>Cancelar</button>
              <button className="btn-g" onClick={() => saveExam('borrador')}>Guardar borrador</button>
              <button className="btn-p" onClick={() => saveExam('activo')}>Publicar examen</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN */}
      {notifMsg && (
        <div className="notif show">{notifMsg}</div>
      )}

    </div>
  )
}
