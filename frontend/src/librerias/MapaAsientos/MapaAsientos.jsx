import React from 'react';
import { Armchair, ShieldCheck, GraduationCap, AlertCircle, X } from 'lucide-react';

/**
 * MapaAsientos - Componente Core para la Gestión de Ubicaciones.
 * 
 * Desarrollado como parte del ecosistema SiGIC para resolver la visualización
 * de anfiteatros de forma dinámica y reactiva. Este componente es agnóstico
 * al negocio y puede ser reutilizado en cualquier sistema de reservas.
 * 
 * @author Julian Cancelo
 */
export function MapaAsientos({
  estructura = { baja: { filas: 5, asientos: 10 } },
  mapaRoles = {},
  seleccionados = [],
  alHacerClick,
  zoom = 1,
  nivelActivo = 'baja',
  estilosPersonalizados = {}
}) {
  
  // Estilos base por defecto (usando Tailwind)
  const ESTILOS_BASE = {
    autoridad: 'bg-slate-900 text-slate-400 border-slate-800 shadow-inner hover:scale-105',
    egresado: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-indigo-200/50 scale-105 hover:rotate-1',
    discapacitado: 'bg-purple-600 text-white shadow-purple-200/50 hover:scale-105',
    reservado: 'bg-amber-500 text-white shadow-amber-200/50 hover:scale-105',
    disponible: 'bg-white border-slate-100 text-slate-400 hover:border-sky-300 hover:text-sky-600 hover:shadow-md',
    bloqueado: 'bg-slate-100/50 text-slate-200 border-none pointer-events-none scale-90 opacity-20',
    seleccionado: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-2xl scale-110 -translate-y-1 z-10 ring-4 ring-sky-100',
    ...estilosPersonalizados
  };

  const configuracion = estructura[nivelActivo] || { filas: 0, asientos: 0 };
  
  // Generar etiquetas de filas (A, B, C...)
  const obtenerEtiquetaFila = (indice) => {
    return String.fromCharCode(65 + indice);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-10 flex flex-col items-center relative overflow-auto w-full transition-all duration-500"
      >
        <div 
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          {/* Escenario */}
          <div className="relative w-full mb-16">
            <div className="w-full h-6 bg-slate-900 rounded-b-3xl shadow-lg flex items-center justify-center">
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-[0.4em]">
                Escenario
              </span>
            </div>
          </div>

          {/* Grilla de Asientos */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: configuracion.filas }).map((_, indiceFila) => {
              const fila = obtenerEtiquetaFila(indiceFila);
              return (
                <div key={fila} className="flex items-center gap-4">
                  <span className="w-6 text-[10px] font-bold text-slate-300 text-right">{fila}</span>
                  <div className="flex gap-2">
                    {Array.from({ length: configuracion.asientos }).map((_, indiceAsiento) => {
                      const numero = indiceAsiento + 1;
                      const id = `${nivelActivo}-${fila}-${numero}`;
                      const rol = mapaRoles[id] || 'disponible';
                      const esSeleccionado = seleccionados.includes(id);

                      return (
                        <button
                          key={id}
                          onClick={() => alHacerClick && alHacerClick(id)}
                          className={`w-10 h-12 rounded-2xl text-[10px] font-bold flex flex-col items-center justify-center transition-all duration-200 ${
                            esSeleccionado 
                              ? ESTILOS_BASE.seleccionado 
                              : ESTILOS_BASE[rol] || ESTILOS_BASE.disponible
                          }`}
                        >
                          <span className="mb-0.5">
                            {rol === 'autoridad' ? <ShieldCheck size={16} /> :
                             rol === 'discapacitado' ? <AlertCircle size={16} /> :
                             rol === 'egresado' ? <GraduationCap size={16} /> : 
                             rol === 'bloqueado' ? <X size={12} className="opacity-10" /> :
                             <Armchair size={12} className="opacity-30" />}
                          </span>
                          <span className={`text-[7px] ${esSeleccionado ? 'text-white/70' : 'text-slate-300'}`}>
                            {numero}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-6 text-[10px] font-bold text-slate-300">{fila}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
