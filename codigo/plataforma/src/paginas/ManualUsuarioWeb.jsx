import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ArrowLeft, ArrowRight, BookOpen, Book, Users, GraduationCap, 
  ScanLine, HelpCircle, Calendar, Shield, Server, LayoutGrid, 
  CheckCircle2, AlertTriangle, XCircle, List, Heart, Map,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Accessibility, Smartphone, FileText,
  Badge, Download, Printer, X
} from 'lucide-react'

// ==========================================
// CREDENCIAL IMPRIMIBLE DE ACCESO AL MANUAL
// ==========================================
function CredencialManual({ urlManual, onCerrar }) {
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', cerrarConEscape)
    return () => document.removeEventListener('keydown', cerrarConEscape)
  }, [onCerrar])

  const abrirSalida = (nombreDocumento) => {
    const tituloAnterior = document.title
    document.title = `${nombreDocumento}_${cantidad}_${cantidad === 1 ? 'copia' : 'copias'}`
    document.body.classList.add('imprimiendo-credencial-manual')
    const restaurarTitulo = () => {
      document.title = tituloAnterior
      document.body.classList.remove('imprimiendo-credencial-manual')
      window.removeEventListener('afterprint', restaurarTitulo)
    }
    window.addEventListener('afterprint', restaurarTitulo)
    window.print()
    setTimeout(restaurarTitulo, 1500)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-credencial-manual"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-credencial-manual" className="text-base font-black text-slate-900">
              Credencial del Manual
            </h2>
            <p className="mt-1 text-xs text-slate-500">Imprimila o guardala como PDF para compartir el acceso.</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar credencial"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`credenciales-impresion cantidad-${cantidad}`}>
        {Array.from({ length: cantidad }, (_, indice) => (
        <div className="credencial-hoja-corte relative" key={indice}>
          <div className="linea-corte hidden" aria-hidden="true" />
          <div className="credencial-manual-imprimible relative overflow-hidden rounded-[30px] border-[3px] border-white bg-[#fdfefe] text-[#06194d] shadow-[0_0_0_1px_#b9d6ff,0_24px_60px_rgba(0,62,150,0.22)]">
          {/* Geometrías inspiradas en la portada del manual */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rotate-12 bg-gradient-to-br from-[#0069ff] to-[#003b9c] opacity-95" />
          <div className="pointer-events-none absolute -right-20 top-1 h-44 w-44 rotate-[28deg] bg-[#a9d4ff]/80" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#0069ff] via-[#29ABE2] to-[#003b9c]" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#0069ff]" />

          <div className="relative px-7 pb-4 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm">
                  <LogoSigic className="h-full w-full" />
                </div>
                <div>
                  <h3 className="text-[28px] font-black leading-none tracking-[0.12em] text-[#06194d]">SiGIC</h3>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.17em] text-[#087fbd]">Guía de uso diario</p>
                </div>
              </div>
              <div className="relative z-10 mt-1 rounded-xl border border-white/40 bg-white/20 p-2 text-white backdrop-blur-sm">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="mt-4 h-px w-[78%] bg-gradient-to-r from-[#0069ff] via-blue-200 to-transparent" />
          </div>

          <div className="relative flex flex-col items-center px-8 pb-6 pt-2 text-center">
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#0069ff]">Acceso oficial</p>
            </div>
            <h4 className="mt-3 text-[21px] font-black tracking-tight text-[#06194d]">Manual de Usuario</h4>
            <p className="mt-1 max-w-[250px] text-[10px] leading-relaxed text-slate-500">Escaneá el código QR para consultar el manual digital de SiGIC.</p>

            <div className="mt-5 rounded-[24px] border border-blue-200 bg-white p-2.5 shadow-[0_12px_30px_rgba(0,86,179,0.14)] outline outline-[5px] outline-blue-50">
              <QRCodeSVG
                value={urlManual}
                size={166}
                level="H"
                marginSize={1}
                fgColor="#0f172a"
                bgColor="#ffffff"
                title="Código QR de acceso al Manual SiGIC"
              />
            </div>

            <p className="mt-5 max-w-full break-all rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-[8px] text-slate-500">{urlManual}</p>
          </div>

          <div className="relative mx-6 flex items-center justify-between border-t border-blue-100 px-1 py-4 text-[7.5px] font-black uppercase tracking-[0.16em] text-[#0b3980]">
            <span>Instituto Tecnológico Beltrán</span>
            <span className="text-[#087fbd]">Manual oficial</span>
          </div>
          </div>
        </div>
        ))}
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0b3980]">Cantidad de credenciales</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Hasta 4 por hoja A4, sin reducir el tamaño.</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-blue-100 bg-white p-1 shadow-sm" role="group" aria-label="Cantidad de credenciales">
              {[1, 2, 3, 4].map((opcion) => (
                <button
                  type="button"
                  key={opcion}
                  onClick={() => setCantidad(opcion)}
                  aria-pressed={cantidad === opcion}
                  className={`h-8 w-8 rounded-lg text-xs font-black transition ${
                    cantidad === opcion
                      ? 'bg-[#0056b3] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-blue-50 hover:text-[#0056b3]'
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => abrirSalida('Credencial_Manual_SiGIC')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#0056b3] px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#087fbd] active:scale-[0.98]"
          >
            <Download size={16} /> Exportar PDF
          </button>
          <button
            type="button"
            onClick={() => abrirSalida('Credencial_Manual_SiGIC')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:border-[#29ABE2]/50 hover:bg-sky-50 hover:text-[#0056b3] active:scale-[0.98]"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
          Para exportar, elegí <strong className="text-slate-500">Guardar como PDF</strong> en la ventana que se abre.
        </p>
      </div>

      <style>{`
        @media screen {
          .credenciales-impresion .credencial-hoja-corte:not(:first-child) {
            display: none;
          }
        }
        @media print {
          html,
          body {
            width: ${cantidad === 1 ? '95mm' : '210mm'} !important;
            height: ${cantidad === 1 ? '150mm' : '297mm'} !important;
            min-width: ${cantidad === 1 ? '95mm' : '210mm'} !important;
            min-height: ${cantidad === 1 ? '150mm' : '297mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
          }
          body.imprimiendo-credencial-manual > * {
            height: 0 !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          .credenciales-impresion,
          .credenciales-impresion *,
          .credencial-hoja-corte,
          .credencial-hoja-corte *,
          .credencial-manual-imprimible,
          .credencial-manual-imprimible * { visibility: visible !important; }
          .credenciales-impresion {
            position: fixed !important;
            inset: 0 !important;
            width: ${cantidad === 1 ? '95mm' : '210mm'} !important;
            height: ${cantidad === 1 ? '150mm' : '297mm'} !important;
            display: ${cantidad === 1 ? 'block' : 'grid'} !important;
            grid-template-columns: ${cantidad === 1 ? 'none' : 'repeat(2, 89mm)'} !important;
            grid-template-rows: ${cantidad === 1 ? 'none' : 'repeat(2, 144mm)'} !important;
            gap: ${cantidad === 1 ? '0' : '3mm 4mm'} !important;
            padding: ${cantidad === 1 ? '0' : '3mm 14mm'} !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
          }
          .credencial-hoja-corte {
            position: relative !important;
            inset: auto !important;
            display: block !important;
            width: ${cantidad === 1 ? '95mm' : '89mm'} !important;
            height: ${cantidad === 1 ? '150mm' : '144mm'} !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .credencial-manual-imprimible {
            position: absolute !important;
            inset: ${cantidad === 1 ? '5mm auto auto 5mm' : '2mm auto auto 2mm'} !important;
            width: 85mm !important;
            height: 140mm !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            border: 0.7mm solid white !important;
            border-radius: 7mm !important;
            box-shadow: 0 0 0 0.3mm #b9d6ff !important;
            transform: none !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .linea-corte {
            display: block !important;
            position: absolute !important;
            inset: ${cantidad === 1 ? '4.25mm' : '1.25mm'} !important;
            border: 0.25mm dashed #64748b !important;
            border-radius: 7.5mm !important;
            z-index: 20 !important;
            pointer-events: none !important;
            box-sizing: border-box !important;
          }
          .linea-corte::before {
            content: 'LÍNEA DE CORTE' !important;
            position: absolute !important;
            top: -3.2mm !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 0 1.5mm !important;
            background: white !important;
            color: #64748b !important;
            font: 700 6pt/1 sans-serif !important;
            letter-spacing: 0.8pt !important;
            white-space: nowrap !important;
          }
          @page { size: ${cantidad === 1 ? '95mm 150mm' : 'A4 portrait'}; margin: 0; }
        }
      `}</style>
    </div>
  )
}

// Logo y capturas con respaldo visual: nunca dejan el ícono nativo de imagen rota.
function LogoSigic({ className = '' }) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0069ff] to-[#06194d] font-black text-white ${className}`}>
        <span className="text-lg tracking-tighter">SG</span>
      </div>
    )
  }

  return (
    <img
      src="/logo.png?v=20260618"
      alt="Logo oficial de SiGIC"
      className={`object-contain ${className}`}
      onError={() => setFallo(true)}
    />
  )
}

function ImagenManual({ fuentes, alt, className = '', etiqueta = 'Captura del sistema', descripcion = '' }) {
  const listaFuentes = Array.isArray(fuentes) ? fuentes : [fuentes]
  const [indiceFuente, setIndiceFuente] = useState(0)

  if (indiceFuente >= listaFuentes.length) {
    return (
      <div className={`flex min-h-40 w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center ${className}`} role="img" aria-label={alt}>
        <LogoSigic className="h-14 w-14" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0056b3]">SiGIC</p>
          <p className="mt-1 text-xs font-bold text-slate-600">{etiqueta}</p>
          <p className="mt-1 text-[9px] text-slate-400">Imagen no disponible en este dispositivo</p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="group/imagen relative block w-full cursor-zoom-in overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2] focus-visible:ring-offset-2"
      onClick={() => window.dispatchEvent(new CustomEvent('ampliar-imagen-manual', {
        detail: { src: listaFuentes[indiceFuente], alt, titulo: etiqueta, descripcion }
      }))}
      aria-label={`Ampliar imagen: ${etiqueta}`}
    >
      <img
        src={listaFuentes[indiceFuente]}
        alt={alt}
        className={className}
        onError={() => setIndiceFuente(actual => actual + 1)}
      />
      <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/40 bg-slate-950/75 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-white opacity-90 shadow-lg backdrop-blur-md transition group-hover/imagen:scale-105 group-hover/imagen:bg-[#0056b3]">
        <ZoomIn size={11} /> Ampliar
      </span>
    </button>
  )
}

function ModalImagenManual({ imagen, onCerrar }) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setZoom(1)
    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [imagen, onCerrar])

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-imagen-manual"
      onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onCerrar() }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 pb-3 text-white">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#29ABE2]">Captura real de SiGIC</p>
          <h2 id="titulo-imagen-manual" className="truncate text-base font-black sm:text-lg">{imagen.titulo}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setZoom(actual => Math.max(1, actual - 0.25))} disabled={zoom <= 1} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20 disabled:opacity-30" aria-label="Reducir imagen">
            <ZoomOut size={17} />
          </button>
          <span className="w-12 text-center font-mono text-[10px] font-bold text-white/70">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(actual => Math.min(2.5, actual + 0.25))} disabled={zoom >= 2.5} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20 disabled:opacity-30" aria-label="Ampliar imagen">
            <ZoomIn size={17} />
          </button>
          <button type="button" onClick={onCerrar} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 transition hover:bg-[#29ABE2] hover:text-white" aria-label="Cerrar imagen ampliada">
            <X size={19} />
          </button>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl">
        <div className="m-auto flex min-h-full min-w-full items-center justify-center p-3 sm:p-6">
          <img
            src={imagen.src}
            alt={imagen.alt}
            className="max-h-[76vh] max-w-full rounded-xl bg-white object-contain shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      </div>

      <div className="mx-auto mt-3 w-full max-w-7xl rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[11px] leading-relaxed text-white/75 backdrop-blur-md sm:px-5">
        <strong className="mr-1 text-white">¿Qué muestra?</strong>
        {imagen.descripcion || imagen.alt}
      </div>
    </div>
  )
}

// ==========================================
// IMAGEN: PANEL ADMINISTRATIVO REAL
// ==========================================
function ScreenPanelAdmin() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual
        fuentes={['/manual/panel_admin.png?v=20260618', '/panel_admin.png?v=20260618']}
        alt="Panel de Administración SiGIC"
        etiqueta="Panel de Administración"
        descripcion="Vista general del evento activo, indicadores de graduados, invitados, ingresos y ocupación, junto con los accesos a los módulos operativos."
        className="w-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
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
  return (
    <div className="w-full aspect-[16/8.8] overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none bg-slate-50">
      <ImagenManual
        fuentes={['/manual/gestion_graduados.png?v=20260618', '/gestion_graduados.png?v=20260618']}
        alt="Gestión de Graduados SiGIC" 
        etiqueta="Gestión de Graduados"
        descripcion="Listado operativo de graduados con búsqueda, filtros por estado, importación desde Excel y seguimiento del circuito de invitación, aceptación, acompañantes y entregadores."
        className="w-[200%] max-w-none object-cover object-left-top hover:scale-[1.01] transition-transform duration-500"
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
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes={['/manual/gestion_ceremonias.png?v=20260618', '/gestion_ceremonias.png?v=20260618']}
        alt="Gestión de Ceremonias SiGIC"
        etiqueta="Gestión de Ceremonias"
        descripcion="Selector de hábitats o ceremonias. Permite activar el entorno de trabajo correcto, consultar fecha, sede y cupo de invitados, o crear una nueva ceremonia."
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
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
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes={['/manual/diseno_anfiteatro.png?v=20260618', '/diseno_anfiteatro.png?v=20260618']}
        alt="Configuración real del anfiteatro SiGIC"
        etiqueta="Diseño del Anfiteatro"
        descripcion="Modelador de Platea y Pullman. Desde aquí se definen filas, asientos por fila, capacidad y rol de cada ubicación antes de guardar el plano."
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
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
  return (
    <div className="w-full max-w-[200px] mx-auto overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual
        fuentes={['/manual/email_invitacion.png?v=20260618', '/email_invitacion.png?v=20260618']}
        alt="Correo de invitación enviado por SiGIC"
        etiqueta="Correo de Invitación"
        descripcion="Mensaje que recibe el graduado con la información de la ceremonia y el enlace personal para aceptar o rechazar su participación."
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
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual
        fuentes={['/manual/portal_otp.png?v=20260618', '/portal_otp.png?v=20260618']}
        etiqueta="Acceso del Graduado"
        descripcion="Pantalla de acceso mediante correo institucional y código temporal. Protege la autogestión sin exigir una contraseña permanente."
        className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105"
        alt="Portal de acceso OTP del graduado"
      />
    </div>
  )
}

// ==========================================
// IMAGEN: PANTALLA DE ACEPTACIÓN
// ==========================================
function ScreenPantallaAceptacion() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual fuentes="/manual/pantalla_aceptacion.png?v=20260618" className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Aceptación de participación" etiqueta="Aceptación de participación" descripcion="Confirmación inicial en la que el graduado revisa evento, fecha y sede antes de aceptar o rechazar su asistencia." />
    </div>
  )
}

// ==========================================
// IMAGEN: ACOMPAÑANTES
// ==========================================
function ScreenPanelAcompanantes() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual fuentes="/manual/panel_graduado_acompanantes.png?v=20260618" className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Panel real de acompañantes" etiqueta="Panel de acompañantes" descripcion="Sección donde el graduado registra, consulta y administra a sus familiares invitados respetando el cupo disponible." />
    </div>
  )
}

// ==========================================
// IMAGEN: ENTREGADORES
// ==========================================
function ScreenPanelEntregadores() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual fuentes="/manual/panel_graduado_entregadores.png?v=20260618" className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Panel real de entregadores" etiqueta="Selección de entregadores" descripcion="Pantalla para elegir hasta tres personas autorizadas a participar en la entrega del título durante la ceremonia." />
    </div>
  )
}

// ==========================================
// IMAGEN: CREDENCIAL DIGITAL
// ==========================================
function ScreenCredencialDigital() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual fuentes="/manual/credencial_digital.png?v=20260618" className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105" alt="Credencial digital real de SiGIC" etiqueta="Credencial digital" descripcion="Pase grupal con QR generado al finalizar la inscripción. Identifica al graduado, su ubicación y las personas asociadas para el control de ingreso." />
    </div>
  )
}

// ==========================================
// IMAGEN: CONFIGURACIÓN MÓVIL
// ==========================================
function ScreenMovilConfiguracion() {
  return (
    <div className="w-[120px] mx-auto overflow-hidden rounded-2xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes="/manual/app_movil_configuracion.png"
        className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105"
        alt="Configuración segura de la app"
        etiqueta="Configuración"
        descripcion="Pantalla de configuración técnica del dispositivo..."
      />
    </div>
  )
}

// ==========================================
// IMAGEN: INICIO DE APP MÓVIL
// ==========================================
function ScreenMovilInicio() {
  return (
    <div className="w-[120px] mx-auto overflow-hidden rounded-2xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes="/manual/app_movil_inicio.png"
        className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105"
        alt="Inicio de la app"
        etiqueta="Dashboard"
        descripcion="Dashboard principal de acreditación..."
      />
    </div>
  )
}

// ==========================================
// IMAGEN: ACREDITACIÓN MÓVIL
// ==========================================
function ScreenMovilAcreditacion() {
  return (
    <div className="w-[120px] mx-auto overflow-hidden rounded-2xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes="/manual/app_movil_acreditacion.png"
        className="w-full object-cover object-top transition-transform duration-[2s] group-hover:scale-105"
        alt="Validación de credenciales"
        etiqueta="Acreditación"
        descripcion="Vista de validación del grupo..."
      />
    </div>
  )
}

// ==========================================
// IMAGEN: PANTALLA INASISTENCIA
// ==========================================
function ScreenInasistencia() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg relative group select-none">
      <ImagenManual
        fuentes={['/manual/portal_inasistencia.png?v=20260618', '/portal_inasistencia.png?v=20260618']}
        alt="Confirmación de inasistencia"
        etiqueta="Confirmación de Inasistencia"
        descripcion="Resultado mostrado cuando el graduado rechaza la invitación. La decisión queda registrada para actualizar aforo y planificación."
        className="w-full object-cover object-center hover:scale-[1.02] transition-transform duration-500"
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
  return (
    <div className="w-[85px] mx-auto overflow-hidden rounded-[14px] border-2 border-slate-700 shadow-md bg-slate-50 relative select-none">
      <ImagenManual
        fuentes={['/manual/porteria_wireframe.png?v=20260618', '/porteria_wireframe.png?v=20260618']}
        alt="Escáner QR móvil de portería"
        etiqueta="Control de Ingreso QR"
        descripcion="Vista móvil utilizada por portería para leer la credencial, validar al grupo y confirmar su ingreso junto con la ubicación asignada."
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
      />
    </div>
  )
}

// ==========================================
// WIREFRAME: MAPA DE ASIENTOS
// ==========================================
function WireframeEgresado() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-md relative group select-none">
      <ImagenManual
        fuentes="/manual/panel_graduado_acompanantes.png?v=20260618"
        alt="Portal real del graduado para administrar acompañantes"
        etiqueta="Portal del graduado"
        className="w-full max-h-[150px] object-cover object-top hover:scale-[1.02] transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 z-20 pointer-events-none">
        <span className="text-[8px] font-bold text-white">📸 Portal real de autogestión del graduado</span>
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
  const [direccionPaso, setDireccionPaso] = useState('adelante')
  const [nivelZoom, setNivelZoom] = useState(1.0) // Zoom: 1.0 (100%), 1.2 (120%), 1.4 (140%)
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false)
  const [rutaPortada, setRutaPortada] = useState('/manual/manual_portada.png')
  const [mostrarCredencial, setMostrarCredencial] = useState(false)
  const [urlManual, setUrlManual] = useState('/manual')
  const [imagenAmpliada, setImagenAmpliada] = useState(null)

  // Detectar tamaño de pantalla para la vista de hojas
  useEffect(() => {
    const chequearTamano = () => {
      setEsMovil(window.innerWidth < 1024)
    }
    chequearTamano()
    window.addEventListener('resize', chequearTamano)
    return () => window.removeEventListener('resize', chequearTamano)
  }, [])

  // La credencial siempre apunta a una URL absoluta para que funcione fuera de este dispositivo.
  useEffect(() => {
    setUrlManual(`${window.location.origin}/manual`)
  }, [])

  useEffect(() => {
    const ampliarImagen = (evento) => setImagenAmpliada(evento.detail)
    window.addEventListener('ampliar-imagen-manual', ampliarImagen)
    return () => window.removeEventListener('ampliar-imagen-manual', ampliarImagen)
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
    setDireccionPaso(nuevoPliego > pliegoActual ? 'adelante' : 'atras')
    setEstaAnimando(true)
    setPliegoActual(nuevoPliego)
    setTimeout(() => setEstaAnimando(false), 620)
  }

  const cambiarPaginaMovil = (nuevaPagina) => {
    if (estaAnimando) return
    setDireccionPaso(nuevaPagina > paginaMovil ? 'adelante' : 'atras')
    setEstaAnimando(true)
    setPaginaMovil(nuevaPagina)
    setTimeout(() => setEstaAnimando(false), 620)
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
      <div className="space-y-2">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-1.5 uppercase tracking-wide">
          <List size={16} className="text-[#0056b3]" /> Índice General
        </h3>
        <p className="text-[9.5px] text-slate-500 italic">
          Hacé clic en cualquier sección para saltar directamente a la página:
        </p>
        <div className="grid grid-cols-1 gap-1 pt-1">
          {[
            { t: '1. Acceso y Canales de Inicio', p: 2 },
            { t: '2. Operación Diaria y Ceremonia Activa', p: 2 },
            { t: '3. Carga de Padrón desde Excel', p: 3 },
            { t: '4. Despacho Masivo de Invitaciones', p: 4 },
            { t: '5. Autogestión del Egresado (OTP)', p: 5 },
            { t: '6. Asignación de Butacas y Aforo', p: 6 },
            { t: '7. Configuración de Cuentas de Portería', p: 7 },
            { t: '8. Dashboard de la App Móvil', p: 8 },
            { t: '9. Acreditación de Invitados (Validación)', p: 9 },
            { t: '10. Protocolo de Acreditación QR', p: 10 },
            { t: '11. Acreditación de Emergencia (Manual)', p: 11 },
            { t: '12. Centro de Control y Backups', p: 12 },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => irAPagina(item.p)}
              className="w-full text-left flex justify-between items-center text-[9.5px] font-bold text-slate-600 hover:text-[#0056b3] p-1 rounded-lg hover:bg-slate-50 transition active:scale-98 border border-transparent hover:border-slate-100 cursor-pointer"
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
            <p className="text-[8.5px] text-slate-400 mt-1 leading-snug">El graduado ingresa su correo electrónico o DNI para recibir el código de 6 dígitos en el correo registrado.</p>
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

        <ScreenDisenoAnfiteatro />

        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          Desde <strong>Diseño del Anfiteatro</strong>, el administrador construye la distribución que luego utilizarán los graduados. Puede alternar entre <strong>Platea</strong> y <strong>Pullman</strong>, definir filas, asientos por fila y verificar la capacidad total antes de publicar el plano.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">1. Estructura y aforo</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              Ajustá la cantidad de filas y butacas. El indicador de capacidad se recalcula automáticamente y evita asignaciones por encima del límite configurado.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-0.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">2. Rol de cada butaca</span>
            <p className="text-[9px] text-slate-500 m-0 leading-snug">
              Seleccioná una butaca y marcala como <strong>graduado, autoridad, accesible, reservada, pasillo</strong> o disponible. La leyenda inferior permite comprobar la distribución.
            </p>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-lg p-2 flex gap-2 items-start">
          <CheckCircle2 size={16} className="text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-black text-sky-800 text-[9.5px] uppercase m-0">3. Guardar antes de continuar</h5>
            <p className="m-0 text-slate-500 text-[9px] leading-relaxed mt-0.5">
              Presioná <strong>Guardar</strong> después de cada modificación. La selección de asientos de los graduados utilizará exactamente esta estructura y sus restricciones de accesibilidad.
            </p>
          </div>
        </div>
      </div>
    ),

    // Página 7: Configuración de Portería
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Shield size={16} className="text-[#0056b3]" /> 5. Configuración de Portería
        </h3>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
              El personal de portería utiliza la aplicación móvil <strong>SiGIC Accesos</strong> para controlar y validar los ingresos el día de la ceremonia.
            </p>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1.5 text-[9px]">
              <li><strong>Servidor Institucional:</strong> Ingresá la URL del servidor entregada por la institución (ej: <code className="bg-slate-100 px-1 py-0.2 rounded">https://sigic.com.ar/api</code>).</li>
              <li><strong>Probar y Guardar:</strong> Tocá el botón para comprobar el acceso y conectar con la base de datos central.</li>
              <li><strong>Vinculación Rápida:</strong> También podés configurar el servidor escaneando un código QR de configuración que comience con <code className="bg-slate-100 px-1 py-0.2 rounded">sigic-config:[URL]</code>.</li>
            </ol>
          </div>
          <div className="col-span-5 flex flex-col items-center gap-1">
            <ScreenMovilConfiguracion />
            <span className="text-[7px] text-slate-400 text-center font-bold">Pantalla de Configuración</span>
          </div>
        </div>
      </div>
    ),

    // Página 8: Dashboard de la App Móvil
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Smartphone size={16} className="text-[#0056b3]" /> 6. Dashboard de Portería
        </h3>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
              Una vez vinculado el dispositivo, el operador accede al panel de control de ingresos de la colación:
            </p>
            <ul className="list-disc pl-4 text-slate-500 space-y-1.5 text-[9px]">
              <li><strong>Sesión Activa:</strong> Muestra el nombre del operador autenticado y el servidor conectado.</li>
              <li><strong>Tus Ceremonias:</strong> Listado de colaciones asignadas y habilitadas para el operador.</li>
              <li><strong>Acreditados en Sala:</strong> Contador de invitados en tiempo real que ya cruzaron la portería.</li>
              <li><strong>Abrir Escáner QR:</strong> Botón principal para iniciar la cámara y leer credenciales.</li>
            </ul>
          </div>
          <div className="col-span-5 flex flex-col items-center gap-1">
            <ScreenMovilInicio />
            <span className="text-[7px] text-slate-400 text-center font-bold">Panel Principal de Control</span>
          </div>
        </div>
      </div>
    ),

    // Página 9: Validación y Acreditación de Invitados
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <CheckCircle2 size={16} className="text-[#0056b3]" /> 7. Validación de Credencial
        </h3>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-7 space-y-2">
            <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
              Al escanear un QR válido, la aplicación muestra los detalles del graduado y su grupo de acompañantes:
            </p>
            <ul className="list-disc pl-4 text-slate-500 space-y-1.5 text-[9px]">
              <li><strong>Ficha de Graduado:</strong> Nombre del egresado, legajo, carrera y asiento asignado.</li>
              <li><strong>Acompañantes en Grupo:</strong> Listado con nombre, DNI y relación.</li>
              <li><strong>Ingreso selectivo:</strong> Botón <strong>"Ingresar"</strong> al lado de cada persona para registrar asistencias individuales.</li>
              <li><strong>Acreditación Masiva:</strong> Botón <strong>"Acreditar Todos los Pendientes"</strong> para acelerar el ingreso grupal.</li>
            </ul>
          </div>
          <div className="col-span-5 flex flex-col items-center gap-1">
            <ScreenMovilAcreditacion />
            <span className="text-[7px] text-slate-400 text-center font-bold">Pantalla de Validación</span>
          </div>
        </div>
      </div>
    ),

    // Página 10: Protocolo de Escaneo QR
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <ScanLine size={16} className="text-[#0056b3]" /> 8. Protocolo de Escaneo QR
        </h3>
        <p className="text-slate-500 m-0 text-[9.5px] leading-relaxed">
          El día de la colación, el portero usa la cámara de su celular para escanear el código QR que presenta cada invitado. La respuesta visual es inmediata:
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

    // Página 11: Acreditación de Emergencia
    (
      <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <HelpCircle size={16} className="text-[#0056b3]" /> 9. Acreditaciones de Emergencia
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

    // Página 12: Soporte Técnico y Arquitectura
    (
      <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
          <Server size={16} className="text-[#0056b3]" /> 10. Soporte Técnico
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

    // Página 13: Contraportada
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
    ),

    // Página 14: Contratapa
    (
      <div className="flex flex-col items-center justify-center text-center h-full space-y-2 select-none py-6 bg-slate-900 text-white rounded-r-2xl -mr-6 -my-6 p-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#29ABE2]">SiGIC Acceso Seguro</span>
        <p className="text-[8px] text-slate-400">© 2026 Instituto Tecnológico Beltrán. Todos los derechos reservados.</p>
      </div>
    )
  ]

  // Controles de paso de página
  const paginaSiguiente = () => {
    if (esMovil) {
      if (paginaMovil < 14) cambiarPaginaMovil(paginaMovil + 1)
    } else {
      if (pliegoActual < 7) cambiarPliego(pliegoActual + 1)
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
    <div className="font-sans flex w-full flex-col items-center justify-center px-2 py-4 animate-fade-in sm:py-6">
      {/* Contenedor 3D del Libro */}
      <div
        className="relative group aspect-[46/66] max-w-[460px] select-none cursor-pointer perspective-1200"
        style={{ width: 'min(86vw, 50dvh, 460px)' }}
        onClick={abrirLibro}
      >
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
        <div className="absolute bottom-1 right-[-4px] top-1 w-[5px] bg-slate-100 rounded-r shadow-inner z-[-1] transition-transform duration-500 group-hover:translate-x-[2px]" />
        <div className="absolute bottom-2 right-[-8px] top-2 w-[5px] bg-slate-200 rounded-r shadow-inner z-[-2] transition-transform duration-500 group-hover:translate-x-[4px]" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 sm:gap-3">
        <button
          type="button"
          onClick={() => setMostrarCredencial(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#0056b3] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition hover:bg-[#087fbd] active:scale-95"
        >
          <Badge size={14} /> Generar credencial QR
        </button>
        <button
          onClick={onVolver}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> Volver al Portal
        </button>
      </div>
    </div>
  )

  // Renderiza el libro abierto con controles de zoom y navegación
  const renderLibroAbierto = () => (
    <div className="relative flex min-h-[calc(100dvh-64px)] w-full flex-col items-center justify-start bg-paper animate-fade-in select-none sm:min-h-[calc(100dvh-73px)]">
      
      {/* FLOATING CONTROLS PANEL (OVERLAID ON THE BACKGROUND, NO VERTICAL LAYOUT IMPACT) */}
      <div className="pointer-events-none absolute left-2 right-2 top-2 z-40 flex items-center justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
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
        <div className="pointer-events-auto flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-md backdrop-blur-md sm:gap-1.5 sm:p-1.5">
          <button
            type="button"
            onClick={() => setMostrarCredencial(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#087fbd] text-white text-[9px] font-black uppercase tracking-wider cursor-pointer transition active:scale-95"
            title="Generar credencial con QR"
          >
            <Badge size={12} /> <span className="hidden sm:inline">Credencial QR</span>
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

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
        className="flex w-full items-start justify-start overflow-auto px-1.5 pb-16 pt-14 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 sm:px-4 sm:pt-16"
        style={{ 
          maxHeight: esPantallaCompleta ? '95dvh' : 'calc(100dvh - 64px)',
          width: '100%'
        }}
      >
        {/* WRAPPER FÍSICO CON TAMAÑO ESCALADO REAL */}
        <div
          className="w-full transition-all duration-300 flex items-start justify-center"
          style={{
            width: `${100 * nivelZoom}%`,
            height: esMovil ? 'auto' : `calc((100dvh - 100px) * ${nivelZoom})`,
            position: 'relative',
          }}
        >
          {/* CUERPO DEL LIBRO CON SCALE DINÁMICO */}
          <div
            className="w-full bg-[#fdfdfb] relative overflow-hidden transition-shadow duration-300"
            style={{
              transform: `scale(${nivelZoom})`,
              transformOrigin: 'top left',
              width: `calc(100% / ${nivelZoom})`,
              height: esMovil ? 'auto' : '100%',
              minHeight: esMovil ? 'auto' : 'calc(100dvh - 100px)',
              position: esMovil ? 'relative' : 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <div className={`relative min-h-[calc(100dvh-88px)] flex flex-col lg:flex-row preserve-3d sm:min-h-[calc(100dvh-100px)] ${
              estaAnimando ? (direccionPaso === 'adelante' ? 'animar-hoja-adelante' : 'animar-hoja-atras') : ''
            }`}>
              
              {/* Lomo y Sombra Central (Solo en Desktop) */}
              {!esMovil && (
                <>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3.5 h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-x border-slate-200/40 z-30 pointer-events-none" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-r from-black/0 via-black/5 to-black/0 z-20 pointer-events-none" />
                </>
              )}

              {/* MÓVIL: MUESTRA UNA SOLA PÁGINA */}
              {esMovil ? (
                <div className="flex min-h-[calc(100dvh-88px)] w-full flex-col justify-between bg-paper p-4 sm:min-h-[calc(100dvh-100px)] sm:p-8">
                  <div className="contenido-pagina-manual flex-1">
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
                    <div className="contenido-pagina-manual flex-1">
                      {listaPaginas[(pliegoActual - 1) * 2 + 1]}
                    </div>
                    <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono select-none">
                      <span>SiGIC Manual</span>
                      <span>Pág. {(pliegoActual - 1) * 2 + 1}</span>
                    </div>
                  </div>

                  <div className="w-1/2 bg-paper p-8 flex flex-col justify-between relative page-shadow-right">
                    <div className="contenido-pagina-manual flex-1">
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

      {/* Navegación lateral: ubicada como los controles físicos de un libro */}
      <button
        onClick={paginaAnterior}
        disabled={esMovil ? paginaMovil === 1 : pliegoActual === 1}
        className="absolute left-3 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white/95 text-[#0056b3] shadow-[0_8px_24px_rgba(0,48,120,0.18)] backdrop-blur-md transition hover:-translate-x-1 hover:scale-110 hover:bg-[#0056b3] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-20 lg:flex"
        title="Página anterior"
        aria-label="Página anterior"
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>

      <button
        onClick={paginaSiguiente}
        disabled={esMovil ? paginaMovil === 14 : pliegoActual === 7}
        className="absolute right-3 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white/95 text-[#0056b3] shadow-[0_8px_24px_rgba(0,48,120,0.18)] backdrop-blur-md transition hover:translate-x-1 hover:scale-110 hover:bg-[#0056b3] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-20 lg:flex"
        title="Página siguiente"
        aria-label="Página siguiente"
      >
        <ArrowRight size={20} strokeWidth={2.5} />
      </button>

      {/* En móvil las flechas permanecen juntas y al alcance del pulgar */}
      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-blue-100/80 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(0,48,120,0.16)] backdrop-blur-md lg:hidden">
        <button
          onClick={paginaAnterior}
          disabled={esMovil ? paginaMovil === 1 : pliegoActual === 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0056b3] transition hover:bg-[#0056b3] hover:text-white active:scale-95 disabled:opacity-25"
          aria-label="Página anterior"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="min-w-[58px] text-center font-mono text-[10px] font-black tracking-wide text-slate-600">
          {esMovil ? `${paginaMovil} / 14` : `${pliegoActual} / 7`}
        </span>
        <button
          onClick={paginaSiguiente}
          disabled={esMovil ? paginaMovil === 14 : pliegoActual === 7}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0056b3] transition hover:bg-[#0056b3] hover:text-white active:scale-95 disabled:opacity-25"
          aria-label="Página siguiente"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 font-mono text-[9px] font-black tracking-[0.16em] text-slate-500 shadow-sm backdrop-blur-md lg:block">
        PLIEGO {pliegoActual} DE 7
      </div>

      <style>{`
        @media (max-width: 640px) {
          .contenido-pagina-manual .grid-cols-2,
          .contenido-pagina-manual .grid-cols-12 {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .contenido-pagina-manual .col-span-4,
          .contenido-pagina-manual .col-span-5,
          .contenido-pagina-manual .col-span-7,
          .contenido-pagina-manual .col-span-8 {
            grid-column: 1 / -1 !important;
          }
          .contenido-pagina-manual {
            font-size: 11px;
            line-height: 1.55;
          }
          .contenido-pagina-manual img {
            max-height: none;
          }
        }
      `}</style>
    </div>
  )

  // RENDER ABIERTO / CERRADO CON O SIN HEADER
  if (sinHeader) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        {!estaAbierto ? renderPortadaCerrada() : renderLibroAbierto()}
        {mostrarCredencial && <CredencialManual urlManual={urlManual} onCerrar={() => setMostrarCredencial(false)} />}
        {imagenAmpliada && <ModalImagenManual imagen={imagenAmpliada} onCerrar={() => setImagenAmpliada(null)} />}
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
          .preserve-3d { transform-style: preserve-3d; perspective: 1800px; }
          .animar-hoja-adelante { animation: pasarHojaAdelante 620ms cubic-bezier(.22,.72,.18,1) both; transform-origin: right center; }
          .animar-hoja-atras { animation: pasarHojaAtras 620ms cubic-bezier(.22,.72,.18,1) both; transform-origin: left center; }
          @keyframes pasarHojaAdelante {
            0% { opacity: .35; transform: perspective(1800px) rotateY(-10deg) translateX(14px) scale(.985); filter: brightness(.9); box-shadow: 28px 0 42px rgba(15,23,42,.16); }
            55% { opacity: .9; transform: perspective(1800px) rotateY(2deg) translateX(-2px) scale(.998); }
            100% { opacity: 1; transform: perspective(1800px) rotateY(0) translateX(0) scale(1); filter: brightness(1); box-shadow: none; }
          }
          @keyframes pasarHojaAtras {
            0% { opacity: .35; transform: perspective(1800px) rotateY(10deg) translateX(-14px) scale(.985); filter: brightness(.9); box-shadow: -28px 0 42px rgba(15,23,42,.16); }
            55% { opacity: .9; transform: perspective(1800px) rotateY(-2deg) translateX(2px) scale(.998); }
            100% { opacity: 1; transform: perspective(1800px) rotateY(0) translateX(0) scale(1); filter: brightness(1); box-shadow: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .animar-hoja-adelante, .animar-hoja-atras { animation: none; }
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
      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/75 px-3 py-3 backdrop-blur-md select-none sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onVolver}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-[#29ABE2] hover:bg-[#29ABE2] hover:text-white hover:scale-105 active:scale-95 cursor-pointer sm:h-10 sm:w-10"
            title="Volver al Portal"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-800 sm:text-lg">
              SiGIC <span className="hidden rounded-md border border-[#29ABE2]/25 bg-[#29ABE2]/10 px-2 py-0.5 text-xs font-bold text-[#0056b3] sm:inline">Manual Oficial</span>
            </h1>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:block">Libro Digital e Interactivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setMostrarCredencial(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0056b3] px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#087fbd] hover:shadow-lg active:scale-95 sm:px-4 sm:text-[10px]"
            title="Generar credencial de acceso al manual"
          >
            <Badge size={15} />
            <span className="hidden sm:inline">Generar credencial</span>
          </button>
          <div className="hidden items-center gap-4 text-xs text-slate-500 lg:flex">
            <span>v2.1.0</span>
            <span className="h-4 w-px bg-slate-200" style={{ backgroundColor: '#e2e8f0' }} />
            <span>Instituto Tecnológico Beltrán</span>
          </div>
        </div>
      </header>

      {/* Área del Libro */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
        {!estaAbierto ? renderPortadaCerrada() : renderLibroAbierto()}
      </div>

      {mostrarCredencial && <CredencialManual urlManual={urlManual} onCerrar={() => setMostrarCredencial(false)} />}
      {imagenAmpliada && <ModalImagenManual imagen={imagenAmpliada} onCerrar={() => setImagenAmpliada(null)} />}

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
        .preserve-3d { transform-style: preserve-3d; perspective: 1800px; }
        .animar-hoja-adelante { animation: pasarHojaAdelante 620ms cubic-bezier(.22,.72,.18,1) both; transform-origin: right center; }
        .animar-hoja-atras { animation: pasarHojaAtras 620ms cubic-bezier(.22,.72,.18,1) both; transform-origin: left center; }
        @keyframes pasarHojaAdelante {
          0% { opacity: .35; transform: perspective(1800px) rotateY(-10deg) translateX(14px) scale(.985); filter: brightness(.9); box-shadow: 28px 0 42px rgba(15,23,42,.16); }
          55% { opacity: .9; transform: perspective(1800px) rotateY(2deg) translateX(-2px) scale(.998); }
          100% { opacity: 1; transform: perspective(1800px) rotateY(0) translateX(0) scale(1); filter: brightness(1); box-shadow: none; }
        }
        @keyframes pasarHojaAtras {
          0% { opacity: .35; transform: perspective(1800px) rotateY(10deg) translateX(-14px) scale(.985); filter: brightness(.9); box-shadow: -28px 0 42px rgba(15,23,42,.16); }
          55% { opacity: .9; transform: perspective(1800px) rotateY(-2deg) translateX(2px) scale(.998); }
          100% { opacity: 1; transform: perspective(1800px) rotateY(0) translateX(0) scale(1); filter: brightness(1); box-shadow: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animar-hoja-adelante, .animar-hoja-atras { animation: none; }
        }
      `}</style>
    </main>
  )
}
