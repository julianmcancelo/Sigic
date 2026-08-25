import { ShieldCheck } from 'lucide-react'

export function LayoutAutenticacion({ children, centrado = false }) {
  return (
    <main className="sigic-auth-console">
      <div className="sigic-boot-noise" aria-hidden="true" />

      <div className={`sigic-auth-shell ${centrado ? 'sigic-auth-shell-centered' : ''}`}>
        {!centrado && <section className="sigic-auth-brand" aria-label="SiGIC">
          <div className="sigic-auth-mark">
            <span aria-hidden="true" />
            <img src="/logo.png" alt="SiGIC" />
          </div>
          <p className="sigic-auth-kicker">Acceso institucional</p>
          <h1>SiGIC</h1>
          <p className="sigic-auth-copy">Sistema integral de gestión institucional para ceremonias de colación.</p>
          <div className="sigic-auth-security"><ShieldCheck size={14} aria-hidden="true" /> Conexión segura</div>
        </section>}

        <section className="sigic-auth-card" aria-label="Inicio de sesión">
          {children}
        </section>
      </div>

      <footer className="sigic-auth-footer">
        <span>Instituto Tecnológico Beltrán</span>
        <span>Acceso protegido</span>
      </footer>
    </main>
  )
}
