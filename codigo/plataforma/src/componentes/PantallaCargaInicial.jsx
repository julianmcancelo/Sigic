export function PantallaCargaInicial({ saliendo = false }) {
  return (
    <main className={`sigic-boot-screen sigic-boot-console sigic-welcome${saliendo ? ' is-leaving' : ''}`}>
      <div className="sigic-boot-noise" aria-hidden="true" />
      <section className="sigic-welcome-content" aria-live="polite" aria-label="Bienvenido a SiGIC">
        <div className="sigic-welcome-mark">
          <span aria-hidden="true" />
          <img src="/logo.png" alt="SiGIC" />
        </div>
        <p>Gestión institucional</p>
        <h1>SiGIC</h1>
        <strong>Tu ceremonia comienza acá</strong>
        <div className="sigic-welcome-line" aria-hidden="true"><i /></div>
        <small><b /> Acceso seguro habilitado</small>
      </section>
      <aside className="sigic-welcome-panel" aria-hidden="true">
        <i /><strong /><span /><span /><button />
      </aside>
      <footer className="sigic-boot-footer">
        <span>Instituto Tecnológico Beltrán</span>
        <span>Conexión segura</span>
      </footer>
    </main>
  )
}
