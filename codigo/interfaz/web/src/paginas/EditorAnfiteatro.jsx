import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, Layout, ZoomIn, ZoomOut,
  ShieldCheck, AlertCircle, GraduationCap,
  Armchair, RefreshCw, Layers, Info, X, Maximize, Minimize, ChevronLeft, ChevronRight, UserCheck, RotateCcw, HelpCircle
} from 'lucide-react';
import { BASE, obtenerGraduados, obtenerInvitados, cabeceras } from '../servicios/api';
import { SeleccionAsientos } from './SeleccionAsientos';
import { HeaderGlobal } from '../componentes/HeaderGlobal';

export function EditorAnfiteatro({ ceremoniaId, onVolver }) {
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
        setMensaje({ tipo: 'exito', texto: 'Mapa del habitat guardado con exito' });
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
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Escaneando Estructura...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`bg-[#f1f5f9] font-sans selection:bg-sky-100 flex flex-col ${fullscreen ? 'h-screen w-screen' : 'min-h-screen'}`}>
      {!fullscreen && (
        <HeaderGlobal 
          titulo="Diseño del Anfiteatro"
          subtitulo="Arquitectura de Hábitat"
          onVolver={onVolver}
        />
      )}

      <main className={`flex-1 mx-auto w-full flex flex-col lg:flex-row transition-all duration-300 ${fullscreen ? 'p-4 gap-4 max-w-[1920px]' : 'p-8 gap-8 max-w-7xl'}`}>
        {/* PANEL DE CONTROL LATERAL */}
        <aside className={`flex flex-col gap-4 transition-all duration-300 relative ${sidebarColapsada ? 'w-16' : 'w-full lg:w-80'}`}>
          <button 
            onClick={() => setSidebarColapsada(!sidebarColapsada)}
            className="absolute -right-4 top-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-md hover:bg-slate-50 hover:text-sky-500 transition-colors"
          >
            {sidebarColapsada ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {!sidebarColapsada ? (
            <>
              {/* Botones de Acción Principales */}
              <div className="flex gap-2">
                <button
                  onClick={descartarCambios}
                  className="p-4 rounded-[24px] bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm flex items-center justify-center active:scale-[0.98]"
                  title="Descartar Cambios"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className={`flex-1 relative overflow-hidden py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 border
                    ${guardando 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 border-slate-900 hover:bg-sky-600 hover:border-sky-600 text-white shadow-xl shadow-slate-900/10 active:scale-[0.98]'}`}
                >
                  {guardando ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <Save size={16} />
                  )}
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
              <Layout className="text-sky-500" size={16} />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Estructura Base</h3>
            </div>

            {/* SELECCIÓN DE NIVEL */}
            <div className="flex bg-slate-50 p-1 rounded-xl">
              {['baja', 'alta'].map(n => (
                <button
                  key={n}
                  onClick={() => setNivel(n)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${nivel === n ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {n === 'baja' ? 'Platea' : 'Pullman'}
                </button>
              ))}
            </div>

            {/* DIMENSIONES */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filas ({nivel})</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="1" max="50"
                    value={estructura[nivel].filas}
                    onChange={(e) => actualizarEstructura(nivel, 'filas', e.target.value)}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-9 text-center font-black text-slate-700 bg-slate-50 py-1.5 rounded-lg text-xs">{estructura[nivel].filas}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asientos por Fila</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="1" max="50"
                    value={estructura[nivel].asientos}
                    onChange={(e) => actualizarEstructura(nivel, 'asientos', e.target.value)}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-9 text-center font-black text-slate-700 bg-slate-50 py-1.5 rounded-lg text-xs">{estructura[nivel].asientos}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacidad Total</p>
                <p className="text-xl font-black text-slate-900">
                  {estructura.baja.filas * estructura.baja.asientos + estructura.alta.filas * estructura.alta.asientos}
                </p>
              </div>
              <div className="h-9 w-9 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center">
                <Layers size={18} />
              </div>
            </div>
          </div>

          {/* PALETA DE ROLES (compacta) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="text-sky-500" size={16} />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Asignación de Roles</h3>
              </div>
              <button
                onClick={() => setMostrarAyuda(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                title="Cómo usar el editor"
              >
                <HelpCircle size={15} />
              </button>
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
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all text-left ${
                    rolSeleccionado === rol.id
                      ? 'border-sky-400 bg-sky-50 shadow-sm'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${rol.color}`}>
                    <rol.icono size={12} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wide truncate ${
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
             <div className="flex flex-col items-center gap-4 bg-white rounded-full py-6 shadow-sm border border-slate-100 h-full">
               <button onClick={handleGuardar} disabled={guardando} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors" title="Guardar">
                 <Save size={16} />
               </button>
               <div className="w-8 h-px bg-slate-100" />
               <button onClick={() => setNivel('baja')} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${nivel === 'baja' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Platea">P</button>
               <button onClick={() => setNivel('alta')} className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${nivel === 'alta' ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:bg-slate-50'}`} title="Pullman">U</button>
               <div className="w-8 h-px bg-slate-100" />
               {['disponible', 'egresado', 'autoridad', 'discapacitado', 'reservado', 'bloqueado'].map(rol => (
                 <button
                   key={rol}
                   onClick={() => setRolSeleccionado(rol)}
                   className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                     rolSeleccionado === rol ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                   }`}
                   title={rol}
                 >
                   {rol === 'disponible' ? <Armchair size={14} /> :
                    rol === 'egresado' ? <GraduationCap size={14} /> :
                    rol === 'autoridad' ? <ShieldCheck size={14} /> :
                    rol === 'discapacitado' ? <AlertCircle size={14} /> :
                    rol === 'reservado' ? <Info size={14} /> : <X size={14} />}
                 </button>
               ))}
             </div>
          )}
        </aside>

        {/* ÁREA DE VISUALIZACIÓN */}
        <section className="flex-1 relative flex flex-col gap-4 overflow-hidden">
          {mensaje && (
            <div className={`px-6 py-4 rounded-[20px] border text-xs font-black uppercase tracking-wider flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300
              ${mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
            >
              <div className="flex items-center gap-2">
                {mensaje.tipo === 'exito' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                <span>{mensaje.texto}</span>
              </div>
              <button onClick={() => setMensaje(null)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${nivel === 'baja' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20' : 'bg-white border border-slate-200 text-slate-500'}`}>
                  Visualizando {nivel === 'baja' ? 'Platea' : 'Pullman'}
                </div>
                {asientosOcupados.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100">
                    <UserCheck size={12} /> {asientosOcupados.length} Asientos Ocupados
                  </div>
                )}
             </div>
             
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                  <button 
                    onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[10px] font-black text-slate-500 px-2 min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
                  >
                    <ZoomIn size={16} />
                  </button>
               </div>
               
               <button
                 onClick={toggleFullscreen}
                 className={`p-3 rounded-xl border transition-all ${fullscreen ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:bg-slate-50'}`}
                 title={fullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
               >
                 {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
               </button>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative flex flex-col">
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
      </main>
    </div>
  );
}
