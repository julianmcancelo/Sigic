'use client'

import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { Search, X, CalendarDays, Power, LayoutGrid, Clock, LayoutDashboard, Sparkles, ChevronRight } from 'lucide-react'
import { AnimatedThemeToggler } from './AnimatedThemeToggler'
import { esAutoridadCancelo } from '../lib/autoridad-cancelo'
import './menu-inicio.css'

const informacion = {
  bienvenida: ['Inicio', 'Resumen general', 'escritorio home inicio dashboard'],
  'gestion-ceremonias': ['Ceremonias', 'Gestión de actos y fechas', 'crear evento ceremonia'],
  'gestion-graduados': ['Padrón', 'Graduados e inscripciones', 'alumnos egresados importar excel'],
  convocatoria: ['Invitaciones', 'Despacho de correos', 'correo email invitar'],
  'preparacion-ceremonia': ['Preparación', 'Organización del evento', 'asientos plano'],
  'despacho-credenciales': ['Credenciales', 'Pases QR digitales', 'credenciales pases qr'],
  'control-ingreso': ['Acreditación', 'Control de ingreso en puerta', 'qr porteria acceso escaner'],
  'estado-ceremonia': ['En vivo', 'Seguimiento en directo', 'vivo estado proyeccion'],
  'panel-reportes': ['Reportes', 'Métricas y estadísticas', 'informes exportar asistencia'],
  'gestion-profesores': ['Docentes', 'Padrinos y profesores', 'profesores padrinos'],
  'gestion-porteria': ['Seguridad', 'Personal de acreditación', 'usuarios roles dispositivos'],
  ajustes: ['Ajustes', 'Preferencias del sistema', 'configuracion'],
  'seleccion-asientos': ['Anfiteatro', 'Mapa de butacas', 'anfiteatro mapa butacas'],
  'manual-usuario': ['Manual', 'Documentación oficial', 'manual ayuda soporte guia'],
  'acerca-de': ['Acerca de', 'Instituto Beltrán', 'acerca de version equipo'],
  'actualizar-sigic': ['Actualizar', 'Actualización del sistema', 'update parche version'],
  'landing-page': ['Portal Público', 'Vista del evento', 'landing evento web'],
  'operaciones-demo': ['Simulación', 'Herramientas de prueba', 'demo'],
}

const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const MenuInicio = forwardRef(function MenuInicio({ 
  aplicaciones = [], 
  usuario, 
  ceremonia, 
  ventanas = [], 
  onAbrir, 
  onCerrar, 
  onCerrarSesion, 
  onCambiarEstiloInterfaz, 
  onCambiarVersion, 
  versionAdmin,
  esModal = false
}, ref) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const buscador = useRef(null)

  useEffect(() => { 
    buscador.current?.focus() 
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCerrar])

  const disponibles = aplicaciones.filter(app => app.id !== 'bienvenida' && (app.id !== 'centro-control' || esAutoridadCancelo(usuario)))
  const termino = normalizar(busqueda.trim())

  const categorias = [
    { id: 'todos', label: 'Todo' },
    { id: 'organizacion', label: 'Organización', apps: ['gestion-ceremonias', 'gestion-graduados', 'convocatoria', 'preparacion-ceremonia', 'despacho-credenciales', 'seleccion-asientos'] },
    { id: 'evento', label: 'En el Acto', apps: ['control-ingreso', 'estado-ceremonia', 'panel-reportes'] },
    { id: 'sistema', label: 'Ajustes', apps: ['gestion-profesores', 'gestion-porteria', 'ajustes', 'actualizar-sigic', 'manual-usuario', 'acerca-de'] },
  ]

  let listaFiltrada = disponibles
  if (termino) {
    listaFiltrada = disponibles.filter(app => normalizar(`${app.titulo} ${(informacion[app.id] || []).join(' ')}`).includes(termino))
  } else if (categoriaActiva !== 'todos') {
    const cat = categorias.find(c => c.id === categoriaActiva)
    if (cat?.apps) {
      listaFiltrada = disponibles.filter(app => cat.apps.includes(app.id))
    }
  }

  function acceso(app) {
    const Icono = app.icono
    const abierto = ventanas.includes(app.id)
    return (
      <button 
        key={app.id} 
        data-start-app 
        onClick={() => { onAbrir(app.id); if (esModal) onCerrar?.() }} 
        className="sg-chill-card" 
        title={informacion[app.id]?.[1]}
      >
        <div className="sg-chill-icon">
          <Icono size={18} />
        </div>
        <div className="sg-chill-text">
          <div className="sg-chill-title">{app.titulo}</div>
          <div className="sg-chill-desc">{informacion[app.id]?.[1]}</div>
        </div>
        {abierto && <span className="sg-chill-badge-live" title="Módulo activo" />}
      </button>
    )
  }

  const contenidoMenu = (
    <section 
      ref={ref} 
      id="sigic-menu-inicio" 
      className={`sg-chill-container ${esModal ? 'sg-chill-modal' : ''}`} 
      role="dialog" 
      aria-label="Espacio de trabajo" 
      onClick={e => e.stopPropagation()}
    >
      {/* Header relajado */}
      <div className="sg-chill-header">
        <div className="sg-chill-brand">
          <div className="sg-chill-logo">
            <LayoutGrid size={15} />
          </div>
          <div>
            <h3>Espacio de Trabajo</h3>
            <p>Acceso rápido a los módulos de SiGIC</p>
          </div>
        </div>
        <button onClick={onCerrar} className="sg-chill-close" aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>

      {/* Buscador minimalista */}
      <div className="sg-chill-search-box">
        <Search size={15} className="sg-chill-search-icon" />
        <input 
          ref={buscador} 
          placeholder="Escribí para filtrar módulos..." 
          value={busqueda} 
          onChange={e => setBusqueda(e.target.value)} 
          onKeyDown={e => { 
            if (e.key === 'Enter' && listaFiltrada[0]) { 
              e.preventDefault(); 
              onAbrir(listaFiltrada[0].id); 
              if (esModal) onCerrar?.() 
            } 
          }} 
        />
        {busqueda ? (
          <button onClick={() => { setBusqueda(''); buscador.current?.focus() }}>
            <X size={14} />
          </button>
        ) : (
          <span className="sg-chill-kbd">ESC para salir</span>
        )}
      </div>

      {/* Pestañas de categoría limpias (cuando no hay búsqueda) */}
      {!termino && (
        <div className="sg-chill-tabs">
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`sg-chill-tab ${categoriaActiva === cat.id ? 'activo' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Tarjeta de Ceremonia Actual (Sutil) */}
      {ceremonia && !termino && (
        <div className="sg-chill-event-banner">
          <div className="sg-chill-event-info">
            <CalendarDays size={14} />
            <span>Ceremonia: <strong>{ceremonia.nombre}</strong></span>
          </div>
          <button onClick={() => onAbrir('gestion-ceremonias')}>
            Cambiar
          </button>
        </div>
      )}

      {/* Grilla limpia y espaciosa */}
      <div className="sg-chill-scroll">
        <div className="sg-chill-grid">
          {listaFiltrada.map(acceso)}
        </div>

        {!listaFiltrada.length && (
          <div className="sg-chill-empty">
            <Search size={24} />
            <p>No se encontraron módulos con «{busqueda}»</p>
            <button onClick={() => setBusqueda('')}>Restablecer búsqueda</button>
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <div className="sg-chill-footer">
        <div className="sg-chill-user">
          <div className="sg-chill-avatar">
            {(usuario?.nombre || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="sg-chill-user-meta">
            <span className="sg-chill-user-name">{usuario?.nombre || 'Administrador'}</span>
            <span className="sg-chill-user-role">{usuario?.rol === 'PORTERIA' ? 'Control de Portería' : 'Gestión Institucional'}</span>
          </div>
        </div>

        <div className="sg-chill-actions">
          <AnimatedThemeToggler size="sm" />
          <button 
            onClick={() => { onAbrir('bienvenida'); onCerrar?.() }} 
            className="sg-chill-btn" 
            title="Ver inicio"
          >
            <LayoutGrid size={15} />
          </button>
          <button 
            onClick={onCerrarSesion} 
            className="sg-chill-btn danger" 
            title="Cerrar sesión"
          >
            <Power size={15} />
          </button>
        </div>
      </div>
    </section>
  )

  if (esModal) {
    return (
      <div className="sg-chill-backdrop" onClick={onCerrar}>
        {contenidoMenu}
      </div>
    )
  }

  return contenidoMenu
})
