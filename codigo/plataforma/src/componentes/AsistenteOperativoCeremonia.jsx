import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, FileSpreadsheet, LayoutTemplate, LoaderCircle, Plus, Radio, Send, Users, X } from 'lucide-react'
import { buscarGraduadoPorDNI, crearGraduado, obtenerCeremonias } from '../lib/api'
import { ModalImportar } from './ModalImportar'

const ETAPAS = ['Ceremonia', 'Padrón', 'Anfiteatro', 'Convocatoria', 'Preparación', 'En vivo']

function siguientePaso(ceremonia) {
  if (!ceremonia) return { titulo: 'Prepará la próxima ceremonia', detalle: 'Creá una ceremonia y activala para comenzar el flujo.', destino: 'gestion-ceremonias', icono: CalendarClock, avance: 0 }
  if (!Number(ceremonia.total_egresados)) return { titulo: 'Cargá el padrón de graduados', detalle: 'Necesitás al menos un graduado para iniciar la convocatoria.', destino: 'gestion-graduados', icono: Users, avance: 1 }
  if (!ceremonia.plano_configurado) return { titulo: 'Configurá el anfiteatro', detalle: 'Definí el plano y las reglas de butacas antes de preparar el grupo.', destino: 'seleccion-asientos', icono: LayoutTemplate, avance: 2 }
  if (Number(ceremonia.invitaciones_enviadas) < Number(ceremonia.total_egresados)) return { titulo: 'Completá las invitaciones', detalle: `${ceremonia.invitaciones_enviadas || 0} de ${ceremonia.total_egresados} graduados recibieron su invitación.`, destino: 'convocatoria', icono: Send, avance: 3 }
  if (ceremonia.estado_operativo === 'EN_VIVO') return { titulo: 'Ceremonia en seguimiento', detalle: `${ceremonia.asistencias || 0} asistencias acreditadas hasta el momento.`, destino: 'estado-ceremonia', icono: Radio, avance: 5 }
  if (ceremonia.estado_operativo === 'FINALIZADA') return { titulo: 'Ceremonia finalizada', detalle: 'El acta operativa quedó archivada. Podés consultar los reportes.', destino: 'panel-reportes', icono: CheckCircle2, avance: 6 }
  return { titulo: 'Prepará la operación', detalle: 'Revisá grupos, confirmaciones y butacas antes de abrir la acreditación.', destino: 'preparacion-ceremonia', icono: CheckCircle2, avance: 4 }
}

function pasoAnterior(avance) {
  const pasos = [
    null,
    { titulo: 'Ceremonia', destino: 'gestion-ceremonias' },
    { titulo: 'Padrón', destino: 'gestion-graduados' },
    { titulo: 'Anfiteatro', destino: 'seleccion-asientos' },
    { titulo: 'Convocatoria', destino: 'convocatoria' },
    { titulo: 'Preparación', destino: 'preparacion-ceremonia' },
    { titulo: 'Ceremonia en vivo', destino: 'estado-ceremonia' },
  ]
  return pasos[avance] || null
}

export function AsistenteOperativoCeremonia({ onNavegar }) {
  const [ceremonia, setCeremonia] = useState(null)
  const [mostrarCargaRapida, setMostrarCargaRapida] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorCarga, setErrorCarga] = useState('')
  const [mensajeCarga, setMensajeCarga] = useState('')
  const [graduado, setGraduado] = useState({ nombre: '', dni: '', legajo: '', correo: '', carrera: '' })
  const [coincidenciasDni, setCoincidenciasDni] = useState([])
  const [identidadConfirmada, setIdentidadConfirmada] = useState(false)

  const actualizarCeremonia = async () => {
    const ceremonias = await obtenerCeremonias()
    setCeremonia(ceremonias.find(item => item.activa) || null)
  }

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const ceremonias = await obtenerCeremonias()
        if (activo) setCeremonia(ceremonias.find(item => item.activa) || null)
      } catch {
        // El escritorio sigue disponible aunque el tablero no pueda sincronizarse.
      }
    }
    cargar()
    const intervalo = window.setInterval(cargar, 20000)
    return () => { activo = false; window.clearInterval(intervalo) }
  }, [])

  async function guardarGraduado(evento) {
    evento.preventDefault()
    if (!graduado.nombre.trim() || graduado.dni.replace(/\D/g, '').length < 7) {
      setErrorCarga('Completá el nombre y un DNI válido para continuar.')
      return
    }

    setErrorCarga('')
    setMensajeCarga('')
    const dni = graduado.dni.replace(/\D/g, '')
    try {
      const resultado = await buscarGraduadoPorDNI(dni)
      const coincidencias = resultado.coincidencias || []
      if (coincidencias.length && !identidadConfirmada) {
        setCoincidenciasDni(coincidencias)
        setErrorCarga('Este DNI ya figura en el sistema. Confirmá si corresponde a la misma persona antes de continuar.')
        return
      }
    } catch (error) {
      setErrorCarga(error.message || 'No se pudo verificar el DNI.')
      return
    }

    setGuardando(true)
    try {
      await crearGraduado({
        ...graduado,
        nombre: graduado.nombre.trim(),
        dni,
        ceremonia_id: ceremonia?.id,
        identidad_confirmada: identidadConfirmada
      })
      await actualizarCeremonia()
      setGraduado({ nombre: '', dni: '', legajo: '', correo: '', carrera: '' })
      setCoincidenciasDni([])
      setIdentidadConfirmada(false)
      setMensajeCarga('Graduado agregado al padrón. Podés cargar otra persona o cerrar esta ventana.')
    } catch (error) {
      const persona = error.persona
      if (error.codigo === 'REQUIERE_CONFIRMACION_IDENTIDAD' && persona) {
        setCoincidenciasDni([persona])
        setIdentidadConfirmada(false)
        setErrorCarga('Confirmá la identidad de la persona encontrada antes de crear la inscripción.')
      } else {
        setErrorCarga(error.message || 'No se pudo guardar el graduado.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const paso = siguientePaso(ceremonia)
  const anterior = pasoAnterior(paso.avance)
  const Icono = paso.icono
  return <section className="mx-auto w-full max-w-3xl p-4 sm:p-8" aria-label="Asistente administrativo de ceremonia">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><Icono size={19} /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-600">Asistente administrativo</p><h2 className="text-base font-black text-slate-900">Próxima acción</h2></div>
      </header>
      <div className="p-5 sm:p-7">
        <h3 className="text-xl font-black text-slate-900">{paso.titulo}</h3>
        <p className="mt-1 text-sm text-slate-500">{paso.detalle}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-sky-500" style={{ width: `${(paso.avance / 6) * 100}%` }} /></div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{ETAPAS.map((etapa, indice) => <div key={etapa} className={`flex items-center gap-1 text-[9px] font-bold ${indice <= paso.avance ? 'text-sky-600' : 'text-slate-300'}`}>{indice < paso.avance ? <CheckCircle2 size={11} /> : <span className="h-2 w-2 rounded-full bg-current" />}{etapa}</div>)}</div>
        {ceremonia && !['EN_VIVO', 'FINALIZADA'].includes(ceremonia.estado_operativo) && <div className="mt-6 flex flex-wrap gap-2"><button onClick={() => { setErrorCarga(''); setMensajeCarga(''); setMostrarCargaRapida(true) }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus size={14} /> Cargar graduado</button>{paso.avance === 1 && <button onClick={() => setMostrarImportar(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><FileSpreadsheet size={14} /> Importar archivo</button>}</div>}
        <div className="mt-7 flex flex-wrap items-center gap-3"><button onClick={() => onNavegar(paso.destino)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800">Continuar <ArrowRight size={14} /></button>{anterior && <button onClick={() => onNavegar(anterior.destino)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><ArrowLeft size={14} /> Volver a {anterior.titulo}</button>}</div>
      </div>
    </div>
    {mostrarCargaRapida && <div className="sigic-quick-graduate-overlay" role="dialog" aria-modal="true" aria-labelledby="carga-rapida-titulo">
      <form className="sigic-quick-graduate-card" onSubmit={guardarGraduado}>
        <header><div><span>Asistente operativo</span><h2 id="carga-rapida-titulo">Cargar graduado</h2><p>{ceremonia?.nombre || 'Ceremonia activa'}</p></div><button type="button" onClick={() => setMostrarCargaRapida(false)} aria-label="Cerrar"><X size={18} /></button></header>
        {errorCarga && <p className="sigic-quick-graduate-error"><AlertCircle size={14} />{errorCarga}</p>}
        {mensajeCarga && <p className="sigic-quick-graduate-success"><CheckCircle2 size={14} />{mensajeCarga}</p>}
        <div className="sigic-quick-graduate-fields">
          <label>Nombre completo<input autoFocus value={graduado.nombre} onChange={evento => setGraduado(valor => ({ ...valor, nombre: evento.target.value }))} placeholder="Nombre y apellido" /></label>
          <label>DNI<input inputMode="numeric" value={graduado.dni} onChange={evento => { setIdentidadConfirmada(false); setCoincidenciasDni([]); setGraduado(valor => ({ ...valor, dni: evento.target.value.replace(/\D/g, '') })) }} placeholder="Sin puntos" /></label>
          <label>Legajo<input value={graduado.legajo} onChange={evento => setGraduado(valor => ({ ...valor, legajo: evento.target.value }))} placeholder="Opcional" /></label>
          <label>Correo<input type="email" value={graduado.correo} onChange={evento => setGraduado(valor => ({ ...valor, correo: evento.target.value }))} placeholder="Opcional" /></label>
          <label className="sigic-quick-graduate-field-wide">Carrera<input value={graduado.carrera} onChange={evento => setGraduado(valor => ({ ...valor, carrera: evento.target.value }))} placeholder="Opcional" /></label>
        </div>
        {coincidenciasDni.length > 0 && <section className={`sigic-quick-graduate-identity ${identidadConfirmada ? 'is-confirmed' : ''}`} aria-live="polite"><div><strong>{identidadConfirmada ? 'Identidad confirmada' : 'DNI encontrado en una inscripción anterior'}</strong><p>{coincidenciasDni[0].nombre || 'Persona registrada'} · {coincidenciasDni[0].correo || 'Sin correo registrado'}</p></div>{!identidadConfirmada && <div><button type="button" onClick={() => { const persona = coincidenciasDni[0]; setGraduado(valor => ({ ...valor, nombre: persona.nombre || valor.nombre, correo: persona.correo || valor.correo })); setIdentidadConfirmada(true); setErrorCarga('') }}>Sí, es la misma persona</button><button type="button" onClick={() => { setGraduado(valor => ({ ...valor, dni: '' })); setCoincidenciasDni([]); setErrorCarga('Revisá el DNI para continuar.') }}>No coincide, revisar DNI</button></div>}</section>}
        <footer><button type="button" onClick={() => setMostrarCargaRapida(false)}>Cancelar</button><button type="submit" disabled={guardando || (coincidenciasDni.length > 0 && !identidadConfirmada)}>{guardando ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{guardando ? 'Guardando...' : coincidenciasDni.length > 0 && !identidadConfirmada ? 'Confirmá la identidad' : 'Agregar al padrón'}</button></footer>
      </form>
    </div>}
    {mostrarImportar && <ModalImportar onCerrar={() => setMostrarImportar(false)} onCompletado={async () => { await actualizarCeremonia(); setMostrarImportar(false) }} />}
  </section>
}
