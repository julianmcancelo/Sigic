'use client'
import React, { forwardRef, useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { 
  ssr: false,
  loading: () => (
    <div className="w-[800px] h-[550px] bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#0056b3] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">Cargando libro interactivo...</span>
      </div>
    </div>
  )
})

const PaginaHoja = forwardRef(({ children, numero, esPortada, esContraportada, className = '' }, ref) => {
  return (
    <div
      ref={ref}
      className={`page bg-[#fdfdfb] h-full flex flex-col justify-between overflow-y-auto overflow-x-hidden ${
        esPortada || esContraportada ? 'bg-slate-900 text-white' : ''
      } ${className}`}
      style={{
        boxShadow: esPortada || esContraportada ? 'none' : 'inset 0 0 35px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex-1 p-5 sm:p-7 select-text">
        {children}
      </div>
      {!esPortada && !esContraportada && (
        <div className="px-6 py-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
          <span>SiGIC Manual</span>
          <span>Pág. {numero}</span>
        </div>
      )}
    </div>
  )
})
PaginaHoja.displayName = 'PaginaHoja'

export const ManualFlipBookEngine = forwardRef(function ManualFlipBookEngine(
  { listaPaginas, rutaPortada, onCambiarPagina, esMovil },
  ref
) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) {
    return (
      <div className="w-[800px] h-[550px] bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0056b3] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Iniciando motor de lectura 3D...</span>
        </div>
      </div>
    )
  }

  const ancho = esMovil ? 360 : 500
  const alto = esMovil ? 580 : 690

  return (
    <div className="w-full flex justify-center items-center py-2">
      <HTMLFlipBook
        width={ancho}
        height={alto}
        size="fixed"
        maxShadowOpacity={0.6}
        showCover={true}
        mobileScrollSupport={true}
        drawShadow={true}
        flippingTime={650}
        usePortrait={esMovil}
        startZIndex={20}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        className="manual-flipbook shadow-[0_25px_60px_rgba(15,23,42,0.25)] rounded-lg overflow-hidden border border-slate-300/60"
        onFlip={(e) => {
          if (onCambiarPagina) onCambiarPagina(e.data)
        }}
        ref={ref}
      >
        {/* TAPA DURA FRONTAL */}
        <PaginaHoja esPortada numero={0} className="rounded-r-2xl overflow-hidden p-0">
          <div className="w-full h-full relative select-none">
            <img 
              src={rutaPortada} 
              alt="Portada SiGIC" 
              className="w-full h-full object-cover pointer-events-none" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        </PaginaHoja>

        {/* PÁGINAS DE CONTENIDO */}
        {listaPaginas.slice(1).map((contenido, idx) => (
          <PaginaHoja key={idx + 1} numero={idx + 1}>
            <div className="contenido-pagina-manual text-slate-700">
              {contenido}
            </div>
          </PaginaHoja>
        ))}

        {/* CONTRAPORTADA */}
        <PaginaHoja esContraportada numero={listaPaginas.length} className="flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-white">
          <div className="space-y-4 select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#0056b3]/20 border border-[#0056b3]/40 flex items-center justify-center mx-auto text-[#29ABE2] font-black text-2xl">
              SG
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[#29ABE2] block">
              SiGIC · Manual Institucional
            </span>
            <p className="text-[11px] text-slate-300 font-medium">
              Instituto Tecnológico Beltrán
            </p>
            <p className="text-[10px] text-slate-400">
              Tecnicatura Superior en Analista de Sistemas
            </p>
            <p className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-800">
              Ciclo Lectivo 2026 · Avellaneda
            </p>
          </div>
        </PaginaHoja>
      </HTMLFlipBook>
    </div>
  )
})
