import React from 'react'

export function PantallaCargaInicial({ saliendo = false }) {
  return (
    <main className={`sigic-boot-screen sigic-boot-console sigic-welcome${saliendo ? ' is-leaving' : ''}`}>
      <div className="sigic-boot-noise" aria-hidden="true" />
      
      {/* Resplandor ambiental de fondo */}
      <div className="sigic-boot-glow sigic-boot-glow-one" aria-hidden="true" />
      <div className="sigic-boot-glow sigic-boot-glow-two" aria-hidden="true" />

      <section className="sigic-welcome-content" aria-live="polite" aria-label="Iniciando SiGIC">
        {/* Isotipo con aura de carga Beltrán */}
        <div className="sigic-welcome-mark">
          <span aria-hidden="true" />
          <img src="/logo.png" alt="SiGIC" />
        </div>

        <p>Instituto Tecnológico Beltrán</p>
        <h1>SiGIC</h1>
        <strong>Sistema de Gestión Integral de Colaciones</strong>
        
        {/* Barra de progreso / escaneo fino */}
        <div className="sigic-welcome-line" aria-hidden="true">
          <i />
        </div>

        <small>
          <b /> Plataforma Oficial · Acceso Seguro
        </small>
      </section>

      {/* Pie de pantalla institucional */}
      <footer className="sigic-boot-footer">
        <span>Tecnicatura Superior en Analista de Sistemas</span>
        <span>Conexión institucional cifrada</span>
      </footer>
    </main>
  )
}
