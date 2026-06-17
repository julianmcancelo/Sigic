import { useState, useEffect } from 'react'
import { 
  ArrowLeft, ArrowRight, BookOpen, Book, Users, GraduationCap, 
  ScanLine, HelpCircle, Calendar, Shield, Server, LayoutGrid, 
  CheckCircle2, AlertTriangle, XCircle, Award, List, Heart, Map
} from 'lucide-react'

// ==========================================
// WIREFRAME 1: ADMINISTRADOR (REAL MOCKUP IMAGE)
// ==========================================
function WireframeAdmin() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-50 relative group select-none">
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
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-50 relative group select-none">
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
    <div className="w-[85px] mx-auto overflow-hidden rounded-[14px] border-2 border-slate-700 shadow-md bg-slate-50 relative select-none">
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
export function ManualUsuarioWeb({ onVolver }) {
  const [isOpen, setIsOpen] = useState(false)
  const [spread, setSpread] = useState(0) // 0 a 5 en Desktop
  const [mobilePage, setMobilePage] = useState(0) // 0 a 10 en Mobile
  const [isMobile, setIsMobile] = useState(false)
  const [animando, setAnimando] = useState(false)

  // Detectar responsividad
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  // Disparar animación temporal al pasar páginas
  const cambiarSpread = (nuevoSpread) => {
    if (animando) return
    setAnimando(true)
    setSpread(nuevoSpread)
    setTimeout(() => setAnimando(false), 400)
  }

  const cambiarPaginaMobile = (nuevaPagina) => {
    if (animando) return
    setAnimando(true)
    setMobilePage(nuevaPagina)
    setTimeout(() => setAnimando(false), 400)
  }

  const handleOpenBook = () => {
    setAnimando(true)
    setIsOpen(true)
    setSpread(1)
    setMobilePage(1)
    setTimeout(() => setAnimando(false), 500)
  }

  const handleCloseBook = () => {
    setAnimando(true)
    setIsOpen(false)
    setSpread(0)
    setMobilePage(0)
    setTimeout(() => setAnimando(false), 500)
  }

  // Saltar a sección desde el índice
  const saltarSeccion = (numPagina) => {
    if (isMobile) {
      cambiarPaginaMobile(numPagina)
    } else {
      const nuevoSpread = Math.ceil(numPagina / 2)
      cambiarSpread(nuevoSpread)
    }
  }

  // Páginas del manual
  const paginas = [
    // Página 0: Portada (no se renderiza en las páginas interiores)
    null,

    // Página 1: Índice
    (
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <List size={16} className="text-sky-500" /> Índice General
        </h3>
        <p className="text-[10px] text-slate-500 italic">
          Haz clic en cualquier sección para saltar directamente a la página:
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
              onClick={() => saltarSeccion(item.p)}
              className="w-full text-left flex justify-between items-center text-[10px] font-bold text-slate-600 hover:text-sky-600 p-1.5 rounded-lg hover:bg-slate-55 transition active:scale-98 border border-transparent hover:border-slate-100 cursor-pointer"
            >
              <span>{item.t}</span>
              <span className="font-mono text-sky-500">Pág. {item.p}</span>
            </button>
          ))}
        </div>
      </div>
    ),

    // Página 2: Acceso y Ceremonia Activa
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Calendar size={16} className="text-sky-500" /> 1. Operatoria de Inicio
        </h3>
        
        <div>
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider mb-1">Acceso Administrativo</h4>
          <p className="text-slate-500 m-0">
            Para iniciar sesión como gestor, presione el botón <strong>"Gestión"</strong> en la portada web o ingrese a la ruta asignada en su servidor (e.g. <code>/admin</code>).
          </p>
        </div>

        <div>
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider mb-1">La Ceremonia Activa (Paso Crítico)</h4>
          <p className="text-slate-500 m-0">
            SiGIC permite registrar múltiples ceremonias, pero <strong>solo una ceremonia puede estar activa a la vez</strong>.
          </p>
          <div className="bg-sky-50 border-l-4 border-sky-500 p-2 rounded-r-lg mt-2">
            <p className="m-0 text-[9.5px] text-sky-700 font-semibold leading-relaxed">
              Toda reserva de butacas y los ingresos en portería móvil afectarán exclusivamente a la ceremonia que tenga la estrella de <strong>ACTIVA</strong> en la pestaña de ceremonias.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 3: Carga de Graduados (Excel) + Wireframe
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <GraduationCap size={16} className="text-sky-500" /> 2. Carga de Graduados
        </h3>
        <p className="text-slate-500 m-0">
          Para que los alumnos puedan autogestionarse, se debe importar el padrón de la colación activa en <strong>Gestionar Graduados</strong>:
        </p>

        <WireframeAdmin />

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Estructura Excel Requerida</span>
          <p className="text-slate-500 text-[9px] m-0">
            Debe contener columnas: <strong>nombre</strong> (Pérez, Juan), <strong>dni</strong> (plano sin puntos), <strong>correo</strong>, y <strong>carrera</strong>.
          </p>
        </div>
      </div>
    ),

    // Página 4: Invitaciones y Autogestión
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Users size={16} className="text-sky-500" /> 3. Envío y Autogestión
        </h3>
        
        <div>
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider mb-1">Despacho de Correos</h4>
          <p className="text-slate-500 m-0">
            Haga clic en <strong>"Enviar Invitaciones por Correo"</strong> para despachar las notificaciones con los enlaces encriptados individuales.
          </p>
        </div>

        <div>
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider mb-1">Acceso OTP Egresado</h4>
          <p className="text-slate-500 m-0">
            El graduado ingresa con su DNI y recibe una contraseña temporal (código OTP de 6 dígitos) en su casilla que valida su sesión de forma segura.
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-lg mt-1">
          <h5 className="font-black text-amber-800 text-[9px] uppercase m-0">¿Invitación no recibida?</h5>
          <p className="m-0 text-[9px] text-amber-700 leading-snug mt-0.5">
            En Gestión de Graduados, haga clic en el botón azul de su fila para copiar y enviarle el enlace directo por WhatsApp, saltando el OTP.
          </p>
        </div>
      </div>
    ),

    // Página 5: Plano del Anfiteatro & Movilidad + Wireframe
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <LayoutGrid size={16} className="text-sky-500" /> 4. Anfiteatro & Aforo
        </h3>

        <WireframeEgresado />

        <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5 flex gap-2.5 items-start">
          <span className="text-sky-500 shrink-0 font-bold">♿</span>
          <div>
            <h5 className="font-black text-sky-800 text-[9.5px] uppercase m-0">Movilidad Reducida</h5>
            <p className="m-0 text-slate-500 text-[9.5px] leading-relaxed mt-0.5">
              Si el alumno declara acompañantes con movilidad reducida, su butaca aparecerá en el plano con el símbolo de silla de ruedas para coordinar asistencia.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 6: Cuentas de Portería (Códigos QR) + Wireframe
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Shield size={16} className="text-sky-500" /> 5. Cuentas de Portería
        </h3>
        
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-500 m-0">
              Habilite el escáner del personal el día del evento creando una cuenta:
            </p>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1 text-[9.5px]">
              <li>Vaya a <strong>Seguridad</strong> y pulse "Registrar Personal" con rol <code>PORTERIA</code>.</li>
              <li>En la fila del portero, haga clic en <strong>"Mostrar Acceso QR"</strong>.</li>
              <li>El portero escaneará el código para configurar su app e iniciar sesión automáticamente.</li>
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
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <ScanLine size={16} className="text-sky-500" /> 6. Acreditación QR
        </h3>
        <p className="text-slate-500 m-0">
          El portero escanea las credenciales en la entrada. El sistema devuelve tres estados posibles:
        </p>

        <div className="space-y-1.5">
          <div className="border border-emerald-100 bg-emerald-50/50 p-2 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-emerald-700 text-[9px] uppercase">VERDE (Autorizado)</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">QR legítimo. Vibra, suena y despliega el número de butaca del invitado.</p>
            </div>
          </div>

          <div className="border border-amber-100 bg-amber-50/50 p-2 rounded-xl flex items-start gap-2">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-amber-700 text-[9px] uppercase">NARANJA (Duplicado)</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">QR escaneado previamente. Alerta al staff para prevenir fraudes.</p>
            </div>
          </div>

          <div className="border border-rose-100 bg-rose-50/50 p-2 rounded-xl flex items-start gap-2">
            <XCircle className="text-rose-500 shrink-0 mt-0.5" size={13} />
            <div>
              <h5 className="font-bold text-rose-700 text-[9px] uppercase">ROJO (Denegado)</h5>
              <p className="text-slate-500 text-[9px] m-0 leading-snug">QR inválido o de otra ceremonia. Se deniega el ingreso físico.</p>
            </div>
          </div>
        </div>
      </div>
    ),

    // Página 8: Acreditación de Emergencia (Alfanumérico / Manual)
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <HelpCircle size={16} className="text-sky-500" /> 7. Acreditaciones Manuales
        </h3>
        <p className="text-slate-500 m-0">
          Si el egresado o invitado pierde su credencial física, no tiene batería o la cámara falla, existen dos vías de respaldo:
        </p>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <span className="text-sky-500">📱</span> Acreditación con Celular
          </h4>
          <p className="text-slate-500 m-0 text-[9.5px]">
            El portero puede teclear el <strong>código alfanumérico único</strong> del invitado (8 caracteres impreso en el correo o credencial) directamente en la aplicación móvil de portería.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
          <h4 className="font-black text-slate-750 uppercase text-[9.5px] tracking-wider m-0 flex items-center gap-1.5">
            <span className="text-sky-500">📝</span> Soporte Papel
          </h4>
          <p className="text-slate-500 m-0 text-[9.5px]">
            Si falla la conexión de red en las puertas, puede buscar al invitado en el <strong>listado impreso en soporte papel</strong>, verificar su código alfanumérico y tildar su ingreso físico en la planilla.
          </p>
        </div>
      </div>
    ),

    // Página 9: Soporte Técnico + Diagrama
    (
      <div className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Server size={16} className="text-sky-500" /> 8. Soporte Técnico
        </h3>
        
        <DiagramaArquitectura />

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          <p className="text-slate-550 text-[9px] m-0 leading-tight">
            La cuenta <code>soporte@sigic.com.ar</code> tiene acceso al **Centro de Control** para descargar backups en JSON y realizar el **Formatear y Resetear** de tablas en la base de datos Neon.
          </p>
        </div>
      </div>
    ),

    // Página 10: Contraportada
    (
      <div className="flex flex-col items-center justify-center text-center h-full space-y-5 select-none py-6">
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
  const nextPage = () => {
    if (isMobile) {
      if (mobilePage < 10) cambiarPaginaMobile(mobilePage + 1)
    } else {
      if (spread < 5) cambiarSpread(spread + 1)
    }
  }

  const prevPage = () => {
    if (isMobile) {
      if (mobilePage > 1) cambiarPaginaMobile(mobilePage - 1)
      else handleCloseBook()
    } else {
      if (spread > 1) cambiarSpread(spread - 1)
      else handleCloseBook()
    }
  }

  if (sinHeader) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        {!isOpen ? (
          <div className="font-sans flex flex-col items-center justify-center py-6 animate-fade-in">
            {/* Contenedor 3D del Libro */}
            <div className="relative group w-72 h-[410px] select-none cursor-pointer perspective-1200" onClick={handleOpenBook}>
              {/* Tapa del Libro */}
              <div 
                className="w-full h-full rounded-r-2xl shadow-[15px_15px_35px_rgba(15,23,42,0.35)] border-y border-r border-[#0f172a] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] p-8 flex flex-col justify-between text-center relative transition-all duration-500 transform origin-left-center rotate-y-hover"
                style={{
                  borderLeft: '7px solid #29ABE2'
                }}
              >
                {/* Lomo decorativo */}
                <div className="absolute top-0 left-0 w-2.5 h-full bg-black/45" />

                {/* Marcador superior */}
                <div className="text-[10px] font-black text-[#29ABE2] uppercase tracking-widest">
                  Manual de Operatoria
                </div>

                {/* Contenido Central */}
                <div className="space-y-4 my-auto relative z-10">
                  <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 bg-white/5 shadow-inner relative">
                    <img src="/logo-oficial.png" alt="Logo" className="h-11 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(41,171,226,0.6)] animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">SiGIC</h2>
                    <p className="text-[9px] font-black text-[#29ABE2] uppercase tracking-[0.25em]">Manual Interactivo</p>
                  </div>
                  <div className="h-[2px] w-12 bg-[#29ABE2]/50 mx-auto rounded-full" />
                  <p className="text-[10.5px] font-semibold text-slate-300 leading-relaxed max-w-[200px] mx-auto">
                    Guía cotidiana de padrón, invitaciones, butacas y validación QR de accesos.
                  </p>
                </div>

                {/* Footer */}
                <div className="space-y-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-wider relative z-10">
                  <p className="m-0">ITB · PP 2026</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#29ABE2] text-[8px] font-black tracking-widest animate-bounce">
                    <BookOpen size={10} /> HACER CLIC PARA ABRIR
                  </div>
                </div>
              </div>

              {/* Hojas interiores visibles por el lateral */}
              <div className="absolute top-1 right-[-4px] w-[5px] h-[402px] bg-slate-100 rounded-r shadow-inner z-[-1] transition-transform duration-500 group-hover:translate-x-[2px]" />
              <div className="absolute top-2 right-[-8px] w-[5px] h-[394px] bg-slate-200 rounded-r shadow-inner z-[-2] transition-transform duration-500 group-hover:translate-x-[4px]" />
            </div>

            {/* Botón salir alternativo debajo del libro */}
            <button 
              onClick={onVolver}
              className="mt-8 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> Volver al Portal
            </button>
          </div>
        ) : (
          /* VISTA ABIERTA: LIBRO INTERACTIVO */
          <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in select-none">
            
            {/* Controles de Cabecera del Libro */}
            <div className="w-full flex items-center justify-between mb-4 px-2 select-none">
              <button 
                onClick={handleCloseBook}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Book size={13} /> Cerrar Libro (Ver Portada)
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                {isMobile ? `Página ${mobilePage} / 10` : `Hojas ${spread * 2 - 1}-${spread * 2} / 10`}
              </span>
            </div>

            {/* CUERPO HÉRCULES DEL LIBRO */}
            <div 
              className={`w-full bg-white border border-slate-200/50 rounded-[24px] shadow-2xl relative overflow-hidden transition-all duration-300 ${
                animando ? 'opacity-80 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-none'
              }`}
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)'
              }}
            >
              <div className="relative min-h-[470px] flex flex-col lg:flex-row">
                
                {/* Lomo y Sombra Central (Solo en Desktop) */}
                {!isMobile && (
                  <>
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-full bg-gradient-to-r from-slate-200 via-slate-350 to-slate-200 border-x border-slate-300/40 z-30 pointer-events-none" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-r from-black/0 via-black/5 to-black/0 z-20 pointer-events-none" />
                    <div className="absolute left-[calc(50%-24px)] w-6 h-full bg-gradient-to-r from-black/0 to-black/4 z-20 pointer-events-none" />
                    <div className="absolute left-1/2 w-6 h-full bg-gradient-to-r from-black/4 to-black/0 z-20 pointer-events-none" />
                  </>
                )}

                {/* MÓVIL: MUESTRA UNA SOLA PÁGINA */}
                {isMobile ? (
                  <div className="w-full bg-paper p-6 sm:p-8 flex flex-col justify-between min-h-[470px]">
                    <div className="flex-1">
                      {paginas[mobilePage]}
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                      <span>SiGIC Manual</span>
                      <span>Pág. {mobilePage} / 10</span>
                    </div>
                  </div>
                ) : (
                  // DESKTOP: DOS PÁGINAS (IZQUIERDA Y DERECHA)
                  <>
                    {/* PÁGINA IZQUIERDA */}
                    <div className="w-1/2 bg-paper p-8 flex flex-col justify-between border-r border-slate-150 relative page-shadow-left">
                      <div className="flex-1">
                        {paginas[(spread - 1) * 2 + 1]}
                      </div>
                      <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                        <span>SiGIC Manual</span>
                        <span>Pág. {(spread - 1) * 2 + 1}</span>
                      </div>
                    </div>

                    {/* PÁGINA DERECHA */}
                    <div className="w-1/2 bg-paper p-8 flex flex-col justify-between relative page-shadow-right">
                      <div className="flex-1">
                        {paginas[(spread - 1) * 2 + 2]}
                      </div>
                      <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                        <span>Manual Oficial</span>
                        <span>Pág. {(spread - 1) * 2 + 2}</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* BOTONES FLOTANTES DE NAVEGACIÓN */}
            <div className="flex items-center gap-6 mt-6 select-none">
              <button 
                onClick={prevPage}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                title="Página Anterior"
              >
                <ArrowLeft size={16} />
              </button>

              <span className="text-xs font-bold text-slate-400 tracking-wide font-mono">
                {isMobile ? `${mobilePage} / 10` : `${spread} / 5`}
              </span>

              <button 
                onClick={nextPage}
                disabled={isMobile ? mobilePage === 10 : spread === 5}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                title="Página Siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        )}

        <style>{`
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
          <span>v2.0.0</span>
          <span className="h-4 w-px bg-white/10" />
          <span>Instituto Tecnológico Beltrán</span>
        </div>
      </header>

      {/* Área del Libro */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        
        {/* VISTA CERRADA: PORTADA */}
        {!isOpen ? (
          <div className="font-sans flex flex-col items-center justify-center py-6 animate-fade-in">
            {/* Contenedor 3D del Libro */}
            <div className="relative group w-72 h-[410px] select-none cursor-pointer perspective-1200" onClick={handleOpenBook}>
              {/* Tapa del Libro */}
              <div 
                className="w-full h-full rounded-r-2xl shadow-[15px_15px_35px_rgba(15,23,42,0.35)] border-y border-r border-[#0f172a] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] p-8 flex flex-col justify-between text-center relative transition-all duration-500 transform origin-left-center rotate-y-hover"
                style={{
                  borderLeft: '7px solid #29ABE2'
                }}
              >
                {/* Lomo decorativo */}
                <div className="absolute top-0 left-0 w-2.5 h-full bg-black/45" />

                {/* Marcador superior */}
                <div className="text-[10px] font-black text-[#29ABE2] uppercase tracking-widest">
                  Manual de Operatoria
                </div>

                {/* Contenido Central */}
                <div className="space-y-4 my-auto relative z-10">
                  <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 bg-white/5 shadow-inner relative">
                    <img src="/logo-oficial.png" alt="Logo" className="h-11 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(41,171,226,0.6)] animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">SiGIC</h2>
                    <p className="text-[9px] font-black text-[#29ABE2] uppercase tracking-[0.25em]">Manual Interactivo</p>
                  </div>
                  <div className="h-[2px] w-12 bg-[#29ABE2]/50 mx-auto rounded-full" />
                  <p className="text-[10.5px] font-semibold text-slate-300 leading-relaxed max-w-[200px] mx-auto">
                    Guía cotidiana de padrón, invitaciones, butacas y validación QR de accesos.
                  </p>
                </div>

                {/* Footer */}
                <div className="space-y-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-wider relative z-10">
                  <p className="m-0">ITB · PP 2026</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#29ABE2] text-[8px] font-black tracking-widest animate-bounce">
                    <BookOpen size={10} /> HACER CLIC PARA ABRIR
                  </div>
                </div>
              </div>

              {/* Hojas interiores visibles por el lateral */}
              <div className="absolute top-1 right-[-4px] w-[5px] h-[402px] bg-slate-100 rounded-r shadow-inner z-[-1] transition-transform duration-500 group-hover:translate-x-[2px]" />
              <div className="absolute top-2 right-[-8px] w-[5px] h-[394px] bg-slate-200 rounded-r shadow-inner z-[-2] transition-transform duration-500 group-hover:translate-x-[4px]" />
            </div>

            {/* Botón salir alternativo debajo del libro */}
            <button 
              onClick={onVolver}
              className="mt-8 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> Volver al Inicio
            </button>
          </div>
        ) : (
          /* VISTA ABIERTA: LIBRO INTERACTIVO */
          <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in select-none">
            
            {/* Controles de Cabecera del Libro */}
            <div className="w-full flex items-center justify-between mb-4 px-2 select-none">
              <button 
                onClick={handleCloseBook}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Book size={13} /> Cerrar Libro (Ver Portada)
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                {isMobile ? `Página ${mobilePage} / 10` : `Hojas ${spread * 2 - 1}-${spread * 2} / 10`}
              </span>
            </div>

            {/* CUERPO HÉRCULES DEL LIBRO */}
            <div 
              className={`w-full bg-white border border-slate-200/50 rounded-[24px] shadow-2xl relative overflow-hidden transition-all duration-300 ${
                animando ? 'opacity-80 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-none'
              }`}
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)'
              }}
            >
              <div className="relative min-h-[470px] flex flex-col lg:flex-row">
                
                {/* Lomo y Sombra Central (Solo en Desktop) */}
                {!isMobile && (
                  <>
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-full bg-gradient-to-r from-slate-200 via-slate-350 to-slate-200 border-x border-slate-300/40 z-30 pointer-events-none" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-r from-black/0 via-black/5 to-black/0 z-20 pointer-events-none" />
                    <div className="absolute left-[calc(50%-24px)] w-6 h-full bg-gradient-to-r from-black/0 to-black/4 z-20 pointer-events-none" />
                    <div className="absolute left-1/2 w-6 h-full bg-gradient-to-r from-black/4 to-black/0 z-20 pointer-events-none" />
                  </>
                )}

                {/* MÓVIL: MUESTRA UNA SOLA PÁGINA */}
                {isMobile ? (
                  <div className="w-full bg-paper p-6 sm:p-8 flex flex-col justify-between min-h-[470px]">
                    <div className="flex-1">
                      {paginas[mobilePage]}
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                      <span>SiGIC Manual</span>
                      <span>Pág. {mobilePage} / 10</span>
                    </div>
                  </div>
                ) : (
                  // DESKTOP: DOS PÁGINAS (IZQUIERDA Y DERECHA)
                  <>
                    {/* PÁGINA IZQUIERDA */}
                    <div className="w-1/2 bg-paper p-8 flex flex-col justify-between border-r border-slate-150 relative page-shadow-left">
                      <div className="flex-1">
                        {paginas[(spread - 1) * 2 + 1]}
                      </div>
                      <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                        <span>SiGIC Manual</span>
                        <span>Pág. {(spread - 1) * 2 + 1}</span>
                      </div>
                    </div>

                    {/* PÁGINA DERECHA */}
                    <div className="w-1/2 bg-paper p-8 flex flex-col justify-between relative page-shadow-right">
                      <div className="flex-1">
                        {paginas[(spread - 1) * 2 + 2]}
                      </div>
                      <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                        <span>Manual Oficial</span>
                        <span>Pág. {(spread - 1) * 2 + 2}</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* BOTONES FLOTANTES DE NAVEGACIÓN */}
            <div className="flex items-center gap-6 mt-6 select-none">
              <button 
                onClick={prevPage}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                title="Página Anterior"
              >
                <ArrowLeft size={16} />
              </button>

              <span className="text-xs font-bold text-slate-400 tracking-wide font-mono">
                {isMobile ? `${mobilePage} / 10` : `${spread} / 5`}
              </span>

              <button 
                onClick={nextPage}
                disabled={isMobile ? mobilePage === 10 : spread === 5}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 hover:bg-[#29ABE2] border border-white/10 text-white transition active:scale-95 shadow-lg shadow-black/30 cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                title="Página Siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        )}

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

