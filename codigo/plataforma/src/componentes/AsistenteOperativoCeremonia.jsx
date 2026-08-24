import { useEffect, useState } from 'react'
import { ArrowRight, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, LayoutTemplate, Radio, Send, Users } from 'lucide-react'
import { obtenerCeremonias } from '../lib/api'

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
      <button onClick={() => onNavegar(paso.destino)} className="sigic-ceremony-assistant-action">Ir ahora <ArrowRight size={14} /></button>
    </div>}
  </aside>
}
