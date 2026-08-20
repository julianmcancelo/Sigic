import Link from 'next/link';

export default function PaginaNoEncontrada() {
  return (
    <main className="simpsons-404">
      <div className="simpsons-cloud cloud-one" />
      <div className="simpsons-cloud cloud-two" />
      <section className="simpsons-card">
        <div className="simpsons-scene" aria-hidden="true">
          <div className="simpsons-hair">MMM</div>
          <div className="simpsons-head">
            <span className="simpsons-eye eye-left" />
            <span className="simpsons-eye eye-right" />
            <span className="simpsons-nose" />
            <span className="simpsons-mouth" />
          </div>
          <div className="simpsons-donut"><span /></div>
        </div>
        <p className="simpsons-kicker">ERROR 404 · SPRINGFIELD</p>
        <h1>¡D&apos;oh!</h1>
        <h2>Esta página desapareció como una rosquilla.</h2>
        <p className="simpsons-copy">La dirección no existe o fue movida. Homero ya está investigando, aunque probablemente esté en la planta nuclear.</p>
        <div className="simpsons-actions">
          <Link href="/">Volver al inicio</Link>
          <Link href="/egresado" className="secondary">Acceso de egresados</Link>
        </div>
        <small>SiGIC · Sector 7-G</small>
      </section>
    </main>
  );
}
