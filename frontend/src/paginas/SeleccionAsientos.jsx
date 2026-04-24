import React, { useState, useEffect } from 'react';
import {
  Info, CheckCircle, Users, ShieldCheck, GraduationCap,
  AlertCircle, Armchair, X
} from 'lucide-react';
import { BASE } from '../servicios/api';

const ESTILOS_ASIENTOS = {
  autoridad: 'bg-slate-900 text-slate-400 border border-slate-800 shadow-inner hover:scale-105',
  egresado: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200/50 scale-105 hover:rotate-1',
  discapacitado: 'bg-purple-600 text-white shadow-lg shadow-purple-200/50 hover:scale-105',
  reservado: 'bg-amber-500 text-white shadow-lg shadow-amber-200/50 hover:scale-105',
  disponible: 'bg-white border border-slate-100 text-slate-400 hover:border-sky-300 hover:text-sky-600 hover:shadow-md',
  bloqueado: 'bg-slate-100/50 text-slate-200 border-none pointer-events-none scale-90 opacity-20'
};

const LEYENDA = [
  { rol: 'egresado', color: 'bg-indigo-600', label: 'Egresados' },
  { rol: 'autoridad', color: 'bg-slate-900', label: 'Autoridades' },
  { rol: 'discapacitado', color: 'bg-purple-600', label: 'Accesibilidad' },
  { rol: 'reservado', color: 'bg-amber-500', label: 'Reservado' },
  { rol: 'disponible', color: 'bg-white border border-slate-200', label: 'Disponible' },
];

export function SeleccionAsientos({
  ceremoniaId,
  nivel: nivelProp,
  setNivel: setNivelProp,
  zoom: zoomProp,
  setZoom: setZoomProp,
  estructura: estructuraProp,
  mapaRoles: mapaRolesProp,
  seleccionados: seleccionadosProp,
  setSeleccionados: setSeleccionadosProp,
  onSeleccionChange,
  maxSeleccion = 1,
  onConfirmar,
  estaCargando = false,
  onAsientoClick
}) {
  // ... (estados locales)
  const [nivelLocal, setNivelLocal] = useState('baja');
  const [zoomLocal, setZoomLocal] = useState(1);
  const [estructuraLocal, setEstructuraLocal] = useState({
    baja: { filas: 8, asientos: 16 },
    alta: { filas: 6, asientos: 20 }
  });
  const [mapaRolesLocal, setMapaRolesLocal] = useState({});
  const [seleccionadosLocal, setSeleccionadosLocal] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Determinar qué valores usar (Prop o Local)
  const nivel = nivelProp || nivelLocal;
  const setNivel = setNivelProp || setNivelLocal;
  const zoom = zoomProp || zoomLocal;
  const setZoom = setZoomProp || setZoomLocal;
  const estructura = estructuraProp || estructuraLocal;
  const mapaRoles = mapaRolesProp || mapaRolesLocal;
  const seleccionados = seleccionadosProp || seleccionadosLocal;
  const setSeleccionados = setSeleccionadosProp || setSeleccionadosLocal;

  // Carga autónoma si no hay props de datos
  useEffect(() => {
    if ((!estructuraProp || !mapaRolesProp) && ceremoniaId) {
      setCargando(true);
      fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`)
        .then(res => res.json())
        .then(data => {
          if (data.estructura) setEstructuraLocal(data.estructura);
          if (data.mapaRoles) setMapaRolesLocal(data.mapaRoles);
        })
        .catch(err => console.error("Error cargando mapa autónomo:", err))
        .finally(() => setCargando(false));
    }
  }, [estructuraProp, mapaRolesProp, ceremoniaId]);

  // Notificar cambios de selección
  useEffect(() => {
    if (onSeleccionChange) onSeleccionChange(seleccionados);
  }, [seleccionados]);

  const manejarClickAsiento = (fila, numero) => {
    const id = `${nivel}-${fila}-${numero}`;
    
    // Si hay un callback externo, lo usamos (modo editor)
    if (onAsientoClick) {
      onAsientoClick(id);
      return;
    }

    const rol = mapaRoles[id] || 'disponible';
    if (rol !== 'disponible') return;

    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(s => s !== id));
    } else if (seleccionados.length < maxSeleccion) {
      setSeleccionados([...seleccionados, id]);
    }
  };

  if (cargando || !estructura) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Cargando Mapa del Hábitat...</div>;

  const configuracionActual = estructura[nivel] || { filas: 0, asientos: 0 };
  const etiquetasFilas = Array.from({ length: configuracionActual.filas || 0 }, (_, i) =>
    String.fromCharCode((nivel === 'baja' ? 65 : 73) + i)
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!nivelProp && (
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          {['baja', 'alta'].map(n => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${nivel === n ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400'}`}
            >
              {n === 'baja' ? 'Platea' : 'Pullman'}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-12 flex flex-col items-center relative overflow-auto custom-scrollbar w-full min-h-[600px] transition-all duration-500">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          {/* ESCENARIO PREMIUM */}
          <div className="relative w-full mb-20 group">
            <div className="absolute -inset-1 bg-gradient-to-b from-sky-400 to-indigo-600 rounded-b-[40px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative w-full h-8 bg-slate-900 rounded-b-[40px] shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
              <span className="text-[9px] text-white font-black uppercase tracking-[0.6em] opacity-60 flex items-center gap-4">
                <div className="w-12 h-px bg-white/20"></div>
                Escenario Principal
                <div className="w-12 h-px bg-white/20"></div>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {etiquetasFilas.map((fila) => (
              <div key={fila} className="flex items-center gap-4 group/fila">
                <span className="w-8 text-[10px] font-black text-slate-300 group-hover/fila:text-sky-500 transition-colors text-right">{fila}</span>
                <div className="flex gap-2">
                  {Array.from({ length: configuracionActual.asientos }, (_, i) => {
                    const numero = i + 1;
                    const id = `${nivel}-${fila}-${numero}`;
                    const rol = mapaRoles[id] || 'disponible';
                    const esSeleccionado = seleccionados.includes(id);

                    return (
                      <button
                        key={id}
                        onClick={() => manejarClickAsiento(fila, numero)}
                        className={`w-12 h-14 rounded-[18px] text-[10px] font-black flex flex-col items-center justify-center transition-all duration-300 transform ${
                          esSeleccionado 
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-2xl scale-110 -translate-y-1 z-10 ring-4 ring-sky-100' 
                            : rol === 'disponible' 
                              ? 'bg-white border-2 border-slate-50 text-slate-400 hover:border-sky-200 hover:text-sky-600 hover:shadow-xl hover:-translate-y-0.5'
                              : `${ESTILOS_ASIENTOS[rol]} opacity-90`
                        }`}
                      >
                        <span className="mb-0.5">
                          {rol === 'autoridad' ? <ShieldCheck size={18} /> :
                           rol === 'discapacitado' ? <AlertCircle size={18} /> :
                           rol === 'egresado' ? <GraduationCap size={18} /> : 
                           rol === 'bloqueado' ? <X size={14} className="opacity-10" /> :
                           <Armchair size={14} className="opacity-30" />}
                        </span>
                        <span className={`text-[8px] ${esSeleccionado ? 'text-white/80' : 'text-slate-300'}`}>{numero}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="w-8 text-[10px] font-black text-slate-300 group-hover/fila:text-sky-500 transition-colors">{fila}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-8 border-t border-slate-50 pt-12 w-full max-w-3xl">
          {LEYENDA.map(item => (
            <div key={item.rol} className="flex items-center gap-3 group/item">
              <div className={`w-5 h-5 rounded-lg ${item.color} shadow-sm group-hover/item:scale-110 transition-transform`}></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover/item:text-slate-600 transition-colors">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {onConfirmar && !estaCargando && (
        <button
          onClick={() => onConfirmar(seleccionados)}
          disabled={seleccionados.length < maxSeleccion}
          className="mt-8 bg-sky-500 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/40 hover:bg-sky-600 transition-all active:scale-95 disabled:opacity-30"
        >
          Confirmar Reserva de {seleccionados.length} Ubicaciones
        </button>
      )}
    </div>
  );
}
