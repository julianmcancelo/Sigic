import React, { useState } from 'react'
import { X, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Download, Trash2, Check, Sparkles } from 'lucide-react'
import * as XLSX from 'xlsx'
import { importarProfesoresMasivo } from '../servicios/api'

export function ModalImportarProfesores({ onCerrar, onCompletado, profesoresExistentes = [] }) {
  const [archivo, setArchivo] = useState(null)
  const [previsualizacion, setPrevisualizacion] = useState([])
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const dnisExistentes = new Set(
    (profesoresExistentes || []).map(p => String(p.dni || '').replace(/\D/g, '')).filter(Boolean)
  )

  const cargarDocentesDemo = () => {
    const plantelModelo = [
      { nombre: 'Lic. Mariano Benítez', dni: '28456123', carrera: 'Desarrollo de Software', materia: 'Programación III' },
      { nombre: 'Ing. Valeria Rossi', dni: '31987654', carrera: 'Desarrollo de Software', materia: 'Bases de Datos' },
      { nombre: 'Prof. Carlos Méndez', dni: '25678912', carrera: 'Análisis de Sistemas', materia: 'Análisis de Sistemas II' },
      { nombre: 'Ing. Laura Gómez', dni: '33456789', carrera: 'Redes y Telecomunicaciones', materia: 'Seguridad de la Información' },
      { nombre: 'Lic. Fernando Morales', dni: '29876543', carrera: 'Administración General', materia: 'Planeamiento Estratégico' },
      { nombre: 'Dra. Silvina Álvarez', dni: '27123987', carrera: 'Higiene y Seguridad', materia: 'Seguridad Laboral I' },
      { nombre: 'Ing. Diego Fernández', dni: '32543210', carrera: 'Desarrollo de Software', materia: 'Sistemas Operativos' },
      { nombre: 'Lic. Patricia Romero', dni: '30432198', carrera: 'Administración General', materia: 'Costos y Presupuestos' }
    ]

    setArchivo({ name: 'Plantel_Docente_Modelo_Beltran.xlsx' })
    setPrevisualizacion(plantelModelo)
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
        const mapeado = data.map(row => {
          const nombre = row.nombre || row.Nombre || row.NOMBRE || row['Nombre Completo'] || row.profesor || row.Docente || ''
          const dni = String(row.dni || row.DNI || row.documento || row.Documento || '').trim()
          const carrera = row.carrera || row.Carrera || row.CARRERA || row.Departamento || ''
          const materia = row.materia || row.Materia || row.MATERIA || row.Asignatura || ''

          return {
            nombre: String(nombre).trim(),
            dni,
            carrera: String(carrera).trim(),
            materia: String(materia).trim()
          }
        }).filter(r => r.nombre)

        setPrevisualizacion(mapeado)
      } catch (err) {
        alert('Error al leer el archivo. Asegúrate de que sea CSV o XLSX válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportar = async () => {
    if (previsualizacion.length === 0) return
    setProcesando(true)
    try {
      const res = await importarProfesoresMasivo(previsualizacion)
      setResultado(res)
    } catch (err) {
      alert(err.message || 'Error al procesar la importación masiva.')
    } finally {
      setProcesando(false)
    }
  }

  const descargarPlantilla = () => {
    const datosEjemplo = [
      { 'Nombre Completo': 'Lic. Mariano Benítez', 'DNI': '28456123', 'Carrera': 'Desarrollo de Software', 'Materia': 'Programación III' },
      { 'Nombre Completo': 'Ing. Valeria Rossi', 'DNI': '31987654', 'Carrera': 'Desarrollo de Software', 'Materia': 'Bases de Datos' },
      { 'Nombre Completo': 'Prof. Carlos Méndez', 'DNI': '25678912', 'Carrera': 'Análisis de Sistemas', 'Materia': 'Análisis de Sistemas II' },
      { 'Nombre Completo': 'Ing. Laura Gómez', 'DNI': '33456789', 'Carrera': 'Redes y Telecomunicaciones', 'Materia': 'Seguridad de la Información' }
    ]
    const ws = XLSX.utils.json_to_sheet(datosEjemplo)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Docentes')
    XLSX.writeFile(wb, 'Plantilla_Docentes_SiGIC.xlsx')
  }

  const conteoExistentes = previsualizacion.filter(r => {
    const d = String(r.dni || '').replace(/\D/g, '')
    return d && dnisExistentes.has(d)
  }).length
  const conteoNuevos = previsualizacion.length - conteoExistentes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-400" size={18} />
              Importar Docentes y Padrinos
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Carga Masiva · Plantel Académico</p>
          </div>
          <button 
            id="btn-cerrar-modal-importar-docentes"
            onClick={() => {
              if (resultado?.ok) onCompletado()
              else onCerrar()
            }} 
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
                  <p className="text-xs font-black text-sky-950">Plantel Modelo y Plantilla Excel</p>
                  <p className="text-[10px] text-sky-700 font-medium">Subí tu archivo .xlsx o probá con el plantel institucional de prueba.</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="btn-cargar-docentes-demo"
                    type="button"
                    onClick={cargarDocentesDemo}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[10.5px] font-black shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={12} /> Cargar Plantel Modelo (8)
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
                <label className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50 hover:bg-sky-50/20 transition-all cursor-pointer group">
                  <div className="p-3 bg-white group-hover:scale-105 transition shadow-xs rounded-xl text-sky-500 border border-slate-100">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      Arrastrá o hacé clic para subir la planilla docente
                    </p>
                    <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                      Soporta archivos XLSX, XLS y CSV (con columnas Nombre, DNI, Carrera, Materia)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls" 
                    onChange={manejarArchivo}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="text-emerald-600 shrink-0" size={24} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{archivo.name}</p>
                      <p className="text-[10px] text-slate-400">{previsualizacion.length} docentes detectados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10.5px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition">
                      Cambiar
                      <input 
                        type="file" 
                        accept=".csv, .xlsx, .xls" 
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
                      Previsualización ({previsualizacion.length} profesores)
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="text-emerald-700 font-black">{conteoNuevos} nuevos</span>
                      {conteoExistentes > 0 && (
                        <span className="text-amber-700 font-black">· {conteoExistentes} actualizarán datos</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9.5px] border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Estado</th>
                          <th className="py-2 px-3">Nombre</th>
                          <th className="py-2 px-3">DNI</th>
                          <th className="py-2 px-3">Carrera</th>
                          <th className="py-2 px-3">Materia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {previsualizacion.slice(0, 8).map((r, i) => {
                          const d = String(r.dni || '').replace(/\D/g, '')
                          const yaExiste = Boolean(d && dnisExistentes.has(d))
                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 whitespace-nowrap">
                                {yaExiste ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    Actualizar
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Nuevo
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{r.nombre}</td>
                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.dni || '-'}</td>
                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.carrera || '-'}</td>
                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{r.materia || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {previsualizacion.length > 8 && (
                    <p className="text-[10px] text-slate-400 text-center font-medium">
                      ... y {previsualizacion.length - 8} profesores más en la lista.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Pantalla de Resultados */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">¡Importación Exitosa!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {resultado.mensaje || `Se cargaron ${resultado.total || previsualizacion.length} profesores correctamente.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Nuevos</p>
                  <p className="text-xl font-black text-emerald-800">{resultado.agregados ?? previsualizacion.length}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Actualizados</p>
                  <p className="text-xl font-black text-slate-700">{resultado.actualizados ?? 0}</p>
                </div>
              </div>
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
                id="btn-confirmar-importacion-docentes"
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
              id="btn-finalizar-importacion-docentes"
              type="button"
              onClick={onCompletado}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              Finalizar y Ver Plantel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
