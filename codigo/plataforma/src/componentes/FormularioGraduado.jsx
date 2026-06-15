import React, { useState, useEffect } from 'react'
import { Users, CheckCircle2, Mail, GraduationCap, Calendar, Award } from 'lucide-react'
import { crearGraduado, obtenerAjustes } from '../servicios/api'
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
  const [ajustes, setAjustes] = useState({
    formato_identificador: '{CARRERA}-{LEGAJO}-{AÑO}',
    campos_identificador: 'carrera,legajo,anio_inscripcion'
  })

  // Cargar configuración de identificación
  useEffect(() => {
    async function cargarConfig() {
      try {
        const datos = await obtenerAjustes()
        setAjustes({
          formato_identificador: datos.formato_identificador?.valor || '{CARRERA}-{LEGAJO}-{AÑO}',
          campos_identificador: datos.campos_identificador?.valor || 'carrera,legajo,anio_inscripcion'
        })
      } catch (err) {
        console.error('Error al cargar ajustes de identificador:', err)
      }
    }
    cargarConfig()
  }, [])

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
      const nuevo = await crearGraduado(form)
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
              {cargando ? 'Sincronizando...' : 'Crear Graduado'}
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
