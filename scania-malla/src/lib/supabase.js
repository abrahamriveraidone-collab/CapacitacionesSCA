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
    .select('*, preguntas(*), modulos(titulo)')
    .order('created_at', { ascending: false })
  return data || []
}

export async function upsertExamen(examen) {
  return supabase.from('examenes').upsert(examen)
}

export async function upsertPregunta(pregunta) {
  return supabase.from('preguntas').upsert(pregunta)
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

export async function guardarResultadoExamen({ almacenero_id, examen_id, modulo_id, puntaje, aprobado, respuestas }) {
  // 1. Guardar resultado del examen
  await supabase.from('resultados_examenes').insert({
    almacenero_id, examen_id, modulo_id, puntaje, aprobado, respuestas
  })
  // 2. Actualizar progreso del módulo automáticamente
  if (aprobado) {
    await supabase.from('progreso').upsert({
      almacenero_id,
      modulo_id,
      porcentaje: puntaje,
      completado: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'almacenero_id,modulo_id' })
  }
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
