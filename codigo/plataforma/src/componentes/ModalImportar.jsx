import React, { useState } from 'react'
import { X, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, ShieldAlert, Download, Trash2, Check, Sparkles } from 'lucide-react'
import * as XLSX from 'xlsx'
import { importarGraduadosMasivo } from '../servicios/api'
import { obtenerDatosDemoActuales } from '../lib/generador-datos-demo'

export function ModalImportar({ onCerrar, onCompletado }) {
  const [archivo, setArchivo] = useState(null)
  const [previsualizacion, setPrevisualizacion] = useState([])
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const cargarPadronDemo = () => {
    const datos = obtenerDatosDemoActuales()
    const cohorte = Array.isArray(datos?.graduados) && datos.graduados.length > 0
      ? datos.graduados
      : [
          { nombre: 'García Juan Manuel', dni: '40123456', legajo: 'BEL-2024-001', correo: 'juan.garcia@sigic.demo.ar', carrera: 'Desarrollo de Software', anio_inscripcion: 2024, promedio: 8.9 },
          { nombre: 'Martínez Lucía Belén', dni: '41234567', legajo: 'BEL-2024-002', correo: 'lucia.martinez@sigic.demo.ar', carrera: 'Automatización y Robótica', anio_inscripcion: 2024, promedio: 9.4 },
          { nombre: 'Rodríguez Matías', dni: '39987654', legajo: 'BEL-2024-003', correo: 'matias.rodriguez@sigic.demo.ar', carrera: 'Redes e Infraestructura', anio_inscripcion: 2024, promedio: 8.7 }
        ]

    const mapeado = cohorte.map(g => ({
      nombre: g.nombre,
      dni: String(g.dni),
      legajo: String(g.legajo),
      correo: g.correo,
      promedio: g.promedio || 8.5,
      carrera: g.carrera,
      anio_inscripcion: g.anio_inscripcion || 2023
    }))

    setArchivo({ name: 'Padron_Oficial_Cohorte_Beltran.xlsx' })
    setPrevisualizacion(mapeado)
  }

  const manejarArchivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        
        // Mapeo flexible de columnas
        const mapeado = data.map(row => ({
          nombre: row.nombre || row.Nombre || row.NOMBRE || row['Nombre Completo'] || '',
          dni: String(row.dni || row.DNI || row.documento || row.Documento || '').trim(),
          legajo: String(row.legajo || row.Legajo || row.LEGAJO || '').trim(),
          correo: String(row.correo || row.Correo || row.email || row.Email || '').trim(),
          promedio: row.promedio || row.Promedio || row.PROMEDIO || '',
          carrera: row.carrera || row.Carrera || row.CARRERA || '',
          anio_inscripcion: row.anio_inscripcion || row['Año de Inscripción'] || row['año'] || row['Año'] || row.AÑO || row.anio || row.Anio || ''
        })).filter(r => r.nombre && (r.dni || r.legajo))

        setPrevisualizacion(mapeado)
      } catch (err) {
        alert('Error al leer el archivo. Asegúrate de que sea CSV, XLSX o XLS válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportar = async () => {
    if (previsualizacion.length === 0) return
    setProcesando(true)
    try {
      const res = await importarGraduadosMasivo(previsualizacion)
      setResultado(res)
      if (res.exitosos && res.exitosos.length > 0) onCompletado()
    } catch (err) {
      alert(err.message || 'Error al procesar la importación masiva.')
    } finally {
      setProcesando(false)
    }
  }

  const descargarPlantilla = () => {
    const datosEjemplo = [
      { 'Nombre Completo': 'García Juan Manuel', 'DNI': '40123456', 'Legajo': 'LEG-2024-001', 'Correo': 'juan.garcia@gmail.com', 'Carrera': 'Desarrollo de Software', 'Año': 2024 },
      { 'Nombre Completo': 'Martínez Lucía Belén', 'DNI': '41234567', 'Legajo': 'LEG-2024-002', 'Correo': 'lucia.martinez@gmail.com', 'Carrera': 'Automatización y Robótica', 'Año': 2024 },
      { 'Nombre Completo': 'Rodríguez Matías', 'DNI': '39987654', 'Legajo': 'LEG-2024-003', 'Correo': 'matias.rodriguez@gmail.com', 'Carrera': 'Redes e Infraestructura', 'Año': 2024 },
    ]
    const ws = XLSX.utils.json_to_sheet(datosEjemplo)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Graduados')
    XLSX.writeFile(wb, 'Plantilla_Padron_SiGIC.xlsx')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-400" size={18} />
              Importar Padrón de Graduados
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Carga Masiva · Excel / CSV</p>
          </div>
          <button 
            id="btn-cerrar-modal-importar"
            onClick={onCerrar} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 [scrollbar-width:thin]">
          {!resultado ? (
            <>
              {/* Barra de plantilla */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                <div>
                  <p className="text-xs font-black text-sky-950">Padrón Oficial y Plantilla Modelo</p>
                  <p className="text-[10px] text-sky-700 font-medium">Carga directa de cohorte o formato Excel con encabezados.</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="btn-cargar-planilla-modelo"
                    type="button"
                    onClick={cargarPadronDemo}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[10.5px] font-black shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={12} /> Cargar Padrón Modelo (12 Alumnos)
                  </button>
                  <button
                    type="button"
                    onClick={descargarPlantilla}
                    className="flex items-center gap-1 bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Download size={11} /> .xlsx
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              {!archivo ? (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls, .json" 
                    onChange={manejarArchivo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center group-hover:border-emerald-500 transition bg-slate-50/50 group-hover:bg-emerald-50/20 cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-xs flex items-center justify-center mb-2 text-emerald-600 group-hover:scale-110 transition-transform">
                      <Upload size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800">
                      Hacé clic o arrastrá tu planilla Excel aquí
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Formatos: .XLSX, .CSV, .XLS</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{archivo.name}</p>
                      <p className="text-[10px] font-bold text-emerald-700">{previsualizacion.length} registros listos para importar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10.5px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition">
                      Cambiar
                      <input 
                        type="file" 
                        accept=".csv, .xlsx, .xls, .json" 
                        onChange={manejarArchivo}
                        className="hidden"
                      />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setArchivo(null); setPrevisualizacion([]); }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Quitar archivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Previsualización */}
              {previsualizacion.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                      Previsualización ({previsualizacion.length} estudiantes)
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Mostrando primeros 5</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9.5px] border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Nombre</th>
                          <th className="py-2 px-3">DNI</th>
                          <th className="py-2 px-3">Legajo</th>
                          <th className="py-2 px-3">Correo</th>
                          <th className="py-2 px-3">Carrera</th>
                          <th className="py-2 px-3">Año</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {previsualizacion.slice(0, 5).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{r.nombre}</td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.dni || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.legajo || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.correo || <span className="text-amber-600 italic text-[10px]">Sin correo</span>}</td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.carrera || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.anio_inscripcion || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previsualizacion.length > 5 && (
                      <div className="py-1.5 px-3 bg-slate-50 text-center text-[10px] font-bold text-slate-400">
                        + {previsualizacion.length - 5} registros adicionales listos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Resultado del Proceso */
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-2xl font-black text-emerald-600">{resultado.exitosos?.length || 0}</p>
                  <p className="text-[9px] font-black uppercase text-emerald-800 tracking-wider mt-1">Registrados</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                  <p className="text-2xl font-black text-amber-600">{resultado.conflictos?.length || 0}</p>
                  <p className="text-[9px] font-black uppercase text-amber-800 tracking-wider mt-1">Conflictos</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <p className="text-2xl font-black text-rose-600">{resultado.errores || 0}</p>
                  <p className="text-[9px] font-black uppercase text-rose-800 tracking-wider mt-1">Errores</p>
                </div>
              </div>

              {resultado.conflictos && resultado.conflictos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <ShieldAlert size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-wider">Registros ignorados (Preexistentes)</h4>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {resultado.conflictos.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[10.5px]">
                        <div>
                          <p className="font-bold text-slate-800">{c.egresado}</p>
                          <p className="text-slate-400 text-[9.5px]">DNI: {c.dni}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[8.5px] font-black uppercase">{c.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          {!resultado ? (
            <>
              <button 
                type="button"
                onClick={onCerrar} 
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                id="btn-confirmar-importacion-masiva"
                type="button"
                onClick={handleImportar}
                disabled={procesando || previsualizacion.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-4 rounded-xl shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {procesando ? (
                  <>Procesando...</>
                ) : (
                  <>
                    <Check size={14} /> Comenzar Importación ({previsualizacion.length})
                  </>
                )}
              </button>
            </>
          ) : (
            <button 
              id="btn-finalizar-importacion"
              type="button"
              onClick={onCerrar}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              Finalizar y Ver Padrón
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
