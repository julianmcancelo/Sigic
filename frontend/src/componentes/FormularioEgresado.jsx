import React, { useState } from 'react'
import { Users, CheckCircle2, Mail } from 'lucide-react'
import { crearEgresado } from '../servicios/api'
import { InputCampo } from './InputCampo'

/**
 * Formulario para crear un nuevo Egresado en el sistema.
 * @param {Function} onCreado - Callback ejecutado tras crear exitosamente el egresado.
 * @param {Function} onCancelar - Callback para cerrar el formulario.
 */
export function FormularioEgresado({ onCreado, onCancelar }) {
  const [form, setForm] = useState({ nombre: '', legajo: '', dni: '', correo: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Manejo del envío del formulario
  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validaciones básicas
    if (!form.nombre || !form.legajo || !form.dni) {
      setError('Nombre, Legajo y DNI son obligatorios')
      return
    }
    
    setCargando(true)
    setError('')
    
    try {
      // Llamada al servicio de API para persistir el egresado
      const nuevo = await crearEgresado(form)
      onCreado(nuevo)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm p-8 border-b border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <InputCampo
            label="Nombre completo"
            valor={form.nombre}
            onChange={(v) => setForm((p) => ({ ...p, nombre: v }))}
            placeholder="Juan Cancelo"
            icon={Users}
          />
          <InputCampo
            label="Legajo"
            valor={form.legajo}
            onChange={(v) => setForm((p) => ({ ...p, legajo: v }))}
            placeholder="227067"
            icon={CheckCircle2}
          />
          <InputCampo
            label="DNI"
            valor={form.dni}
            onChange={(v) => setForm((p) => ({ ...p, dni: v }))}
            placeholder="35230531"
            icon={Users}
          />
          <InputCampo
            label="Correo (Opcional)"
            valor={form.correo}
            onChange={(v) => setForm((p) => ({ ...p, correo: v }))}
            placeholder="juan@ejemplo.com"
            icon={Mail}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-3 bg-red-50 text-red-600 px-5 py-3 rounded-2xl border border-red-100 animate-shake">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">{error}</span>
          </div>
        )}
        
        <div className="flex items-center gap-6 pt-2">
          <button
            type="submit"
            disabled={cargando}
            className="group relative overflow-hidden rounded-[20px] bg-slate-900 px-8 py-4 text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-3 text-xs font-black uppercase tracking-widest">
              {cargando ? 'Sincronizando...' : 'Crear Egresado'}
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
    </div>
  )
}
