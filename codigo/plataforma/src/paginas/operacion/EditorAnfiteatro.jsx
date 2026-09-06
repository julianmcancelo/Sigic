'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Layout, ZoomIn, ZoomOut, ShieldCheck, AlertCircle, GraduationCap,
  Armchair, X, Maximize, Minimize, ChevronLeft, ChevronRight, UserCheck, RotateCcw, HelpCircle, Layers, Info, Sparkles, Award
} from 'lucide-react';
import { BASE, obtenerGraduados, obtenerInvitados, cabeceras } from '../../servicios/api';
import { useSincronizacion, emitirCambioSync } from '../../lib/sync';
import { SeleccionAsientos } from '../SeleccionAsientos';

const ACCENT = '#0EA5E9';
const DARK   = '#0F172A';

export function EditorAnfiteatro({ ceremoniaId, onVolver, sinHeader }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [nivel, setNivel] = useState('baja');

  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const containerRef = useRef(null);

  // Estado de la estructura
  const [estructura, setEstructura] = useState({
    baja: { filas: 7, asientos: 20 },
    alta: { filas: 5, asientos: 22 }
  });
  const [estructuraOriginal, setEstructuraOriginal] = useState(null);
  
  // Estado de los roles de los asientos
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

  // Sincronización en vivo del mapa de butacas
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

  // ─── PLANTILLAS PRECONFIGURADAS (PRESETS) ─────────────────────
  const aplicarPlantilla = (tipo) => {
    if (!confirm('¿Deseas aplicar esta plantilla? Se ajustará la estructura y distribución de butacas.')) return;

    if (tipo === 'beltran') {
      // Plantilla real Auditorio Beltrán (3 Bloques + 2 Pasillos + Pullman)
      const nuevaEstructura = {
        baja: { filas: 7, asientos: 20 },
        alta: { filas: 5, asientos: 22 }
      };
      const nuevosRoles = {};
      const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

      // Pasillos en columnas 5 y 16 de Platea
      letras.forEach((letra, idx) => {
        nuevosRoles[`baja-${letra}-5`] = 'bloqueado';
        nuevosRoles[`baja-${letra}-16`] = 'bloqueado';

        // Primeras filas centrales para graduados
        if (idx === 0 || idx === 1) {
          for (let col = 6; col <= 15; col++) {
            nuevosRoles[`baja-${letra}-${col}`] = 'egresado';
          }
        }
        // Fila C central para sector exclusivo de padrinos
        if (idx === 2) {
          for (let col = 6; col <= 15; col++) {
            nuevosRoles[`baja-${letra}-${col}`] = 'padrino';
          }
        }
        // Accesibilidad en primera fila cerca de pasillos
        if (idx === 0) {
          nuevosRoles[`baja-A-4`] = 'discapacitado';
          nuevosRoles[`baja-A-17`] = 'discapacitado';
          nuevosRoles[`baja-A-1`] = 'autoridad';
          nuevosRoles[`baja-A-2`] = 'autoridad';
        }
      });

      setEstructura(nuevaEstructura);
      setMapaRoles(nuevosRoles);
      setMensaje({ tipo: 'exito', texto: 'Plantilla Auditorio Beltrán (3 Bloques) aplicada' });
    } else if (tipo === 'pasillo-central') {
      // 2 Bloques con pasillo al medio
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
      setMensaje({ tipo: 'exito', texto: 'Plantilla de 2 Bloques con pasillo central aplicada' });
    } else if (tipo === 'limpiar') {
      setMapaRoles({});
      setMensaje({ tipo: 'exito', texto: 'Mapa de roles restablecido a disponibles' });
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
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando Distribución...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`font-sans flex flex-col ${fullscreen ? 'h-screen w-screen bg-[#F8FAFC] p-4' : ''}`}>
      {/* HEADER INTEGRADO */}
      {!fullscreen && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-150">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Diseño y Maquetación de Auditorio</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-black uppercase tracking-wider">
                Mapa Interactivo
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Configurá las filas, pasillos y asigná sectores para graduados, acompañantes y accesibilidad.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* PANEL DE CONTROL LATERAL */}
        <aside className={`flex flex-col gap-4 transition-all duration-300 relative ${sidebarColapsada ? 'w-12' : 'w-full lg:w-80 shrink-0'}`}>
          <button 
            onClick={() => setSidebarColapsada(!sidebarColapsada)}
            className="absolute -right-3 top-3.5 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 hover:text-sky-500 transition-colors cursor-pointer"
          >
            {sidebarColapsada ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          {!sidebarColapsada ? (
            <>
              {/* Botones de Acción Principales */}
              <div className="flex gap-2">
                <button
                  onClick={descartarCambios}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
                  title="Descartar Cambios"
                >
                  <RotateCcw size={15} />
                </button>
                
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md active:scale-98 cursor-pointer
                    ${guardando 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 border-slate-900 hover:bg-sky-500 hover:border-sky-500 text-white'}`}
                >
                  {guardando ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>{guardando ? 'Guardando...' : 'Guardar Mapa'}</span>
                </button>
              </div>

              {/* PLANTILLAS ARQUITECTÓNICAS (PRESETS) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-sky-500" size={15} />
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Plantillas de Sala</h3>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => aplicarPlantilla('beltran')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 transition-all text-[10px] font-black uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>★ Auditorio Beltrán (3 Bloques)</span>
                  </button>

                  <button
                    onClick={() => aplicarPlantilla('pasillo-central')}
                    className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all text-[9px] font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>Aula Magna (Pasillo Central)</span>
                  </button>

                  <button
                    onClick={() => aplicarPlantilla('limpiar')}
                    className="w-full text-left px-3 py-1.5 rounded-xl bg-rose-50/60 hover:bg-rose-100 text-rose-700 border border-rose-100 transition-all text-[8px] font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>Limpiar roles</span>
                  </button>
                </div>
              </div>

              {/* ESTRUCTURA */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Layout className="text-sky-500" size={15} />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Estructura Base</h3>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['baja', 'alta'].map(n => (
                    <button
                      key={n}
                      onClick={() => setNivel(n)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        nivel === n ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {n === 'baja' ? 'Platea' : 'Pullman (Balcón)'}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">
                      Filas ({nivel === 'baja' ? 'Platea' : 'Pullman'})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="1" max="50"
                        value={estructura[nivel].filas}
                        onChange={(e) => actualizarEstructura(nivel, 'filas', e.target.value)}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <span className="w-8 text-center font-black text-slate-800 bg-slate-100 py-1 rounded-lg text-xs">
                        {estructura[nivel].filas}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">
                      Asientos por Fila
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="1" max="50"
                        value={estructura[nivel].asientos}
                        onChange={(e) => actualizarEstructura(nivel, 'asientos', e.target.value)}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <span className="w-8 text-center font-black text-slate-800 bg-slate-100 py-1 rounded-lg text-xs">
                        {estructura[nivel].asientos}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Capacidad Teórica</p>
                    <p className="text-base font-black text-slate-900 leading-tight mt-0.5">
                      {estructura.baja.filas * estructura.baja.asientos + estructura.alta.filas * estructura.alta.asientos} Butacas
                    </p>
                  </div>
                  <div className="h-9 w-9 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center border border-sky-100">
                    <Layers size={17} />
                  </div>
                </div>
              </div>

              {/* ASIGNACIÓN DE ROLES (PINCEL) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-sky-500" size={15} />
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Pincel de Roles</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'disponible', label: 'Disponible', color: 'bg-white border border-slate-300 text-slate-600', icono: Armchair },
                    { id: 'egresado', label: 'Graduado', color: 'bg-indigo-600 text-white', icono: GraduationCap },
                    { id: 'padrino', label: 'Padrinos', color: 'bg-red-500 text-white', icono: Award },
                    { id: 'autoridad', label: 'Autoridad', color: 'bg-slate-900 text-white', icono: ShieldCheck },
                    { id: 'discapacitado', label: 'Accesibilidad', color: 'bg-purple-600 text-white', icono: AlertCircle },
                    { id: 'reservado', label: 'Reservado', color: 'bg-amber-500 text-white', icono: Info },
                    { id: 'bloqueado', label: 'Pasillo / Columna', color: 'bg-slate-200 text-slate-600', icono: X },
                  ].map(rol => (
                    <button
                      key={rol.id}
                      onClick={() => setRolSeleccionado(rol.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all text-left cursor-pointer ${
                        rolSeleccionado === rol.id
                          ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-300 shadow-sm'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${rol.color}`}>
                        <rol.icono size={12} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tight truncate ${
                        rolSeleccionado === rol.id ? 'text-sky-800' : 'text-slate-600'
                      }`}>
                        {rol.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center gap-3.5 bg-white rounded-full py-4 shadow-sm border border-slate-100 h-full">
               <button onClick={handleGuardar} disabled={guardando} className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors shadow-sm cursor-pointer" title="Guardar">
                 <Save size={14} />
               </button>
               <div className="w-6 h-px bg-slate-100" />
               <button onClick={() => setNivel('baja')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] ${nivel === 'baja' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Platea">P</button>
               <button onClick={() => setNivel('alta')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] ${nivel === 'alta' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Pullman">U</button>
               <div className="w-6 h-px bg-slate-100" />
               {['disponible', 'egresado', 'padrino', 'autoridad', 'discapacitado', 'reservado', 'bloqueado'].map(rol => (
                 <button
                   key={rol}
                   onClick={() => setRolSeleccionado(rol)}
                   className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                     rolSeleccionado === rol ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                   }`}
                   title={rol}
                 >
                   {rol === 'disponible' ? <Armchair size={13} /> :
                    rol === 'egresado' ? <GraduationCap size={13} /> :
                    rol === 'padrino' ? <Award size={13} /> :
                    rol === 'autoridad' ? <ShieldCheck size={13} /> :
                    rol === 'discapacitado' ? <AlertCircle size={13} /> :
                    rol === 'reservado' ? <Info size={13} /> : <X size={13} />}
                 </button>
               ))}
             </div>
          )}
        </aside>

        {/* ÁREA DE VISUALIZACIÓN */}
        <section className="flex-1 relative flex flex-col gap-3 min-h-0">
          {mensaje && (
            <div className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm
              ${mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}
            >
              <div className="flex items-center gap-2">
                {mensaje.tipo === 'exito' ? <ShieldCheck size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                <span>{mensaje.texto}</span>
              </div>
              <button onClick={() => setMensaje(null)} className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-3">
                <div className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  nivel === 'baja' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700'
                }`}>
                  Visualizando {nivel === 'baja' ? 'Platea (Nivel Inferior)' : 'Pullman (Balcón Superior)'}
                </div>
                {asientosOcupados.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200 shadow-xs">
                    <UserCheck size={12} /> <span>{asientosOcupados.length} Butacas Ocupadas</span>
                  </div>
                )}
             </div>
             
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
                    title="Alejar"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-black text-slate-700 px-1.5 min-w-[3.5ch] text-center">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer"
                    title="Acercar"
                  >
                    <ZoomIn size={14} />
                  </button>
               </div>
               
               <button
                 onClick={toggleFullscreen}
                 className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                   fullscreen 
                     ? 'bg-sky-500 text-white border-sky-500 shadow-md' 
                     : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                 }`}
                 title={fullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
               >
                 {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
               </button>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col min-h-0">
            <div className="flex-1 overflow-auto p-5 custom-scrollbar">
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
               />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
