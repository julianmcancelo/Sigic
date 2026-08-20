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
      <section className="sigic-boot-center" aria-live="polite">
        <img src="/logo-oficial.png" alt="SiGIC" className="sigic-boot-logo" />
        <span className="sigic-windows-loader" aria-hidden="true" />
        <p className="sigic-boot-status">Preparando SiGIC · {progress}%</p>
      </section>
      <p className="sigic-boot-footer">Entorno de demostración</p>
    </main>
  )
}
