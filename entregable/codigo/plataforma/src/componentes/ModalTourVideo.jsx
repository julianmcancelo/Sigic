import { useState, useEffect } from 'react'
import { X, Play, Pause, ChevronRight, ChevronLeft, ShieldCheck, QrCode, Mail, Users, Armchair, Sparkles } from 'lucide-react'

export function ModalTourVideo({ abierto, alCerrar }) {
  const [pasoActivo, setPasoActivo] = useState(0)
  const [reproduciendo, setReproduciendo] = useState(true)

  const pasos = [
    {
      id: 'invitaciones',
      badge: '01. Convocatoria Inteligente',
      titulo: 'Invitación y Acceso sin Contraseña',
      descripcion: 'El egresado recibe un correo institucional con token de acceso seguro y código OTP temporal. Confirmación en un clic.',
      imagen: '/manual/portal_otp.png',
      icono: Mail,
      color: 'from-sky-500 to-blue-600',
      pill: 'Email + OTP Seguro'
    },
    {
      id: 'anfiteatro',
      badge: '02. Anfiteatro Beltrán',
      titulo: 'Mapa de Butacas y Acompañantes',
      descripcion: 'Selección visual interactiva de ubicaciones numeradas para el graduado y registro de familiares acompañantes.',
      imagen: '/manual/diseno_anfiteatro.png',
      icono: Armchair,
      color: 'from-indigo-500 to-purple-600',
      pill: 'Plano en Tiempo Real'
    },
    {
      id: 'credencial',
      badge: '03. Credencial QR Grupal',
      titulo: 'Pase Digital para el Graduado y su Familia',
      descripcion: 'Generación instantánea de credencial oficial con código QR dinámico criptográfico, lista para presentar desde el celular.',
      imagen: '/manual/credencial_digital.png',
      icono: QrCode,
      color: 'from-emerald-500 to-teal-600',
      pill: 'QR Criptográfico'
    },
    {
      id: 'porteria',
      badge: '04. Acreditación en Puerta',
      titulo: 'Validación en Milisegundos con la App Móvil',
      descripcion: 'El equipo de seguridad escanea el QR en el ingreso al auditorio, validando identidad, butacas y aforo en tiempo real.',
      imagen: '/manual/app_movil_acreditacion.png',
      icono: ShieldCheck,
      color: 'from-amber-500 to-orange-600',
      pill: 'App Móvil Oficial'
    }
  ]

  // Autoplay tipo video (avanza cada 4.5 segundos)
  useEffect(() => {
    if (!abierto || !reproduciendo) return
    const timer = setInterval(() => {
      setPasoActivo(prev => (prev + 1) % pasos.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [abierto, reproduciendo, pasos.length])

  // Reset al abrir
  useEffect(() => {
    if (abierto) {
      setPasoActivo(0)
      setReproduciendo(true)
    }
  }, [abierto])

  if (!abierto) return null

  const paso = pasos[pasoActivo]
  const IconoPaso = paso.icono

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior estilo reproductor de video premium */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-600">
                Recorrido Interactivo Oficial
              </p>
              <h3 className="text-sm font-black text-slate-900">
                ¿Cómo funciona SiGIC en una colación?
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReproduciendo(!reproduciendo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              title={reproduciendo ? 'Pausar recorrido' : 'Reproducir'}
            >
              {reproduciendo ? <Pause size={13} /> : <Play size={13} />}
              <span className="hidden sm:inline">{reproduciendo ? 'Pausa' : 'Play'}</span>
            </button>

            <button
              onClick={alCerrar}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de progreso de video dividida en 4 segmentos */}
        <div className="grid grid-cols-4 gap-1 px-6 pt-3 bg-white">
          {pasos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setPasoActivo(idx)
                setReproduciendo(false)
              }}
              className="group text-left cursor-pointer focus:outline-none"
            >
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    idx === pasoActivo 
                      ? 'bg-sky-600 w-full' 
                      : idx < pasoActivo 
                        ? 'bg-slate-400 w-full' 
                        : 'w-0'
                  }`}
                />
              </div>
              <p className={`mt-1.5 text-[10px] font-bold truncate transition-colors ${
                idx === pasoActivo ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                {p.pill}
              </p>
            </button>
          ))}
        </div>

        {/* Contenido principal: Pantalla / Video Player interactivo */}
        <div className="p-6 overflow-y-auto">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
            <img 
              src={paso.imagen} 
              alt={paso.titulo}
              className="w-full h-full object-contain bg-slate-950/90 transition-transform duration-700 group-hover:scale-[1.01]" 
            />
            
            {/* Overlay sutil informativo en la base de la pantalla */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 text-white flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md text-sky-300 border border-white/10">
                  <IconoPaso size={12} /> {paso.badge}
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-black tracking-tight">{paso.titulo}</h4>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">{paso.descripcion}</p>
            </div>
          </div>
        </div>

        {/* Footer con controles anterior/siguiente y llamada a la acción */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPasoActivo(prev => (prev - 1 + pasos.length) % pasos.length)
                setReproduciendo(false)
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              onClick={() => {
                setPasoActivo(prev => (prev + 1) % pasos.length)
                setReproduciendo(false)
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Paso {pasoActivo + 1} de {pasos.length}
          </p>
        </div>
      </div>
    </div>
  )
}
