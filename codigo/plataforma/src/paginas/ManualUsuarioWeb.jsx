import { useState, useEffect } from 'react'
import { 
  ArrowLeft, ArrowRight, BookOpen, Book, Users, GraduationCap, 
  ScanLine, HelpCircle, Calendar, Shield, Server, LayoutGrid, 
  CheckCircle2, AlertTriangle, XCircle, List, Heart, Map,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Accessibility, Smartphone, FileText
} from 'lucide-react'

// ==========================================
// IMAGEN: PANEL ADMINISTRATIVO REAL
// ==========================================
function ScreenPanelAdmin() {
  const [src, setSrc] = useState('/manual/panel_admin.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/panel_admin.png') {
            setSrc('/panel_admin.png')
          }
        }}
        alt="Panel de Administración SiGIC" 
        className="w-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
        style={{ maxHeight: '450px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">📸 Captura real: Panel de Administración SiGIC</span>
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: GESTIÓN DE GRADUADOS REAL
// ==========================================
function ScreenGestionGraduados() {
  const [src, setSrc] = useState('/manual/gestion_graduados.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/gestion_graduados.png') {
            setSrc('/gestion_graduados.png')
          }
        }}
        alt="Gestión de Graduados SiGIC" 
        className="w-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
        style={{ maxHeight: '450px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold text-white">📸 Pipeline de estados en Gestión</span>
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: GESTIÓN DE CEREMONIAS REAL
// ==========================================
function ScreenGestionCeremonias() {
  const [src, setSrc] = useState('/manual/gestion_ceremonias.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/gestion_ceremonias.png') {
            setSrc('/gestion_ceremonias.png')
          }
        }}
        alt="Gestión de Ceremonias SiGIC" 
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
        style={{ maxHeight: '450px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold text-white">📸 Consola Multi-Hábitat de Ceremonias</span>
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: DISEÑO DEL ANFITEATRO REAL
// ==========================================
function ScreenDisenoAnfiteatro() {
  const [src, setSrc] = useState('/manual/diseno_anfiteatro.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/diseno_anfiteatro.png') {
            setSrc('/diseno_anfiteatro.png')
          }
        }}
        alt="Diseño del Anfiteatro SiGIC" 
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
        style={{ maxHeight: '450px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold text-white">📸 Modelador del Anfiteatro y Butacas</span>
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: EMAIL DE INVITACION REAL
// ==========================================
function ScreenEmailInvitacion() {
  const [src, setSrc] = useState('/manual/email_invitacion.png')
  return (
    <div className="w-full max-w-[200px] mx-auto overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/email_invitacion.png') {
            setSrc('/email_invitacion.png')
          }
        }}
        alt="Correo de Invitación" 
        className="w-full object-cover object-top hover:scale-[1.01] transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">📸 Correo real que recibe el egresado</span>
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: PORTAL OTP DEL EGRESADO
// ==========================================
function ScreenPortalOTP() {
  const [src, setSrc] = useState('/manual/portal_otp.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img 
        src={src} 
        onError={() => { if (src === '/manual/portal_otp.png') setSrc('/portal_otp.png') }}
        className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105"
        alt="Portal OTP"
      />
    </div>
  )
}

// ==========================================
// IMAGEN: PANTALLA DE ACEPTACIÓN
// ==========================================
function ScreenPantallaAceptacion() {
  const [src, setSrc] = useState('/manual/pantalla_aceptacion.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img src={src} onError={() => { if (src === '/manual/pantalla_aceptacion.png') setSrc('/pantalla_aceptacion.png') }} className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Aceptación" />
    </div>
  )
}

// ==========================================
// IMAGEN: ACOMPAÑANTES
// ==========================================
function ScreenPanelAcompanantes() {
  const [src, setSrc] = useState('/manual/panel_graduado_acompanantes.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img src={src} onError={() => { if (src === '/manual/panel_graduado_acompanantes.png') setSrc('/panel_graduado_acompanantes.png') }} className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Acompañantes" />
    </div>
  )
}

// ==========================================
// IMAGEN: ENTREGADORES
// ==========================================
function ScreenPanelEntregadores() {
  const [src, setSrc] = useState('/manual/panel_graduado_entregadores.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img src={src} onError={() => { if (src === '/manual/panel_graduado_entregadores.png') setSrc('/panel_graduado_entregadores.png') }} className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Entregadores" />
    </div>
  )
}

// ==========================================
// IMAGEN: CREDENCIAL DIGITAL
// ==========================================
function ScreenCredencialDigital() {
  const [src, setSrc] = useState('/manual/credencial_digital.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img src={src} onError={() => { if (src === '/manual/credencial_digital.png') setSrc('/credencial_digital.png') }} className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Credencial Digital" />
    </div>
  )
}

// ==========================================
// IMAGEN: PANTALLA INASISTENCIA
// ==========================================
function ScreenInasistencia() {
  const [src, setSrc] = useState('/manual/portal_inasistencia.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/portal_inasistencia.png') {
            setSrc('/portal_inasistencia.png')
          }
        }}
        alt="Pantalla Inasistencia" 
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
        style={{ maxHeight: '450px' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">📸 Confirmación de inasistencia</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME: PORTERIA SCANNER MOVIL
// ==========================================
function WireframePorteria() {
  const [src, setSrc] = useState('/manual/porteria_wireframe.png')
  return (
    <div className="w-[85px] mx-auto overflow-hidden rounded-[14px] border-2 border-slate-700 shadow-md bg-slate-50 relative select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/porteria_wireframe.png') {
            setSrc('/porteria_wireframe.png')
          }
        }}
        alt="Escáner QR Móvil" 
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
      />
    </div>
  )
}

// ==========================================
// WIREFRAME: MAPA DE ASIENTOS
// ==========================================
function WireframeEgresado() {
  const [src, setSrc] = useState('/manual/egresado_wireframe.png')
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <img 
        src={src} 
        onError={() => {
          if (src === '/manual/egresado_wireframe.png') {
            setSrc('/egresado_wireframe.png')
          }
        }}
        alt="Mapa de Butacas Anfiteatro" 
        className="w-full max-h-[120px] object-cover hover:scale-[1.02] transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">📸 Mapa interactivo del anfiteatro ITB</span>
      </div>
    </div>
  )
}

// ==========================================
// DIAGRAMA DE ARQUITECTURA
// ==========================================
function DiagramaArquitectura() {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-md text-[7.5px] text-white/80 font-sans space-y-2">
      <div className="text-center border-b border-white/5 pb-1">
        <span className="font-bold text-white uppercase tracking-wider text-[7px]">Ecosistema de Conectividad</span>
      </div>
      <div className="flex flex-col gap-1.5 relative">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 border border-white/5 rounded p-1 flex flex-col items-center text-center">
            <span className="font-black text-sky-400">Centro de Control Web</span>
            <span className="text-white/40 text-[5.5px] mt-0.5">Gestión de Infraestructura</span>
          </div>
          <div className="bg-slate-950 border border-white/5 rounded p-1 flex flex-col items-center text-center">
            <span className="font-black text-emerald-400">Portal Web Next.js</span>
            <span className="text-white/40 text-[5.5px] mt-0.5">Admin & Graduados</span>
          </div>
        </div>
        <div className="flex justify-around items-center h-1.5 select-none">
          <div className="w-0.5 h-full bg-sky-500/30" />
          <div className="w-0.5 h-full bg-emerald-500/30" />
        </div>
        <div className="bg-sky-500/10 border border-sky-500/25 rounded-md p-1.5 text-center flex flex-col items-center mx-2">
          <span className="font-black text-white text-[8px] tracking-wide">Vercel Serverless Platform</span>
        </div>
        <div className="flex justify-center items-center h-1.5 select-none">
          <div className="w-0.5 h-full bg-sky-500/30" />
        </div>
        <div className="bg-slate-950 border border-white/5 rounded-md p-1.5 text-center flex flex-col items-center mx-6">
          <span className="font-black text-purple-400">Neon Cloud PostgreSQL</span>
          <span className="text-white/40 text-[5.5px]">Base de Datos en la Nube</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL DEL MANUAL WEB
// ==========================================
export function ManualUsuarioWeb({ onVolver, sinHeader }) {
  const [estaAbierto, setEstaAbierto] = useState(false)
  const [pliegoActual, setPliegoActual] = useState(0) // 0 a 5 en Escritorio (Desktop)
  const [paginaMovil, setPaginaMovil] = useState(0) // 0 a 10 en Celular (Mobile)
  const [esMovil, setEsMovil] = useState(false)
  const [estaAnimando, setEstaAnimando] = useState(false)
  const [nivelZoom, setNivelZoom] = useState(1.0) // Zoom: 1.0 (100%), 1.2 (120%), 1.4 (140%)
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false)
  const [rutaPortada, setRutaPortada] = useState('/manual/manual_portada.png')

  // Detectar tamaño de pantalla para la vista de hojas
  useEffect(() => {
    const chequearTamano = () => {
      setEsMovil(window.innerWidth < 1024)
    }
    chequearTamano()
    window.addEventListener('resize', chequearTamano)
    return () => window.removeEventListener('resize', chequearTamano)
  }, [])

  // Escuchar cambios de pantalla completa del navegador para sincronizar el botón
  useEffect(() => {
    const chequearPantallaCompleta = () => {
      setEsPantallaCompleta(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', chequearPantallaCompleta)
    return () => document.removeEventListener('fullscreenchange', chequearPantallaCompleta)
  }, [])

  // Pasar pliegos o páginas con efectos
  const cambiarPliego = (nuevoPliego) => {
    if (estaAnimando) return
    setEstaAnimando(true)
    setPliegoActual(nuevoPliego)
    setTimeout(() => setEstaAnimando(false), 400)
  }

  const cambiarPaginaMovil = (nuevaPagina) => {
    if (estaAnimando) return
    setEstaAnimando(true)
    setPaginaMovil(nuevaPagina)
    setTimeout(() => setEstaAnimando(false), 400)
  }

  const abrirLibro = () => {
    setEstaAnimando(true)
    setEstaAbierto(true)
    setPliegoActual(1)
    setPaginaMovil(1)
    setTimeout(() => setEstaAnimando(false), 500)
  }

  const cerrarLibro = () => {
    setEstaAnimando(true)
    setEstaAbierto(false)
    setPliegoActual(0)
    setPaginaMovil(0)
    setNivelZoom(1.0) // Reiniciamos el zoom al cerrar
    setTimeout(() => setEstaAnimando(false), 500)
  }

  // Saltar directo a una página desde el índice
  const irAPagina = (numeroPagina) => {
    if (esMovil) {
      cambiarPaginaMovil(numeroPagina)
    } else {
      const nuevoPliego = Math.ceil(numeroPagina / 2)
      cambiarPliego(nuevoPliego)
    }
  }

  // Agrandar o reducir el zoom
  const aumentarZoom = () => {
    if (nivelZoom < 1.4) setNivelZoom(prev => Math.min(1.4, prev + 0.2))
  }

  const disminuirZoom = () => {
    if (nivelZoom > 1.0) setNivelZoom(prev => Math.max(1.0, prev - 0.2))
  }

  // Activar o desactivar Fullscreen
  const alternarPantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al activar pantalla completa: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Páginas del manual escritas en tono local (ITB Beltrán)
  const listaPaginas = [
    // Página 0: Portada
    null,

    // Página 1: Índice
    (
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <List size={16} className="text-[#0056b3]" /> Índice General
        </h3>
        <p className="text-[10px] text-slate-500 italic">
          Hacé clic en cualquier sección para saltar directamente a la página:
        </p>
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          {[
            { t: '1. Acceso y Canales de Inicio', p: 2 },
            { t: '2. Operación Diaria y Ceremonia Activa', p: 2 },
            { t: '3. Carga de Padrón desde Excel', p: 3 },
            { t: '4. Despacho Masivo de Invitaciones', p: 4 },
            { t: '5. Autogestión del Egresado (OTP)', p: 4 },
            { t: '6. Asignación de Butacas y Aforo', p: 5 },
            { t: '7. Alertas de Movilidad Reducida', p: 5 },
            { t: '8. Configuración de Cuentas de Portería', p: 6 },
            { t: '9. Protocolo de Acreditación QR', p: 7 },
            { t: '10. Acreditación de Emergencia (Manual)', p: 8 },
            { t: '11. Centro de Control y Backups', p: 9 },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => irAPagina(item.p)}
              className="w-full text-left flex justify-between items-center text-[10px] font-bold text-slate-600 hover:text-[#0056b3] p-1.5 rounded-lg hover:bg-slate-50 transition active:scale-98 border border-transparent hover:border-slate-100 cursor-pointer"
            >
              <span>{item.t}</span>
              <span className="font-mono text-[#0056b3]">Pág. {item.p}</span>
            </button>
          ))}
        </div>
      </div>
    ),

    // Página 2: Acceso y Ceremonia Activa
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Calendar size={16} className="text-[#0056b3]" /> 1. Operatoria de Inicio
        </h3>
        
        <div>
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider mb-1">Acceso Administrativo</h4>
          <p className="text-slate-500 m-0">
            Para entrar como gestor, hacé clic en el botón <strong>"Gestión"</strong> en la portada de la web o andá directo al endpoint <code>/admin</code>. Te logueás con tu correo institucional y contraseña.
          </p>
        </div>

        <div>
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider mb-1">La Ceremonia Activa (Clave para que no falle nada)</h4>
          <p className="text-slate-500 m-0">
            El sistema te deja cargar varias ceremonias, pero **solamente una ceremonia puede estar ACTIVA al mismo tiempo**.
          </p>
          <div className="bg-sky-50 border-l-4 border-[#0056b3] p-2 rounded-r-lg mt-2">
            <p className="m-0 text-[9.5px] text-sky-800 font-semibold leading-relaxed">
              <AlertTriangle size={14} className="text-[#0056b3] inline mr-1 align-middle shrink-0" /> <strong>¡Acordate!</strong> La reserva de butacas de los chicos y los escaneos en las entradas van a afectar exclusivamente a la ceremonia que tenga la estrella de **ACTIVA** en tu panel de ceremonias. Sincroniza al instante contra Neon PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 3: Panel Administrativo con captura real
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <GraduationCap size={16} className="text-[#0056b3]" /> 2. Panel Administrativo
        </h3>

        <ScreenPanelAdmin />

        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          El panel de administración es el corazón del sistema. Desde aquí se gestiona <strong>todo el ciclo de vida</strong> de la colación: el hábitat activo (ceremonia actual), métricas en vivo, acceso a cada módulo del sistema y configuración general.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-sky-50 border border-sky-100 rounded-lg p-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-sky-600 block mb-0.5">Métricas en tiempo real</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">Graduados, invitados totales, ingresados y porcentaje de ocupación del anfiteatro. Todo actualizado al instante.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 block mb-0.5">Consola de Control</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">Acceso rápido a Ingreso (QR), Graduados, Profesores, Plano, Seguridad y Ajustes del sistema.</p>
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Gestión de Graduados e Importación</span>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-7">
              <p className="text-slate-500 text-[9px] m-0 leading-relaxed">
                Desde <strong>Gestionar Graduados</strong>, podés dar de alta a mano o pulsar <strong>"Importar CSV/XLSX"</strong>. El sistema detecta automáticamente duplicados (mismo legajo + carrera + año) y provee un <strong>pipeline de estados</strong> (Invitación, Aceptación, Invitados y Entregadores) visible en tiempo real.
              </p>
            </div>
            <div className="col-span-5">
              <ScreenGestionGraduados />
            </div>
          </div>
        </div>
      </div>
    ),

    // Página 4: Correo de Invitación y Autogestión del Egresado
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Users size={16} className="text-[#0056b3]" /> 3. Invitación y Acceso del Egresado
        </h3>

        <div className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-7 space-y-1.5">
            <h4 className="font-black text-slate-700 uppercase text-[9px] tracking-wider m-0">El correo que recibe cada egresado</h4>
            <p className="text-slate-500 m-0 text-[9px] leading-relaxed">
              Al enviar las invitaciones desde el panel, cada egresado recibe automáticamente un email personalizado con su nombre, instrucciones claras y un botón de <strong>"Confirmar Asistencia"</strong> con su token único.
            </p>
            <div className="bg-sky-50 border-l-4 border-[#0056b3] p-1.5 rounded-r-lg">
              <p className="m-0 text-[8.5px] text-sky-800 leading-snug">
                <strong>El token</strong> está integrado en el enlace del botón y es intransferible. Identifica al egresado de forma única en el sistema.
              </p>
            </div>
          </div>
          <div className="col-span-5">
            <ScreenEmailInvitacion />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Login OTP del Egresado</span>
            <ScreenPortalOTP />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">El egresado ingresa su correo institucional para recibir el código de 6 dígitos.</p>
          </div>
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rechazo de Asistencia</span>
            <ScreenInasistencia />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">Si el egresado rechazó, el sistema queda anotado como "Inasistencia Confirmada" sin ocupar butacas.</p>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-lg">
          <h5 className="font-black text-amber-800 text-[9px] uppercase m-0">¿No le llega el mail?</h5>
          <p className="m-0 text-[8.5px] text-amber-700 leading-snug mt-0.5">
            Buscá al graduado en el listado → copiá su enlace de acceso directo (botón azul de la fila) → mandáselo por WhatsApp. Entrará sin necesidad del OTP.
          </p>
        </div>
      </div>
    ),

    // NUEVA Página 5: Portal de Autogestión del Egresado
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <GraduationCap size={16} className="text-[#0056b3]" /> 4. Portal de Autogestión
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Aceptación Inicial</span>
            <ScreenPantallaAceptacion />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">El egresado debe confirmar su participación obligatoriamente para continuar.</p>
          </div>
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Gestión de Acompañantes</span>
            <ScreenPanelAcompanantes />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">Puede agregar familiares respetando el aforo máximo asignado por la institución.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Entregadores de Título</span>
            <ScreenPanelEntregadores />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">El egresado selecciona quién le hará entrega del diploma en el escenario.</p>
          </div>
          <div>
            <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block mb-1">Credencial Digital</span>
            <ScreenCredencialDigital />
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">Al finalizar, obtiene un código QR como pase grupal para el día del evento.</p>
          </div>
        </div>
      </div>
    ),

    // Página 6: Plano del Anfiteatro & Movilidad
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <LayoutGrid size={16} className="text-[#0056b3]" /> 5. Anfiteatro y Aforo
        </h3>

        <WireframeEgresado />

        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          El <strong>mapa interactivo del anfiteatro</strong> permite a cada egresado elegir las butacas exactas para sus acompañantes de manera autónoma. Está construido sobre la planta real del ITB Beltrán.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Control de Aforo</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              El sistema cierra automáticamente la selección cuando se alcanza el límite de butacas configurado. Nadie puede exceder el aforo máximo establecido por la institución.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Estado en tiempo real</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              Butacas <span className="text-emerald-600 font-bold">verdes</span> = libres. <span className="text-rose-500 font-bold">Rojas</span> = ocupadas. El mapa se actualiza en tiempo real para todos los usuarios.
            </p>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-lg p-2 flex gap-2 items-start">
          <Accessibility size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-black text-sky-800 text-[9.5px] uppercase m-0">Movilidad Reducida</h5>
            <p className="m-0 text-slate-500 text-[9px] leading-relaxed mt-0.5">
              El egresado puede declarar si algún acompañante tiene movilidad reducida. Esas butacas quedan señalizadas con un ícono especial en el mapa del admin, facilitando la coordinación de rampas y asistencia el día del evento.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 7: Cuentas de Portería
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Shield size={16} className="text-[#0056b3]" /> 5. Cuentas de Portería
        </h3>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
              Antes de la ceremonia, cada operador de portería necesita tener su cuenta registrada con rol <code className="bg-slate-100 px-1 py-0.5 rounded">PORTERIA</code>. El proceso de configuración es instantáneo:
            </p>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1.5 text-[9.5px]">
              <li>Andá al módulo <strong>Personal de Seguridad</strong> en la consola de control.</li>
              <li>Registrá al portero con nombre y correo. El sistema genera su acceso automáticamente.</li>
              <li>Pulsá <strong>"Mostrar Acceso QR"</strong> en la fila del operador.</li>
              <li>El portero escanea el QR con su celular: se configura la conexión con la API del servidor y queda logueado al instante, sin necesidad de ingresar usuario ni contraseña.</li>
            </ol>
          </div>
          <div className="col-span-5 flex flex-col items-center gap-1">
            <WireframePorteria />
            <span className="text-[7.5px] text-slate-400 text-center">App de portería móvil</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex gap-1.5 items-start">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-emerald-800 m-0 leading-snug">
            <strong>Tip operativo:</strong> Podés tener varios porteros activos al mismo tiempo, cada uno con su propio celular y sesión. El sistema registra quién validó cada ingreso.
          </p>
        </div>
      </div>
    ),

    // Página 8: Protocolo de Escaneo QR
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <ScanLine size={16} className="text-[#0056b3]" /> 6. Acreditación por QR
        </h3>
        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          El día de la colación, el portero usa la cámara de su celular para escanear el código QR que presenta cada invitado (impreso o desde la pantalla del celular). La respuesta del sistema es inmediata:
        </p>

        <div className="space-y-1.5">
          <div className="border border-emerald-100 bg-emerald-50/50 p-2 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-emerald-700 text-[9px] uppercase">VERDE: Autorizado ✓</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">QR válido y de la ceremonia activa. El celular vibra y muestra la butaca asignada al invitado. Puede ingresar.</p>
            </div>
          </div>

          <div className="border border-amber-100 bg-amber-50/50 p-2 rounded-xl flex items-start gap-2">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-amber-700 text-[9px] uppercase">NARANJA: Duplicado ⚠</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">El código es válido pero este invitado ya ingresó previamente. Alerta de posible fraude o transferencia de credencial.</p>
            </div>
          </div>

          <div className="border border-rose-100 bg-rose-50/50 p-2 rounded-xl flex items-start gap-2">
            <XCircle className="text-rose-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-rose-700 text-[9px] uppercase">ROJO: Denegado ✗</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">Token inválido, egresado que confirmó inasistencia, o credencial de otra ceremonia. No autorizar el ingreso.</p>
            </div>
          </div>
        </div>
      </div>
    ),

    // Página 8: Acreditación de Emergencia
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <HelpCircle size={16} className="text-[#0056b3]" /> 7. Acreditaciones de Emergencia
        </h3>
        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          Ante imprevistos (credencial olvidada, celular sin batería, cámara con problemas), el sistema ofrece dos métodos de respaldo:
        </p>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
          <h4 className="font-black text-slate-700 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <Smartphone size={14} className="text-[#0056b3] shrink-0" /> Código Alfanumérico Manual
          </h4>
          <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
            Cada invitado tiene un <strong>código de 8 caracteres</strong> impreso en su correo de invitación. El portero puede tipear ese código directamente en la app sin necesidad de escanear. El sistema lo valida igual que un QR.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
          <h4 className="font-black text-slate-700 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <FileText size={14} className="text-[#0056b3] shrink-0" /> Listado en Papel (Plan de Contingencia)
          </h4>
          <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
            Antes de la ceremonia, exportá el listado completo de invitados desde el panel (formato PDF/Excel) e imprimilo. Si hay corte total de señal o red, el portero puede verificar a las personas contra la lista impresa y tildarlas manualmente.
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-2 rounded-r-lg">
          <p className="text-[8.5px] text-amber-800 m-0 leading-snug">
            <strong>Recomendación:</strong> Siempre tener 2-3 copias del listado impreso el día de la colación como respaldo operativo.
          </p>
        </div>
      </div>
    ),

    // Página 9: Soporte Técnico y Arquitectura
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Server size={16} className="text-[#0056b3]" /> 8. Soporte Técnico
        </h3>

        <DiagramaArquitectura />

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Backups y Exportación</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              La cuenta <code className="bg-white px-0.5 border border-slate-200 rounded text-[8px]">soporte@sigic.com.ar</code> puede descargar volcados completos de la base de datos en JSON desde el Centro de Control.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Reseteo anual</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              Al terminar el ciclo lectivo, ejecutá <strong>"Restablecer Base de Datos"</strong> para limpiar Neon Cloud y dejar el sistema listo para el nuevo año sin datos del ciclo anterior.
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2">
          <p className="text-[9px] text-rose-700 m-0 leading-snug font-semibold">
            ⚠️ El reseteo elimina TODOS los datos permanentemente. Siempre realizá un backup antes de ejecutarlo.
          </p>
        </div>
      </div>
    ),

    // Página 10: Contraportada
    (
      <div className="flex flex-col items-center justify-center text-center h-full space-y-4 select-none py-6">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
          <img src="/logo-oficial.png" alt="Logo" className="h-8 w-auto object-contain" />
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-base">SiGIC V2</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ecosistema Cloud Serverless</p>
        </div>
        <div className="h-[1.5px] w-20 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
        <p className="text-[9px] text-slate-400 leading-normal max-w-[200px] font-bold uppercase tracking-wider">
          Desarrollado para la gestión académica institucional del ITB.
        </p>
        <div className="flex items-center gap-1.5 text-[9.5px] text-sky-500 font-bold">
          <span>Hecho con</span> <Heart size={11} className="fill-sky-500 text-sky-500 animate-pulse" /> <span>por alumnos de PP</span>
        </div>
      </div>
    )
  ]

  // Controles de paso de página
  const paginaSiguiente = () => {
    if (esMovil) {
      if (paginaMovil < 10) cambiarPaginaMovil(paginaMovil + 1)
    } else {
      if (pliegoActual < 5) cambiarPliego(pliegoActual + 1)
    }
  }

  const paginaAnterior = () => {
    if (esMovil) {
      if (paginaMovil > 1) cambiarPaginaMovil(paginaMovil - 1)
      else cerrarLibro()
    } else {
      if (pliegoActual > 1) cambiarPliego(pliegoActual - 1)
      else cerrarLibro()
    }
  }

  // --- RENDERS CONDICIONALES ---

  // Renderiza la portada del libro cerrado
  const renderPortadaCerrada = () => (
    <div className="font-sans flex flex-col items-center justify-center py-6 animate-fade-in">
      {/* Contenedor 3D del Libro */}
      <div className="relative group w-[460px] h-[660px] select-none cursor-pointer perspective-1200" onClick={abrirLibro}>
        {/* Tapa del Libro con Portada Real */}
        <div 
          className="w-full h-full rounded-r-3xl shadow-[15px_15px_35px_rgba(15,23,42,0.12)] border-y border-r border-slate-200 bg-white overflow-hidden relative transition-all duration-500 transform origin-left-center rotate-y-hover"
          style={{
            borderLeft: '9px solid #0056b3'
          }}
        >
          {/* Lomo de la encuadernación */}
          <div className="absolute top-0 left-0 w-3 h-full bg-black/10 z-20" />
          
          {/* Imagen de Portada Real */}
          <img 
            src={rutaPortada}
            onError={() => {
              if (rutaPortada === '/manual/manual_portada.png') {
                setRutaPortada('/manual_portada.png')
              }
            }}
            alt="Guía de Uso Diario - SiGIC" 
            className="w-full h-full object-cover relative z-10 select-none pointer-events-none"
          />

          {/* Badge flotante animada */}
          <div className="absolute bottom-6 right-6 z-30 select-none pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/95 text-white text-[9px] font-black tracking-widest shadow-xl border border-white/10 animate-bounce">
              <BookOpen size={11} className="text-[#29ABE2]" /> ABRIR MANUAL
            </div>
          </div>
        </div>

        {/* Hojas interiores visibles por el lateral */}
        <div className="absolute top-1 right-[-4px] w-[5px] h-[652px] bg-slate-100 rounded-r shadow-inner z-[-1] transition-transform duration-500 group-hover:translate-x-[2px]" />
        <div className="absolute top-2 right-[-8px] w-[5px] h-[644px] bg-slate-200 rounded-r shadow-inner z-[-2] transition-transform duration-500 group-hover:translate-x-[4px]" />
      </div>

      {/* Botón salir alternativo debajo del libro */}
      <button 
        onClick={onVolver}
        className="mt-8 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
      >
        <ArrowLeft size={13} /> Volver al Portal
      </button>
    </div>
  )

  // Renderiza el libro abierto con controles de zoom y navegación
  const renderLibroAbierto = () => (
    <div className="w-full min-h-[calc(100vh-73px)] flex flex-col items-center justify-start select-none relative bg-paper animate-fade-in">
      
      {/* FLOATING CONTROLS PANEL (OVERLAID ON THE BACKGROUND, NO VERTICAL LAYOUT IMPACT) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left side: Back to Cover and page indicator */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-md">
          <button 
            onClick={cerrarLibro}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100/50 hover:bg-[#29ABE2] hover:text-white text-slate-700 text-[9px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer border border-slate-200/40"
          >
            <Book size={12} /> Tapa
          </button>
        </div>

        {/* Right side: Zoom and Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-md">
          <button
            onClick={disminuirZoom}
            disabled={nivelZoom <= 1.0}
            className="p-1.5 rounded-lg bg-slate-100/50 hover:bg-slate-200/70 text-slate-700 disabled:opacity-35 cursor-pointer border border-slate-200/40"
            title="Reducir Zoom"
          >
            <ZoomOut size={12} />
          </button>
          <span className="text-[9px] font-bold text-slate-700 font-mono w-8 text-center select-none">
            {Math.round(nivelZoom * 100)}%
          </span>
          <button
            onClick={aumentarZoom}
            disabled={nivelZoom >= 1.4}
            className="p-1.5 rounded-lg bg-slate-100/50 hover:bg-slate-200/70 text-slate-700 disabled:opacity-35 cursor-pointer border border-slate-200/40"
            title="Aumentar Zoom"
          >
            <ZoomIn size={12} />
          </button>
          
          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          <button
            onClick={alternarPantallaCompleta}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100/50 hover:bg-[#29ABE2] hover:text-white text-slate-700 text-[9px] font-black uppercase tracking-widest cursor-pointer transition active:scale-95 border border-slate-200/40"
          >
            {esPantallaCompleta ? <Minimize2 size={12} className="text-[#29ABE2]" /> : <Maximize2 size={12} />}
            <span className="hidden sm:inline">{esPantallaCompleta ? "Salir" : "Pantalla"}</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR SCROLLABLE DEL LIBRO ABIERTO */}
      <div 
        className="w-full overflow-auto pt-16 pb-16 px-4 flex justify-start items-start scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        style={{ 
          maxHeight: esPantallaCompleta ? '95vh' : 'calc(100vh - 73px)',
          width: '100%'
        }}
      >
        {/* WRAPPER FÍSICO CON TAMAÑO ESCALADO REAL */}
        <div
          className="w-full transition-all duration-300 flex items-start justify-center"
          style={{
            width: `${100 * nivelZoom}%`,
            height: esMovil ? 'auto' : `calc((100vh - 100px) * ${nivelZoom})`,
            position: 'relative',
          }}
        >
          {/* CUERPO DEL LIBRO CON SCALE DINÁMICO */}
          <div 
            className={`w-full bg-[#fdfdfb] relative overflow-hidden transition-all duration-300 ${
              estaAnimando ? 'opacity-80 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-none'
            }`}
            style={{
              transform: `scale(${nivelZoom})`,
              transformOrigin: 'top left',
              width: `calc(100% / ${nivelZoom})`,
              height: esMovil ? 'auto' : '100%',
              minHeight: esMovil ? 'auto' : 'calc(100vh - 100px)',
              position: esMovil ? 'relative' : 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <div className="relative min-h-[calc(100vh-100px)] flex flex-col lg:flex-row">
              
              {/* Lomo y Sombra Central (Solo en Desktop) */}
              {!esMovil && (
                <>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-x border-slate-200/40 z-30 pointer-events-none" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-r from-black/0 via-black/5 to-black/0 z-20 pointer-events-none" />
                </>
              )}

              {/* MÓVIL: MUESTRA UNA SOLA PÁGINA */}
              {esMovil ? (
                <div className="w-full bg-paper p-6 sm:p-8 flex flex-col justify-between min-h-[calc(100vh-100px)]">
                  <div className="flex-1">
                    {listaPaginas[paginaMovil]}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                    <span>SiGIC Manual</span>
                    <span>Pág. {paginaMovil} / 10</span>
                  </div>
                </div>
              ) : (
                // DESKTOP: DOS PÁGINAS (IZQUIERDA Y DERECHA)
                <>
                  <div className="w-1/2 bg-paper p-8 flex flex-col justify-between border-r border-slate-150 relative page-shadow-left">
                    <div className="flex-1">
                      {listaPaginas[(pliegoActual - 1) * 2 + 1]}
                    </div>
                    <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                      <span>SiGIC Manual</span>
                      <span>Pág. {(pliegoActual - 1) * 2 + 1}</span>
                    </div>
                  </div>

                  <div className="w-1/2 bg-paper p-8 flex flex-col justify-between relative page-shadow-right">
                    <div className="flex-1">
                      {listaPaginas[(pliegoActual - 1) * 2 + 2]}
                    </div>
                    <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                      <span>Manual Oficial</span>
                      <span>Pág. {(pliegoActual - 1) * 2 + 2}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING PAGE NAVIGATION PILL */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-lg select-none pointer-events-auto">
        <button 
          onClick={paginaAnterior}
          disabled={esMovil ? paginaMovil === 1 : pliegoActual === 1}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100/50 hover:bg-[#29ABE2] hover:text-white border border-slate-200/40 text-slate-700 transition active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-100/50 disabled:hover:text-slate-700 cursor-pointer"
          title="Página Anterior"
        >
          <ArrowLeft size={14} />
        </button>

        <span className="text-[10px] font-bold text-slate-600 font-mono tracking-wide min-w-[50px] text-center">
          {esMovil ? `${paginaMovil} / 10` : `${pliegoActual} / 5`}
        </span>

        <button 
          onClick={paginaSiguiente}
          disabled={esMovil ? paginaMovil === 10 : pliegoActual === 5}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100/50 hover:bg-[#29ABE2] hover:text-white border border-slate-200/40 text-slate-700 transition active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-100/50 disabled:hover:text-slate-700 cursor-pointer"
          title="Página Siguiente"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )

  // RENDER ABIERTO / CERRADO CON O SIN HEADER
  if (sinHeader) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        {!estaAbierto ? renderPortadaCerrada() : renderLibroAbierto()}
        <style>{`
          .perspective-1200 {
            perspective: 1200px;
          }
          .origin-left-center {
            transform-origin: left center;
          }
          .rotate-y-hover {
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s;
          }
          .rotate-y-hover:hover {
            transform: rotateY(-22deg);
          }
          .page-shadow-left {
            box-shadow: inset -15px 0 20px rgba(0, 0, 0, 0.02);
          }
          .page-shadow-right {
            box-shadow: inset 15px 0 20px rgba(0, 0, 0, 0.02);
          }
          .bg-paper {
            background-color: #fdfdfb;
            background-image: radial-gradient(rgba(0,0,0,0.015) 1px, transparent 0);
            background-size: 8px 8px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-slate-700 flex flex-col animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Orbes de fondo */}
      <div className="orbe orbe-1"></div>
      <div className="orbe orbe-2"></div>
      <div className="orbe orbe-3"></div>

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-50 z-20" />

      {/* Rejilla decorativa */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Cabecera superior */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/75 backdrop-blur-md px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-[#29ABE2] hover:text-white hover:border-[#29ABE2] hover:scale-105 active:scale-95 cursor-pointer"
            title="Volver al Portal"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
              SiGIC <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#29ABE2]/10 text-[#0056b3] border border-[#29ABE2]/25">Manual Oficial</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Libro Digital e Interactivo</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
          <span>v2.1.0</span>
          <span className="h-4 w-px bg-slate-200" style={{ backgroundColor: '#e2e8f0' }} />
          <span>Instituto Tecnológico Beltrán</span>
        </div>
      </header>

      {/* Área del Libro */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        {!estaAbierto ? renderPortadaCerrada() : renderLibroAbierto()}
      </div>

      {/* Estilos */}
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
          background: rgba(14, 165, 233, 0.06);
          top: -150px; left: -100px;
          animation: orbitar1 15s ease-in-out infinite;
        }
        .orbe-2 {
          width: 350px; height: 350px;
          background: rgba(99, 102, 241, 0.05);
          bottom: -80px; right: -50px;
          animation: orbitar2 18s ease-in-out infinite;
        }
        .orbe-3 {
          width: 250px; height: 250px;
          background: rgba(236, 72, 153, 0.03);
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
        .animate-fade-in {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Estilos de Libro 3D */
        .perspective-1200 {
          perspective: 1200px;
        }
        .origin-left-center {
          transform-origin: left center;
        }
        .rotate-y-hover {
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s;
        }
        .rotate-y-hover:hover {
          transform: rotateY(-22deg);
        }
        .page-shadow-left {
          box-shadow: inset -15px 0 20px rgba(0, 0, 0, 0.02);
        }
        .page-shadow-right {
          box-shadow: inset 15px 0 20px rgba(0, 0, 0, 0.02);
        }
        .bg-paper {
          background-color: #fdfdfb;
          background-image: radial-gradient(rgba(0,0,0,0.015) 1px, transparent 0);
          background-size: 8px 8px;
        }
      `}</style>
    </main>
  )
}
