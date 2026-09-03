import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Users, CheckCircle2, Mail, GraduationCap, Calendar, Award, Search, ShieldCheck, AlertTriangle, History } from 'lucide-react'
import { buscarGraduadoPorDNI, crearGraduado, obtenerAjustes, obtenerCeremoniaActiva } from '../servicios/api'
import { InputCampo } from './InputCampo'

const CARRERAS_OFICIALES = [
  { id: 'Analista de Sistemas', nombre: 'Analista de Sistemas', iniciales: 'TSA / TSAS' },
  { id: 'Desarrollo de Software', nombre: 'Desarrollo de Software', iniciales: 'TSDS' },
  { id: 'Automatización y Robótica', nombre: 'Automatización y Robótica', iniciales: 'TSAR' },
  { id: 'Redes e Infraestructura', nombre: 'Redes e Infraestructura', iniciales: 'TSRI' },
  { id: 'Diseño y Desarrollo Web', nombre: 'Diseño y Desarrollo Web', iniciales: 'TSDW' },
  { id: 'Higiene y Seguridad en el Trabajo', nombre: 'Higiene y Seguridad en el Trabajo', iniciales: 'TSHST' },
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
 * Formulario para crear un nuevo Graduado en el sistema.
 * @param {Function} onCreado - Callback ejecutado tras crear exitosamente el graduado.
 * @param {Function} onCancelar - Callback para cerrar el formulario.
 */
export function FormularioGraduado({ onCreado, onCancelar, enModal = false }) {
  const [form, setForm] = useState({ 
    nombre: '', 
    legajo: '', 
    dni: '', 
    correo: '', 
    carrera: '', 
    anio_inscripcion: '',
    promedio: ''
  })
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

  // Función para comprobar si este DNI ya tiene graduación o inscripción previa en esa carrera
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

  // Cargar configuración de identificación
  useEffect(() => {
    async function cargarConfig() {
      try {
        const [datos, ceremonia] = await Promise.all([
          obtenerAjustes(),
          obtenerCeremoniaActiva()
        ])
        setAjustes({
          formato_identificador: datos.formato_identificador?.valor || '{CARRERA}-{LEGAJO}-{AÑO}',
          campos_identificador: datos.campos_identificador?.valor || 'carrera,legajo,anio_inscripcion'
        })
        setCeremoniaActiva(ceremonia)
      } catch (err) {
        console.error('Error al cargar ajustes de identificador:', err)
      }
    }
    cargarConfig()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

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

  // Verificar si un campo está activo en la configuración
  const esCampoActivo = (campo) => {
    return ajustes.campos_identificador.toLowerCase().includes(campo.toLowerCase())
  }

  // Generar identificador en tiempo real para previsualización
  const generarIdentificadorPreview = () => {
    let fmt = ajustes.formato_identificador
    fmt = fmt.replace('{CARRERA}', form.carrera || '[CARRERA]')
    fmt = fmt.replace('{LEGAJO}', form.legajo || '[LEGAJO]')
    fmt = fmt.replace('{AÑO}', form.anio_inscripcion || '[AÑO]')
    return fmt
  }

  // Manejo del envío del formulario
  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validaciones básicas
    if (!form.nombre || !form.dni) {
      setError('Nombre y DNI son obligatorios')
      return
    }

    if (coincidencias.length > 0 && !identidadConfirmada) {
      setError('Confirmá si el DNI corresponde a la persona encontrada antes de continuar')
      return
    }

    if (coincidenciaEnCeremoniaActiva) {
      setError('Esta persona ya está inscripta en la ceremonia activa. Cerrá este formulario y usá Editar en su registro existente.')
      return
    }

    if (carreraDuplicada) {
      setError(`Esta persona ya se encuentra graduada o registrada en "${form.carrera}" (${carreraDuplicada.ceremonia_nombre || 'ceremonia previa'}). No es posible registrar dos veces a un egresado en la misma carrera.`)
      return
    }

    if (esCampoActivo('legajo') && !form.legajo) {
      setError('El Legajo es requerido por la configuración del sistema')
      return
    }

    if (esCampoActivo('carrera') && !form.carrera) {
      setError('La Carrera es requerida por la configuración del sistema')
      return
    }

    if (esCampoActivo('anio_inscripcion') && !form.anio_inscripcion) {
      setError('El Año de Inscripción es requerido por la configuración del sistema')
      return
    }
    
    setCargando(true)
    setError('')
    
    try {
      // Llamada al servicio de API para persistir el graduado
      const nuevo = await crearGraduado({
        ...form,
        ceremonia_id: ceremoniaActiva?.id,
        identidad_confirmada: identidadConfirmada
      })
      onCreado(nuevo)
    } catch (err) {
      if (err.codigo === 'REQUIERE_CONFIRMACION_IDENTIDAD') {
        try {
          const resultado = await buscarGraduadoPorDNI(form.dni)
          const registros = resultado.coincidencias || (err.persona ? [err.persona] : [])
          setCoincidencias(registros)
          setIdentidadConfirmada(false)
          setMostrarModalIdentidad(registros.length > 0)
          setError('Confirmá la identidad de la persona encontrada antes de crear la inscripción.')
        } catch {
          setCoincidencias(err.persona ? [err.persona] : [])
          setMostrarModalIdentidad(Boolean(err.persona))
          setError('Confirmá la identidad de la persona encontrada antes de crear la inscripción.')
        }
      } else {
        setError(err.message)
      }
    } finally {
      setCargando(false)
    }
  }

  const formulario = (
    <div className={`${enModal ? 'bg-white p-5 sm:p-6' : 'bg-white/50 backdrop-blur-sm p-6 border-b border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 rounded-[28px] mb-6 shadow-sm'}`}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-5">
        {error && (
          <div ref={errorRef} role="alert" aria-live="assertive" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">No se pudo registrar al graduado</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${ceremoniaActiva ? 'border-sky-200 bg-sky-50/70' : 'border-red-200 bg-red-50'}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${ceremoniaActiva ? 'text-sky-600' : 'text-red-600'}`}>
              Ceremonia de destino
            </p>
            <p className="mt-0.5 text-sm font-black text-slate-900">
              {ceremoniaActiva?.nombre || 'No hay una ceremonia activa'}
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${ceremoniaActiva ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {ceremoniaActiva ? 'Activa' : 'Requiere activación'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
          <InputCampo
            label="Nombre completo"
            valor={form.nombre}
            onChange={(v) => setForm((p) => ({ ...p, nombre: v }))}
            placeholder="Juan Cancelo"
            icon={Users}
          />
          <InputCampo
            label="DNI"
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
            placeholder="35230531"
            icon={Users}
            inputMode="numeric"
            maxLength={10}
          />
          <InputCampo
            label="Correo (Opcional)"
            valor={form.correo}
            onChange={(v) => setForm((p) => ({ ...p, correo: v }))}
            placeholder="juan@ejemplo.com"
            icon={Mail}
          />

          {esCampoActivo('legajo') && (
            <InputCampo
              label="Legajo"
              valor={form.legajo}
              onChange={(v) => setForm((p) => ({ ...p, legajo: v }))}
              placeholder="227067"
              icon={CheckCircle2}
            />
          )}

          {esCampoActivo('carrera') && (
            <div className="flex flex-col gap-1.5 w-full group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-sky-600 flex items-center justify-between">
                <span>Carrera de Graduación</span>
                {form.carrera && !carreraDuplicada && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 size={10} /> {form.carrera}
                  </span>
                )}
              </label>

              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none ${carreraDuplicada ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-sky-500'}`}>
                  <GraduationCap size={18} />
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
                    w-full bg-white border-2 rounded-2xl py-3.5 text-sm font-semibold
                    transition-all duration-300 ease-out outline-none pl-12 pr-10 cursor-pointer appearance-none
                    ${carreraDuplicada 
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500' 
                      : 'border-slate-100 text-slate-700 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 focus:shadow-xl'
                    }
                  `}
                >
                  <option value="">-- Seleccionar Carrera Oficial --</option>
                  {CARRERAS_OFICIALES.map(c => {
                    const previa = graduacionPreviaEnCarrera(c.nombre) || (c.iniciales ? graduacionPreviaEnCarrera(c.iniciales) : null)
                    return (
                      <option 
                        key={c.id} 
                        value={c.nombre}
                        disabled={Boolean(previa)}
                        className={previa ? 'text-slate-400 bg-slate-100 font-normal' : 'text-slate-800 font-bold'}
                      >
                        {c.nombre} {c.iniciales ? `(${c.iniciales})` : ''} {previa ? `· [Ya graduado/registrado en ${previa.ceremonia_nombre || 'acto anterior'}]` : ''}
                      </option>
                    )
                  })}
                  <option value="__OTRA__">+ Otra carrera (ingresar manualmente)...</option>
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                  ▼
                </div>
              </div>

              {/* Si eligió ingresar manualmente otra carrera */}
              {esOtraCarrera && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                  <InputCampo
                    label="Nombre de la Carrera (Manual)"
                    valor={form.carrera}
                    onChange={(v) => setForm(p => ({ ...p, carrera: v }))}
                    placeholder="Ej: Tecnicatura Superior en Logística"
                    icon={GraduationCap}
                  />
                </div>
              )}

              {/* ALERTA DE BLOQUEO SI YA SE GRADUÓ O REGISTRÓ EN ESTA CARRERA */}
              {carreraDuplicada && (
                <div className="mt-1.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block text-rose-900">Inscripción no permitida en esta carrera:</strong>
                    <p className="font-normal text-rose-700">
                      Esta persona (DNI {form.dni}) ya registra una graduación o inscripción activa en <strong>{form.carrera}</strong> ({carreraDuplicada.ceremonia_nombre || 'ceremonia previa'}).
                    </p>
                    <span className="block text-[10px] text-rose-600 font-bold">
                      Un egresado solo puede inscribirse en una carrera diferente a las ya cursadas.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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
            placeholder="9.50"
            icon={Award}
          />
        </div>

        {(buscandoDni || (coincidencias.length > 0 && identidadConfirmada)) && (
          <div className={`rounded-xl border px-4 py-3 ${identidadConfirmada ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/70'}`}>
            {buscandoDni ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Search size={18} className="animate-pulse text-sky-500" />
                <p className="text-xs font-bold">Comprobando antecedentes del DNI…</p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white"><ShieldCheck size={18} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900">Identidad confirmada</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-600">{coincidencias[0].nombre} · {coincidencias[0].correo || 'Sin correo registrado'}</p>
                  <details className="mt-1.5 text-[10px] text-slate-500">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 font-bold text-emerald-700"><History size={11} /> {coincidencias.length} {coincidencias.length === 1 ? 'participación anterior' : 'participaciones anteriores'} · Ver historial</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {coincidencias.map((registro) => <div key={registro.id} className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2"><strong className="block text-slate-800">{registro.carrera || 'Carrera sin informar'}</strong><span>{registro.ceremonia_nombre || 'Ceremonia sin informar'} · {registro.estado === 'RECHAZADO' ? 'No participó' : registro.ceremonia_activa ? (registro.estado || 'Pendiente') : 'Finalizada'}</span></div>)}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista previa del identificador configurado */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Identificador</p>
            <p className="mt-0.5 text-sm font-black text-slate-700">{generarIdentificadorPreview()}</p>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest">
            {ajustes.formato_identificador}
          </span>
        </div>
        
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="submit"
            disabled={cargando || !ceremoniaActiva || (coincidencias.length > 0 && !identidadConfirmada) || Boolean(carreraDuplicada)}
            className="group relative overflow-hidden rounded-xl bg-slate-900 px-6 py-3.5 text-white shadow-lg shadow-slate-900/15 transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-3 text-xs font-black uppercase tracking-widest">
              {cargando
                ? 'Registrando...'
                : !ceremoniaActiva
                  ? 'Activá una ceremonia'
                  : carreraDuplicada
                    ? 'Carrera ya cursada'
                    : coincidencias.length > 0 && !identidadConfirmada
                      ? 'Confirmá la identidad'
                      : 'Crear Graduado'}
              {!cargando && <CheckCircle2 size={16} className="transition-transform group-hover:rotate-12" />}
            </span>
          </button>
          
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 hover:text-red-500 transition-colors"
          >
            Descartar
          </button>
        </div>
      </form>

      {mostrarModalIdentidad && coincidencias.length > 0 && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmar-identidad">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="border-b border-slate-100 bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">DNI registrado anteriormente</p>
                  <h2 id="titulo-confirmar-identidad" className="mt-2 text-2xl font-black tracking-tight text-slate-900">{coincidenciaEnCeremoniaActiva ? 'Esta persona ya está en el padrón activo' : '¿Es la persona que intentás registrar?'}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {coincidenciaEnCeremoniaActiva
                      ? 'Esta persona ya tiene una inscripción en la ceremonia activa. Para mantener un único registro, editá el existente desde el padrón.'
                      : 'Encontramos este DNI en otras participaciones. Revisá la información antes de crear la nueva inscripción para esta ceremonia.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nombre registrado</p>
                    <p className="mt-1 text-base font-black text-slate-900">{coincidencias[0].nombre}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">DNI</p>
                    <p className="mt-1 text-base font-black text-slate-900">{coincidencias[0].dni}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Correo</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-700">{coincidencias[0].correo || 'Sin correo registrado'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Participaciones</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{coincidencias.length} en el sistema</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Historial encontrado</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {coincidencias.map((registro) => (
                    <div key={registro.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-black text-slate-900">{registro.carrera || 'Carrera sin informar'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{registro.ceremonia_nombre || 'Ceremonia sin informar'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">{registro.estado || 'Pendiente'}</span>
                        {registro.anio_inscripcion && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Año {registro.anio_inscripcion}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 text-xs font-semibold leading-relaxed ${coincidenciaEnCeremoniaActiva ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {coincidenciaEnCeremoniaActiva
                  ? 'No se permiten dos inscripciones del mismo DNI en una misma ceremonia.'
                  : 'Si no es la misma persona, revisá el número ingresado: este DNI ya está asociado a la persona mostrada.'}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {!coincidenciaEnCeremoniaActiva && <button
                  type="button"
                  onClick={() => {
                    setMostrarModalIdentidad(false)
                    setCoincidencias([])
                    setIdentidadConfirmada(false)
                    setForm((p) => ({ ...p, dni: '' }))
                    setError('Revisá el DNI: el número ingresado ya pertenece a otra persona registrada.')
                  }}
                  className="rounded-2xl border border-amber-300 bg-white px-5 py-3.5 text-xs font-black uppercase tracking-wider text-amber-700 hover:bg-amber-50"
                >
                  Es otra persona, revisar DNI
                </button>}
                {!coincidenciaEnCeremoniaActiva ? <button
                  type="button"
                  autoFocus
                  onClick={() => {
                    const persona = coincidencias[0]
                    setForm((p) => ({ ...p, nombre: persona.nombre || p.nombre, correo: persona.correo || p.correo }))
                    setIdentidadConfirmada(true)
                    setMostrarModalIdentidad(false)
                    setError('')
                  }}
                  className="rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-emerald-600"
                >
                  Sí, es la misma persona
                </button> : <button
                  type="button"
                  autoFocus
                  onClick={onCancelar}
                  className="rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-sky-700"
                >
                  Cerrar y editar registro
                </button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (!enModal || typeof document === 'undefined') return formulario

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Registrar graduado">
      <section className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:px-8">
          <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-600">Padrón de ceremonia</p><h2 className="text-base font-black text-slate-900">Nuevo graduado</h2></div>
          <button type="button" onClick={onCancelar} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar formulario">X</button>
        </div>
        {formulario}
      </section>
    </div>,
    document.body
  )
}
