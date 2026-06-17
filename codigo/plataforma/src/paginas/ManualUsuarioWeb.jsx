import { useState } from 'react'
import { 
  ArrowLeft, Users, GraduationCap, ScanLine, Calendar, 
  FileSpreadsheet, Send, Mail, Map, QrCode, ShieldAlert, 
  CheckCircle2, AlertTriangle, XCircle, Settings, HelpCircle
} from 'lucide-react'

// ==========================================
// WIREFRAME 1: ADMINISTRADOR (REAL MOCKUP IMAGE)
// ==========================================
function WireframeAdmin() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-slate-950/40 relative group">
      <img 
        src="/manual/admin_wireframe.png" 
        alt="Dashboard de Administración - Padrón y Ceremonias" 
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300 relative z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 z-20 pointer-events-none">
        <span className="text-[9px] font-bold text-white/90">Vista Real: Panel de Administración Web</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 2: SELECCION DE ASIENTOS (REAL MOCKUP IMAGE)
// ==========================================
function WireframeEgresado() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-slate-950/40 relative group">
      <img 
        src="/manual/egresado_wireframe.png" 
        alt="Portal del Graduado - Selección de Asiento" 
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300 relative z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 z-20 pointer-events-none">
        <span className="text-[9px] font-bold text-white/90">Vista Real: Mapa de Selección de Butacas</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 3: PORTERIA SCANNER MOVIL (REAL MOCKUP IMAGE)
// ==========================================
function WireframePorteria() {
  return (
    <div className="w-[185px] mx-auto overflow-hidden rounded-[26px] border-4 border-slate-700 shadow-2xl bg-slate-950/40 relative group">
      <img 
        src="/manual/porteria_wireframe.png" 
        alt="Escáner QR Móvil - Acreditación" 
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
    <div className="w-full bg-[#1e293b]/95 border border-white/10 rounded-xl p-3 shadow-2xl text-[8.5px] text-white/80 font-sans space-y-2.5">
      <div className="text-center border-b border-white/5 pb-1">
        <span className="font-bold text-white uppercase tracking-wider text-[8px]">Ecosistema de Conectividad</span>
      </div>

      <div className="flex flex-col gap-2.5 relative">
        {/* Fila 1: Clientes */}
        <div className="grid grid-cols-2 gap-2">
          {/* Centro de Control Web */}
          <div className="bg-slate-900 border border-white/5 rounded p-1.5 flex flex-col items-center text-center">
            <span className="font-black text-sky-400">Centro de Control Web</span>
            <span className="text-white/40 text-[6px] mt-0.5">Módulo de Infraestructura</span>
            <div className="h-1 bg-sky-500/30 w-px my-1" />
            <span className="text-[6.5px] text-[#29ABE2]">Integrado en la App</span>
          </div>

          {/* Portal Web */}
          <div className="bg-slate-900 border border-white/5 rounded p-1.5 flex flex-col items-center text-center">
            <span className="font-black text-emerald-400">Portal Web Next.js</span>
            <span className="text-white/40 text-[6px] mt-0.5">Admin & Graduados</span>
            <div className="h-1 bg-emerald-500/30 w-px my-1" />
            <span className="text-[6.5px] text-emerald-400">React Server Components</span>
          </div>
        </div>

        {/* Flechas hacia el Servidor */}
        <div className="flex justify-around items-center h-2 select-none">
          <div className="w-0.5 h-full bg-sky-500/30" />
          <div className="w-0.5 h-full bg-emerald-500/30" />
        </div>

        {/* Fila 2: Servidor Backend */}
        <div className="bg-[#29ABE2]/10 border border-[#29ABE2]/20 rounded-lg p-2 text-center flex flex-col items-center mx-3">
          <span className="font-black text-white text-[9px] tracking-wide">Vercel Serverless Platform</span>
          <span className="text-white/40 text-[6px]">Servidor de APIs en la Nube</span>
          <p className="text-[6.5px] text-white/60 mt-1 leading-normal">
            Procesa tokens OTP, valida butacas y sincroniza la DB de forma instantánea.
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
            <div className="space-y-6 animate-fade-in text-white/80">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol Técnico Institucional</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Gestión y Configuración</h3>
                <p className="text-xs text-white/60 mt-1">Soporte y flujo de trabajo para el personal administrativo de SiGIC.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-6 text-xs leading-relaxed">
                  
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.1 Configuración Inicial (Setup)</h4>
                    <p className="mb-2">
                      Al forzar la instalación o realizar un restablecimiento de datos a través del Centro de Control de Windows, la aplicación web ingresará de forma obligatoria en el **Asistente de Setup Inicial**.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Procedimiento de registro:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2 text-white/70">
                      <li>Completar los datos personales del Super-Administrador (Nombre, Correo y Contraseña).</li>
                      <li>Registrar el Nombre Formal de la Institución y el lugar inicial previsto para el evento.</li>
                      <li>Confirmar la configuración para que el servidor impacte las tablas en la base de datos PostgreSQL.</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.2 Creación y Gestión de Ceremonias</h4>
                    <p className="mb-2">
                      El sistema permite crear múltiples colaciones independientes. Sin embargo, para evitar conflictos de aforo, **el sistema solo admite una única ceremonia activa a la vez**.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Procedimiento operativo:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2 text-white/70">
                      <li>Ingresar a la pestaña de "Ceremonias" en el panel lateral.</li>
                      <li>Definir el nombre del acto, lugar físico, fecha y el cupo máximo de acompañantes.</li>
                      <li>Presionar el botón **Marcar como Activa** sobre el evento deseado para habilitar la autogestión de sus egresados.</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.3 Carga Masiva del Padrón de Egresados</h4>
                    <p className="mb-2">
                      Para poblar los graduados asignados al evento activo, el administrador puede realizar una importación directa arrastrando un archivo de Excel (.xlsx) que contenga la estructura unificada de datos.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Campos requeridos de la planilla:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
                      <li><code className="text-[#29ABE2]">nombre</code>: Apellido y Nombre del egresado.</li>
                      <li><code className="text-[#29ABE2]">dni</code>: Documento Único (en formato numérico plano).</li>
                      <li><code className="text-[#29ABE2]">correo</code>: Dirección electrónica oficial.</li>
                      <li><code className="text-[#29ABE2]">legajo</code>, <code className="text-[#29ABE2]">carrera</code>, <code className="text-[#29ABE2]">anio_inscripcion</code> y <code className="text-[#29ABE2]">promedio</code>.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.4 Envío y Reenvío de Invitaciones</h4>
                    <p className="mb-2">
                      Una vez validado el padrón, el administrador ejecuta el envío de invitaciones por email. Cada alumno recibirá un correo con su **Token de Acceso** único para ingresar de forma segura.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Soporte de reenvíos:</p>
                    <p className="text-white/70 pl-2">
                      Si el correo rebota, el administrador puede editar los datos del estudiante en pantalla y presionar el botón de **Reenvío Individual** (icono de avión de papel) para forzar un nuevo despacho del token.
                    </p>
                  </div>

                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Panel General de Administración</span>
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
            <div className="space-y-6 animate-fade-in text-white/80">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol del Estudiante Graduado</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Autogestión del Portal</h3>
                <p className="text-xs text-white/60 mt-1">Confirmación de asistencia, registro de familiares y reserva de butacas.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-6 text-xs leading-relaxed">
                  
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.5 Autogestión del Egresado y Validación OTP</h4>
                    <p className="mb-2">
                      El acceso a la autogestión es estrictamente individual. Si se ingresa de forma manual a la plataforma web, el graduado deberá verificar su identidad mediante el ingreso de un código OTP temporal.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Pasos para acceder:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2 text-white/70">
                      <li>Ingresar a la plataforma web del sistema y colocar su correo registrado en la base.</li>
                      <li>Abrir su bandeja de entrada y copiar el código OTP de 6 dígitos enviado por el servidor.</li>
                      <li>Pegar el código en pantalla para que el servidor emita su token de sesión.</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.6 Declaración de Asistencia (Aceptación/Rechazo)</h4>
                    <p className="mb-2">
                      Al acceder al portal, el graduado debe registrar de forma inicial su decisión de presenciar el evento de colación.
                    </p>
                    <p className="mb-2 text-white/70 pl-2">
                      Si declara **asistir (Aceptar)**, se habilitará el flujo para cargar acompañantes y elegir asientos. En caso de declarar que **no asistirá (Rechazar)**, el sistema registrará la inasistencia de forma irreversible en el servidor, liberando sus asientos automáticamente para otros alumnos y cancelando sus credenciales.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.7 Carga de Acompañantes e Indicador de Movilidad Reducida</h4>
                    <p className="mb-2">
                      El egresado tiene permitido registrar a sus acompañantes (Nombre, DNI, Teléfono y Relación) de acuerdo al límite establecido por la institución.
                    </p>
                    <p className="mb-2 text-white/70 pl-2">
                      Si algún invitado posee dificultades físicas o requiere silla de ruedas, debe marcar la casilla de **Movilidad Reducida**. Esta alerta se grabará en el sistema para que los organizadores preparen su asistencia en sala y para que la aplicación del portero emita un aviso visual prioritario en la entrada del anfiteatro.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.8 Selección Visual de Asientos y Descarga QR</h4>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Procedimiento de reservación:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2 text-white/70">
                      <li>Ingresar al plano gráfico interactivo del anfiteatro.</li>
                      <li>Hacer clic en las butacas disponibles (color azul para el graduado, color verde para acompañantes) asegurando que se sienten juntos.</li>
                      <li>Confirmar la asignación y hacer clic en **Descargar Credenciales** para obtener los archivos oficiales con los códigos QR únicos encriptados.</li>
                    </ol>
                  </div>

                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Plano de Selección de Asientos</span>
                  <WireframeEgresado />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTERIA */}
          {tabActiva === 'porteria' && (
            <div className="space-y-6 animate-fade-in text-white/80">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Rol de Acreditación y Seguridad</span>
                <h3 className="text-xl font-black text-white mt-1">Manual de Control de Accesos (Portería)</h3>
                <p className="text-xs text-white/60 mt-1">Escaneo de credenciales en el acceso al salón el día del evento.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Instrucciones */}
                <div className="lg:col-span-7 space-y-6 text-xs leading-relaxed">
                  
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">7.10 Acreditación y Control de Accesos por Cámara</h4>
                    <p className="mb-2">
                      El personal de portería y acreditación utiliza una aplicación móvil basada en Flutter que controla la cámara del dispositivo para escanear de forma rápida las credenciales QR impresas o digitales provistas por los egresados e invitados.
                    </p>
                    <p className="mb-2 font-semibold text-[#29ABE2]">Validación de códigos QR:</p>
                    <p className="mb-2">
                      Al enfocar una credencial, el software procesa el token digital y devuelve de manera inmediata el resultado mediante un color y un sonido en pantalla:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Caso Verde */}
                    <div className="border border-emerald-500/20 bg-emerald-950/20 p-3.5 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h5 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Acceso Autorizado (Pantalla Verde)</h5>
                        <p className="text-emerald-100/70 text-[11px] mt-0.5 leading-snug">
                          Indica que el código QR es legítimo, pertenece a la ceremonia activa y posee una butaca asignada. Muestra el Nombre y el Asiento en pantalla para agilizar el ingreso.
                        </p>
                      </div>
                    </div>

                    {/* Caso Naranja */}
                    <div className="border border-amber-500/20 bg-amber-950/20 p-3.5 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h5 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Acceso Duplicado (Pantalla Naranja)</h5>
                        <p className="text-amber-100/70 text-[11px] mt-0.5 leading-snug">
                          El código es válido pero la persona **ya ingresó anteriormente** al salón. Esta alerta inmediata permite frenar fraudes o copias físicas de las credenciales, derivando el caso a la mesa de ayuda.
                        </p>
                      </div>
                    </div>

                    {/* Caso Rojo */}
                    <div className="border border-rose-500/20 bg-rose-950/20 p-3.5 rounded-xl flex items-start gap-3">
                      <XCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <h5 className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">Acceso Denegado (Pantalla Roja)</h5>
                        <p className="text-rose-100/70 text-[11px] mt-0.5 leading-snug">
                          Token de credencial inválido, código de otra ceremonia del instituto o asociado a alumnos que declararon inasistencia. Se deniega el paso físico de forma inmediata.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Columna Derecha: Wireframe */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Aplicación del Acreditador en Portería</span>
                  <WireframePorteria />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESOLUCION DE PROBLEMAS */}
          {tabActiva === 'faq' && (
            <div className="space-y-6 animate-fade-in text-white/80">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2]">Soporte Técnico Especializado</span>
                <h3 className="text-xl font-black text-white mt-1">Resolución de Incidentes</h3>
                <p className="text-xs text-white/60 mt-1">Procedimientos prácticos de resolución a problemas recurrentes.</p>
              </div>

              {/* Layout Split de 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Columna Izquierda: Preguntas */}
                <div className="lg:col-span-7 space-y-5 text-xs leading-relaxed">
                  
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">¿Cómo recupero el enlace de un graduado si no recibió el correo?</h4>
                    <p className="text-white/70">
                      En **Gestión de Graduados**, el administrador puede verificar el correo de la fila del graduado. Si persiste el inconveniente, copie su **Token de Acceso** único y provéale la dirección web manual:
                    </p>
                    <code className="block bg-black/45 p-2 rounded font-mono text-[#29ABE2] text-[10px] mt-2 select-all border border-white/5">
                      https://sigic-plataforma.vercel.app/?token=PEGAR_EL_TOKEN_AQUI
                    </code>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">¿Cómo ingreso al panel de gestión desde la pantalla de bienvenida?</h4>
                    <p className="text-white/70">
                      Haga clic directamente en el enlace "Acceso Personal" o "Gestión" en la barra de navegación superior de la portada para abrir el formulario de inicio de sesión de personal administrativo.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">¿Cómo se limpia la base de datos para una nueva colación?</h4>
                    <p className="text-white/70">
                      El personal de soporte técnico (`soporte@sigic.com.ar`) puede acceder al módulo de **Centro de Control** integrado en la web y realizar la acción de **Formatear & Resetear** para limpiar la base de datos Neon Cloud en la nube.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-sm mb-1.5">¿Qué permisos tiene la cuenta de Soporte Técnico?</h4>
                    <p className="text-white/70">
                      La cuenta de soporte técnico (`soporte@sigic.com.ar`) tiene acceso exclusivo tanto al **Centro de Control** (mantenimiento y base de datos) como al módulo de **Seguridad**, lo que le permite crear y gestionar cuentas de usuario generales, personal de portería, auditores y administradores especiales de la plataforma.
                    </p>
                  </div>

                </div>

                {/* Columna Derecha: Diagrama */}
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#29ABE2] block">Ecosistema y Flujo de Datos</span>
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
