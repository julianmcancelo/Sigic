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
