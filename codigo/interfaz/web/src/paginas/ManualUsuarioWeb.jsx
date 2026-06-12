import { useState } from 'react'
import { 
  ArrowLeft, Users, GraduationCap, ScanLine, Calendar, 
  FileSpreadsheet, Send, Mail, Map, QrCode, ShieldAlert, 
  CheckCircle2, AlertTriangle, XCircle, Settings, HelpCircle
} from 'lucide-react'

// ==========================================
// WIREFRAME 1: ADMINISTRADOR (MAQUETA DE NAVEGADOR)
// ==========================================
function WireframeAdmin() {
  const [metricas] = useState({ egresados: 124, invitados: 248, confirmados: '89%' })
  return (
    <div className="w-full bg-[#1e293b]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl text-[10px] text-white/80 font-sans">
      {/* Cabecera del navegador */}
      <div className="bg-slate-800 px-3 py-2 flex items-center gap-1.5 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-rose-500" />
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <div className="bg-slate-900/60 px-3 py-0.5 rounded text-[8px] text-white/40 ml-2 select-none flex-1 truncate font-mono">
          admin.sigic.beltran.edu.ar/dashboard
        </div>
      </div>
      {/* Cuerpo del Navegador */}
      <div className="flex min-h-[220px]">
        {/* Barra lateral */}
        <div className="w-24 bg-slate-900 p-2 border-r border-white/5 flex flex-col gap-1.5 shrink-0">
          <div className="h-4 bg-sky-500/10 rounded flex items-center gap-1 px-1 text-sky-400 font-bold select-none text-[7.5px]">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> SiGIC Admin
          </div>
          <div className="h-3.5 bg-white/5 rounded border border-[#29ABE2]/30 flex items-center gap-1 px-1 text-white select-none text-[7px]">
            Panel General
          </div>
          <div className="h-3.5 hover:bg-white/5 rounded flex items-center gap-1 px-1 text-white/50 select-none text-[7px] cursor-pointer">
            Graduados
          </div>
          <div className="h-3.5 hover:bg-white/5 rounded flex items-center gap-1 px-1 text-white/50 select-none text-[7px] cursor-pointer">
            Ceremonias
          </div>
          <div className="h-3.5 hover:bg-white/5 rounded flex items-center gap-1 px-1 text-white/50 select-none text-[7px] cursor-pointer">
            Butacas
          </div>
        </div>
        {/* Contenido Principal */}
        <div className="flex-1 p-3 bg-slate-950/40 flex flex-col gap-2">
          {/* Barra de título interna */}
          <div className="flex items-center justify-between border-b border-white/5 pb-1">
            <span className="font-bold text-white text-[9px]">Panel General</span>
            <div className="flex items-center gap-1 text-[7.5px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/60">Colación Activa</span>
            </div>
          </div>
          {/* Fila de Tarjetas de Métricas */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-slate-900/60 border border-white/5 rounded p-1 text-center">
              <span className="block text-white/40 text-[6.5px] uppercase tracking-wider font-bold">Graduados</span>
              <span className="block text-sky-400 text-[10px] font-black mt-0.5">{metricas.egresados}</span>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded p-1 text-center">
              <span className="block text-white/40 text-[6.5px] uppercase tracking-wider font-bold">Invitados</span>
              <span className="block text-emerald-400 text-[10px] font-black mt-0.5">{metricas.invitados}</span>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded p-1 text-center">
              <span className="block text-white/40 text-[6.5px] uppercase tracking-wider font-bold">Asistencias</span>
              <span className="block text-amber-400 text-[10px] font-black mt-0.5">{metricas.confirmados}</span>
            </div>
          </div>
          {/* Tabla de Graduados simulada */}
          <div className="border border-white/5 rounded bg-slate-900/40 overflow-hidden flex-1 flex flex-col">
            <div className="bg-slate-900/80 px-2 py-1 border-b border-white/5 font-bold text-[7.5px] text-white/60">
              Padrón Reciente
            </div>
            <div className="p-1.5 space-y-1 text-[7px] overflow-y-auto max-h-[100px]">
              <div className="flex justify-between items-center bg-white/5 px-1.5 py-0.5 rounded border border-white/[0.02]">
                <span className="text-white font-medium">Gomez, Lucía (Tec. Sistemas)</span>
                <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[6px]">Confirmado</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 px-1.5 py-0.5 rounded border border-white/[0.02]">
                <span className="text-white font-medium">Martínez, Pedro (Ing. Redes)</span>
                <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[6px]">Pendiente</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 px-1.5 py-0.5 rounded border border-white/[0.02]">
                <span className="text-white font-medium">Pérez, Juan (Tec. Redes)</span>
                <span className="px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20 text-[6px]">Enviado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 2: SELECCION DE ASIENTOS INTERACTIVO
// ==========================================
function WireframeEgresado() {
  // 0: libre, 1: egresado (seleccionado), 2: invitado (seleccionado), 3: ocupado por otros
  const [asientos, setAsientos] = useState([
    [3, 3, 0, 3, 3, 3],
    [3, 1, 2, 2, 0, 0],
    [0, 0, 0, 0, 3, 3],
    [0, 0, 3, 0, 0, 0],
  ])

  function toggleAsiento(filaIdx, colIdx) {
    const nuevo = [...asientos]
    const actual = nuevo[filaIdx][colIdx]
    if (actual === 0) {
      // Validar si ya hay un egresado seleccionado (máximo 1)
      nuevo[filaIdx][colIdx] = 2 // Selecciona como invitado
    } else if (actual === 2) {
      nuevo[filaIdx][colIdx] = 0 // Libera asiento
    }
    setAsientos(nuevo)
  }

  const filas = ['A', 'B', 'C', 'D']

  return (
    <div className="w-full bg-[#1e293b]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl text-[10px] text-white/80 font-sans">
      {/* Cabecera del navegador */}
      <div className="bg-slate-800 px-3 py-2 flex items-center gap-1.5 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-rose-500" />
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <div className="bg-slate-900/60 px-3 py-0.5 rounded text-[8px] text-white/40 ml-2 select-none flex-1 truncate font-mono">
          graduados.sigic.beltran.edu.ar/seleccion-asientos
        </div>
      </div>
      <div className="p-3 bg-slate-950/40 flex flex-col gap-2">
        {/* Barra superior de pasos */}
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className="font-bold text-white text-[9px]">Mapa de Asientos</span>
          <span className="text-[7px] bg-[#29ABE2]/20 text-[#29ABE2] px-1.5 py-0.2 rounded border border-[#29ABE2]/30 uppercase font-black">Paso 3 de 4</span>
        </div>

        {/* Escenario */}
        <div className="w-full bg-[#29ABE2]/10 border border-[#29ABE2]/20 rounded text-center py-1 font-bold text-[#29ABE2] text-[8px] tracking-widest uppercase">
          Escenario Principal
        </div>

        {/* Cuadrícula de asientos */}
        <div className="flex flex-col gap-1.5 py-2 items-center">
          {asientos.map((fila, filaIdx) => (
            <div key={filaIdx} className="flex gap-1.5 items-center">
              <span className="w-3 text-right text-[7px] font-bold opacity-40 mr-1">{filas[filaIdx]}</span>
              {fila.map((estado, colIdx) => {
                let color = 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/70 hover:border-slate-500'
                let label = 'Libre'
                if (estado === 1) {
                  color = 'bg-[#29ABE2] border-sky-400 text-white shadow-[0_0_8px_rgba(41,171,226,0.6)] font-bold'
                  label = 'Egresado'
                } else if (estado === 2) {
                  color = 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)] font-bold'
                  label = 'Invitado'
                } else if (estado === 3) {
                  color = 'bg-rose-500/20 border-rose-500/20 text-rose-500/40 cursor-not-allowed'
                  label = 'Ocupado'
                }
                return (
                  <button
                    key={colIdx}
                    onClick={() => estado !== 3 && estado !== 1 && toggleAsiento(filaIdx, colIdx)}
                    disabled={estado === 3 || estado === 1}
                    className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center text-[7px] transition-all cursor-pointer ${color}`}
                    title={`Butaca ${filas[filaIdx]}${colIdx + 1} (${label})`}
                  >
                    {colIdx + 1}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Leyenda explicativa */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[6.5px] border-t border-white/5 pt-1.5 opacity-90">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-[#29ABE2] inline-block shadow-[0_0_3px_rgba(41,171,226,0.6)]" />
            <span>Tu ubicación (Graduado)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-emerald-500 inline-block shadow-[0_0_3px_rgba(16,185,129,0.6)]" />
            <span>Tus acompañantes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-slate-700/50 border border-slate-600 inline-block" />
            <span>Disponible (Clic)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-rose-500/20 border border-rose-500/20 inline-block" />
            <span>Ocupado por otros</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 3: PORTERIA SCANNER MOVIL INTERACTIVO
// ==========================================
function WireframePorteria() {
  const [estadoScan, setEstadoScan] = useState('idle')

  const estados = {
    idle: {
      titulo: 'ESPERANDO QR',
      claseCard: 'border-white/5 bg-slate-900/60 text-white/50',
      descripcion: 'Coloque el código QR del graduado o acompañante frente al visor de la cámara.',
      icono: <ScanLine size={14} className="text-white/40 animate-pulse" />
    },
    success: {
      titulo: 'ACCESO PERMITIDO',
      claseCard: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      descripcion: 'Graduado: Gomez, Lucía. Asiento: A-2. ¡Acreditación registrada correctamente!',
      icono: <CheckCircle2 size={14} className="text-emerald-400" />
    },
    error: {
      titulo: 'ACCESO DENEGADO',
      claseCard: 'border-rose-500/30 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
      descripcion: 'Código inválido o de otra colación. Verifique la credencial física.',
      icono: <XCircle size={14} className="text-rose-400" />
    }
  }

  const actual = estados[estadoScan]

  return (
    <div className="w-[170px] h-[310px] rounded-[24px] border-4 border-slate-700 bg-slate-950 p-2.5 flex flex-col gap-2 shadow-2xl relative select-none mx-auto">
      {/* Notch del Celular */}
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-slate-700 rounded-full" />
      
      {/* App Header */}
      <div className="text-center pt-1 border-b border-white/5">
        <span className="text-[7px] font-black uppercase text-sky-400 tracking-wider">SiGIC Portería</span>
      </div>

      {/* Visor Cámara */}
      <div className="bg-slate-900 rounded-xl h-[140px] border border-white/5 relative overflow-hidden flex items-center justify-center">
        {/* Laser animado de escaneo */}
        {estadoScan === 'idle' && (
          <div 
            className="absolute left-0 w-full h-[1.5px] bg-[#0ea5e9] shadow-[0_0_6px_#0ea5e9]"
            style={{ animation: 'escanear-laser 2.2s ease-in-out infinite' }}
          />
        )}
        
        {/* Rectángulo de enfoque */}
        <div className="absolute h-16 w-16 border-2 border-white/10 rounded-lg flex items-center justify-center border-dashed">
          <QrCode size={30} className={`opacity-20 ${estadoScan === 'idle' ? 'animate-pulse' : ''}`} />
        </div>
        
        {/* Color overlay de validación */}
        {estadoScan !== 'idle' && (
          <div className={`absolute inset-0 opacity-10 ${
            estadoScan === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
        )}
      </div>

      {/* Resultados de Escaneo */}
      <div className={`border rounded-xl p-2 flex-1 flex flex-col gap-1 transition-all duration-300 ${actual.claseCard}`}>
        <div className="flex items-center gap-1 border-b border-white/5 pb-1">
          {actual.icono}
          <span className="text-[7px] font-black tracking-wider uppercase">{actual.titulo}</span>
        </div>
        <p className="text-[6px] leading-snug opacity-80">{actual.descripcion}</p>
      </div>

      {/* Botones de simulación interactiva */}
      <div className="grid grid-cols-2 gap-1 mt-auto">
        <button
          onClick={() => setEstadoScan(estadoScan === 'success' ? 'idle' : 'success')}
          className="py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20 text-[6px] uppercase transition active:scale-95 cursor-pointer"
        >
          {estadoScan === 'success' ? 'Reset' : 'Simular OK'}
        </button>
        <button
          onClick={() => setEstadoScan(estadoScan === 'error' ? 'idle' : 'error')}
          className="py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/20 text-[6px] uppercase transition active:scale-95 cursor-pointer"
        >
          {estadoScan === 'error' ? 'Reset' : 'Simular Error'}
        </button>
      </div>

      <style>{`
        @keyframes escanear-laser {
          0%, 100% { top: 10% }
          50% { top: 90% }
        }
      `}</style>
    </div>
  )
}

// ==========================================
// WIREFRAME 4: DIAGRAMA DE RED Y CONECTIVIDAD
// ==========================================
function DiagramaArquitectura() {
  return (
    <div className="w-full bg-[#1e293b]/95 border border-white/10 rounded-xl p-3 shadow-2xl text-[8.5px] text-white/80 font-sans space-y-2.5">
      <div className="text-center border-b border-white/5 pb-1">
        <span className="font-bold text-white uppercase tracking-wider text-[8px]">Ecosistema de Conectividad</span>
      </div>

      <div className="flex flex-col gap-2.5 relative">
        {/* Fila 1: Clientes */}
        <div className="grid grid-cols-2 gap-2">
          {/* Escritorio WPF */}
          <div className="bg-slate-900 border border-white/5 rounded p-1.5 flex flex-col items-center text-center">
            <span className="font-black text-sky-400">Control Center WPF</span>
            <span className="text-white/40 text-[6px] mt-0.5">Escritorio Windows (.exe)</span>
            <div className="h-1 bg-sky-500/30 w-px my-1" />
            <span className="text-[6.5px] text-[#29ABE2]">Lanza Backend/Frontend local</span>
          </div>

          {/* Portal Web */}
          <div className="bg-slate-900 border border-white/5 rounded p-1.5 flex flex-col items-center text-center">
            <span className="font-black text-emerald-400">Portal Web React</span>
            <span className="text-white/40 text-[6px] mt-0.5">Admin & Graduados (Web)</span>
            <div className="h-1 bg-emerald-500/30 w-px my-1" />
            <span className="text-[6.5px] text-emerald-400">API REST HTTP Requests</span>
          </div>
        </div>

        {/* Flechas hacia el Servidor */}
        <div className="flex justify-around items-center h-2 select-none">
          <div className="w-0.5 h-full bg-sky-500/30" />
          <div className="w-0.5 h-full bg-emerald-500/30" />
        </div>

        {/* Fila 2: Servidor Backend */}
        <div className="bg-[#29ABE2]/10 border border-[#29ABE2]/20 rounded-lg p-2 text-center flex flex-col items-center mx-3">
          <span className="font-black text-white text-[9px] tracking-wide">Servidor API Express Backend</span>
          <span className="text-white/40 text-[6px]">Puerto 3001 (Node.js)</span>
          <p className="text-[6.5px] text-white/60 mt-1 leading-normal">
            Procesa tokens OTP, valida butacas y sincroniza la DB en caliente.
          </p>
        </div>

        {/* Flecha hacia Base de Datos */}
        <div className="flex justify-center items-center h-2 select-none">
          <div className="w-0.5 h-full bg-[#29ABE2]/30" />
        </div>

        {/* Fila 3: Base de Datos */}
        <div className="bg-slate-900 border border-white/5 rounded-lg p-2 text-center flex flex-col items-center mx-8">
          <span className="font-black text-purple-400">Neon Cloud PostgreSQL</span>
          <span className="text-white/40 text-[6px]">Base de Datos en la Nube</span>
          <span className="text-[6.5px] text-purple-300 font-mono mt-0.5">sigic_db (SSL requerido)</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL DEL MANUAL WEB
// ==========================================
export function ManualUsuarioWeb({ onVolver }) {
  const [tabActiva, setTabActiva] = useState('admin')

  const tabs = [
    { id: 'admin', titulo: 'Administrador', descripcion: 'Portal Web de Gestión', icono: Users },
    { id: 'egresado', titulo: 'Egresado', descripcion: 'Portal de Autogestión', icono: GraduationCap },
    { id: 'porteria', titulo: 'Portería', descripcion: 'App de Control QR', icono: ScanLine },
    { id: 'faq', titulo: 'Resolución de Problemas', descripcion: 'Soporte y Preguntas', icono: HelpCircle }
  ]

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-white flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2d45 45%, #2A3448 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Orbes de fondo */}
      <div className="orbe orbe-1"></div>
      <div className="orbe orbe-2"></div>
      <div className="orbe orbe-3"></div>

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-70 z-20" />

      {/* Estrellas parpadeantes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(25)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0,
              animation: `parpadeo ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Rejilla decorativa */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Cabecera superior */}
      <header className="relative z-10 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              SiGIC <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#29ABE2]/20 text-[#29ABE2] border border-[#29ABE2]/30">Manual Oficial</span>
            </h1>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Centro de ayuda para el usuario final</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-white/60">
          <span>v5.1.0</span>
          <span className="h-4 w-px bg-white/10" />
          <span>Instituto Tecnológico Beltrán</span>
        </div>
      </header>

      {/* Contenido Split */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 gap-6">
        
        {/* Barra lateral de navegación de Tabs */}
        <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#29ABE2] mb-3">Roles del Ecosistema</h2>
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icono = tab.icono
                const activa = tabActiva === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`flex items-center gap-3 w-full p-3 text-left rounded-xl transition-all duration-200 border cursor-pointer ${
                      activa 
                        ? 'bg-[#29ABE2]/10 border-[#29ABE2]/30 text-white shadow-[0_4px_20px_rgba(41,171,226,0.15)]' 
                        : 'bg-white/0 border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 transition-colors ${
                      activa ? 'bg-[#29ABE2] text-white' : 'bg-white/5 text-white/50'
                    }`}>
                      <Icono size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none mb-1">{tab.titulo}</p>
                      <p className="text-[9.5px] font-medium opacity-65 leading-tight">{tab.descripcion}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Caja institucional */}
          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-normal">
              Prácticas Profesionalizantes<br />Beltrán · 2026
            </p>
          </div>
        </aside>

        {/* Panel de visualización de guías */}
        <section className="flex-1 bg-slate-900/40 border border-white/5 rounded-[24px] p-6 backdrop-blur-sm shadow-2xl flex flex-col">
          
          {/* TAB 1: ADMINISTRADOR */}
          {tabActiva === 'admin' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol Técnico Institucional</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Gestión y Configuración</h3>
                <p className="text-xs text-white/60 mt-1">Administrá ceremonias, importá egresados, enviá notificaciones y diseñá el anfiteatro de butacas.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Paso 1: Setup */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-[#29ABE2]/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-7 w-7 rounded-lg bg-[#29ABE2]/10 border border-[#29ABE2]/30 flex items-center justify-center text-xs font-bold text-[#29ABE2]">1</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Configuración Inicial</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Al forzar el setup desde el Centro de Control o iniciar en limpio, registrá la cuenta de <strong>Super-Administrador</strong>, el nombre de la institución y el lugar del evento para configurar la base de datos de manera automática.
                    </p>
                  </div>

                  {/* Paso 2: Ceremonias */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-[#29ABE2]/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-7 w-7 rounded-lg bg-[#29ABE2]/10 border border-[#29ABE2]/30 flex items-center justify-center text-xs font-bold text-[#29ABE2]">2</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Gestión de Ceremonias</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Creá eventos e ingresá el cupo máximo de acompañantes permitidos por egresado. Marcá una <strong>Ceremonia Activa</strong> como prioritaria para que el sistema asocie los accesos a ella.
                    </p>
                  </div>

                  {/* Paso 3: Carga Padrón */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-[#29ABE2]/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-7 w-7 rounded-lg bg-[#29ABE2]/10 border border-[#29ABE2]/30 flex items-center justify-center text-xs font-bold text-[#29ABE2]">3</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Carga Masiva (Excel)</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Importá la nómina de graduados arrastrando una planilla Excel (.xlsx). El sistema validará la estructura (Nombre, DNI, Legajo, Carrera y Promedio) notificando errores antes de guardar en base.
                    </p>
                  </div>

                  {/* Paso 4: Notificaciones */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-[#29ABE2]/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-7 w-7 rounded-lg bg-[#29ABE2]/10 border border-[#29ABE2]/30 flex items-center justify-center text-xs font-bold text-[#29ABE2]">4</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Envío de Invitaciones</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Hacé clic en <strong>Enviar Invitaciones</strong> en masa o de forma individual. Cada egresado recibirá un mail automático formal de la institución con un link encriptado único para ingresar a su autogestión.
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Vista Previa: Panel General</span>
                  <WireframeAdmin />
                </div>
              </div>

              {/* Sección Anfiteatro */}
              <div className="bg-[#29ABE2]/5 border border-[#29ABE2]/20 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Map className="text-[#29ABE2]" size={22} />
                  <h4 className="text-sm font-black text-white">Diseño Visual del Anfiteatro (Butacas)</h4>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  El editor permite configurar una cuadrícula a medida (filas y columnas) y pintar cada celda para definir el protocolo del salón.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-2">
                    <div className="h-3 w-3 rounded-full bg-sky-500 mx-auto mb-1.5 animate-pulse" />
                    <span className="text-[10px] font-bold text-sky-400">Graduados</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-400 mx-auto mb-1.5" />
                    <span className="text-[10px] font-bold text-emerald-400">Acompañantes</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mx-auto mb-1.5" />
                    <span className="text-[10px] font-bold text-amber-400">Docentes</span>
                  </div>
                  <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-2">
                    <div className="h-3 w-3 rounded-full bg-slate-700 mx-auto mb-1.5" />
                    <span className="text-[10px] font-bold text-slate-400">Pasillos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EGRESADO */}
          {tabActiva === 'egresado' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol del Estudiante Graduado</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Autogestión del Portal</h3>
                <p className="text-xs text-white/60 mt-1">Confirmá tu presencia, registrá acompañantes, seleccioná tus butacas y obtené tus credenciales QR.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="h-8 w-8 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] border border-[#29ABE2]/20 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">Acceso Seguro por OTP</h4>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Haciendo clic en tu link del email ingresás automáticamente. Si entrás manualmente, completá tu correo y el sistema te enviará una clave numérica temporal (OTP) de 6 dígitos que deberás colocar para validar tu sesión.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="h-8 w-8 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] border border-[#29ABE2]/20 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">Declaración de Asistencia (Irreversible)</h4>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Marcá si asistirás o no a la colación. <strong>Importante:</strong> Confirmar inasistencia (Rechazar) es un paso irreversible en el servidor que inhabilita tu enlace y libera tus butacas automáticamente para el uso de la institución.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="h-8 w-8 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] border border-[#29ABE2]/20 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">Carga de Acompañantes y Asientos</h4>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Completá el Nombre, DNI, Teléfono y Relación de tus invitados. Marcá si alguno posee movilidad reducida. Luego, seleccioná tu ubicación en el plano y asignale las butacas verdes contiguas a tus acompañantes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="h-8 w-8 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] border border-[#29ABE2]/20 flex items-center justify-center font-bold text-xs shrink-0">4</div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1">Descarga de Credencial Oficial (QR)</h4>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        El sistema emitirá tu credencial digital y la de tus invitados. Guardá los archivos con los códigos QR en tu celular o imprimilos. Cada invitado ingresará mostrando su respectivo código QR en el acceso del salón.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Simulador: Plano de Asientos</span>
                  <WireframeEgresado />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTERIA */}
          {tabActiva === 'porteria' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol de Acreditación y Seguridad</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Control de Accesos (Portería)</h3>
                <p className="text-xs text-white/60 mt-1">Utilizá la aplicación móvil basada en Flutter para escanear credenciales y registrar presentismo.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Caso Verde */}
                  <div className="border border-emerald-500/20 bg-emerald-950/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Acceso Permitido (Verde)</h4>
                      <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                        La credencial es válida para la ceremonia activa y el asiento está verificado. Muestra los datos de la persona y la fila/asiento asignado.
                      </p>
                    </div>
                  </div>

                  {/* Caso Naranja */}
                  <div className="border border-amber-500/20 bg-amber-950/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Ya Registrado (Alerta Naranja)</h4>
                      <p className="text-[11px] text-amber-100/60 leading-relaxed">
                        El código QR es válido pero esa persona <strong>ya ingresó anteriormente</strong> al salón. Alerta inmediata ante fotocopias o fraude.
                      </p>
                    </div>
                  </div>

                  {/* Caso Rojo */}
                  <div className="border border-rose-500/20 bg-rose-950/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <XCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Acceso Denegado (Rojo)</h4>
                      <p className="text-[11px] text-rose-100/60 leading-relaxed">
                        Token QR incorrecto, de otra ceremonia, egresado con inasistencia declarada o butacas no asignadas.
                      </p>
                    </div>
                  </div>

                  {/* Alerta Movilidad Reducida */}
                  <div className="border border-sky-500/30 bg-sky-950/15 p-4 rounded-xl flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
                      <ScanLine size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 mb-0.5">Indicador de Movilidad Reducida</h4>
                      <p className="text-[11px] text-sky-100/60 leading-relaxed">
                        Si el invitado escaneado tiene movilidad reducida declarada, la pantalla verde emitirá un aviso visual especial en portería para alertar a los organizadores y proveer asistencia física directa hacia su butaca asignada.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Simulador: Visor QR de Portero</span>
                  <WireframePorteria />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESOLUCION DE PROBLEMAS */}
          {tabActiva === 'faq' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Soporte Técnico Especializado</span>
                <h3 className="text-xl font-black text-white mt-1">Resolución de Incidentes</h3>
                <p className="text-xs text-white/60 mt-1">Soluciones rápidas a inconvenientes operativos típicos durante la ceremonia o el montaje.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Preguntas */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldAlert size={14} className="text-[#29ABE2]" /> ¿Cómo recupero el enlace de un graduado si no recibió el correo?
                    </h4>
                    <p className="text-[11px] text-white/60 mt-2 leading-relaxed">
                      En **Gestión de Graduados**, el administrador puede verificar el correo, reenviar individualmente, o simplemente copiar el **Token de Acceso** único de la fila del graduado y proveerle el link manual: <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[#29ABE2]">http://localhost:5173/?token=TOKEN_DE_8_DIGITOS</code>.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldAlert size={14} className="text-[#29ABE2]" /> El Centro de Control muestra "Sin conexión" en el Backend.
                    </h4>
                    <p className="text-[11px] text-white/60 mt-2 leading-relaxed">
                      Asegúrese de que el puerto <strong>3001</strong> no esté siendo usado por otra aplicación o base de datos local. Verifique que la conexión a internet sea estable (para el backend que conecta a la base PostgreSQL en Neon Cloud) y que el archivo <code className="bg-black/30 px-1 py-0.5 rounded font-mono">.env</code> de la carpeta del servidor no tenga credenciales de base de datos incorrectas.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldAlert size={14} className="text-[#29ABE2]" /> ¿Cómo limpio las butacas y el padrón para una nueva colación?
                    </h4>
                    <p className="text-[11px] text-white/60 mt-2 leading-relaxed">
                      En el Centro de Control de Windows, pulse en <strong>Forzar Setup Inicial</strong>. Esto vaciará todas las tablas e inhabilitará los enlaces anteriores para permitir al administrador configurar una nueva ceremonia en limpio sin dejar remanentes de datos.
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Diagrama */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Arquitectura del Ecosistema</span>
                  <DiagramaArquitectura />
                </div>
              </div>
            </div>
          )}

        </section>
      </div>

      <style>{`
        .orbe {
          position: absolute;
          border-radius: 50%;
          filter: blur(85px);
          pointer-events: none;
          z-index: 1;
        }
        .orbe-1 {
          width: 500px; height: 500px;
          background: rgba(14, 165, 233, 0.12);
          top: -150px; left: -100px;
          animation: orbitar1 15s ease-in-out infinite;
        }
        .orbe-2 {
          width: 350px; height: 350px;
          background: rgba(99, 102, 241, 0.08);
          bottom: -80px; right: -50px;
          animation: orbitar2 18s ease-in-out infinite;
        }
        .orbe-3 {
          width: 250px; height: 250px;
          background: rgba(236, 72, 153, 0.05);
          top: 40%; left: 50%;
          animation: orbitar3 12s ease-in-out infinite;
        }
        @keyframes orbitar1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 80px) scale(1.08); }
        }
        @keyframes orbitar2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -70px) scale(0.9); }
        }
        @keyframes orbitar3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }
        @keyframes parpadeo {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.7; }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
