'use client'

import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { Search, X, ArrowUpRight, ChevronRight, CalendarDays, Power, LayoutGrid, Clock } from 'lucide-react'
import './menu-inicio.css'

const informacion = {
  bienvenida: ['General', 'Tu espacio de trabajo', 'escritorio home inicio'],
  'gestion-ceremonias': ['Organizar', 'Eventos y fechas', 'inicializar crear evento ceremonia'],
  'gestion-graduados': ['Organizar', 'Padrón e inscripciones', 'alumnos egresados importar excel'],
  convocatoria: ['Organizar', 'Invitaciones y respuestas', 'correo email enviar invitar'],
  'preparacion-ceremonia': ['Organizar', 'Butacas y organización', 'asientos plano preparacion'],
  'control-ingreso': ['Durante el evento', 'Escaneo y asistencia', 'qr porteria acceso escaner'],
  'estado-ceremonia': ['Durante el evento', 'Seguimiento de la ceremonia', 'vivo estado proyeccion'],
  'panel-reportes': ['Durante el evento', 'Resultados y estadísticas', 'informes exportar asistencia'],
  'gestion-profesores': ['Administrar', 'Docentes y entregadores', 'profesores padrinos'],
  'gestion-porteria': ['Administrar', 'Personal y permisos', 'usuarios equipo roles dispositivos seguridad'],
  ajustes: ['Administrar', 'Preferencias del sistema', 'configuracion ajustes'],
  'seleccion-asientos': ['Organizar', 'Distribución del espacio', 'anfiteatro mapa butacas'],
  'operaciones-demo': ['Administrar', 'Herramientas de demostración', 'demo prueba'],
}
const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const MenuInicio = forwardRef(function MenuInicio({ aplicaciones, usuario, ceremonia, ventanas = [], onAbrir, onCerrar, onCerrarSesion }, ref) {
  const [busqueda, setBusqueda] = useState('')
  const buscador = useRef(null)
  useEffect(() => { buscador.current?.focus() }, [])
  const disponibles = aplicaciones.filter(app => app.id !== 'bienvenida')
  const termino = normalizar(busqueda.trim())
  const resultados = disponibles.filter(app => normalizar(`${app.titulo} ${(informacion[app.id] || []).join(' ')}`).includes(termino))
  const ultima = [...ventanas].reverse().map(id => disponibles.find(app => app.id === id)).find(Boolean)
  const continuar = ultima || disponibles.find(app => app.id === (ceremonia ? 'preparacion-ceremonia' : 'gestion-ceremonias'))
  const grupos = ['Organizar', 'Durante el evento', 'Administrar']

  function navegarConTeclado(evento) {
    if (!['ArrowDown', 'ArrowUp'].includes(evento.key)) return
    const botones = [...evento.currentTarget.querySelectorAll('[data-start-app]')]
    if (!botones.length) return
    evento.preventDefault()
    const actual = botones.indexOf(document.activeElement)
    const siguiente = actual < 0 ? (evento.key === 'ArrowDown' ? 0 : botones.length - 1) : (actual + (evento.key === 'ArrowDown' ? 1 : -1) + botones.length) % botones.length
    botones[siguiente].focus()
  }

  function acceso(app) {
    const Icono = app.icono
    const abierto = ventanas.includes(app.id)
    return <button key={app.id} data-start-app onClick={() => onAbrir(app.id)} className="sg-start-app" title={informacion[app.id]?.[1]}>
      <span className={`sg-start-icon ${app.color}`}><Icono size={18} /></span>
      <span className="sg-start-app-copy"><strong>{app.titulo}</strong><small>{informacion[app.id]?.[1]}</small></span>
      {abierto ? <span className="sg-start-open" aria-label="Ventana abierta" title="Ventana abierta" /> : <ChevronRight size={13} className="sg-start-arrow" />}
    </button>
  }

  return <section ref={ref} id="sigic-menu-inicio" className="sigic-start-menu sg-start" role="dialog" aria-label="Menú de inicio" onKeyDown={navegarConTeclado}>
    <header className="sg-start-heading"><span><LayoutGrid size={17} /><strong>Tu espacio de trabajo</strong></span><button onClick={onCerrar} aria-label="Cerrar menú de inicio"><X size={17} /></button></header>
    <div className="sg-start-search"><Search size={17} /><input ref={buscador} aria-label="Buscar módulos" placeholder="Buscar módulos, personas, permisos…" value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && resultados[0]) { e.preventDefault(); onAbrir(resultados[0].id) } }} />{busqueda ? <button aria-label="Limpiar búsqueda" onClick={() => { setBusqueda(''); buscador.current?.focus() }}><X size={15} /></button> : <kbd>Ctrl K</kbd>}</div>
    <div className="sg-start-scroll">
      {!termino && <>
        <div className="sg-start-event"><CalendarDays size={16} /><span><small>Ceremonia activa</small><strong title={ceremonia?.nombre}>{ceremonia?.nombre || 'Todavía no seleccionaste una ceremonia'}</strong></span><button onClick={() => onAbrir('gestion-ceremonias')}>{ceremonia ? 'Cambiar' : 'Elegir'}<ArrowUpRight size={13} /></button></div>
        {continuar && <button className="sg-start-resume" onClick={() => onAbrir(continuar.id)}><Clock size={17} /><span><small>{ultima ? 'Retomar trabajo' : 'Siguiente paso'}</small><strong>{continuar.titulo}</strong></span><ArrowUpRight size={17} /></button>}
      </>}
      {termino ? <div><div className="sg-start-label"><span>Resultados</span><small>{resultados.length} módulos</small></div><div className="sg-start-grid">{resultados.map(acceso)}</div>{!resultados.length && <div className="sg-start-empty"><Search size={25} /><strong>No encontramos ese módulo</strong><span>Probá con «permisos», «QR» o «graduados».</span><button onClick={() => setBusqueda('')}>Ver todos los accesos</button></div>}</div> : grupos.map(grupo => <div key={grupo}><div className="sg-start-label"><span>{grupo}</span></div><div className="sg-start-grid">{disponibles.filter(app => informacion[app.id]?.[0] === grupo).map(acceso)}</div></div>)}
    </div>
    <footer className="sg-start-footer"><span className="sg-start-avatar">{(usuario?.nombre || 'A').slice(0, 1).toUpperCase()}</span><span className="sg-start-user"><strong>{usuario?.nombre || 'Administrativo'}</strong><small>{usuario?.rol === 'PORTERIA' ? 'Portería' : 'Administrativo'}</small></span><button onClick={() => { onAbrir('bienvenida'); onCerrar() }} aria-label="Mostrar escritorio" title="Mostrar escritorio"><LayoutGrid size={17} /></button><button onClick={onCerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión"><Power size={17} /></button></footer>
  </section>
})
