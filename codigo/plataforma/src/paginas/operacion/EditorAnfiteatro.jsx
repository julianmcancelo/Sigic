'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Layout, ZoomIn, ZoomOut, ShieldCheck, AlertCircle, GraduationCap,
  Armchair, X, Maximize, Minimize, UserCheck, RotateCcw, Award, Move, Sparkles
} from 'lucide-react';
import { BASE, obtenerGraduados, obtenerInvitados, cabeceras } from '../../servicios/api';
import { useSincronizacion, emitirCambioSync } from '../../lib/sync';
import { SeleccionAsientos } from '../SeleccionAsientos';

export function EditorAnfiteatro({ ceremoniaId, onVolver, sinHeader }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  // Nivel y Zoom con límites responsivos
  const [zoom, setZoom] = useState(1);
  const [nivel, setNivel] = useState('baja');
  const [fullscreen, setFullscreen] = useState(false);
  
  const containerRef = useRef(null);
  const areaMapaRef = useRef(null);

  // Modo Arrastre / Paneo Fluido
  const [estaArrastrando, setEstaArrastrando] = useState(false);
  const [posicionInicio, setPosicionInicio] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [modoPaneoActivo, setModoPaneoActivo] = useState(false);

  // Estructura de filas y columnas
  const [estructura, setEstructura] = useState({
    baja: { filas: 7, asientos: 20 },
    alta: { filas: 5, asientos: 22 }
  });
  const [estructuraOriginal, setEstructuraOriginal] = useState(null);
  
  // Roles de asientos
  const [mapaRoles, setMapaRoles] = useState({});
  const [mapaRolesOriginal, setMapaRolesOriginal] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState('disponible');
  const [asientosOcupados, setAsientosOcupados] = useState([]);

  useEffect(() => {
    if (ceremoniaId) {
      cargarConfiguracion();
      cargarOcupacion();
    }
  }, [ceremoniaId]);

  useSincronizacion(['BUTACAS', 'EGRESADOS', 'INVITADOS'], () => {
    cargarOcupacion();
  });

  async function cargarOcupacion() {
    try {
      const [graduados, invitados] = await Promise.all([obtenerGraduados(), obtenerInvitados()]);
      const asientos = [];
      graduados.forEach(g => { if (g.asiento_id) asientos.push(g.asiento_id); });
      invitados.forEach(i => { if (i.asiento_id) asientos.push(i.asiento_id); });
      setAsientosOcupados(asientos);
    } catch (err) {
      console.error("Error cargando ocupación:", err);
    }
  }

  async function cargarConfiguracion() {
    setCargando(true);
    try {
      const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.estructura) {
          setEstructura(data.estructura);
          setEstructuraOriginal(data.estructura);
        }
        if (data.mapaRoles) {
          setMapaRoles(data.mapaRoles);
          setMapaRolesOriginal(data.mapaRoles);
        }
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la configuración previa' });
    } finally {
      setCargando(false);
    }
  }

  const descartarCambios = () => {
    if (estructuraOriginal) setEstructura(JSON.parse(JSON.stringify(estructuraOriginal)));
    if (mapaRolesOriginal) setMapaRoles(JSON.parse(JSON.stringify(mapaRolesOriginal)));
    setMensaje({ tipo: 'exito', texto: 'Cambios descartados' });
    setTimeout(() => setMensaje(null), 2000);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  async function handleGuardar() {
    setGuardando(true);
    try {
      const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify({ estructura, mapaRoles, usuarioId: null })
      });
      
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Mapa de asientos guardado con éxito' });
        setEstructuraOriginal(JSON.parse(JSON.stringify(estructura)));
        setMapaRolesOriginal(JSON.parse(JSON.stringify(mapaRoles)));
        emitirCambioSync('BUTACAS');
        setTimeout(() => setMensaje(null), 3000);
      } else {
        throw new Error("Fallo al guardar");
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al sincronizar con el servidor' });
    } finally {
      setGuardando(false);
    }
  }

  // Paneo con mouse / touch
  const iniciarArrastre = (e) => {
    if (!modoPaneoActivo && e.button !== 1) return;
    const contenedor = areaMapaRef.current;
    if (!contenedor) return;

    setEstaArrastrando(true);
    setPosicionInicio({
      x: e.pageX || (e.touches && e.touches[0].pageX),
      y: e.pageY || (e.touches && e.touches[0].pageY),
      scrollLeft: contenedor.scrollLeft,
      scrollTop: contenedor.scrollTop
    });
  };

  const procesarArrastre = (e) => {
    if (!estaArrastrando || !areaMapaRef.current) return;
    e.preventDefault();
    const contenedor = areaMapaRef.current;
    const x = e.pageX || (e.touches && e.touches[0].pageX);
    const y = e.pageY || (e.touches && e.touches[0].pageY);
    const walkX = (x - posicionInicio.x) * 1.5;
    const walkY = (y - posicionInicio.y) * 1.5;
    contenedor.scrollLeft = posicionInicio.scrollLeft - walkX;
    contenedor.scrollTop = posicionInicio.scrollTop - walkY;
  };

  const detenerArrastre = () => {
    setEstaArrastrando(false);
  };

  const aplicarPlantilla = (tipo) => {
    if (tipo === 'beltran') {
      const nuevaEstructura = {
        baja: { filas: 7, asientos: 20 },
        alta: { filas: 5, asientos: 22 }
      };
      const nuevosRoles = {};
      const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

      letras.forEach((letra, idx) => {
        nuevosRoles[`baja-${letra}-5`] = 'bloqueado';
        nuevosRoles[`baja-${letra}-16`] = 'bloqueado';

        if (idx === 0 || idx === 1) {
          for (let col = 6; col <= 15; col++) {
            nuevosRoles[`baja-${letra}-${col}`] = 'egresado';
          }
        }
        if (idx === 2) {
          for (let col = 6; col <= 15; col++) {
            nuevosRoles[`baja-${letra}-${col}`] = 'padrino';
          }
        }
        if (idx === 0) {
          nuevosRoles[`baja-A-4`] = 'discapacitado';
          nuevosRoles[`baja-A-17`] = 'discapacitado';
        }
      });

      setEstructura(nuevaEstructura);
      setMapaRoles(nuevosRoles);
      setMensaje({ tipo: 'exito', texto: 'Plantilla Auditorio Beltrán (3 Bloques) aplicada' });
    } else if (tipo === 'pasillo-central') {
      const nuevaEstructura = {
        baja: { filas: 8, asientos: 17 },
        alta: { filas: 6, asientos: 17 }
      };
      const nuevosRoles = {};
      const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      letras.forEach((letra, idx) => {
        nuevosRoles[`baja-${letra}-9`] = 'bloqueado';
        if (idx < 2) {
          for (let col = 1; col <= 8; col++) nuevosRoles[`baja-${letra}-${col}`] = 'egresado';
          for (let col = 10; col <= 17; col++) nuevosRoles[`baja-${letra}-${col}`] = 'egresado';
        }
      });
      setEstructura(nuevaEstructura);
      setMapaRoles(nuevosRoles);
      setMensaje({ tipo: 'exito', texto: 'Plantilla Pasillo Central aplicada' });
    } else if (tipo === 'limpiar') {
      setMapaRoles({});
      setMensaje({ tipo: 'exito', texto: 'Mapa de roles restablecido a libres' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const actualizarEstructura = (nivelKey, campo, valor) => {
    const num = parseInt(valor) || 1;
    const nuevoValor = Math.min(Math.max(num, 1), 50);
    setEstructura(prev => ({
      ...prev,
      [nivelKey]: { ...prev[nivelKey], [campo]: nuevoValor }
    }));
  };

  const asignarRolAsiento = (idAsiento) => {
    if (modoPaneoActivo) return;
    if (asientosOcupados.includes(idAsiento)) {
      setMensaje({ tipo: 'error', texto: 'Asiento ocupado: no se puede modificar su rol' });
      setTimeout(() => setMensaje(null), 2000);
      return;
    }
    setMapaRoles(prev => ({
      ...prev,
      [idAsiento]: rolSeleccionado
    }));
  };

  const mapaRolesConOcupacion = { ...mapaRoles };
  asientosOcupados.forEach(id => {
    mapaRolesConOcupacion[id] = 'ocupado';
  });

  const rolesDisponibles = [
    { id: 'egresado', label: 'Egresados', color: 'bg-blue-600 text-white', icono: GraduationCap },
    { id: 'acompanante', label: 'Acompañantes', color: 'bg-emerald-600 text-white', icono: Armchair },
    { id: 'ocupado', label: 'Ocupado', color: 'bg-red-600 text-white', icono: Armchair },
    { id: 'disponible', label: 'Libre', color: 'bg-slate-100 border border-slate-300 text-slate-800', icono: Armchair },
    { id: 'bloqueado', label: 'Pasillo / Bloq.', color: 'bg-slate-900 text-slate-100', icono: ShieldCheck },
    { id: 'discapacitado', label: 'Preferencial', color: 'bg-purple-600 text-white', icono: AlertCircle },
    { id: 'padrino', label: 'Padrinos', color: 'bg-amber-500 text-white', icono: Award },
  ];

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 select-none">
        <div className="relative w-14 h-14 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
          <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
          <img 
            src="/logo-oficial.png" 
            alt="SiGIC" 
            className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Cargando Anfiteatro...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`font-sans flex flex-col ${fullscreen ? 'fixed inset-0 z-50 h-screen w-screen bg-slate-900 text-white p-3 sm:p-5' : 'w-full'}`}>
      
      {/* TARJETA MAESTRA DEL EDITOR */}
      <div className="bg-white rounded-3xl border border-slate-300/80 shadow-lg shadow-slate-200/50 p-4 sm:p-6 space-y-4">
        
        {/* CABECERA CON ACCIONES INTEGRADAS EN 1 LÍNEA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Diseño y Maquetación de Auditorio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-[9.5px] font-black uppercase tracking-wider">
                Interactivo
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Definí la capacidad, pasillos y sectores asignados para graduados, acompañantes y accesibilidad.
            </p>
          </div>

          {/* BOTONERA SUPERIOR */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={descartarCambios}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-2xs flex items-center justify-center active:scale-95 cursor-pointer"
              title="Descartar Cambios"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={handleGuardar}
              disabled={guardando}
              className={`py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm active:scale-98 cursor-pointer ${
                guardando 
                  ? 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-900 border-slate-900 hover:bg-sky-600 hover:border-sky-600 text-white'
              }`}
            >
              {guardando ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <Save size={15} />
              )}
              <span>{guardando ? 'Guardando...' : 'Guardar Mapa'}</span>
            </button>

            {/* Selector de Nivel Platea / Pullman */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setNivel('baja')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  nivel === 'baja' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Platea
              </button>
              <button
                type="button"
                onClick={() => setNivel('alta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  nivel === 'alta' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pullman
              </button>
            </div>

            {/* Botón Paneo / Arrastre */}
            <button
              type="button"
              onClick={() => setModoPaneoActivo(!modoPaneoActivo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                modoPaneoActivo
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sky-500/20'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={modoPaneoActivo ? "Modo Arrastre Activo" : "Activar Arrastre"}
            >
              <Move size={14} />
              <span>{modoPaneoActivo ? 'Arrastrando' : 'Arrastrar'}</span>
            </button>

            {/* Controles de Zoom */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-2xs">
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
                title="Alejar mapa"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-black text-slate-800 px-1 min-w-[3.5ch] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.2))}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
                title="Acercar mapa"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                fullscreen 
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md' 
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-2xs'
              }`}
              title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN MENSAJES */}
        {mensaje && (
          <div className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xs ${
            mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {mensaje.tipo === 'exito' ? <ShieldCheck size={16} className="text-emerald-700" /> : <AlertCircle size={16} className="text-rose-700" />}
              <span>{mensaje.texto}</span>
            </div>
            <button onClick={() => setMensaje(null)} className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL: PANEL LATERAL + MAPA */}
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          
          {/* PANEL DE HERRAMIENTAS Y PINCELES */}
          <div className="w-full xl:w-72 shrink-0 space-y-4">
            
            {/* Pincel de Asignación */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-300 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-sky-700" size={16} />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Pincel de Roles</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {rolesDisponibles.map(rol => {
                  const IconoRol = rol.icono;
                  const seleccionado = rolSeleccionado === rol.id;
                  return (
                    <button
                      key={rol.id}
                      type="button"
                      onClick={() => setRolSeleccionado(rol.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left cursor-pointer ${
                        seleccionado
                          ? 'border-sky-600 bg-sky-100/80 shadow-xs'
                          : 'border-slate-300 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${rol.color}`}>
                        <IconoRol size={11} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-tight truncate ${
                        seleccionado ? 'text-sky-950 font-black' : 'text-slate-800 font-bold'
                      }`}>
                        {rol.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estructura Base y Plantillas */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Layout className="text-sky-700" size={16} />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Estructura Base</h3>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-black text-slate-800 uppercase">
                    <span>Filas ({nivel === 'baja' ? 'Platea' : 'Pullman'})</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-900 font-mono font-bold">
                      {estructura[nivel].filas}
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="50"
                    value={estructura[nivel].filas}
                    onChange={(e) => actualizarEstructura(nivel, 'filas', e.target.value)}
                    className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-black text-slate-800 uppercase">
                    <span>Asientos por Fila</span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-900 font-mono font-bold">
                      {estructura[nivel].asientos}
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="50"
                    value={estructura[nivel].asientos}
                    onChange={(e) => actualizarEstructura(nivel, 'asientos', e.target.value)}
                    className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Plantillas Oficiales */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Plantillas Oficiales</p>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('beltran')}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-900 transition-all text-[10.5px] font-black uppercase tracking-wider flex items-center justify-between cursor-pointer"
                >
                  <span>★ Auditorio Beltrán (3 Bloques)</span>
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('pasillo-central')}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer"
                >
                  <span>Aula Magna (Pasillo Central)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ÁREA CENTRAL: MAPA DEL ANFITEATRO */}
          <div className="flex-1 w-full bg-slate-50/50 rounded-2xl border border-slate-300 overflow-hidden flex flex-col">
            <div 
              ref={areaMapaRef}
              onMouseDown={iniciarArrastre}
              onMouseMove={procesarArrastre}
              onMouseUp={detenerArrastre}
              onMouseLeave={detenerArrastre}
              onTouchStart={iniciarArrastre}
              onTouchMove={procesarArrastre}
              onTouchEnd={detenerArrastre}
              className={`flex-1 overflow-auto p-2 sm:p-4 custom-scrollbar select-none min-h-[560px] ${
                modoPaneoActivo ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            >
              <div className="w-full flex justify-center items-center py-2">
                <SeleccionAsientos 
                  ceremoniaId={ceremoniaId}
                  nivel={nivel}
                  setNivel={setNivel}
                  zoom={zoom}
                  setZoom={setZoom}
                  estructura={estructura}
                  mapaRoles={mapaRolesConOcupacion}
                  seleccionados={[]}
                  setSeleccionados={() => {}}
                  maxSeleccion={0}
                  onAsientoClick={asignarRolAsiento}
                  compacto={true}
                />
              </div>
            </div>

            {/* PIE DE ESTADO DEL ANFITEATRO */}
            <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span>Capacidad Total:</span>
                <strong className="text-slate-900 font-black">
                  {estructura.baja.filas * estructura.baja.asientos + estructura.alta.filas * estructura.alta.asientos} Butacas
                </strong>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">
                  ({estructura.baja.filas * estructura.baja.asientos} Platea + {estructura.alta.filas * estructura.alta.asientos} Pullman)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Pincel Activo:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-black text-sky-800 uppercase">
                  {rolesDisponibles.find(r => r.id === rolSeleccionado)?.label || rolSeleccionado}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
