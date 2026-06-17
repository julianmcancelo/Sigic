import { useState } from 'react'
import { 
  Users, GraduationCap, ScanLine, HelpCircle, Calendar, FileSpreadsheet, Mail, Map, QrCode, 
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft
} from 'lucide-react'

// ==========================================
// WIREFRAME 1: ADMINISTRADOR (REAL MOCKUP)
// ==========================================
function WireframeAdmin() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/60 shadow bg-slate-50 relative group">
      <img 
        src="/manual/admin_wireframe.png" 
        alt="Dashboard de Administración - Padrón y Ceremonias" 
        className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300 relative z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold text-white">Vista Real: Panel de Administración Web</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 2: SELECCION DE ASIENTOS (REAL MOCKUP)
// ==========================================
function WireframeEgresado() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/60 shadow bg-slate-50 relative group">
      <img 
        src="/manual/egresado_wireframe.png" 
        alt="Portal del Graduado - Selección de Asiento" 
        className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300 relative z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold text-white">Vista Real: Mapa de Selección de Butacas</span>
      </div>
    </div>
  )
}

// ==========================================
// WIREFRAME 3: PORTERIA SCANNER MOVIL (REAL MOCKUP)
// ==========================================
function WireframePorteria() {
  return (
    <div className="w-40 mx-auto overflow-hidden rounded-2xl border-4 border-slate-850 shadow-md bg-slate-900 relative group">
      <img 
        src="/manual/porteria_wireframe.png" 
        alt="Escáner QR Móvil - Acreditación" 
        className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-300"
      />
    </div>
  )
}

// ==========================================
// WIREFRAME 4: DIAGRAMA DE RED Y CONECTIVIDAD
// ==========================================
function DiagramaArquitectura() {
  return (
    <div className="w-full bg-[#1e293b] border border-slate-800 rounded-xl p-3 shadow text-[8px] text-slate-350 font-sans space-y-2">
      <div className="text-center border-b border-slate-800 pb-1">
        <span className="font-bold text-white uppercase tracking-wider text-[7.5px]">Ecosistema de Conectividad</span>
      </div>

      <div className="flex flex-col gap-2 relative">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center text-center">
            <span className="font-black text-sky-400">Centro de Control Web</span>
            <span className="text-slate-500 text-[5.5px] mt-0.5">Módulo de Infraestructura</span>
            <span className="text-[6px] text-sky-400 mt-1">Integrado en la App</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center text-center">
            <span className="font-black text-emerald-400">Portal Web Next.js</span>
            <span className="text-slate-500 text-[5.5px] mt-0.5">Admin & Graduados</span>
            <span className="text-[6px] text-emerald-400 mt-1">React Server Components</span>
          </div>
        </div>

        <div className="flex justify-around items-center h-1 select-none">
          <div className="w-0.5 h-full bg-slate-800" />
          <div className="w-0.5 h-full bg-slate-800" />
        </div>

        <div className="bg-[#29ABE2]/10 border border-[#29ABE2]/20 rounded-md p-1.5 text-center flex flex-col items-center">
          <span className="font-black text-white text-[8px] tracking-wide">Vercel Serverless Platform</span>
          <span className="text-slate-500 text-[5.5px]">Servidor de APIs en la Nube</span>
        </div>

        <div className="flex justify-center items-center h-1 select-none">
          <div className="w-0.5 h-full bg-slate-800" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-1.5 text-center flex flex-col items-center">
          <span className="font-black text-purple-400 text-[8px]">Neon Cloud PostgreSQL</span>
          <span className="text-slate-555 text-[5.5px]">Base de Datos Cloud (SSL)</span>
        </div>
      </div>
    </div>
  )
}

const DARK   = '#2A3448'
const ACCENT = '#0EA5E9'

export function ManualUsuarioWeb({ onVolver, sinHeader }) {
  const [tabActiva, setTabActiva] = useState('admin')

  const tabs = [
    { id: 'admin', titulo: 'Administrador', descripcion: 'Portal de Gestión', icono: Users },
    { id: 'egresado', titulo: 'Egresado', descripcion: 'Portal de Autogestión', icono: GraduationCap },
    { id: 'porteria', titulo: 'Portería', descripcion: 'Control QR Móvil', icono: ScanLine },
    { id: 'faq', titulo: 'Incidentes', descripcion: 'Resolución y Soporte', icono: HelpCircle }
  ]

  const content = (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Barra lateral de navegación */}
      <aside className="w-full lg:w-56 shrink-0 flex flex-col gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm space-y-2">
          <h2 className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Secciones del Manual</h2>
          <div className="flex flex-col gap-1.5">
            {tabs.map((tab) => {
              const Icono = tab.icono
              const activa = tabActiva === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`flex items-center gap-2.5 w-full p-2.5 text-left rounded-xl transition-all border cursor-pointer ${
                    activa 
                      ? 'bg-sky-50/50 border-sky-100 text-sky-600 shadow-sm' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors ${
                    activa ? 'bg-sky-500 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <Icono size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold leading-none mb-0.5">{tab.titulo}</p>
                    <p className="text-[9px] font-semibold opacity-70 leading-none">{tab.descripcion}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
            Prácticas Profesionalizantes <br /> ITB Beltrán · 2026
          </p>
        </div>
      </aside>

      {/* Panel de visualización de guías */}
      <section className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm min-w-0">
        
        {/* TAB 1: ADMINISTRADOR */}
        {tabActiva === 'admin' && (
          <div className="space-y-5 text-slate-600">
            <div className="border-b border-slate-50 pb-3">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-[#29ABE2]">Rol de Gestión</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Manual del Administrador</h3>
              <p className="text-[11px] text-slate-400">Soporte y flujo de trabajo para el personal administrativo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4 text-[11px] leading-relaxed">
                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Configuración Inicial (Setup)</h4>
                  <p className="text-slate-500">
                    Al inicializar el sistema, la aplicación web solicitará los datos del Super-Administrador y el Nombre de la Institución para generar la base de datos PostgreSQL.
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Gestión de Ceremonias</h4>
                  <p className="text-slate-500">
                    El sistema admite múltiples colaciones. Solo se puede tener una **única ceremonia activa a la vez** para habilitar la confirmación y reservas de butacas de sus estudiantes.
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Carga de Padrón y Despacho</h4>
                  <p className="text-slate-500">
                    Se puede importar el padrón desde archivos Excel (.xlsx). Al guardarlo, se puede despachar los correos de invitación que incluyen el token único autogestionable de cada alumno.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Dashboard</span>
                <WireframeAdmin />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EGRESADO */}
        {tabActiva === 'egresado' && (
          <div className="space-y-5 text-slate-600">
            <div className="border-b border-slate-50 pb-3">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-[#29ABE2]">Rol de Estudiante</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Manual del Egresado</h3>
              <p className="text-[11px] text-slate-400">Confirmación de asistencia, acompañantes y butacas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4 text-[11px] leading-relaxed">
                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Validación OTP</h4>
                  <p className="text-slate-500">
                    El graduado valida su acceso ingresando su correo y recibiendo un código temporal de 6 dígitos que emite su credencial de sesión segura.
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Carga de Acompañantes</h4>
                  <p className="text-slate-500">
                    Puede registrar el aforo permitido e indicar si alguno requiere asistencia de **Movilidad Reducida**, lo cual alertará al staff de portería durante la acreditación.
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Mapa de Asientos</h4>
                  <p className="text-slate-500">
                    Permite elegir visualmente las butacas del auditorio (azul para egresado, verde para acompañantes) y descargar la credencial digital PDF con los códigos QR encriptados.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Mapa del Auditorio</span>
                <WireframeEgresado />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PORTERIA */}
        {tabActiva === 'porteria' && (
          <div className="space-y-5 text-slate-600">
            <div className="border-b border-slate-50 pb-3">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-[#29ABE2]">Acreditación</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Manual de Portería</h3>
              <p className="text-[11px] text-slate-400">Escaneo de credenciales QR el día del evento.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-3.5 text-[11px] leading-relaxed">
                <p className="text-slate-500">
                  El personal de puerta escanea las credenciales con la aplicación móvil. El sistema valida el token de seguridad y retorna tres respuestas en pantalla:
                </p>

                <div className="space-y-2">
                  <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                    <div>
                      <h5 className="font-bold text-emerald-700 text-[10px] uppercase">Acceso Autorizado</h5>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">QR legítimo. El dispositivo vibra/emite sonido verde y despliega la butaca del invitado.</p>
                    </div>
                  </div>

                  <div className="border border-amber-100 bg-amber-50/50 p-2.5 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                    <div>
                      <h5 className="font-bold text-amber-700 text-[10px] uppercase">Acceso Duplicado</h5>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">QR escaneado previamente. Alerta al staff para prevenir fraudes en el acceso.</p>
                    </div>
                  </div>

                  <div className="border border-rose-100 bg-rose-50/50 p-2.5 rounded-xl flex items-start gap-2.5">
                    <XCircle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                    <div>
                      <h5 className="font-bold text-rose-700 text-[10px] uppercase">Acceso Denegado</h5>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">QR inválido o cancelado. Se deniega el ingreso físico.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block text-center">App Portero</span>
                <WireframePorteria />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RESOLUCION DE PROBLEMAS */}
        {tabActiva === 'faq' && (
          <div className="space-y-5 text-slate-600">
            <div className="border-b border-slate-50 pb-3">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-[#29ABE2]">Soporte</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Resolución de Incidentes</h3>
              <p className="text-[11px] text-slate-400">Guías rápidas para resolución de problemas comunes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4 text-[11px] leading-relaxed">
                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">¿Cómo ingreso al panel de login desde la portada?</h4>
                  <p className="text-slate-500">
                    La pantalla de bienvenida es una portada limpia. Para revelar el panel de autenticación, realice un gesto especial sobre el logotipo central (haciendo click 5 veces consecutivas).
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Restablecer la base de datos</h4>
                  <p className="text-slate-500">
                    El personal de soporte técnico (`soporte@sigic.com.ar`) puede acceder al módulo de **Centro de Control** integrado en la web para vaciar las tablas de Neon Cloud y configurar una nueva ceremonia.
                  </p>
                </div>

                <div>
                  <h4 className="text-slate-800 font-bold text-[12px] mb-1">Gestión de Cuentas y Soporte</h4>
                  <p className="text-slate-500">
                    El personal de soporte técnico (`soporte@sigic.com.ar`) tiene acceso tanto al **Centro de Control** (mantenimiento y base de datos) como al módulo de **Seguridad**, lo que le permite crear y gestionar cuentas de usuario generales, personal de portería, auditores y administradores especiales de la plataforma.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block">Ecosistema de Red</span>
                <DiagramaArquitectura />
              </div>
            </div>
          </div>
        )}

      </section>
    </div>
  )

  if (sinHeader) {
    return (
      <div className="font-sans">
        {/* HEADER INTEGRADO PRO */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Manual de Ayuda</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentación Oficial del Sistema SiGIC</p>
          </div>
        </div>
        {content}
      </div>
    )
  }

  return (
    <main
      className="relative min-h-screen text-slate-700 flex flex-col p-6 md:p-8"
      style={{
        background: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <header className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-3">
        <button
          onClick={onVolver}
          className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-base font-black tracking-tight flex items-center gap-1.5" style={{ color: DARK }}>
            SiGIC <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">Manual Web</span>
          </h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Centro de ayuda para el usuario final</p>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto">
        {content}
      </div>
    </main>
  )
}
