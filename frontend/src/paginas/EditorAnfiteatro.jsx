import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Layout, ZoomIn, ZoomOut,
  ShieldCheck, AlertCircle, GraduationCap,
  Armchair, RefreshCw, Layers, Info, X
} from 'lucide-react';
import { BASE } from '../servicios/api';
import { SeleccionAsientos } from './SeleccionAsientos';
import { HeaderGlobal } from '../componentes/HeaderGlobal';

export function EditorAnfiteatro({ ceremoniaId, onVolver }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [nivel, setNivel] = useState('baja');

  // Estado de la estructura
  const [estructura, setEstructura] = useState({
    baja: { filas: 8, asientos: 16 },
    alta: { filas: 6, asientos: 20 }
  });
  
  // Estado de los roles de los asientos
  const [mapaRoles, setMapaRoles] = useState({});
  const [rolSeleccionado, setRolSeleccionado] = useState('disponible');

  useEffect(() => {
    if (ceremoniaId) {
      cargarConfiguracion();
    }
  }, [ceremoniaId]);

  async function cargarConfiguracion() {
    setCargando(true);
    try {
      const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.estructura) setEstructura(data.estructura);
        if (data.mapaRoles) setMapaRoles(data.mapaRoles);
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar la configuración previa' });
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estructura, mapaRoles, usuarioId: null })
      });
      
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Mapa del habitat guardado con exito' });
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
    setMapaRoles(prev => ({
      ...prev,
      [idAsiento]: rolSeleccionado
    }));
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Escaneando Estructura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-sky-100 flex flex-col">
      <HeaderGlobal 
        titulo="Diseño del Anfiteatro"
        subtitulo="Arquitectura de Hábitat"
        onVolver={onVolver}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 flex flex-col lg:flex-row gap-8">
        {/* PANEL DE CONTROL LATERAL */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Layout className="text-sky-500" size={20} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Estructura Base</h3>
            </div>

            {/* SELECCIÓN DE NIVEL */}
            <div className="flex bg-slate-50 p-1 rounded-2xl">
              {['baja', 'alta'].map(n => (
                <button
                  key={n}
                  onClick={() => setNivel(n)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${nivel === n ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {n === 'baja' ? 'Platea' : 'Pullman'}
                </button>
              ))}
            </div>

            {/* DIMENSIONES */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filas ({nivel})</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="50"
                    value={estructura[nivel].filas}
                    onChange={(e) => actualizarEstructura(nivel, 'filas', e.target.value)}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-10 text-center font-black text-slate-700 bg-slate-50 py-2 rounded-lg text-sm">{estructura[nivel].filas}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asientos por Fila</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="50"
                    value={estructura[nivel].asientos}
                    onChange={(e) => actualizarEstructura(nivel, 'asientos', e.target.value)}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-10 text-center font-black text-slate-700 bg-slate-50 py-2 rounded-lg text-sm">{estructura[nivel].asientos}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad Total</p>
                <p className="text-2xl font-black text-slate-900">
                  {estructura.baja.filas * estructura.baja.asientos + estructura.alta.filas * estructura.alta.asientos}
                </p>
              </div>
              <div className="h-12 w-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center">
                <Layers size={24} />
              </div>
            </div>
          </div>

          {/* PALETA DE ROLES */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <ShieldCheck className="text-indigo-500" size={20} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Asignación de Roles</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'disponible', label: 'Disponible', color: 'bg-white border-2 border-slate-200', icono: Armchair },
                { id: 'egresado', label: 'Egresado', color: 'bg-indigo-600 text-white shadow-lg', icono: GraduationCap },
                { id: 'autoridad', label: 'Autoridad', color: 'bg-slate-900 text-white', icono: ShieldCheck },
                { id: 'discapacitado', label: 'Accesibilidad', color: 'bg-purple-600 text-white', icono: AlertCircle },
                { id: 'reservado', label: 'Reservado', color: 'bg-amber-500 text-white', icono: Info },
                { id: 'bloqueado', label: 'Bloquear (Pasillo)', color: 'bg-slate-200 text-slate-500', icono: X },
              ].map(rol => (
                <button
                  key={rol.id}
                  onClick={() => setRolSeleccionado(rol.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    rolSeleccionado === rol.id ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-100' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${rol.color}`}>
                    <rol.icono size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">{rol.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/20">
            <div className="flex items-center gap-3">
              <Info className="text-sky-400" size={20} />
              <h3 className="text-sm font-black uppercase tracking-tight">Instrucciones</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Ajuste las dimensiones de cada nivel usando los controles deslizantes. El mapa se actualiza en tiempo real para visualizar la distribución.
            </p>
            <div className="flex items-center gap-3 pt-4 opacity-50">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Publicación Sincrónica</span>
            </div>
          </div>
        </aside>

        {/* ÁREA DE VISUALIZACIÓN */}
        <section className="flex-1 relative flex flex-col gap-4 overflow-hidden">
          <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-2">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${nivel === 'baja' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  Visualizando {nivel === 'baja' ? 'Platea' : 'Pullman'}
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-100">
                <button 
                  onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[10px] font-black text-slate-500 px-2">{Math.round(zoom * 100)}%</span>
                <button 
                  onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
                >
                  <ZoomIn size={16} />
                </button>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative flex flex-col">
            <div className="flex-1 overflow-auto p-12 custom-scrollbar flex flex-col items-center">
               <SeleccionAsientos 
                 ceremoniaId={ceremoniaId}
                 nivel={nivel}
                 setNivel={setNivel}
                 zoom={zoom}
                 setZoom={setZoom}
                 estructura={estructura}
                 mapaRoles={mapaRoles}
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
