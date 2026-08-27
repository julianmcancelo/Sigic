import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, CheckCircle2, XCircle, RefreshCw, X, AlertTriangle, 
  Clock, ShieldCheck, Mail, Check 
} from 'lucide-react'
import { enviarInvitacion, enviarCredencialCeremonia } from '../servicios/api'

export function ModalDespachoMasivo({ 
  graduados = [], 
  tipo = 'invitacion', // 'invitacion' | 'recordatorio' | 'credencial'
  onCerrar, 
  onCompletado 
}) {
  const [progreso, setProgreso] = useState(0)
  const [actualIndice, setActualIndice] = useState(0)
  const [enviados, setEnviados] = useState([])
  const [fallidos, setFallidos] = useState([])
  const [enEjecucion, setEnEjecucion] = useState(true)
  const [pausado, setPausado] = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  
  const canceladoRef = useRef(false)
  const pausadoRef = useRef(false)
  pausadoRef.current = pausado

  const total = graduados.length

  useEffect(() => {
    let cancelado = false

    async function ejecutarDespacho() {
      for (let i = 0; i < graduados.length; i++) {
        if (canceladoRef.current) break

        // Manejo de pausa
        while (pausadoRef.current && !canceladoRef.current) {
          await new Promise(r => setTimeout(r, 400))
        }

        const grad = graduados[i]
        setActualIndice(i + 1)
        setProgreso(Math.round(((i + 1) / total) * 100))

        try {
          if (tipo === 'credencial') {
            await enviarCredencialCeremonia(grad.id)
          } else {
            await enviarInvitacion(grad.id)
          }
          setEnviados(prev => [...prev, { id: grad.id, nombre: grad.nombre, correo: grad.correo }])
        } catch (err) {
          setFallidos(prev => [...prev, { id: grad.id, nombre: grad.nombre, correo: grad.correo, error: err.message || 'Error desconocido' }])
        }

        // Pequeño delay de 250ms para no saturar rate-limits de SMTP
        await new Promise(r => setTimeout(r, 250))
      }

      setEnEjecucion(false)
      setFinalizado(true)
      if (onCompletado) onCompletado()
    }

    ejecutarDespacho()

    return () => {
      canceladoRef.current = true
    }
  }, [])

  const cancelar = () => {
    canceladoRef.current = true
    setEnEjecucion(false)
    setFinalizado(true)
    if (onCompletado) onCompletado()
  }

  async function reintentarFallidos() {
    if (fallidos.length === 0) return
    const aReintentar = [...fallidos]
    setFallidos([])
    setFinalizado(false)
    setEnEjecucion(true)

    for (let i = 0; i < aReintentar.length; i++) {
      const grad = aReintentar[i]
      try {
        if (tipo === 'credencial') {
          await enviarCredencialCeremonia(grad.id)
        } else {
          await enviarInvitacion(grad.id)
        }
        setEnviados(prev => [...prev, { id: grad.id, nombre: grad.nombre, correo: grad.correo }])
      } catch (err) {
        setFallidos(prev => [...prev, { id: grad.id, nombre: grad.nombre, correo: grad.correo, error: err.message || 'Error desconocido' }])
      }
      await new Promise(r => setTimeout(r, 300))
    }

    setEnEjecucion(false)
    setFinalizado(true)
    if (onCompletado) onCompletado()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              {enEjecucion ? <RefreshCw size={20} className="animate-spin text-sky-400" /> : <Send size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {enEjecucion ? 'Despacho Masivo en Progreso' : 'Despacho Finalizado'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {tipo === 'invitacion' && 'Enviando convocatorias formales por correo'}
                {tipo === 'recordatorio' && 'Enviando recordatorios de confirmación'}
                {tipo === 'credencial' && 'Enviando credenciales digitales QR'}
              </p>
            </div>
          </div>

          {!enEjecucion && (
            <button
              onClick={onCerrar}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">
              Procesados: <strong className="text-white">{actualIndice}</strong> de {total}
            </span>
            <span className="text-sky-400 font-mono font-black">{progreso}%</span>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* CONTADORES DE ESTADO */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Enviados con Éxito</span>
            <strong className="text-xl font-black text-emerald-300">{enviados.length}</strong>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">Fallidos / Rebotados</span>
            <strong className="text-xl font-black text-rose-300">{fallidos.length}</strong>
          </div>
        </div>

        {/* LOG DE ENVÍOS EN VIVO */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 max-h-48 overflow-y-auto space-y-2 text-xs font-medium">
          {enviados.map((item) => (
            <div key={`env-${item.id}`} className="flex items-center justify-between gap-2 text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span className="truncate">{item.nombre}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.correo}</span>
            </div>
          ))}

          {fallidos.map((item) => (
            <div key={`fallo-${item.id}`} className="flex items-center justify-between gap-2 text-rose-300 bg-rose-950/30 p-1.5 rounded-lg">
              <div className="flex items-center gap-2 truncate">
                <XCircle size={14} className="text-rose-400 shrink-0" />
                <span className="truncate">{item.nombre}</span>
              </div>
              <span className="text-[10px] text-rose-400 font-bold truncate">{item.error}</span>
            </div>
          ))}
        </div>

        {/* BOTONES DE CONTROL */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {enEjecucion ? (
            <>
              <button
                type="button"
                onClick={() => setPausado(!pausado)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                {pausado ? 'Reanudar Despacho' : 'Pausar'}
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                Cancelar Restantes
              </button>
            </>
          ) : (
            <>
              {fallidos.length > 0 ? (
                <button
                  type="button"
                  onClick={reintentarFallidos}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Reintentar {fallidos.length} Fallidos
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Check size={16} /> Todos los correos fueron despachados.
                </div>
              )}

              <button
                type="button"
                onClick={onCerrar}
                className="px-6 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shadow-sky-500/20"
              >
                Aceptar & Finalizar
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
