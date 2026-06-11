import React, { useState, useEffect } from 'react';
import { MapaAsientos } from '@jcancelo/mapa-asientos-sigic';
import '@jcancelo/mapa-asientos-sigic/dist/style.css';
import { BASE, obtenerCeremoniaActiva } from '../servicios/api';

const LEYENDA = [
  { rol: 'egresado', color: 'bg-indigo-600', label: 'Graduados' },
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

  // Modo autónomo: sin estructura por props, carga la configuración real del
  // anfiteatro. Si tampoco recibe ceremoniaId, usa la ceremonia activa (antes
  // este caso quedaba con la grilla por defecto y sin roles).
  useEffect(() => {
    if (estructuraProp && mapaRolesProp) return;

    let cancelado = false;

    async function cargarMapa() {
      setCargando(true);
      try {
        let id = ceremoniaId;
        if (!id) {
          const activa = await obtenerCeremoniaActiva();
          id = activa?.id;
        }
        if (!id || cancelado) return;

        const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelado) return;
        if (data.estructura) setEstructuraLocal(data.estructura);
        if (data.mapaRoles) setMapaRolesLocal(data.mapaRoles);
      } catch (err) {
        console.error('Error cargando mapa:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarMapa();
    return () => { cancelado = true; };
  }, [estructuraProp, mapaRolesProp, ceremoniaId]);

  useEffect(() => {
    if (onSeleccionChange) onSeleccionChange(seleccionados);
  }, [seleccionados]);

  const manejarClickAsiento = (id) => {
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

  if (cargando || !estructura) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Cargando Mapa...</div>;

  // En modo autónomo el mapa muestra sus propios controles de zoom; cuando lo
  // controla una pantalla externa (Editor del Anfiteatro), esa pantalla ya
  // tiene los suyos y acá solo sincronizamos el estado.
  const esAutonomo = !nivelProp;

  // El zoom se aplica como tamaño real de asiento (variables CSS) en lugar
  // del transform: scale() de la librería, que rompía el layout y la
  // posición de los tooltips (ver index.css, ".sigic-zoom-por-variables").
  const variablesZoom = {
    '--mapa-seat-w': `${Math.round(38 * zoom)}px`,
    '--mapa-seat-h': `${Math.round(44 * zoom)}px`,
    '--mapa-gap-asientos': `${Math.max(2, Math.round(6 * zoom))}px`,
    '--mapa-gap-filas': `${Math.max(2, Math.round(8 * zoom))}px`,
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-full sigic-zoom-por-variables" style={variablesZoom}>
      <MapaAsientos
        estructura={estructura}
        mapaRoles={mapaRoles}
        seleccionados={seleccionados}
        alHacerClick={manejarClickAsiento}
        zoom={zoom}
        onZoomChange={setZoom}
        mostrarControlesZoom={esAutonomo}
        nivelActivo={nivel}
        alCambiarNivel={setNivel}
        maxSeleccionados={!onAsientoClick && maxSeleccion > 0 ? maxSeleccion : undefined}
      />

      {/* Leyenda */}
      <div className="mt-8 flex flex-wrap justify-center gap-8 border-t border-slate-50 pt-8 w-full max-w-3xl">
        {LEYENDA.map(item => (
          <div key={item.rol} className="flex items-center gap-3 group/item">
            <div className={`w-4 h-4 rounded-lg ${item.color} shadow-sm group-hover/item:scale-110 transition-transform`}></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
          </div>
        ))}
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
