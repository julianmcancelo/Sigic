'use client'
import React, { useState } from 'react'
import { GitBranch, Database, Check, Copy } from 'lucide-react'
import { APP_VERSION, BUILD_COMMIT } from '../lib/version'

export function BadgeVersion() {
  const [copiado, setCopiado] = useState(false)
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

  return (
    <aside
      aria-label="Información de compilación del sistema"
      className="fixed bottom-2.5 left-3 z-[9990] select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 transition-all duration-200 group"
    >
      {/* Versión semántica */}
      <span className="font-bold text-slate-700 dark:text-slate-300">
        v{APP_VERSION}
      </span>

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
  )
}
