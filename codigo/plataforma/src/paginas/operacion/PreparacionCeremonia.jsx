import { useEffect, useState } from 'react'
import {
  AlertCircle, Armchair, CheckCircle2, ClipboardCheck, LoaderCircle,
  Play, Send, Users, Sparkles, Mic, FileText, RefreshCw
} from 'lucide-react'
import {
  actualizarEstadoCeremonia,
  autoAsignarButacas,
  obtenerCeremoniaActiva,
  obtenerGraduados,
  obtenerInvitados
} from '../../servicios/api'
import { ModalActaCierre } from '../../componentes/ModalActaCierre'

export function PreparacionCeremonia({ onNavegar }) {
  const [datos, setDatos] = useState({ ceremonia: null, graduados: [], invitados: [] })
  const [cargando, setCargando] = useState(true)
  const [abriendo, setAbriendo] = useState(false)
  const [autoAsignando, setAutoAsignando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [mostrarActa, setMostrarActa] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const [ceremonia, graduados, invitados] = await Promise.all([
        obtenerCeremoniaActiva(),
        obtenerGraduados(),
        obtenerInvitados()
      ])
      setDatos({ ceremonia, graduados, invitados })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo cargar la preparación de la ceremonia.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const aceptados = datos.graduados.filter(item => item.estado === 'ACEPTADO')
  const conGrupoCompleto = aceptados.filter(item => item.estado_flujo === 'COMPLETO')
  const pendientesRevision = aceptados.filter(item => item.estado_asignacion_butacas === 'PENDIENTE_REVISION')
  const confirmados = aceptados.filter(item => item.estado_asignacion_butacas === 'CONFIRMADA' && item.asiento_id)
  const sinUbicacion = aceptados.filter(item => !item.asiento_id || item.estado_asignacion_butacas !== 'CONFIRMADA')
  const credencialesPendientes = confirmados.filter(item => !item.credencial_enviada_en)
  const listoParaVivo = aceptados.length > 0 && sinUbicacion.length === 0

  async function ejecutarAutoAsignacion() {
    setAutoAsignando(true)
    setMensaje({ tipo: '', texto: '' })
    try {
      const res = await autoAsignarButacas(datos.ceremonia?.id)
      setMensaje({ tipo: 'exito', texto: res.mensaje || 'Distribución inteligente completada con éxito.' })
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo completar la distribución de butacas.' })
    } finally {
      setAutoAsignando(false)
    }
  }

  async function abrirAcreditacion() {
    if (!datos.ceremonia || !listoParaVivo) return
    setAbriendo(true)
    setMensaje({ tipo: '', texto: '' })
    try {
      await actualizarEstadoCeremonia(datos.ceremonia.id, 'EN_VIVO')
      onNavegar('control-ingreso')
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo abrir la acreditación.' })
    } finally {
      setAbriendo(false)
    }
  }

  const controles = [
    {
      titulo: 'Grupos completos',
      detalle: `${conGrupoCompleto.length} de ${aceptados.length} grupos aceptados completaron sus datos.`,
      listo: aceptados.length > 0 && conGrupoCompleto.length === aceptados.length,
      icono: Users,
      destino: 'convocatoria',
      accion: 'Ver Convocatoria'
    },
    {
      titulo: 'Propuestas por revisar',
      detalle: pendientesRevision.length ? `${pendientesRevision.length} grupo(s) esperan confirmación administrativa.` : 'No hay propuestas pendientes.',
      listo: pendientesRevision.length === 0,
      icono: ClipboardCheck,
      destino: 'gestion-graduados',
      accion: 'Revisar butacas'
    },
    {
      titulo: 'Butacas confirmadas',
      detalle: `${confirmados.length} de ${aceptados.length} grupos tienen ubicación definitiva.`,
      listo: aceptados.length > 0 && confirmados.length === aceptados.length,
      icono: Armchair,
      destino: 'seleccion-asientos',
      accion: 'Ver Anfiteatro'
    },
    {
      titulo: 'Credenciales digitales',
      detalle: credencialesPendientes.length ? `${credencialesPendientes.length} credencial(es) listas para comunicar.` : 'Todas las credenciales confirmadas fueron enviadas.',
      listo: credencialesPendientes.length === 0,
      icono: Send,
      destino: 'convocatoria',
      accion: 'Abrir convocatoria'
    },
  ]

  return (
    <section className="mx-auto w-full max-w-5xl font-sans space-y-5">
      {/* HEADER */}
      <header className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[9px] font-black uppercase tracking-wider">
              Fase 4 · Preparación & Auto-Seating
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Revisión y Logística de Ceremonia</h2>
          <p className="mt-1 text-xs text-slate-300">
            {datos.ceremonia?.nombre || 'Ceremonia activa'} · Checklist previo a la apertura de acreditación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavegar('locucion')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-md transition cursor-pointer"
          >
            <Mic size={14} /> Modo Locutor / Estrado
          </button>

          <button
            onClick={cargar}
            disabled={cargando}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </header>

      {/* FEEDBACK MENSAJES */}
      {mensaje.texto && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
          mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {mensaje.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje({ tipo: '', texto: '' })} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {cargando ? (
        <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-400">
          <span className="inline-flex items-center gap-2">
            <LoaderCircle size={18} className="animate-spin text-sky-500" /> Verificando estado de preparación...
          </span>
        </div>
      ) : !datos.ceremonia ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <AlertCircle className="mx-auto text-amber-500" size={32} />
          <h3 className="font-black text-slate-800">No hay una ceremonia activa</h3>
          <p className="text-xs text-slate-500">Activá una ceremonia para continuar con la preparación.</p>
          <button onClick={() => onNavegar('gestion-ceremonias')} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white">
            Ir a ceremonias
          </button>
        </div>
      ) : (
        <>
          {/* BOTÓN DESTACADO DE AUTO-SEATING */}
          {sinUbicacion.length > 0 && (
            <div className="rounded-3xl border-2 border-sky-500/30 bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-sky-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-sky-800">Distribución Automática de Sala</span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  ¿Querés ubicar a todos los graduados y acompañantes en 1 clic?
                </h3>
                <p className="text-xs text-slate-600 max-w-xl">
                  Ubica a los graduados por orden alfabético de carrera en las primeras filas de Platea, garantiza asientos accesibles y sienta a los acompañantes en bloques continuos.
                </p>
              </div>

              <button
                onClick={ejecutarAutoAsignacion}
                disabled={autoAsignando}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-500 px-5 py-3 text-xs font-black text-white shadow-lg shadow-sky-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {autoAsignando ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{autoAsignando ? 'Distribuyendo sala...' : '⚡ Distribuir Sala Inteligentemente'}</span>
              </button>
            </div>
          )}

          {/* TARJETAS DE CONTROL */}
          <div className="grid gap-3 md:grid-cols-2">
            {controles.map(({ titulo, detalle, listo, icono: Icono, destino, accion }) => (
              <article
                key={titulo}
                className={`rounded-3xl border p-5 transition-all ${
                  listo ? 'border-emerald-200 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-2xl ${
                    listo ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-50 text-sky-600'
                  }`}>
                    <Icono size={18} />
                  </span>
                  {listo ? (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={13} /> Listo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      <AlertCircle size={13} /> Pendiente
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-sm font-black text-slate-900">{titulo}</h3>
                <p className="mt-1 min-h-10 text-xs leading-relaxed text-slate-500">{detalle}</p>
                <button
                  onClick={() => onNavegar(destino)}
                  className="mt-3 text-xs font-black text-sky-600 hover:text-sky-800 transition cursor-pointer"
                >
                  {accion} →
                </button>
              </article>
            ))}
          </div>

          {/* FOOTER DE APERTURA */}
          <footer
            className={`rounded-3xl border p-6 sm:flex sm:items-center sm:justify-between transition-all ${
              listoParaVivo ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[.18em] ${
                listoParaVivo ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {listoParaVivo ? 'Preparación completada' : 'Preparación pendiente'}
              </p>
              <h3 className="mt-1 text-base font-black text-slate-900">
                {listoParaVivo
                  ? 'La ceremonia está 100% lista para iniciar la acreditación.'
                  : `Faltan ${sinUbicacion.length} graduado(s) con butacas por confirmar.`}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Al abrir la acreditación, el sistema pasa a estado En Vivo y habilita los escáneres de portería.
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMostrarActa(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <FileText size={15} /> Borrador de Acta
              </button>

              <button
                onClick={abrirAcreditacion}
                disabled={!listoParaVivo || abriendo}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                {abriendo ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />}
                <span>{abriendo ? 'Abriendo...' : 'Abrir acreditación en vivo'}</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {/* MODAL ACTA */}
      {mostrarActa && (
        <ModalActaCierre
          ceremonia={datos.ceremonia}
          graduados={datos.graduados}
          onCerrar={() => setMostrarActa(false)}
        />
      )}
    </section>
  )
}
