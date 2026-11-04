import { useState, useRef } from 'react'
import { CheckCircle2, Download, FileText, Printer, ShieldCheck, X } from 'lucide-react'
import { FORMULAS_JURAMENTO } from './graduado/SeccionJuramento'

export function ModalActaCierre({ ceremonia, graduados = [], onCerrar }) {
  const [imprimiendo, setImprimiendo] = useState(false)
  const actaRef = useRef(null)

  const fechaActual = new Date()
  const fechaStr = fechaActual.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const horaStr = fechaActual.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const egresadosAceptados = graduados.filter(g => g.estado === 'ACEPTADO')
  const diplomasEntregados = egresadosAceptados.filter(g => g.diploma_entregado).length
  const ausentes = egresadosAceptados.length - diplomasEntregados

  function imprimirActa() {
    window.print()
  }

  function descargarCsvLibroMatriz() {
    const cabeceras = ['Orden', 'Apellido y Nombre', 'DNI', 'Legajo', 'Carrera', 'Formula Juramento', 'Padrino', 'Diploma Conferido']
    const filas = egresadosAceptados.map((g, idx) => [
      idx + 1,
      `"${g.nombre || ''}"`,
      g.dni || '',
      g.legajo || '',
      `"${g.carrera || 'Tecnicatura Superior'}"`,
      `"${FORMULAS_JURAMENTO[g.formula_juramento]?.titulo || 'Por la Patria'}"`,
      `"${g.entregador_nombre || 'Cuerpo Docente'}"`,
      g.diploma_entregado ? 'SI' : 'NO'
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [cabeceras.join(','), ...filas.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Libro_Matriz_Colacion_${ceremonia?.id || '2026'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* BARRA SUPERIOR (OCULTA AL IMPRIMIR) */}
        <header className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">Acta Oficial de Cierre de Ceremonia</h2>
              <p className="text-[10px] text-slate-400">Documento formal institucional para archivo académico y notarial</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-acta-libro-matriz"
              onClick={descargarCsvLibroMatriz}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Download size={14} /> Libro Matriz (CSV)
            </button>
            <button
              id="btn-acta-imprimir"
              onClick={imprimirActa}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md transition cursor-pointer"
            >
              <Printer size={14} /> Imprimir / Guardar PDF
            </button>
            <button
              id="btn-cerrar-acta-modal"
              onClick={onCerrar}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* DOCUMENTO DEL ACTA (A4 IMPRIMIBLE) */}
        <div ref={actaRef} className="p-8 sm:p-12 overflow-y-auto text-slate-900 font-serif leading-relaxed print:p-6 print:overflow-visible">
          {/* ENCABEZADO FORMAL */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
            <p className="text-[11px] font-sans font-black tracking-[.25em] text-slate-500 uppercase">
              Dirección General de Cultura y Educación · Provincia de Buenos Aires
            </p>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
              Instituto Superior Beltrán
            </h1>
            <p className="text-sm font-sans font-bold text-slate-700 uppercase">
              Acta Protocolar y Notarial de Colación de Grados
            </p>
            <div className="flex justify-center gap-6 text-xs font-sans font-semibold text-slate-500 pt-1">
              <span><strong>Resolución:</strong> RES-BEL-{ceremonia?.id || '2026'}</span>
              <span><strong>Acta N°:</strong> {ceremonia?.id ? String(ceremonia.id).slice(-4) : '0042'}/2026</span>
              <span><strong>Fecha:</strong> {fechaStr}</span>
            </div>
          </div>

          {/* CUERPO DEL ACTA */}
          <div className="mt-8 space-y-4 text-xs sm:text-sm text-justify">
            <p>
              En la ciudad de Avellaneda, Provincia de Buenos Aires, a los <strong>{fechaActual.getDate()}</strong> días del mes de <strong>{fechaActual.toLocaleDateString('es-AR', { month: 'long' })}</strong> del año <strong>{fechaActual.getFullYear()}</strong>, siendo las <strong>{horaStr}</strong> horas, en las instalaciones de <strong>{ceremonia?.lugar || 'Sede Beltrán'}</strong>, se constituye la Mesa Académica presidida por las Autoridades del <strong>Instituto Superior Beltrán</strong> para celebrar el <strong>{ceremonia?.nombre || 'Acto Oficial de Colación de Grados'}</strong>.
            </p>

            <p>
              Abierto el acto solemne, se procedió a la toma de juramento y compromiso profesional de los graduados conforme a las fórmulas reglamentarias elegidas libremente por cada uno de ellos (<em>Fórmula I: Por Dios y la Patria / Fórmula II: Por la Patria</em>), asumiendo el deber ético de poner sus conocimientos al servicio de la sociedad y el bien común.
            </p>

            <p>
              A continuación, se formalizó la entrega pública de diplomas y medallas a los egresados que cumplimentaron la totalidad de las exigencias del plan de estudios, conforme se detalla en el siguiente padrón de colación:
            </p>
          </div>

          {/* TABLA DE GRADUADOS Y JURAMENTOS */}
          <div className="mt-6 border border-slate-300 rounded-xl overflow-hidden font-sans">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-slate-700">
                  <th className="p-2.5 text-center w-12">N°</th>
                  <th className="p-2.5">Graduado / DNI</th>
                  <th className="p-2.5">Carrera / Título</th>
                  <th className="p-2.5">Fórmula de Jura</th>
                  <th className="p-2.5">Padrino</th>
                  <th className="p-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {egresadosAceptados.map((egresado, index) => (
                  <tr key={egresado.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center font-mono font-bold text-slate-500">{index + 1}</td>
                    <td className="p-2.5">
                      <strong className="block text-slate-900 uppercase">{egresado.nombre}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">DNI {egresado.dni} · Legajo {egresado.legajo || '-'}</span>
                    </td>
                    <td className="p-2.5 font-semibold text-slate-700">{egresado.carrera || 'Tecnicatura Superior'}</td>
                    <td className="p-2.5">
                      <span className="font-bold text-slate-800">
                        {FORMULAS_JURAMENTO[egresado.formula_juramento]?.etiquetaCorta || 'Por la Patria'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{egresado.entregador_nombre || 'Cuerpo Docente'}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        egresado.diploma_entregado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {egresado.diploma_entregado ? 'Conferido' : 'Registrado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RESUMEN ESTADÍSTICO */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs flex flex-wrap justify-between gap-4">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Graduados Convocados</span>
              <strong className="text-sm text-slate-800">{egresadosAceptados.length}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Diplomas Conferidos en Estrado</span>
              <strong className="text-sm text-emerald-700">{diplomasEntregados}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Inasistencias Registradas</span>
              <strong className="text-sm text-slate-600">{ausentes}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Sistema de Certificación</span>
              <strong className="text-sm text-sky-700">SiGIC v2.0 · Cripto QR</strong>
            </div>
          </div>

          {/* CIERRE Y BLOQUE DE FIRMAS */}
          <div className="mt-8 text-xs text-justify">
            <p>
              No siendo para más, y en prueba de conformidad de todo lo actuado, se da por finalizado el acto a las <strong>{horaStr}</strong> horas, labrándose la presente acta para constancia en el Libro Matriz de Colaciones, firmando las Autoridades al pie.
            </p>
          </div>

          <div className="mt-16 pt-8 grid grid-cols-3 gap-8 text-center font-sans text-xs">
            <div className="border-t border-slate-800 pt-2">
              <strong className="block font-black text-slate-900 uppercase">Rectoría / Dirección</strong>
              <span className="text-[10px] text-slate-500">Instituto Superior Beltrán</span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <strong className="block font-black text-slate-900 uppercase">Secretaría Académica</strong>
              <span className="text-[10px] text-slate-500">Firma y Sello Oficial</span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <strong className="block font-black text-slate-900 uppercase">Veedor Institucional</strong>
              <span className="text-[10px] text-slate-500">DGCyE Bs. As.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
