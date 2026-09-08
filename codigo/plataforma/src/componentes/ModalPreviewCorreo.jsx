import { origenPortalGraduados } from '../lib/graduate-origin'
import React, { useState } from 'react'
import { 
  X, Monitor, Smartphone, Mail, Sparkles, Send, Check, 
  ExternalLink, Calendar, MapPin, Award, QrCode, Copy, RefreshCw 
} from 'lucide-react'
import { enviarCorreoPrueba } from '../servicios/api'

export function ModalPreviewCorreo({ 
  graduadoEjemplo, 
  ceremonia, 
  onCerrar, 
  usuarioActual 
}) {
  const [plantilla, setPlantilla] = useState('invitacion') // 'invitacion' | 'recordatorio' | 'credencial'
  const [dispositivo, setDispositivo] = useState('desktop') // 'desktop' | 'mobile'
  const [enviandoPrueba, setEnviandoPrueba] = useState(false)
  const [mensajePrueba, setMensajePrueba] = useState(null)

  const nombreGraduado = graduadoEjemplo?.nombre || 'García, Sofía Milagros'
  const carreraGraduado = graduadoEjemplo?.carrera || 'Tecnicatura Superior en Desarrollo de Software'
  const tokenGraduado = graduadoEjemplo?.token || 'sigic-demo-token-9988'
  const fechaCeremonia = ceremonia?.fecha 
    ? new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '27 de Agosto de 2026'
  const lugarCeremonia = ceremonia?.lugar || 'Auditorio Central - Instituto Tecnológico Beltrán'
  const linkPortal = `${origenPortalGraduados()}/?token=${tokenGraduado}`

  async function handleEnviarPrueba() {
    if (!usuarioActual?.email && !usuarioActual?.correo) {
      setMensajePrueba({ tipo: 'error', texto: 'No se encontró un correo de remitente válido.' })
      return
    }
    const destino = usuarioActual?.email || usuarioActual?.correo
    setEnviandoPrueba(true)
    setMensajePrueba(null)
    try {
      await enviarCorreoPrueba(destino)
      setMensajePrueba({ tipo: 'exito', texto: `Correo de prueba enviado a ${destino}` })
      setTimeout(() => setMensajePrueba(null), 4000)
    } catch (err) {
      setMensajePrueba({ tipo: 'error', texto: err.message || 'Error al enviar prueba.' })
    } finally {
      setEnviandoPrueba(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BARRA SUPERIOR DE CONTROL */}
        <header className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Estudio de Plantillas & Previsualización</h3>
              <p className="text-[11px] text-slate-400 font-medium">Visualizá exactamente cómo recibirá el egresado cada comunicación oficial</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SWITCH DISPOSITIVO */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setDispositivo('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  dispositivo === 'desktop' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista PC / Escritorio"
              >
                <Monitor size={15} />
                <span className="hidden sm:inline">Escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => setDispositivo('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  dispositivo === 'mobile' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Celular / Móvil"
              >
                <Smartphone size={15} />
                <span className="hidden sm:inline">Móvil</span>
              </button>
            </div>

            <button
              id="btn-cerrar-preview-correo"
              onClick={onCerrar}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* SELECTOR DE PLANTILLAS */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 shrink-0">Plantilla:</span>
          
          <button
            type="button"
            onClick={() => setPlantilla('invitacion')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              plantilla === 'invitacion' 
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Invitación Formal & OTP
          </button>

          <button
            type="button"
            onClick={() => setPlantilla('recordatorio')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              plantilla === 'recordatorio' 
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Recordatorio Urgente
          </button>

          <button
            type="button"
            onClick={() => setPlantilla('credencial')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              plantilla === 'credencial' 
                ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Credencial QR & Google Wallet
          </button>
        </div>

        {/* CONTENEDOR DEL SIMULADOR */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex items-center justify-center">
          <div 
            className={`transition-all duration-300 bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 ${
              dispositivo === 'mobile' ? 'w-[360px] text-xs' : 'w-full max-w-[620px] text-sm'
            }`}
          >
            {/* CABECERA INSTITUCIONAL BELTRÁN */}
            <div className="bg-[#1e293b] p-6 sm:p-8 text-center text-white relative overflow-hidden border-b-4 border-sky-400">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 p-2 border border-white/20 shadow-inner flex items-center justify-center">
                <img src="/logo-oficial.png" alt="Beltrán" className="max-h-full max-w-full object-contain" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {plantilla === 'invitacion' && 'Convocatoria Oficial a Colación'}
                {plantilla === 'recordatorio' && 'Recordatorio: Confirmación Pendiente'}
                {plantilla === 'credencial' && 'Tu Pase de Ingreso Digital'}
              </h2>
              <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest mt-1">
                Instituto Tecnológico Beltrán
              </p>
            </div>

            {/* CUERPO DEL CORREO */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <p className="text-sm font-black text-slate-900">
                  Estimado/a <span className="text-sky-600">{nombreGraduado}</span>,
                </p>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  {carreraGraduado}
                </p>
              </div>

              {plantilla === 'invitacion' && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Nos complace convocarte formalmente a la <strong>Ceremonia de Graduación 2026</strong>. Para garantizar tu lugar en el estrado y gestionar el ingreso de tus acompañantes, por favor ingresá al portal oficial de confirmación.
                </p>
              )}

              {plantilla === 'recordatorio' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                  <strong className="block font-black text-amber-800">Atención: Cierre de Padrón Próximo</strong>
                  <p>Aún no registramos tu respuesta para la ceremonia. Es fundamental confirmar tu asistencia para la reserva de butacas y diplomas.</p>
                </div>
              )}

              {plantilla === 'credencial' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium space-y-2 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase">
                    Pase Grupal Habilitado
                  </span>
                  <div className="w-28 h-28 bg-white p-2 mx-auto rounded-xl border border-emerald-300 flex items-center justify-center shadow-sm">
                    <QrCode size={80} className="text-slate-800" />
                  </div>
                  <p className="text-[11px] font-bold">Presentá este código QR en portería al ingresar con tus invitados.</p>
                </div>
              )}

              {/* DETALLES DE LA CEREMONIA */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={14} className="text-sky-500 shrink-0" />
                  <span><strong>Fecha:</strong> {fechaCeremonia}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin size={14} className="text-sky-500 shrink-0" />
                  <span><strong>Sede:</strong> {lugarCeremonia}</span>
                </div>
              </div>

              {/* BOTÓN DE ACCIÓN */}
              <div className="text-center pt-2">
                <a
                  href={linkPortal}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-sky-500/20 text-center"
                >
                  {plantilla === 'credencial' ? 'Ver Credencial Digital Completa' : 'Confirmar Asistencia en Portal'}
                </a>
                <p className="text-[10px] text-slate-400 mt-2 font-mono truncate max-w-sm mx-auto">
                  {linkPortal}
                </p>
              </div>

              {/* PIE INSTITUCIONAL */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400">SiGIC · Sistema Integral de Gestión Institucional de Colaciones</p>
                <p className="text-[9px] text-slate-400">Por consultas comunicarse con bedelia@ibeltran.com.ar</p>
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE ACCIONES */}
        <footer className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {mensajePrueba && (
              <span className={`font-bold ${mensajePrueba.tipo === 'exito' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mensajePrueba.texto}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnviarPrueba}
              disabled={enviandoPrueba}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {enviandoPrueba ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Enviar muestra a mi correo</span>
            </button>

            <button
              onClick={onCerrar}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </footer>

      </div>
    </div>
  )
}
