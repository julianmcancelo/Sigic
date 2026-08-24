import { useEffect, useState } from 'react'

const ETAPAS = [
  'Conectando con el entorno operativo',
  'Verificando configuración de ceremonia',
  'Sincronizando accesos y credenciales',
  'Preparando el espacio de trabajo',
]

export function PantallaCargaInicial() {
  const [progress, setProgress] = useState(0)
  const [etapa, setEtapa] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(value => {
        const siguiente = value >= 94 ? 94 : Math.min(value + Math.floor(Math.random() * 5) + 2, 94)
        setEtapa(Math.min(ETAPAS.length - 1, Math.floor(siguiente / 25)))
        return siguiente
      })
    }, 220)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="sigic-boot-screen sigic-boot-console">
      <div className="sigic-boot-noise" aria-hidden="true" />

      <section className="sigic-boot-center" aria-live="polite" aria-label="Iniciando SiGIC">
        <div className="sigic-boot-mark">
          <span className="sigic-boot-mark-orbit" aria-hidden="true" />
          <img src="/logo.png" alt="SiGIC" className="sigic-boot-logo" />
        </div>

        <div className="sigic-boot-title">
          <strong>SiGIC</strong>
          <span>Sistema integral de gestión institucional</span>
        </div>

        <div className="sigic-boot-terminal">
          <p className="sigic-boot-terminal-title">[ INICIANDO PLATAFORMA SIGIC ]</p>
          <div className="sigic-boot-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="sigic-boot-terminal-line">&gt; {ETAPAS[etapa]}<i /></p>
          <p className="sigic-boot-terminal-line is-muted">&gt; Entorno seguro disponible</p>
          <p className="sigic-boot-terminal-line is-muted">&gt; Acceso administrativo protegido</p>
        </div>
      </section>

      <footer className="sigic-boot-footer">
        <span>SiGIC · Entorno de demostración</span>
        <span>Inicialización segura</span>
      </footer>
    </main>
  )
}
