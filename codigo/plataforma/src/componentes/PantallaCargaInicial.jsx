import { useEffect, useState } from 'react'

export function PantallaCargaInicial() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(value => value >= 96 ? 96 : Math.min(value + Math.floor(Math.random() * 6) + 2, 96))
    }, 190)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="sigic-boot-screen">
      <div className="sigic-boot-glow sigic-boot-glow-one" />
      <div className="sigic-boot-glow sigic-boot-glow-two" />
      <section className="sigic-boot-center sigic-boot-compact">
        <div className="sigic-boot-logo-wrap"><img src="/logo-oficial.png" alt="Logo de SIGIC" className="sigic-boot-logo" /><span className="sigic-boot-ring" /></div>
        <p className="sigic-boot-brand">SIGIC</p>
        <p className="sigic-boot-subtitle">Iniciando tu espacio de trabajo</p>
        <div className="sigic-boot-progress"><div style={{ width: `${progress}%` }} /></div>
        <div className="sigic-boot-status"><span>Preparando el sistema...</span><strong>{progress}%</strong></div>
      </section>
      <div className="sigic-boot-footer"><span>Instituto Tecnológico Beltrán</span><span>SIGIC · 2026</span></div>
    </main>
  )
}
