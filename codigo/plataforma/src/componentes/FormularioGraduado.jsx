import React, { useState, useEffect, useRef } from 'react'
import { Users, CheckCircle2, Mail, GraduationCap, Calendar, Award, Search, ShieldCheck, AlertTriangle, History } from 'lucide-react'
import { buscarGraduadoPorDNI, crearGraduado, obtenerAjustes, obtenerCeremoniaActiva } from '../servicios/api'
import { InputCampo } from './InputCampo'

/**
 * Formulario para crear un nuevo Graduado en el sistema.
 * @param {Function} onCreado - Callback ejecutado tras crear exitosamente el graduado.
 * @param {Function} onCancelar - Callback para cerrar el formulario.
 */
export function FormularioGraduado({ onCreado, onCancelar }) {
  const [form, setForm] = useState({ 
    nombre: '', 
    legajo: '', 
    dni: '', 
    correo: '', 
    carrera: '', 
    anio_inscripcion: '',
    promedio: ''
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [buscandoDni, setBuscandoDni] = useState(false)
  const [coincidencias, setCoincidencias] = useState([])
  const [identidadConfirmada, setIdentidadConfirmada] = useState(false)
  const [mostrarModalIdentidad, setMostrarModalIdentidad] = useState(false)
  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  const errorRef = useRef(null)
  const dniPerdioFocoRef = useRef(false)
  const [ajustes, setAjustes] = useState({
    formato_identificador: '{CARRERA}-{LEGAJO}-{AÑO}',
    campos_identificador: 'carrera,legajo,anio_inscripcion'
  })

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
    setIdentidadConfirmada(false)
    setMostrarModalIdentidad(false)
    setCoincidencias([])
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
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm p-8 border-b border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 rounded-[32px] mb-6 shadow-sm">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8">
        {error && (
          <div ref={errorRef} role="alert" aria-live="assertive" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">No se pudo registrar al graduado</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${ceremoniaActiva ? 'border-sky-200 bg-sky-50' : 'border-red-200 bg-red-50'}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${ceremoniaActiva ? 'text-sky-600' : 'text-red-600'}`}>
              Ceremonia de destino
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {ceremoniaActiva?.nombre || 'No hay una ceremonia activa'}
            </p>
            {ceremoniaActiva && (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                El nuevo graduado quedará registrado en esta ceremonia.
              </p>
            )}
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${ceremoniaActiva ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {ceremoniaActiva ? 'Activa' : 'Requiere activación'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <InputCampo
              label="Iniciales de Carrera"
              valor={form.carrera}
              onChange={(v) => setForm((p) => ({ ...p, carrera: v }))}
              placeholder="ISI"
              icon={GraduationCap}
            />
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
          <div className={`rounded-[24px] border p-5 ${identidadConfirmada ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
            {buscandoDni ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Search size={18} className="animate-pulse text-sky-500" />
                <p className="text-xs font-black uppercase tracking-wider">Comprobando antecedentes del DNI…</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className={`rounded-2xl p-3 ${identidadConfirmada ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                      {identidadConfirmada ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {identidadConfirmada ? 'Identidad confirmada' : 'Este DNI ya figura en el sistema'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {coincidencias[0].nombre} · {coincidencias[0].correo || 'Sin correo registrado'}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <History size={12} /> {coincidencias.length} {coincidencias.length === 1 ? 'participación anterior' : 'participaciones anteriores'}
                      </p>
                    </div>
                  </div>
                  {!identidadConfirmada && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const persona = coincidencias[0]
                          setForm((p) => ({ ...p, nombre: persona.nombre || p.nombre, correo: persona.correo || p.correo }))
                          setIdentidadConfirmada(true)
                          setError('')
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-600"
                      >
                        Sí, es la misma persona
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, dni: '' }))
                          setError('Revisá el DNI antes de continuar: ya está asociado a otra persona.')
                        }}
                        className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-amber-700"
                      >
                        No coincide, revisar
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {coincidencias.map((registro) => (
                    <div key={registro.id} className="rounded-2xl border border-white bg-white/80 p-3 shadow-sm">
                      <p className="text-xs font-black text-slate-800">{registro.carrera || 'Carrera sin informar'}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">{registro.ceremonia_nombre || 'Ceremonia sin informar'}</p>
                      <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-sky-600">
                        {registro.estado === 'RECHAZADO' ? 'No participó' : registro.ceremonia_activa ? (registro.estado || 'Pendiente') : 'Ceremonia finalizada'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vista previa del identificador configurado */}
        <div className="p-5 bg-slate-900/5 rounded-2xl border border-slate-900/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identificador Generado (Vista Previa)</p>
            <p className="text-sm font-black text-slate-700 mt-1">{generarIdentificadorPreview()}</p>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest">
            Patrón: {ajustes.formato_identificador}
          </span>
        </div>
        
        <div className="flex items-center gap-6 pt-2">
          <button
            type="submit"
            disabled={cargando || !ceremoniaActiva || (coincidencias.length > 0 && !identidadConfirmada)}
            className="group relative overflow-hidden rounded-[20px] bg-slate-900 px-8 py-4 text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-3 text-xs font-black uppercase tracking-widest">
              {cargando
                ? 'Registrando...'
                : !ceremoniaActiva
                  ? 'Activá una ceremonia'
                  : coincidencias.length > 0 && !identidadConfirmada
                    ? 'Confirmá la identidad'
                    : 'Crear Graduado'}
              {!cargando && <CheckCircle2 size={16} className="transition-transform group-hover:rotate-12" />}
            </span>
          </button>
          
          <button
            type="button"
            onClick={onCancelar}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-colors"
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
                  <h2 id="titulo-confirmar-identidad" className="mt-2 text-2xl font-black tracking-tight text-slate-900">¿Es la persona que intentás registrar?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Encontramos este DNI en otras participaciones. Revisá la información antes de crear la nueva inscripción.
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

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
                Si no es la misma persona, revisá el número ingresado: este DNI ya está asociado a la persona mostrada.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
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
                </button>
                <button
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
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
