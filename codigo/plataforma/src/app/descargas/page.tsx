import Link from 'next/link';

export default function DescargasPage() {
  return <main className="min-h-screen bg-[#071923] px-5 py-10 text-white sm:grid sm:place-items-center">
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[.06] p-7 shadow-2xl backdrop-blur sm:p-10">
      <p className="text-[10px] font-black tracking-[.2em] text-cyan-300">SIGIC · DISTRIBUCION OFICIAL</p>
      <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">SiGIC Accesos</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">Aplicacion Android para acreditacion y control de ingresos institucionales.</p>
      <div className="mt-7 rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-5">
        <p className="text-[10px] font-black tracking-[.15em] text-cyan-300">VERSION ACTUAL</p>
        <p className="mt-1 text-xl font-black">v1.0.3+4</p>
        <p className="mt-2 text-xs text-slate-400">Incluye actualizaciones seguras mediante Shorebird.</p>
      </div>
      <a href="/descargas/SIGIC-Porteria-1.0.3.apk" className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300">Descargar APK para Android</a>
      <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Al instalar, Android puede solicitar permiso para instalar aplicaciones desde esta fuente.</p>
      <Link href="https://demo.sigic.com.ar" className="mt-6 block text-center text-xs font-bold text-cyan-300 hover:text-cyan-200">Volver a la demo</Link>
    </section>
  </main>;
}
