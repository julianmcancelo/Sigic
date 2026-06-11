import React, { useState } from 'react'
import { X, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import * as XLSX from 'xlsx'
import { importarEgresadosBulk } from '../servicios/api'

export function ModalImportar({ onCerrar, onCompletado }) {
  const [archivo, setArchivo] = useState(null)
  const [previsualizacion, setPrevisualizacion] = useState([])
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)

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
          dni: row.dni || row.DNI || row.documento || row.Documento || '',
          legajo: row.legajo || row.Legajo || row.LEGAJO || '',
          correo: row.correo || row.Correo || row.email || row.Email || ''
        })).filter(r => r.nombre && r.dni)

        setPrevisualizacion(mapeado)
      } catch (err) {
        alert('Error al leer el archivo. Asegúrate de que sea CSV, XLSX o JSON válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportar = async () => {
    if (previsualizacion.length === 0) return
    setProcesando(true)
    try {
      const res = await importarEgresadosBulk(previsualizacion)
      setResultado(res)
      if (res.exitosos.length > 0) onCompletado()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <FileSpreadsheet className="text-sky-400" />
              Importar Egresados
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">CSV · XLSX · JSON</p>
          </div>
          <button onClick={onCerrar} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          {!resultado ? (
            <>
              {/* Dropzone / Upload */}
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls, .json" 
                  onChange={manejarArchivo}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-4 border-dashed border-slate-100 rounded-[32px] p-12 flex flex-col items-center justify-center text-center group-hover:border-sky-500/30 transition-all bg-slate-50/50 group-hover:bg-sky-50/30">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-sky-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Seleccionar Archivo</h3>
                  <p className="text-sm text-slate-400 font-medium">Arrastra o haz clic para cargar tu listado</p>
                </div>
              </div>

              {/* Previsualización */}
              {previsualizacion.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Previsualización ({previsualizacion.length} registros)</h4>
                  </div>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase">
                        <tr>
                          <th className="p-4">Nombre</th>
                          <th className="p-4">DNI</th>
                          <th className="p-4">Legajo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {previsualizacion.slice(0, 5).map((r, i) => (
                          <tr key={i} className="text-slate-600">
                            <td className="p-4 font-bold">{r.nombre}</td>
                            <td className="p-4">{r.dni}</td>
                            <td className="p-4">{r.legajo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previsualizacion.length > 5 && (
                      <div className="p-3 bg-slate-50/50 text-center text-[10px] font-bold text-slate-400 italic">
                        Y {previsualizacion.length - 5} registros más...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Resultado del Proceso */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                  <p className="text-4xl font-black text-emerald-600">{resultado.exitosos.length}</p>
                  <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mt-2">Exitosos</p>
                </div>
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                  <p className="text-4xl font-black text-amber-600">{resultado.conflictos.length}</p>
                  <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest mt-2">Conflictos</p>
                </div>
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
                  <p className="text-4xl font-black text-red-600">{resultado.errores}</p>
                  <p className="text-[10px] font-black uppercase text-red-800 tracking-widest mt-2">Errores</p>
                </div>
              </div>

              {resultado.conflictos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <ShieldAlert size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Registros Ignorados (Ya participaron)</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {resultado.conflictos.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[11px]">
                        <div>
                          <p className="font-bold text-slate-800">{c.egresado}</p>
                          <p className="text-slate-400 font-medium">DNI: {c.dni}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-black text-[9px] uppercase">{c.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 flex gap-4">
          {!resultado ? (
            <>
              <button 
                onClick={handleImportar}
                disabled={procesando || previsualizacion.length === 0}
                className="flex-1 bg-sky-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : 'Comenzar Importación'}
              </button>
              <button onClick={onCerrar} className="px-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
                Cancelar
              </button>
            </>
          ) : (
            <button 
              onClick={onCerrar}
              className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Finalizar y Volver
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
