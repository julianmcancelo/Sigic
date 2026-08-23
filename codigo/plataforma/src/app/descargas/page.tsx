const opciones = [
  ['Portería Android', 'v1.0.4+5', 'Acreditación QR y control de acceso.', '/descargas/SIGIC-Porteria-1.0.4.apk', 'Descargar APK'],
  ['SiGIC Escritorio', 'v1.0.2', 'Cliente nativo Windows para gestión institucional.', '/descargas/SiGIC-Escritorio-Setup-1.0.2.exe', 'Descargar para Windows'],
  ['Versión web', 'Siempre actualizada', 'Usá SiGIC desde cualquier navegador.', 'https://demo.sigic.com.ar', 'Abrir SiGIC web'],
];

export default function DescargasPage() {
  return <main className="min-h-screen bg-[#061522] px-5 py-10 text-white sm:grid sm:place-items-center"><section className="mx-auto w-full max-w-5xl"><header className="mb-8 text-center"><p className="text-[10px] font-black tracking-[.24em] text-cyan-300">SIGIC · CENTRO DE DESCARGAS</p><h1 className="mt-3 text-4xl font-black">Elegí cómo usar SiGIC</h1><p className="mt-3 text-sm text-slate-300">Aplicaciones oficiales y acceso web institucional.</p></header><div className="grid gap-4 md:grid-cols-3">{opciones.map(([titulo, version, texto, enlace, accion]) => <article key={titulo} className="flex min-h-72 flex-col rounded-3xl border border-white/10 bg-white/[.07] p-6 shadow-xl"><span className="w-fit rounded-full bg-cyan-300/10 px-3 py-1 text-[9px] font-black text-cyan-200">{version}</span><h2 className="mt-5 text-xl font-black">{titulo}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{texto}</p><a href={enlace} className="mt-auto rounded-xl bg-cyan-300 px-4 py-3 text-center text-xs font-black text-slate-950">{accion}</a></article>)}</div></section></main>;
}
