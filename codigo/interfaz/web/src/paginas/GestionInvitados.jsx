import { useState, useEffect } from 'react'
import { Users, ArrowLeft, X, LogOut, Search, Upload, FileJson, FileSpreadsheet, Trash2 } from 'lucide-react'

// Importación de servicios de API
import { 
  obtenerEgresados, 
  eliminarEgresado,
  vaciarEgresados,
  obtenerInvitados, 
  enviarInvitacion 
} from '../servicios/api'

// Importación de componentes modulares
import { StepCard } from '../componentes/StepCard'
import { ModalQR } from '../componentes/ModalQR'
import { ModalLinkRegistro } from '../componentes/ModalLinkRegistro'
import { ModalCredencial } from '../componentes/ModalCredencial'
import { FormularioEgresado } from '../componentes/FormularioEgresado'
import { TarjetaEgresado } from '../componentes/TarjetaEgresado'
import { ModalImportar } from '../componentes/ModalImportar'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

const DARK = '#2A3448'
const ACCENT = '#29ABE2'
const BG = '#F0F4F8'

/**
 * Pantalla principal de administración para la gestión de egresados e invitados.
 * Utiliza una arquitectura modular importando componentes específicos para cada tarea.
 */
export function GestionInvitados({ usuario, onVolver, onCerrarSesion }) {
  // Estados para los datos del sistema
  const [egresados, setEgresados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para controlar la visibilidad de formularios y modales
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [invitadoQR, setInvitadoQR] = useState(null)
  const [linkQR, setLinkQR] = useState(null)
  const [egresadoCredencial, setEgresadoCredencial] = useState(null)
  
  // Estados para el flujo de envío de correos
  const [enviandoId, setEnviandoId] = useState(null)
  const [exitoEnvio, setExitoEnvio] = useState(null)
  
  // Estado para búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('')
  const [egresadosFiltrados, setEgresadosFiltrados] = useState([])

  // Carga inicial de datos al montar el componente
  useEffect(() => { 
    cargarDatos() 
  }, [])

  // Filtrado reactivo de la lista
  useEffect(() => {
    const term = busqueda.toLowerCase().trim()
    if (!term) {
      setEgresadosFiltrados(egresados)
      return
    }
    const filtrados = egresados.filter(e => 
      e.nombre.toLowerCase().includes(term) || 
      e.dni.includes(term) || 
      e.legajo.toLowerCase().includes(term)
    )
    setEgresadosFiltrados(filtrados)
  }, [busqueda, egresados])

  /**
   * Carga egresados e invitados en paralelo desde el servidor.
   */
  async function cargarDatos() { 
    setCargando(true)
    setError('')
    try { 
      const [listaEgr, listaInv] = await Promise.all([obtenerEgresados(), obtenerInvitados()])
      setEgresados(listaEgr)
      setInvitados(listaInv) 
    } catch { 
      setError('Error de conexión al servidor')
    } finally { 
      setCargando(false)
    } 
  }

  /**
   * Maneja el envío del correo de invitación a un egresado.
   */
  async function manejarEnvioInvitacion(egr) {
    if (!egr.correo) {
      alert('Este egresado no tiene un correo electrónico registrado.')
      return
    }
    setEnviandoId(egr.id)
    try {
      await enviarInvitacion(egr.id)
      setExitoEnvio(egr.id)
      setTimeout(() => setExitoEnvio(null), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviandoId(null)
    }
  }

  /**
   * Genera el link de registro y abre el modal correspondiente.
   */
  function manejarLink(egr) { 
    const url = `${window.location.origin}${window.location.pathname}?token=${egr.token}`
    setLinkQR({ egresado: egr, link: url })
  }

  /**
   * Elimina un egresado tras confirmación del usuario.
   */
  async function handleEliminarEgresado(id) { 
    if (!confirm('¿Estás seguro de que deseas eliminar este egresado y todos sus invitados?')) return
    try { 
      await eliminarEgresado(id)
      cargarDatos() 
    } catch (err) { 
      alert(err.message) 
    } 
  }

  /**
   * Elimina TODOS los egresados tras triple confirmación.
   */
  async function handleVaciarBase() {
    if (!confirm('¡ATENCIÓN! ¿Estás seguro de que deseas eliminar TODOS los egresados registrados?')) return;
    if (!confirm('Esta acción no se puede deshacer. Se perderán todos los datos de egresados e invitados.')) return;
    
    try {
      await vaciarEgresados();
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  }

  // Helpers para filtrar invitados vinculados
  const invitadosDe = (id) => invitados.filter(i => i.egresadoId === id)
  const logoInstitucional = '/footer.png'

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <HeaderGlobal 
        titulo="Gestión de Invitados"
        onVolver={onVolver}
        onCerrarSesion={onCerrarSesion}
      />

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* Encabezado Principal y Estadísticas Rápidas */}
        <section className="mb-8 overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 relative">
          {/* Fondo decorativo sutil */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-sky-500/20 rounded-full border border-sky-500/30">
                  <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Panel de Control</span>
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Gestión de Invitados</h1>
              <div className="flex items-center gap-4 text-slate-400">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">{egresados.length} Egresados</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">{invitados.length} Invitados</span>
                 </div>
              </div>
            </div>
            <button 
              onClick={() => setMostrarForm(!mostrarForm)} 
              className={`
                group relative overflow-hidden px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300
                ${mostrarForm ? 'bg-white/10 text-white border border-white/20' : 'bg-sky-500 text-white shadow-xl shadow-sky-500/20 hover:scale-105 active:scale-95'}
              `}
            >
              <span className="relative z-10 flex items-center gap-2">
                {mostrarForm ? 'Cerrar Formulario' : 'Nuevo Egresado'}
                {!mostrarForm && <Users size={16} className="transition-transform group-hover:-translate-y-0.5" />}
              </span>
            </button>
          </div>
        </section>

        {/* Barra de Búsqueda y Acciones Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre, DNI o legajo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setMostrarImportar(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-sky-500/30 hover:text-sky-600 transition-all"
             >
                <Upload size={14} />
                Importar CSV/XLSX
             </button>
             <button 
              onClick={handleVaciarBase}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
              title="Borrar todos los egresados"
             >
                <Trash2 size={14} />
                Vaciar Lista
             </button>
          </div>
        </div>

        {/* Sección de Lista de Egresados */}
        <StepCard 
          titulo={busqueda ? `Resultados (${egresadosFiltrados.length})` : "Egresados Registrados"} 
          icono={Users} 
          accion={<button onClick={cargarDatos} className="text-[11px] text-white/40 hover:text-white transition-colors">Refrescar Lista</button>}
        >
          {/* Formulario de Alta (Condicional) */}
          {mostrarForm && (
            <FormularioEgresado 
              onCreado={() => { setMostrarForm(false); cargarDatos(); }} 
              onCancelar={() => setMostrarForm(false)} 
            />
          )}
          
          {/* Alerta de Error de Conexión */}
          {error && !cargando && (
            <div className="flex items-center gap-3 bg-red-50 p-4 border-b border-red-100 italic">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <X size={16} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-red-800">{error}</p>
                <p className="text-[10px] text-red-600/70">Asegurate de que el servidor backend esté encendido.</p>
              </div>
              <button 
                onClick={cargarDatos} 
                className="ml-auto rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm hover:bg-red-600"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Renderizado de la Lista */}
          {cargando ? (
            <div className="py-20 text-center text-slate-400 font-medium">Cargando base de datos de egresados...</div>
          ) : egresadosFiltrados.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                <Users size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {busqueda ? 'No hay coincidencias' : 'Base de datos vacía'}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                {busqueda ? `No encontramos ningún egresado que coincida con "${busqueda}"` : 'Aún no hay egresados registrados en el sistema. Comienza agregando uno nuevo usando el botón superior.'}
              </p>
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="mt-6 text-sky-500 text-xs font-black uppercase tracking-widest">
                  Limpiar Búsqueda
                </button>
              )}
            </div>
          ) : (
            egresadosFiltrados.map(egr => (
              <TarjetaEgresado 
                key={egr.id}
                egresado={egr}
                invitados={invitadosDe(egr.id)}
                enviandoId={enviandoId}
                exitoEnvio={exitoEnvio}
                onEnviarInvitacion={manejarEnvioInvitacion}
                onCredencial={setEgresadoCredencial}
                onLink={manejarLink}
                onEliminar={handleEliminarEgresado}
                onInvitadoClick={setInvitadoQR}
              />
            ))
          )}
        </StepCard>
      </main>

      {/* Modales de Interacción */}
      {egresadoCredencial && (
        <ModalCredencial 
          egresado={egresadoCredencial} 
          onCerrar={() => setEgresadoCredencial(null)} 
        />
      )}
      
      {linkQR && (
        <ModalLinkRegistro 
          egresado={linkQR.egresado} 
          link={linkQR.link} 
          onCerrar={() => setLinkQR(null)} 
        />
      )}
      
      {invitadoQR && (
        <ModalQR 
          invitado={invitadoQR} 
          onCerrar={() => setInvitadoQR(null)} 
        />
      )}

      {mostrarImportar && (
        <ModalImportar 
          onCerrar={() => setMostrarImportar(false)} 
          onCompletado={cargarDatos}
        />
      )}
    </div>
  )
}
