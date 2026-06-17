import { useState, useEffect } from 'react'
import { 
  ArrowLeft, ArrowRight, BookOpen, Book, Users, GraduationCap, 
  ScanLine, HelpCircle, Calendar, Shield, Server, LayoutGrid, 
  CheckCircle2, AlertTriangle, XCircle, List, Heart, Map,
  ZoomIn, ZoomOut, Maximize2, Minimize2
} from 'lucide-react'

// ==========================================
// WIREFRAME 1: ADMINISTRADOR (REAL MOCKUP IMAGE)
// ==========================================
function WireframeAdmin() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-55 relative group select-none">
      <img 
        src="/manual/admin_wireframe.png" 
        alt="Dashboard de Administración" 
        className="w-full max-h-[120px] object-cover hover:scale-[1.02] transition-transform duration-300 relative z-10 mx-auto"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">Vista Real: Panel de Administración Web</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 2: SELECCION DE ASIENTOS (REAL MOCKUP IMAGE)
// ==========================================
function WireframeEgresado() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-55 relative group select-none">
      <img 
        src="/manual/egresado_wireframe.png" 
        alt="Portal del Graduado" 
        className="w-full max-h-[120px] object-cover hover:scale-[1.02] transition-transform duration-300 relative z-10 mx-auto"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">Vista Real: Mapa de Selección de Butacas</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 3: PORTERIA SCANNER MOVIL (REAL MOCKUP IMAGE)
// ==========================================
function WireframePorteria() {
  return (
    <div className="w-[85px] mx-auto overflow-hidden rounded-[14px] border-2 border-slate-700 shadow-md bg-slate-55 relative select-none">
      <img 
        src="/manual/porteria_wireframe.png" 
        alt="Escáner QR Móvil" 
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
      />
    </div>
  )
}

// ==========================================
// WIREFRAME 4: DIAGRAMA DE RED Y CONECTIVIDAD
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
              ⚠️ <strong>¡Acordate!</strong> La reserva de butacas de los chicos y los escaneos en las entradas van a afectar exclusivamente a la ceremonia que tenga la estrella de **ACTIVA** en tu panel de ceremonias. Sincroniza al instante contra Neon PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 3: Carga de Graduados (Excel) + Wireframe
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <GraduationCap size={16} className="text-[#0056b3]" /> 2. Carga de Graduados
        </h3>
        <p className="text-slate-500 m-0">
          Para que los egresados puedan elegir sus butacas, tenés que subir el padrón en <strong>Gestionar Graduados</strong>. Tocá en <strong>Cargar desde Excel</strong>, arrastrá la planilla y confirmá:
        </p>

        <WireframeAdmin />

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-105 space-y-0.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Formato Obligatorio del Excel</span>
          <p className="text-slate-500 text-[9px] m-0">
            Armá la planilla <code>.xlsx</code> con estas columnas: <strong>nombre</strong> (Pérez, Juan), <strong>dni</strong> (plano, sin puntos), <strong>correo</strong> (email para mandarle la invitación) y <strong>carrera</strong>.
          </p>
        </div>
      </div>
    ),

    // Página 4: Invitaciones y Autogestión
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Users size={16} className="text-[#0056b3]" /> 3. Envío y Autogestión
        </h3>
        
        <div>
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider mb-1">Despacho de Correos</h4>
          <p className="text-slate-500 m-0">
            Apretá en <strong>"Enviar Invitaciones por Correo"</strong> para mandarles a todos los egresados el mail automático con su token individual encriptado.
          </p>
        </div>

        <div>
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider mb-1">Acceso OTP Egresado (Super Seguro)</h4>
          <p className="text-slate-500 m-0">
            El egresado pone su DNI en el portal público y el servidor le manda un código OTP temporal de 6 dígitos al mail. Lo escribe en pantalla y ¡listo! Entra al toque sin recordar contraseñas.
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-lg mt-1">
          <h5 className="font-black text-amber-800 text-[9px] uppercase m-0">¿No le llega el mail con el código?</h5>
          <p className="m-0 text-[9px] text-amber-700 leading-snug mt-0.5">
            Buscá al graduado en el listado de administración, clickeá el botón azul de su fila para copiar su enlace de acceso directo y mandáselo por WhatsApp. Con eso entra directo saltando el OTP.
          </p>
        </div>
      </div>
    ),

    // Página 5: Plano del Anfiteatro & Movilidad + Wireframe
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <LayoutGrid size={16} className="text-[#0056b3]" /> 4. Anfiteatro & Aforo
        </h3>

        <WireframeEgresado />

        <div className="bg-sky-50 border border-sky-100 rounded-lg p-2 flex gap-2 items-start">
          <span className="text-sky-500 shrink-0 font-bold">♿</span>
          <div>
            <h5 className="font-black text-sky-800 text-[9.5px] uppercase m-0">Movilidad Reducida</h5>
            <p className="m-0 text-slate-500 text-[9px] leading-relaxed mt-0.5">
              Si el egresado declara acompañantes con movilidad reducida, su butaca se va a pintar en el plano con el símbolo de silla de ruedas. Sirve un montón para prever rampas y ubicar a su gente.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 6: Cuentas de Portería (Códigos QR) + Wireframe
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Shield size={16} className="text-[#0056b3]" /> 5. Cuentas de Portería
        </h3>
        
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-505 m-0">
              Para habilitar a la gente de seguridad el día de la colación, armales una cuenta rápido:
            </p>
            <ol className="list-decimal pl-4 text-slate-505 space-y-1 text-[9.5px]">
              <li>Andá a <strong>Seguridad</strong> y registralos con el rol <code>PORTERIA</code>.</li>
              <li>Apretá en <strong>"Mostrar Acceso QR"</strong> de su fila.</li>
              <li>El portero escanea ese QR con el celu: esto configura la API de tu server y le inicia sesión al instante sin poner claves.</li>
            </ol>
          </div>
          <div className="col-span-5 flex justify-center">
            <WireframePorteria />
          </div>
        </div>
      </div>
    ),

    // Página 7: Protocolo de Escaneo QR
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <ScanLine size={16} className="text-[#0056b3]" /> 6. Acreditación QR
        </h3>
        <p className="text-slate-500 m-0">
          El portero escanea las credenciales en la entrada usando la app. La pantalla va a cambiar según tres estados:
        </p>

        <div className="space-y-1.5">
          <div className="border border-emerald-100 bg-emerald-50/50 p-2 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-emerald-700 text-[9px] uppercase">VERDE: Autorizado</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">El QR es válido y de la ceremonia activa. Vibra, suena y te dice la butaca asignada.</p>
            </div>
          </div>

          <div className="border border-amber-100 bg-amber-50/50 p-2 rounded-xl flex items-start gap-2">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-amber-700 text-[9px] uppercase">NARANJA: Duplicado</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">El código es válido pero la persona **ya ingresó**. Sirve para evitar fraudes en la puerta.</p>
            </div>
          </div>

          <div className="border border-rose-100 bg-rose-50/50 p-2 rounded-xl flex items-start gap-2">
            <XCircle className="text-rose-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-rose-700 text-[9px] uppercase">ROJO: Denegado</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">Token inválido, egresado inasistente o de otra ceremonia. Se le deniega el ingreso físico.</p>
            </div>
          </div>
        </div>
      </div>
    ),

    // Página 8: Acreditación de Emergencia (Alfanumérico / Manual)
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <HelpCircle size={16} className="text-[#0056b3]" /> 7. Acreditaciones Manuales
        </h3>
        <p className="text-slate-500 m-0">
          Si el egresado o invitado perdió la credencial impresa, se quedó sin batería o le anda mal la cámara al escáner, tenés dos métodos de respaldo rápido:
        </p>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <span className="text-sky-500">📱</span> Acreditación con Celular
          </h4>
          <p className="text-slate-500 m-0 text-[9.5px]">
            El portero puede escribir a mano el <strong>código alfanumérico único</strong> del invitado (código de 8 dígitos que figura en su correo) directamente en la app del celu de portería.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
          <h4 className="font-black text-slate-755 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <span className="text-sky-500">📝</span> Soporte Papel (Plan de Contingencia)
          </h4>
          <p className="text-slate-505 m-0 text-[9.5px]">
            Si no hay nada de señal o red en la entrada, buscá a la persona en el <strong>listado impreso en soporte papel</strong> de tu mesa de control, corroborá su código alfanumérico y tildale el ingreso físico a mano.
          </p>
        </div>
      </div>
    ),

    // Página 9: Soporte Técnico + Diagrama
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Server size={16} className="text-[#0056b3]" /> 8. Soporte Técnico
        </h3>
        
        <DiagramaArquitectura />

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <p className="text-slate-550 text-[9px] m-0 leading-tight">
            La cuenta master <code>soporte@sigic.com.ar</code> tiene acceso al **Centro de Control** integrado en la web. Permite bajarte volcados (Backups) en JSON y ejecutar el **Restablecer Base de Datos** para vaciar por completo Neon Cloud para el próximo año.
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
      <div className="relative group w-[320px] h-[460px] select-none cursor-pointer perspective-1200" onClick={abrirLibro}>
        {/* Tapa del Libro con Portada Real */}
        <div 
          className="w-full h-full rounded-r-3xl shadow-[20px_20px_45px_rgba(15,23,42,0.4)] border-y border-r border-slate-200 bg-white overflow-hidden relative transition-all duration-500 transform origin-left-center rotate-y-hover"
          style={{
            borderLeft: '9px solid #0056b3'
          }}
        >
          {/* Lomo de la encuadernación */}
          <div className="absolute top-0 left-0 w-3 h-full bg-black/10 z-20" />
          
          {/* Imagen de Portada Real */}
          <img 
            src="/manual/manual_portada.png" 
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
        <div className="absolute top-1 right-[-4px] w-[5px] h-[452px] bg-slate-100 rounded-r shadow-inner z-[-1] transition-transform duration-500 group-hover:translate-x-[2px]" />
        <div className="absolute top-2 right-[-8px] w-[5px] h-[444px] bg-slate-200 rounded-r shadow-inner z-[-2] transition-transform duration-500 group-hover:translate-x-[4px]" />
      </div>

      {/* Botón salir alternativo debajo del libro */}
      <button 
        onClick={onVolver}
        className="mt-8 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
      >
        <ArrowLeft size={13} /> Volver al Portal
      </button>
    </div>
  )

  // Renderiza el libro abierto con controles de zoom y navegación
  const renderLibroAbierto = () => (
    <div className="w-full max-w-7xl flex flex-col items-center animate-fade-in select-none">
      
      {/* Controles de Cabecera del Libro (Navegación secundaria, Zoom y Pantalla Completa) */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 px-2 select-none">
        
        {/* Lado izquierdo: Botón cerrar e indicador de página */}
        <div className="flex items-center gap-4">
          <button 
            onClick={cerrarLibro}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Book size={13} /> Cerrar Libro (Portada)
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
            {esMovil ? `Página ${paginaMovil} / 10` : `Hojas ${pliegoActual * 2 - 1}-${pliegoActual * 2} / 10`}
          </span>
        </div>

        {/* Lado derecho: Zoom y Pantalla Completa */}
        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <button
            onClick={disminuirZoom}
            disabled={nivelZoom <= 1.0}
            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-35 cursor-pointer"
            title="Reducir Zoom"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-bold text-slate-300 font-mono w-10 text-center select-none">
            {Math.round(nivelZoom * 100)}%
          </span>
          {/* Zoom In */}
          <button
            onClick={aumentarZoom}
            disabled={nivelZoom >= 1.4}
            className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-35 cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn size={14} />
          </button>
          
          {/* Separador */}
          <span className="h-5 w-px bg-white/15 mx-1" />

          {/* Pantalla Completa */}
          <button
            onClick={alternarPantallaCompleta}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition active:scale-95"
            title={esPantallaCompleta ? "Salir de Pantalla Completa" : "Pantalla Completa"}
          >
            {esPantallaCompleta ? (
              <>
                <Minimize2 size={13} className="text-[#29ABE2]" />
                <span className="hidden md:inline">Salir Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} />
                <span className="hidden md:inline">Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CONTENEDOR SCROLLABLE DEL LIBRO ABIERTO */}
      <div 
        className="w-full overflow-auto p-4 flex justify-center items-start scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
        style={{ 
          maxHeight: esPantallaCompleta ? '90vh' : '75vh',
          width: '100%'
        }}
      >
        {/* CUERPO DEL LIBRO CON SCALE DINÁMICO */}
        <div 
          className={`bg-white border border-slate-200/50 rounded-[24px] shadow-2xl relative overflow-hidden transition-all duration-300 ${
            estaAnimando ? 'opacity-80 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-none'
          }`}
          style={{
            transform: `scale(${nivelZoom})`,
            transformOrigin: 'top center',
            width: '1050px',
            minWidth: esMovil ? '100%' : '900px',
            minHeight: '520px',
            marginTop: nivelZoom > 1 ? `${(nivelZoom - 1) * 260}px` : '0px',
            marginBottom: nivelZoom > 1 ? `${(nivelZoom - 1) * 260}px` : '0px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)'
          }}
        >
          <div className="relative min-h-[520px] flex flex-col lg:flex-row">
            
            {/* Lomo y Sombra Central (Solo en Desktop) */}
            {!esMovil && (
              <>
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-full bg-gradient-to-r from-slate-200 via-slate-350 to-slate-200 border-x border-slate-300/40 z-30 pointer-events-none" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-r from-black/0 via-black/5 to-black/0 z-20 pointer-events-none" />
                <div className="absolute left-[calc(50%-24px)] w-6 h-full bg-gradient-to-r from-black/0 to-black/4 z-20 pointer-events-none" />
                <div className="absolute left-1/2 w-6 h-full bg-gradient-to-r from-black/4 to-black/0 z-20 pointer-events-none" />
              </>
            )}

            {/* MÓVIL: MUESTRA UNA SOLA PÁGINA */}
            {esMovil ? (
              <div className="w-full bg-paper p-6 sm:p-8 flex flex-col justify-between min-h-[520px]">
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
                {/* PÁGINA IZQUIERDA */}
                <div className="w-1/2 bg-paper p-8 flex flex-col justify-between border-r border-slate-150 relative page-shadow-left">
                  <div className="flex-1">
                    {listaPaginas[(pliegoActual - 1) * 2 + 1]}
                  </div>
                  <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                    <span>SiGIC Manual</span>
                    <span>Pág. {(pliegoActual - 1) * 2 + 1}</span>
                  </div>
                </div>

                {/* PÁGINA DERECHA */}
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

      {/* BOTONES FLOTANTES DE NAVEGACIÓN */}
      <div className="flex items-center gap-6 mt-4 select-none">
        <button 
          onClick={paginaAnterior}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30"
          title="Página Anterior"
        >
          <ArrowLeft size={16} />
        </button>

        <span className="text-xs font-bold text-slate-400 tracking-wide font-mono">
          {esMovil ? `${paginaMovil} / 10` : `${pliegoActual} / 5`}
        </span>

        <button 
          onClick={paginaSiguiente}
          disabled={esMovil ? paginaMovil === 10 : pliegoActual === 5}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30"
          title="Página Siguiente"
        >
          <ArrowRight size={16} />
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
      <header className="relative z-10 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-[#29ABE2] hover:text-white hover:border-[#29ABE2] hover:scale-105 active:scale-95 cursor-pointer"
            title="Volver al Portal"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              SiGIC <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#29ABE2]/20 text-[#29ABE2] border border-[#29ABE2]/30">Manual Oficial</span>
            </h1>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Libro Digital e Interactivo</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-white/60">
          <span>v2.1.0</span>
          <span className="h-4 w-px bg-white/10" />
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
