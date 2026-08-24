import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, FileSpreadsheet, LayoutTemplate, LoaderCircle, Plus, Radio, Send, Users, X } from 'lucide-react'
import { crearGraduado, obtenerCeremonias } from '../lib/api'
import { ModalImportar } from './ModalImportar'

const ETAPAS = ['Ceremonia', 'Padrón', 'Anfiteatro', 'Convocatoria', 'Preparación', 'En vivo']

function siguientePaso(ceremonia) {
  if (!ceremonia) return { titulo: 'Prepará la próxima ceremonia', detalle: 'Creá una ceremonia y activala para comenzar el flujo.', destino: 'gestion-ceremonias', icono: CalendarClock, avance: 0 }
  if (!Number(ceremonia.total_egresados)) return { titulo: 'Cargá el padrón de graduados', detalle: 'Necesitás al menos un graduado para iniciar la convocatoria.', destino: 'gestion-graduados', icono: Users, avance: 1 }
  if (!ceremonia.plano_configurado) return { titulo: 'Configurá el anfiteatro', detalle: 'Definí el plano y las reglas de butacas antes de preparar el grupo.', destino: 'seleccion-asientos', icono: LayoutTemplate, avance: 2 }
  if (Number(ceremonia.invitaciones_enviadas) < Number(ceremonia.total_egresados)) return { titulo: 'Completá las invitaciones', detalle: `${ceremonia.invitaciones_enviadas || 0} de ${ceremonia.total_egresados} graduados recibieron su invitación.`, destino: 'gestion-graduados', icono: Send, avance: 3 }
  if (ceremonia.estado_operativo === 'EN_VIVO') return { titulo: 'Ceremonia en seguimiento', detalle: `${ceremonia.asistencias || 0} asistencias acreditadas hasta el momento.`, destino: 'estado-ceremonia', icono: Radio, avance: 5 }
  if (ceremonia.estado_operativo === 'FINALIZADA') return { titulo: 'Ceremonia finalizada', detalle: 'El acta operativa quedó archivada. Podés consultar los reportes.', destino: 'panel-reportes', icono: CheckCircle2, avance: 6 }
  return { titulo: 'Prepará la operación', detalle: 'Revisá grupos, confirmaciones y butacas antes de abrir la acreditación.', destino: 'gestion-graduados', icono: CheckCircle2, avance: 4 }
}

export function AsistenteOperativoCeremonia({ onNavegar }) {
  const [abierto, setAbierto] = useState(true)
  const [ceremonia, setCeremonia] = useState(null)
  const [mostrarCargaRapida, setMostrarCargaRapida] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorCarga, setErrorCarga] = useState('')
  const [graduado, setGraduado] = useState({ nombre: '', dni: '', legajo: '', correo: '', carrera: '' })

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

    setGuardando(true)
    setErrorCarga('')
    try {
      await crearGraduado({
        ...graduado,
        nombre: graduado.nombre.trim(),
        dni: graduado.dni.replace(/\D/g, ''),
        ceremonia_id: ceremonia?.id
      })
      await actualizarCeremonia()
      setGraduado({ nombre: '', dni: '', legajo: '', correo: '', carrera: '' })
      setMostrarCargaRapida(false)
    } catch (error) {
      setErrorCarga(error.message || 'No se pudo guardar el graduado.')
    } finally {
      setGuardando(false)
    }
  }

  const paso = siguientePaso(ceremonia)
  const Icono = paso.icono
  return <aside className={`sigic-ceremony-assistant ${abierto ? 'is-open' : ''}`} aria-label="Asistente operativo de ceremonia">
    <button className="sigic-ceremony-assistant-toggle" onClick={() => setAbierto(valor => !valor)}>
      <span><span className="sigic-ceremony-assistant-pulse" /> Asistente operativo</span>{abierto ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
    </button>
    {abierto && <div className="sigic-ceremony-assistant-body">
      <div className="sigic-ceremony-assistant-icon"><Icono size={18} /></div>
      <div><p className="sigic-ceremony-assistant-kicker">Siguiente acción</p><strong>{paso.titulo}</strong><p>{paso.detalle}</p></div>
      <div className="sigic-ceremony-assistant-progress"><span style={{ width: `${(paso.avance / 6) * 100}%` }} /></div>
      <div className="sigic-ceremony-assistant-stages">{ETAPAS.map((etapa, indice) => <span key={etapa} className={indice < paso.avance ? 'is-done' : indice === paso.avance ? 'is-current' : ''}>{indice < paso.avance ? <CheckCircle2 size={10} /> : <i />}{etapa}</span>)}</div>
      {paso.avance === 1 && <div className="sigic-ceremony-assistant-load">
        <p>Podés incorporar el padrón sin salir del escritorio.</p>
        <div><button onClick={() => { setErrorCarga(''); setMostrarCargaRapida(true) }}><Plus size={13} /> Cargar uno</button><button onClick={() => setMostrarImportar(true)}><FileSpreadsheet size={13} /> Importar archivo</button></div>
      </div>}
      <button onClick={() => onNavegar(paso.destino)} className="sigic-ceremony-assistant-action">Ir ahora <ArrowRight size={14} /></button>
    </div>}
    {mostrarCargaRapida && <div className="sigic-quick-graduate-overlay" role="dialog" aria-modal="true" aria-labelledby="carga-rapida-titulo">
      <form className="sigic-quick-graduate-card" onSubmit={guardarGraduado}>
        <header><div><span>Asistente operativo</span><h2 id="carga-rapida-titulo">Cargar graduado</h2><p>{ceremonia?.nombre || 'Ceremonia activa'}</p></div><button type="button" onClick={() => setMostrarCargaRapida(false)} aria-label="Cerrar"><X size={18} /></button></header>
        {errorCarga && <p className="sigic-quick-graduate-error"><AlertCircle size={14} />{errorCarga}</p>}
        <div className="sigic-quick-graduate-fields">
          <label>Nombre completo<input autoFocus value={graduado.nombre} onChange={evento => setGraduado(valor => ({ ...valor, nombre: evento.target.value }))} placeholder="Nombre y apellido" /></label>
          <label>DNI<input inputMode="numeric" value={graduado.dni} onChange={evento => setGraduado(valor => ({ ...valor, dni: evento.target.value }))} placeholder="Sin puntos" /></label>
          <label>Legajo<input value={graduado.legajo} onChange={evento => setGraduado(valor => ({ ...valor, legajo: evento.target.value }))} placeholder="Opcional" /></label>
          <label>Correo<input type="email" value={graduado.correo} onChange={evento => setGraduado(valor => ({ ...valor, correo: evento.target.value }))} placeholder="Opcional" /></label>
          <label className="sigic-quick-graduate-field-wide">Carrera<input value={graduado.carrera} onChange={evento => setGraduado(valor => ({ ...valor, carrera: evento.target.value }))} placeholder="Opcional" /></label>
        </div>
        <footer><button type="button" onClick={() => setMostrarCargaRapida(false)}>Cancelar</button><button type="submit" disabled={guardando}>{guardando ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{guardando ? 'Guardando...' : 'Agregar al padrón'}</button></footer>
      </form>
    </div>}
    {mostrarImportar && <ModalImportar onCerrar={() => setMostrarImportar(false)} onCompletado={async () => { await actualizarCeremonia(); setMostrarImportar(false) }} />}
  </aside>
}
