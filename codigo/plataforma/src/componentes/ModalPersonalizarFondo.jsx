import React, { useState } from 'react'
import { Palette, Check, Sparkles, X, Sun, Moon, Eye, Layers, Grid, Sliders } from 'lucide-react'
import { FONDOS_DISPONIBLES } from '../datos/fondos-pantalla'

export function ModalPersonalizarFondo({ 
  fondoActual = 'beltran', 
  alCambiarFondo, 
  onCerrar,
  cuadriculaActiva = true,
  alCambiarCuadricula,
  marcaAguaActiva = true,
  alCambiarMarcaAgua
}) {
  const [seleccionado, setSeleccionado] = useState(fondoActual)
  const [mostrarGrid, setMostrarGrid] = useState(cuadriculaActiva)
  const [mostrarMarca, setMostrarMarca] = useState(marcaAguaActiva)

  const aplicar = (id) => {
    setSeleccionado(id)
    if (alCambiarFondo) alCambiarFondo(id)
  }

  const toggleGrid = () => {
    const nuevo = !mostrarGrid
    setMostrarGrid(nuevo)
    if (alCambiarCuadricula) alCambiarCuadricula(nuevo)
  }

  const toggleMarca = () => {
    const nuevo = !mostrarMarca
    setMostrarMarca(nuevo)
    if (alCambiarMarcaAgua) alCambiarMarcaAgua(nuevo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Personalización & Fondo de Pantalla</h2>
              <p className="text-xs text-slate-400 font-medium">Elegí el estilo visual y los efectos del escritorio institucional</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* GRILLA DE FONDOS DISPONIBLES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
          {FONDOS_DISPONIBLES.map((fondo) => {
            const esActivo = seleccionado === fondo.id
            return (
              <button
                key={fondo.id}
                type="button"
                onClick={() => aplicar(fondo.id)}
                className={`relative rounded-2xl p-4 text-left transition-all cursor-pointer flex flex-col justify-between h-36 border ${
                  esActivo 
                    ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/20 scale-[1.02]' 
                    : 'border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${fondo.colores[0]}, ${fondo.colores[1]})`
                }}
              >
                {/* INDICADOR SUPERIOR */}
                <div className="flex items-center justify-between w-full">
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${fondo.colorPrincipal}25`,
                      color: fondo.colorPrincipal,
                      borderColor: `${fondo.colorPrincipal}40`
                    }}
                  >
                    {fondo.badge}
                  </span>

                  {esActivo && (
                    <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* TEXTO INFERIOR */}
                <div>
                  <h4 className="text-xs font-black text-white">{fondo.nombre}</h4>
                  <p className="text-[10px] text-slate-300/80 font-medium line-clamp-2 mt-0.5 leading-tight">
                    {fondo.descripcion}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* AJUSTES ADICIONALES DE EFECTOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={toggleGrid}
            className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              mostrarGrid 
                ? 'bg-slate-800/90 border-sky-500/40 text-sky-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Grid size={16} />
              <span>Cuadrícula Tecnológica</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
              mostrarGrid ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {mostrarGrid ? 'Visible' : 'Oculta'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleMarca}
            className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              mostrarMarca 
                ? 'bg-slate-800/90 border-sky-500/40 text-sky-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Layers size={16} />
              <span>Marca de Agua Beltrán</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
              mostrarMarca ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {mostrarMarca ? 'Visible' : 'Oculta'}
            </span>
          </button>
        </div>

        {/* BOTÓN FINAL */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onCerrar}
            className="px-6 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-sky-500/20"
          >
            Aceptar & Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
