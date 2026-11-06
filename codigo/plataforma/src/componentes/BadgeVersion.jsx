'use client'
import React, { useState } from 'react'
import { GitBranch, Database, Check, Copy } from 'lucide-react'
import { APP_VERSION, BUILD_COMMIT } from '../lib/version'
import { ModalActualizarSigic } from './ModalActualizarSigic'
import { FormularioInicioSesion } from './FormularioInicioSesion'
import { obtenerTokenSesion } from '../lib/api'

export function BadgeVersion() {
  const [copiado, setCopiado] = useState(false)
  const [mostrarActualizador, setMostrarActualizador] = useState(false)
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false)

  const commitUrl = BUILD_COMMIT !== 'local'
    ? `https://github.com/julianmcancelo/Sigic/commit/${BUILD_COMMIT}`
    : 'https://github.com/julianmcancelo/Sigic'

  const copiarHash = (e) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(BUILD_COMMIT)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const handleClicVersion = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Comprobar si ya existe sesión de administrador activa
    const esAdmin = typeof window !== 'undefined' && (
      localStorage.getItem('sesion_admin') === 'true' ||
      Boolean(obtenerTokenSesion() && !obtenerTokenSesion().startsWith('bypass-egresado'))
    )

    if (esAdmin) {
      setMostrarActualizador(true)
    } else {
      setMostrarModalLogin(true)
    }
  }

  return (
    <>
      <aside
        aria-label="Información de compilación del sistema"
        className="fixed bottom-2.5 left-3 z-[9990] select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 transition-all duration-200 group"
      >
        {/* Versión semántica interactiva: abre actualizador o pide login */}
        <button
          type="button"
          onClick={handleClicVersion}
          title="Ver y gestionar actualizaciones de SiGIC"
          className="font-bold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer inline-flex items-center gap-0.5"
        >
          <span>v{APP_VERSION}</span>
        </button>

        <span className="text-slate-300 dark:text-slate-700">·</span>

        {/* Código del commit / push con enlace a GitHub */}
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ver commit ${BUILD_COMMIT} en GitHub`}
          className="flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 font-semibold transition-colors"
        >
          <GitBranch size={11} className="text-slate-400 group-hover:text-sky-500" />
          <span>{BUILD_COMMIT}</span>
        </a>

        {/* Botón copiar hash */}
        <button
          type="button"
          onClick={copiarHash}
          title={copiado ? 'Copiado al portapapeles' : 'Copiar hash del commit'}
          className="opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-opacity ml-0.5 cursor-pointer"
          aria-label="Copiar hash de commit"
        >
          {copiado ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
        </button>

        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>

        {/* Enlace al esquema interactivo de la base de datos */}
        <a
          href="/esquema/index.html"
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir Esquema DER Interactivo de Base de Datos"
          className="hidden sm:inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-sans font-bold text-[9px] uppercase tracking-wider text-slate-400 transition-colors"
        >
          <Database size={10} className="text-indigo-500" />
          <span>Esquema BD</span>
        </a>
      </aside>

      {/* Modal de Actualización Directo */}
      {mostrarActualizador && (
        <ModalActualizarSigic
          abierto={mostrarActualizador}
          onCerrar={() => setMostrarActualizador(false)}
        />
      )}

      {/* Modal de Autenticación Requerida si no está logueado */}
      {mostrarModalLogin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl font-bold text-xs">
                  SiGIC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Acceso de Administrador Requerido</h3>
                  <p className="text-[11px] text-slate-500">Iniciá sesión para gestionar o actualizar el sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalLogin(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <FormularioInicioSesion
              onInicioSesionExitoso={() => {
                localStorage.setItem('sesion_admin', 'true')
                setMostrarModalLogin(false)
                setMostrarActualizador(true)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
