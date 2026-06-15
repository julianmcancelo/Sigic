import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Layout, ZoomIn, ZoomOut, ShieldCheck, AlertCircle, GraduationCap,
  Armchair, X, Maximize, Minimize, ChevronLeft, ChevronRight, UserCheck, RotateCcw, HelpCircle, Layers, Info
} from 'lucide-react';
import { BASE, obtenerGraduados, obtenerInvitados, cabeceras } from '../../servicios/api';
import { SeleccionAsientos } from '../SeleccionAsientos';

const ACCENT = '#0EA5E9';
const DARK   = '#2A3448';

export function EditorAnfiteatro({ ceremoniaId, onVolver, sinHeader }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [nivel, setNivel] = useState('baja');

  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const containerRef = useRef(null);

  // Estado de la estructura
  const [estructura, setEstructura] = useState({
    baja: { filas: 8, asientos: 16 },
    alta: { filas: 6, asientos: 20 }
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
        setMensaje({ tipo: 'exito', texto: 'Mapa del hábitat guardado con éxito' });
        setEstructuraOriginal(JSON.parse(JSON.stringify(estructura)));
        setMapaRolesOriginal(JSON.parse(JSON.stringify(mapaRoles)));
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
      {/* HEADER INTEGRADO PRO */}
      {!fullscreen && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Diseño de Anfiteatro</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maquetación & Distribución de Butacas</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* PANEL DE CONTROL LATERAL */}
        <aside className={`flex flex-col gap-4 transition-all duration-300 relative ${sidebarColapsada ? 'w-12' : 'w-full lg:w-72 shrink-0'}`}>
          <button 
            onClick={() => setSidebarColapsada(!sidebarColapsada)}
            className="absolute -right-3 top-3.5 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-450 shadow-sm hover:bg-slate-50 hover:text-sky-500 transition-colors"
          >
            {sidebarColapsada ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          {!sidebarColapsada ? (
            <>
              {/* Botones de Acción Principales */}
              <div className="flex gap-2">
                <button
                  onClick={descartarCambios}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm flex items-center justify-center active:scale-95 shrink-0"
                  title="Descartar Cambios"
                >
                  <RotateCcw size={15} />
                </button>
                
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm active:scale-98
                    ${guardando 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 border-slate-900 hover:bg-sky-500 hover:border-sky-500 text-white'}`}
                >
                  {guardando ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <Save size={14} />
                  )}
                  {guardando ? 'Guardando...' : 'Guardar Mapa'}
                </button>
              </div>

              {/* ESTRUCTURA */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <Layout className="text-sky-500" size={14} />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Estructura Base</h3>
                </div>

                <div className="flex bg-slate-50 p-1 rounded-lg">
                  {['baja', 'alta'].map(n => (
                    <button
                      key={n}
                      onClick={() => setNivel(n)}
                      className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${nivel === n ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {n === 'baja' ? 'Platea' : 'Pullman'}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Filas ({nivel === 'baja' ? 'Platea' : 'Pullman'})</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="1" max="50"
                        value={estructura[nivel].filas}
                        onChange={(e) => actualizarEstructura(nivel, 'filas', e.target.value)}
                        className="flex-1 accent-sky-500"
                      />
                      <span className="w-8 text-center font-bold text-slate-600 bg-slate-50 py-1 rounded-md text-xs">{estructura[nivel].filas}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Asientos por Fila</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="1" max="50"
                        value={estructura[nivel].asientos}
                        onChange={(e) => actualizarEstructura(nivel, 'asientos', e.target.value)}
                        className="flex-1 accent-sky-500"
                      />
                      <span className="w-8 text-center font-bold text-slate-600 bg-slate-50 py-1 rounded-md text-xs">{estructura[nivel].asientos}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacidad Total</p>
                    <p className="text-base font-black text-slate-900 leading-tight">
                      {estructura.baja.filas * estructura.baja.asientos + estructura.alta.filas * estructura.alta.asientos}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center">
                    <Layers size={15} />
                  </div>
                </div>
              </div>

              {/* ASIGNACIÓN DE ROLES */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-sky-500" size={14} />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Pincel de Roles</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'disponible', label: 'Disponible', color: 'bg-white border border-slate-200 text-slate-400', icono: Armchair },
                    { id: 'egresado', label: 'Graduado', color: 'bg-indigo-600 text-white', icono: GraduationCap },
                    { id: 'autoridad', label: 'Autoridad', color: 'bg-slate-900 text-white', icono: ShieldCheck },
                    { id: 'discapacitado', label: 'Accesib.', color: 'bg-purple-600 text-white', icono: AlertCircle },
                    { id: 'reservado', label: 'Reservado', color: 'bg-amber-500 text-white', icono: Info },
                    { id: 'bloqueado', label: 'Pasillo', color: 'bg-slate-200 text-slate-500', icono: X },
                  ].map(rol => (
                    <button
                      key={rol.id}
                      onClick={() => setRolSeleccionado(rol.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all text-left ${
                        rolSeleccionado === rol.id
                          ? 'border-sky-400 bg-sky-50 shadow-sm'
                          : 'border-transparent bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${rol.color}`}>
                        <rol.icono size={10} />
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wide truncate ${
                        rolSeleccionado === rol.id ? 'text-sky-700' : 'text-slate-400'
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
               <button onClick={handleGuardar} disabled={guardando} className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors shadow-sm" title="Guardar">
                 <Save size={13} />
               </button>
               <div className="w-6 h-px bg-slate-100" />
               <button onClick={() => setNivel('baja')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] ${nivel === 'baja' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Platea">P</button>
               <button onClick={() => setNivel('alta')} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[9px] ${nivel === 'alta' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Pullman">U</button>
               <div className="w-6 h-px bg-slate-100" />
               {['disponible', 'egresado', 'autoridad', 'discapacitado', 'reservado', 'bloqueado'].map(rol => (
                 <button
                   key={rol}
                   onClick={() => setRolSeleccionado(rol)}
                   className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                     rolSeleccionado === rol ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-50 text-slate-405 hover:bg-slate-100'
                   }`}
                   title={rol}
                 >
                   {rol === 'disponible' ? <Armchair size={12} /> :
                    rol === 'egresado' ? <GraduationCap size={12} /> :
                    rol === 'autoridad' ? <ShieldCheck size={12} /> :
                    rol === 'discapacitado' ? <AlertCircle size={12} /> :
                    rol === 'reservado' ? <Info size={12} /> : <X size={12} />}
                 </button>
               ))}
             </div>
          )}
        </aside>

        {/* ÁREA DE VISUALIZACIÓN */}
        <section className="flex-1 relative flex flex-col gap-3 min-h-0">
          {mensaje && (
            <div className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200
              ${mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
            >
              <div className="flex items-center gap-2">
                {mensaje.tipo === 'exito' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                <span>{mensaje.texto}</span>
              </div>
              <button onClick={() => setMensaje(null)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${nivel === 'baja' ? 'bg-sky-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'}`}>
                  Visualizando {nivel === 'baja' ? 'Platea' : 'Pullman'}
                </div>
                {asientosOcupados.length > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-bold border border-rose-100">
                    <UserCheck size={11} /> {asientosOcupados.length} Ocupados
                  </div>
                )}
             </div>
             
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-slate-100 shadow-sm">
                  <button 
                    onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                    className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[9px] font-black text-slate-500 px-1 min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                    className="p-1.5 hover:bg-slate-50 rounded text-slate-400 transition"
                  >
                    <ZoomIn size={13} />
                  </button>
               </div>
               
               <button
                 onClick={toggleFullscreen}
                 className={`p-2 rounded-lg border transition-all ${fullscreen ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-650 hover:bg-slate-50'}`}
                 title={fullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
               >
                 {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
               </button>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col min-h-0">
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
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
