import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  Users, CheckCircle2, Mail, GraduationCap, Calendar, Award, 
  Search, ShieldCheck, AlertTriangle, History, Phone, Sparkles, X, Plus
} from 'lucide-react'
import { buscarGraduadoPorDNI, crearGraduado, obtenerAjustes, obtenerCeremoniaActiva, obtenerCarreras } from '../servicios/api'
import { InputCampo } from './InputCampo'

const CARRERAS_PREDETERMINADAS = [
  { id: 'Ciencia de Datos e IA', nombre: 'Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial', iniciales: 'TSCDIA' },
  { id: 'Análisis de Sistemas', nombre: 'Tecnicatura Superior en Análisis de Sistemas', iniciales: 'TSAS' },
  { id: 'Higiene y Seguridad', nombre: 'Tecnicatura Superior en Higiene, Seguridad y Ambiente Laboral', iniciales: 'TSHSAL' },
  { id: 'Diseño Industrial', nombre: 'Tecnicatura Superior en Diseño Industrial', iniciales: 'TSDI' },
  { id: 'Automatización y Robótica', nombre: 'Tecnicatura Superior en Automatización y Robótica', iniciales: 'TSAR' },
  { id: 'Desarrollo de Software', nombre: 'Tecnicatura Superior en Desarrollo de Software', iniciales: 'TSDS' },
]

function normalizarTexto(txt) {
  if (!txt) return ''
  return String(txt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Formulario compacto y refinado para registrar un nuevo graduado.
 */
export function FormularioGraduado({ onCreado, onCancelar, enModal = false }) {
  const [form, setForm] = useState({ 
    nombre: '', 
    legajo: '', 
    dni: '', 
    correo: '', 
    correo_personal: '',
    telefono: '',
    carrera: '', 
    anio_inscripcion: '',
    promedio: ''
  })
  
  const [carrerasDisponibles, setCarrerasDisponibles] = useState(CARRERAS_PREDETERMINADAS)
  const [esOtraCarrera, setEsOtraCarrera] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [buscandoDni, setBuscandoDni] = useState(false)
  const [coincidencias, setCoincidencias] = useState([])
  const [identidadConfirmada, setIdentidadConfirmada] = useState(false)
  const [mostrarModalIdentidad, setMostrarModalIdentidad] = useState(false)
  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  const coincidenciaEnCeremoniaActiva = coincidencias.find(registro => String(registro.ceremonia_id) === String(ceremoniaActiva?.id))
  const errorRef = useRef(null)
  const dniPerdioFocoRef = useRef(false)
  const [ajustes, setAjustes] = useState({
    formato_identificador: '{CARRERA}-{LEGAJO}-{AÑO}',
    campos_identificador: 'carrera,legajo,anio_inscripcion'
  })

  // Comprobar graduación o inscripción previa en esa carrera
  const graduacionPreviaEnCarrera = (carreraNombre) => {
    if (!carreraNombre || !coincidencias.length) return null
    const normBuscada = normalizarTexto(carreraNombre)
    return coincidencias.find(reg => {
      if (reg.estado === 'RECHAZADO') return false
      const normReg = normalizarTexto(reg.carrera)
      if (!normReg) return false
      return normReg === normBuscada || 
        (normReg.length >= 3 && normBuscada.length >= 3 && (normReg.includes(normBuscada) || normBuscada.includes(normReg)))
    })
  }

  const carreraDuplicada = useMemo(() => {
    return graduacionPreviaEnCarrera(form.carrera)
  }, [form.carrera, coincidencias])

  // Cargar carreras de base de datos y configuración
  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const [datosAjustes, ceremonia, listaCarreras] = await Promise.all([
          obtenerAjustes().catch(() => ({})),
          obtenerCeremoniaActiva().catch(() => null),
          obtenerCarreras().catch(() => [])
        ])

        setAjustes({
          formato_identificador: datosAjustes.formato_identificador?.valor || '{CARRERA}-{LEGAJO}-{AÑO}',
          campos_identificador: datosAjustes.campos_identificador?.valor || 'carrera,legajo,anio_inscripcion'
        })
        setCeremoniaActiva(ceremonia)

        if (Array.isArray(listaCarreras) && listaCarreras.length > 0) {
          const mapeadas = listaCarreras.map(c => ({
            id: c.id,
            nombre: c.nombre,
            iniciales: c.sigla || ''
          }))
          setCarrerasDisponibles(mapeadas)
        }
      } catch (err) {
        console.error('Error al cargar datos en formulario de graduado:', err)
      }
    }
    cargarDatosIniciales()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Detección automática por DNI
  useEffect(() => {
    const dniLimpio = form.dni.replace(/\D/g, '')
    if (dniLimpio.length < 7) return undefined

    const temporizador = setTimeout(async () => {
      setBuscandoDni(true)
      try {
        const resultado = await buscarGraduadoPorDNI(dniLimpio)
        const registros = resultado.coincidencias || []
        setCoincidencias(registros)
        if (registros.length > 0 && dniPerdioFocoRef.current) {
          setMostrarModalIdentidad(true)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setBuscandoDni(false)
      }
    }, 450)

    return () => clearTimeout(temporizador)
  }, [form.dni])

  const esCampoActivo = (campo) => {
    return ajustes.campos_identificador.toLowerCase().includes(campo.toLowerCase())
  }

  const generarIdentificadorPreview = () => {
    let fmt = ajustes.formato_identificador
    fmt = fmt.replace('{CARRERA}', form.carrera || '[CARRERA]')
    fmt = fmt.replace('{LEGAJO}', form.legajo || '[LEGAJO]')
    fmt = fmt.replace('{AÑO}', form.anio_inscripcion || '[AÑO]')
    return fmt
  }

  // Autocompletar correo institucional del Beltrán al tipear DNI si está vacío
  const sugerirCorreoInstitucional = () => {
    const d = form.dni.replace(/\D/g, '')
    if (d) {
      setForm(p => ({ ...p, correo: `${d}@itbeltran.com.ar` }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!form.nombre.trim() || !form.dni.trim()) {
      setError('Nombre completo y DNI son obligatorios.')
      return
    }

    if (coincidencias.length > 0 && !identidadConfirmada) {
      setError('Confirmá si el DNI corresponde a la persona encontrada antes de continuar.')
      return
    }

    if (coincidenciaEnCeremoniaActiva) {
      setError('Esta persona ya está inscripta en la ceremonia activa. Usá la opción Editar en su registro.')
      return
    }

    if (carreraDuplicada) {
      setError(`Esta persona ya registra una graduación en "${form.carrera}" (${carreraDuplicada.ceremonia_nombre || 'ceremonia previa'}).`)
      return
    }

    if (esCampoActivo('legajo') && !form.legajo.trim()) {
      setError('El Legajo es requerido por la configuración institucional.')
      return
    }

    if (esCampoActivo('carrera') && !form.carrera.trim()) {
      setError('La Carrera es requerida.')
      return
    }
    
    setCargando(true)
    setError('')
    
    try {
      const nuevo = await crearGraduado({
        ...form,
        ceremonia_id: ceremoniaActiva?.id,
        identidad_confirmada: identidadConfirmada
      })
      onCreado(nuevo)
    } catch (err) {
      if (err.codigo === 'REQUIERE_CONFIRMACION_IDENTIDAD') {
        const registros = err.persona ? [err.persona] : []
        setCoincidencias(registros)
        setIdentidadConfirmada(false)
        setMostrarModalIdentidad(registros.length > 0)
        setError('Confirmá la identidad de la persona encontrada antes de continuar.')
      } else {
        setError(err.message)
      }
    } finally {
      setCargando(false)
    }
  }

  const formulario = (
    <div className={`${enModal ? 'bg-white p-4 sm:p-5' : 'bg-white p-5 border border-slate-200 rounded-2xl shadow-sm mb-6'}`}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4">
        {error && (
          <div ref={errorRef} role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-xs">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Ceremonia de destino compacta */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3.5 py-2">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-sky-700">Ceremonia activa</span>
            <p className="truncate text-xs font-bold text-slate-800">{ceremoniaActiva?.nombre || 'Sin ceremonia activa'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
            {ceremoniaActiva ? 'Activa' : 'Requiere activación'}
          </span>
        </div>

        {/* 1. Datos Identificatorios Principales */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <InputCampo
              label="Nombre completo *"
              valor={form.nombre}
              onChange={(v) => setForm((p) => ({ ...p, nombre: v }))}
              placeholder="Ej. Gómez María Belén"
              icon={Users}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 ml-1">DNI *</label>
              {form.dni && !form.correo && (
                <button 
                  type="button" 
                  onClick={sugerirCorreoInstitucional}
                  className="text-[9px] font-bold text-sky-600 hover:text-sky-800 transition-colors"
                >
                  + Correo Beltrán
                </button>
              )}
            </div>
            <InputCampo
              valor={form.dni}
              onChange={(v) => {
                dniPerdioFocoRef.current = false
                setIdentidadConfirmada(false)
                setMostrarModalIdentidad(false)
                setCoincidencias([])
                setForm((p) => ({ ...p, dni: v.replace(/\D/g, '') }))
              }}
              onBlur={() => {
                dniPerdioFocoRef.current = true
                if (coincidencias.length > 0 && !identidadConfirmada) {
                  setMostrarModalIdentidad(true)
                }
              }}
              placeholder="Ej. 42123456"
              icon={Users}
              inputMode="numeric"
              maxLength={10}
            />
          </div>
        </div>

        {/* 2. Carrera y Datos Académicos */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {esCampoActivo('legajo') && (
            <div>
              <InputCampo
                label="Legajo"
                valor={form.legajo}
                onChange={(v) => setForm((p) => ({ ...p, legajo: v }))}
                placeholder="TSAS-2025-0101"
                icon={CheckCircle2}
              />
            </div>
          )}

          {esCampoActivo('carrera') && (
            <div className={esCampoActivo('legajo') ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <div className="flex items-center justify-between mb-1 ml-1">
                <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Carrera de Graduación *
                </label>
                {form.carrera && !carreraDuplicada && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <CheckCircle2 size={9} /> {form.carrera}
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <GraduationCap size={15} />
                </div>

                <select
                  value={esOtraCarrera ? '__OTRA__' : form.carrera}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '__OTRA__') {
                      setEsOtraCarrera(true)
                      setForm(p => ({ ...p, carrera: '' }))
                    } else {
                      setEsOtraCarrera(false)
                      setForm(p => ({ ...p, carrera: val }))
                    }
                  }}
                  className={`
                    w-full bg-white border border-slate-200 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-semibold
                    transition-all duration-200 ease-out outline-none pl-10 pr-8 cursor-pointer appearance-none
                    ${carreraDuplicada 
                      ? 'border-rose-300 bg-rose-50/50 text-rose-900' 
                      : 'text-slate-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10'
                    }
                  `}
                >
                  <option value="">-- Seleccionar Carrera --</option>
                  {carrerasDisponibles.map(c => {
                    const previa = graduacionPreviaEnCarrera(c.nombre) || (c.iniciales ? graduacionPreviaEnCarrera(c.iniciales) : null)
                    return (
                      <option 
                        key={c.id || c.nombre} 
                        value={c.nombre}
                        disabled={Boolean(previa)}
                        className={previa ? 'text-slate-400 bg-slate-100' : 'text-slate-800 font-medium'}
                      >
                        {c.nombre} {c.iniciales ? `(${c.iniciales})` : ''} {previa ? `· [Ya inscripto en ${previa.ceremonia_nombre || 'acto previo'}]` : ''}
                      </option>
                    )
                  })}
                  <option value="__OTRA__">+ Otra carrera (ingresar nombre)...</option>
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">
                  ▼
                </div>
              </div>

              {esOtraCarrera && (
                <div className="mt-2">
                  <InputCampo
                    label="Nombre de la carrera manual"
                    valor={form.carrera}
                    onChange={(v) => setForm(p => ({ ...p, carrera: v }))}
                    placeholder="Ej. Tecnicatura Superior en Logística"
                    icon={GraduationCap}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Vías de Comunicación y Contacto (Institucional, Personal, Teléfono) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Vías de Comunicación y Notificación
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Opcionales</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <InputCampo
              label="Correo Institucional"
              valor={form.correo}
              onChange={(v) => setForm((p) => ({ ...p, correo: v }))}
              placeholder="alumno@itbeltran.com.ar"
              icon={Mail}
              type="email"
            />
            <InputCampo
              label="Correo Personal"
              valor={form.correo_personal}
              onChange={(v) => setForm((p) => ({ ...p, correo_personal: v }))}
              placeholder="ejemplo@gmail.com"
              icon={Mail}
              type="email"
            />
            <InputCampo
              label="Teléfono / WhatsApp"
              valor={form.telefono}
              onChange={(v) => setForm((p) => ({ ...p, telefono: v }))}
              placeholder="Ej. 11 3456-7890"
              icon={Phone}
              type="tel"
            />
          </div>
        </div>

        {/* 4. Año de Inscripción y Promedio */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {esCampoActivo('anio_inscripcion') && (
            <InputCampo
              label="Año de Inscripción"
              valor={form.anio_inscripcion}
              onChange={(v) => setForm((p) => ({ ...p, anio_inscripcion: v }))}
              placeholder="2022"
              icon={Calendar}
            />
          )}

          <InputCampo
            label="Promedio General (Opcional)"
            valor={form.promedio}
            onChange={(v) => setForm((p) => ({ ...p, promedio: v }))}
            placeholder="Ej. 9.20"
            icon={Award}
          />
        </div>

        {/* Alerta de DNI coincidente */}
        {(buscandoDni || (coincidencias.length > 0 && identidadConfirmada)) && (
          <div className={`rounded-xl border px-3 py-2 text-xs ${identidadConfirmada ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
            {buscandoDni ? (
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Search size={14} className="animate-spin text-sky-500" />
                <span>Verificando DNI...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">Persona validada: {coincidencias[0]?.nombre}</span>
                </div>
                <span className="text-[10px] text-slate-500">{coincidencias.length} registro(s)</span>
              </div>
            )}
          </div>
        )}

        {/* Barra de pie con preview compacto y botones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-[10px] text-slate-500">
            <span className="font-bold text-slate-700">Identificador: </span>
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {generarIdentificadorPreview()}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancelar}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={cargando || !ceremoniaActiva || (coincidencias.length > 0 && !identidadConfirmada) || Boolean(carreraDuplicada)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              {cargando ? 'Guardando...' : 'Crear Graduado'}
              {!cargando && <CheckCircle2 size={14} />}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de confirmación de identidad */}
      {mostrarModalIdentidad && coincidencias.length > 0 && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">DNI coincidente detectado</h3>
                <p className="mt-1 text-xs text-slate-600">
                  El DNI <strong>{form.dni}</strong> ya pertenece a <strong>{coincidencias[0]?.nombre}</strong>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalIdentidad(false)
                  setCoincidencias([])
                  setIdentidadConfirmada(false)
                  setForm(p => ({ ...p, dni: '' }))
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Es otra persona
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const persona = coincidencias[0]
                  setForm(p => ({ ...p, nombre: persona.nombre || p.nombre, correo: persona.correo || p.correo }))
                  setIdentidadConfirmada(true)
                  setMostrarModalIdentidad(false)
                }}
                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
              >
                Confirmar identidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (!enModal || typeof document === 'undefined') return formulario

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-sky-600">Padrón Oficial</span>
            <h2 className="text-sm font-bold text-slate-900">Nuevo Graduado</h2>
          </div>
          <button 
            type="button" 
            onClick={onCancelar} 
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {formulario}
      </section>
    </div>,
    document.body
  )
}
