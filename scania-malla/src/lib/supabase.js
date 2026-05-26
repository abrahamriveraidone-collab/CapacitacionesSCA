import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Almaceneros ──────────────────────────────────────────
export async function getAlmaeneroByCodigo(codigo) {
  const { data, error } = await supabase
    .from('almaceneros')
    .select('*, sucursales(nombre, region)')
    .eq('codigo', codigo.toUpperCase())
    .eq('archivado', false)
    .single()
  if (error) return null
  return data
}

// ── Módulos ───────────────────────────────────────────────
export async function getModulos() {
  const { data } = await supabase
    .from('modulos')
    .select('*, lecciones(*)')
    .eq('estado', 'publicado')
    .eq('archivado', false)
    .order('orden')
  return data || []
}

export async function getAllModulos() {
  const { data } = await supabase
    .from('modulos')
    .select('*, lecciones(*)')
    .order('orden')
  return data || []
}

export async function upsertModulo(modulo) {
  const { data, error } = await supabase
    .from('modulos')
    .upsert(modulo)
    .select()
    .single()
  return { data, error }
}

export async function archivarModulo(id, archivado) {
  return supabase.from('modulos').update({ archivado }).eq('id', id)
}

// ── Lecciones ─────────────────────────────────────────────
export async function upsertLeccion(leccion) {
  return supabase.from('lecciones').upsert(leccion)
}

export async function deleteLeccion(id) {
  return supabase.from('lecciones').delete().eq('id', id)
}

// ── Material ──────────────────────────────────────────────
export async function getMaterial() {
  const { data } = await supabase
    .from('material')
    .select('*, modulos(titulo)')
    .order('created_at', { ascending: false })
  return data || []
}

export async function upsertMaterial(mat) {
  return supabase.from('material').upsert(mat)
}

export async function archivarMaterial(id, archivado) {
  return supabase.from('material').update({ archivado }).eq('id', id)
}

export async function uploadPDF(file, path) {
  const { data, error } = await supabase.storage
    .from('material-pdfs')
    .upload(path, file, { upsert: true })
  if (error) return { url: null, error }
  const { data: urlData } = supabase.storage
    .from('material-pdfs')
    .getPublicUrl(path)
  return { url: urlData.publicUrl, error: null }
}

// ── Exámenes ──────────────────────────────────────────────
export async function getExamenes() {
  const { data } = await supabase
    .from('examenes')
    .select('id, titulo, modulo_id, estado, archivado, nota_minima, tiempo_limite, intentos_max, tipo_audiencia, created_at, modulos(titulo)')
    .order('created_at', { ascending: false })
  if (!data) return []

  // Cargar preguntas por separado para evitar duplicados por join
  const ids = data.map(e => e.id)
  const { data: pregs } = await supabase
    .from('preguntas')
    .select('*')
    .in('examen_id', ids)

  // Agrupar preguntas por examen_id
  const pregsPorExamen = {}
  ;(pregs || []).forEach(p => {
    if (!pregsPorExamen[p.examen_id]) pregsPorExamen[p.examen_id] = []
    pregsPorExamen[p.examen_id].push(p)
  })

  return data.map(e => ({ ...e, preguntas: pregsPorExamen[e.id] || [] }))
}

export async function upsertExamen(examen) {
  const { data, error } = await supabase
    .from('examenes')
    .upsert(examen)
    .select()
    .single()
  return { data, error }
}

export async function upsertPregunta(pregunta) {
  const { data, error } = await supabase
    .from('preguntas')
    .upsert(pregunta)
    .select()
    .single()
  return { data, error }
}

export async function archivarExamen(id, archivado) {
  return supabase.from('examenes').update({ archivado }).eq('id', id)
}

// ── Progreso (auto-guardado) ──────────────────────────────
export async function getProgreso(almacenero_id) {
  const { data } = await supabase
    .from('progreso')
    .select('*, modulos(titulo, icono)')
    .eq('almacenero_id', almacenero_id)
  return data || []
}

export async function guardarResultadoExamen({ almacenero_id, examen_id, modulo_id, puntaje, nota_vigesimal, aprobado, respuestas, tiempo_segundos, intento_numero }) {
  await supabase.from('resultados_examenes').insert({
    almacenero_id,
    examen_id,
    modulo_id,
    puntaje,
    nota_vigesimal: nota_vigesimal || 0,
    aprobado,
    respuestas,
    tiempo_segundos: tiempo_segundos || 0,
    intento_numero: intento_numero || 1,
  })
}

export async function getIntentosPorExamen(almacenero_id, examen_id) {
  const { data } = await supabase
    .from('resultados_examenes')
    .select('id')
    .eq('almacenero_id', almacenero_id)
    .eq('examen_id', examen_id)
  return (data || []).length
}

export async function crearSolicitudIntentos({ almacenero_id, examen_id, mensaje }) {
  return supabase.from('solicitudes_intentos').insert({
    almacenero_id,
    examen_id,
    mensaje,
    estado: 'pendiente',
  })
}

export async function getSolicitudesIntentos() {
  const { data } = await supabase
    .from('solicitudes_intentos')
    .select('*, almaceneros(nombre, codigo), examenes(titulo)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
  return data || []
}

export async function aprobarSolicitudIntentos(id, intentos_extra, almacenero_id, examen_titulo) {
  await supabase
    .from('solicitudes_intentos')
    .update({ estado: 'aprobado', intentos_extra })
    .eq('id', id)
  // Crear notificación para el almacenero
  if (almacenero_id) {
    await supabase.from('notificaciones').insert({
      almacenero_id,
      titulo: '✓ Intentos habilitados',
      mensaje: 'El administrador habilitó ' + intentos_extra + ' intento(s) adicional(es) para el examen: ' + (examen_titulo || ''),
    })
  }
}

export async function getReporteNotas() {
  const { data } = await supabase
    .from('resultados_examenes')
    .select('*, almaceneros(nombre, codigo, region, sucursales(nombre)), examenes(titulo, nota_minima, modulos(titulo))')
    .order('created_at', { ascending: false })
  return data || []
}

export async function actualizarProgreso(almacenero_id, modulo_id, porcentaje, completado) {
  await supabase
    .from('progreso')
    .upsert({
      almacenero_id,
      modulo_id,
      porcentaje,
      completado,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'almacenero_id,modulo_id' })
}

export async function marcarLeccionVista(almacenero_id, leccion_id) {
  await supabase.from('lecciones_vistas')
    .upsert({ almacenero_id, leccion_id }, { onConflict: 'almacenero_id,leccion_id' })
}

// ── Sucursales ────────────────────────────────────────────
export async function getSucursales() {
  const { data } = await supabase
    .from('sucursales')
    .select('*')
    .order('codigo')
  return data || []
}

export async function upsertSucursal(suc) {
  return supabase.from('sucursales').upsert(suc)
}

export async function archivarSucursal(id, archivada) {
  return supabase.from('sucursales').update({ archivada }).eq('id', id)
}

// ── Almaceneros (admin) ───────────────────────────────────
export async function getAllAlmaceneros() {
  const { data } = await supabase
    .from('almaceneros')
    .select('*, sucursales(nombre, region)')
    .order('nombre')
  return data || []
}

export async function upsertAlmacenero(alm) {
  return supabase.from('almaceneros').upsert(alm)
}

export async function archivarAlmacenero(id, archivado) {
  return supabase.from('almaceneros').update({ archivado }).eq('id', id)
}


// ── Subcarpetas ───────────────────────────────────────────
export async function getSubcarpetas(modulo_id) {
  const { data } = await supabase
    .from('subcarpetas')
    .select('*, material_subcarpeta(*)')
    .eq('modulo_id', modulo_id)
    .order('orden')
  return data || []
}

export async function upsertSubcarpeta(sub) {
  const { data, error } = await supabase
    .from('subcarpetas')
    .upsert(sub)
    .select()
    .single()
  return { data, error }
}

export async function deleteSubcarpeta(id) {
  return supabase.from('subcarpetas').delete().eq('id', id)
}

export async function upsertMaterialSubcarpeta(mat) {
  const { data, error } = await supabase
    .from('material_subcarpeta')
    .upsert(mat)
    .select()
    .single()
  return { data, error }
}

export async function deleteMaterialSubcarpeta(id) {
  return supabase.from('material_subcarpeta').delete().eq('id', id)
}

export async function uploadPDFSubcarpeta(file, path) {
  const { data, error } = await supabase.storage
    .from('material-pdfs')
    .upload(path, file, { upsert: true })
  if (error) return { url: null, error }
  const { data: urlData } = supabase.storage
    .from('material-pdfs')
    .getPublicUrl(path)
  return { url: urlData.publicUrl, error: null }
}


// ── Helpers de audiencia ──────────────────────────────────
// Determina el tipo de un almacenero: 'distribuidor' o 'sucursal'
export function getTipoAlmacenero(user) {
  return user?.region === 'Distribuidor' ? 'distribuidor' : 'sucursal'
}

// Filtra items por tipo_audiencia
export function filtrarPorAudiencia(items, tipo) {
  return (items || []).filter(item =>
    item.tipo_audiencia === tipo || item.tipo_audiencia === 'ambos'
  )
}

// ── Notificaciones ────────────────────────────────────────
export async function getNotificaciones(almacenero_id) {
  const { data } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('almacenero_id', almacenero_id)
    .order('created_at', { ascending: false })
  return data || []
}

export async function marcarNotificacionLeida(id) {
  return supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
}

export async function crearNotificacion({ almacenero_id, titulo, mensaje }) {
  return supabase.from('notificaciones').insert({ almacenero_id, titulo, mensaje })
}

// ── Dashboard ─────────────────────────────────────────────
export async function getDashboardData() {
  const [alm, mods, exams, resultados] = await Promise.all([
    supabase.from('almaceneros').select('id', { count: 'exact' }).eq('archivado', false),
    supabase.from('modulos').select('id', { count: 'exact' }).eq('estado', 'publicado').eq('archivado', false),
    supabase.from('examenes').select('id', { count: 'exact' }).eq('estado', 'activo').eq('archivado', false),
    supabase.from('resultados_examenes').select('puntaje').order('created_at', { ascending: false }).limit(50),
  ])
  const puntajes = resultados.data?.map(r => r.puntaje) || []
  const promedio = puntajes.length ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : 0
  return {
    totalAlmaceneros: alm.count || 0,
    totalModulos: mods.count || 0,
    totalExamenes: exams.count || 0,
    promedioProgreso: promedio,
  }
}
