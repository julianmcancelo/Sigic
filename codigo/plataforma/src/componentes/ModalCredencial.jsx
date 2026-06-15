import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  X, 
  Printer, 
  Download, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle2,
  Armchair,
  GraduationCap,
  Ticket
} from 'lucide-react'

export function ModalCredencial({ egresado, onCerrar }) {
  if (!egresado) return null

  const handlePrint = () => {
    window.print()
  }

  // Generar datos para el QR
  const qrData = JSON.stringify({
    id: egresado.id,
    token: egresado.token,
    dni: egresado.dni,
    asientos: egresado.asientos || []
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER MODAL */}
        <div className="bg-[#0d1b2e] p-8 text-white flex justify-between items-center relative overflow-hidden">
          {/* Decoración Fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 className="text-emerald-400" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-tight">¡Registro Exitoso!</h2>
            </div>
            <p className="text-sky-300/80 text-sm font-bold tracking-widest uppercase">Tu credencial digital está lista</p>
          </div>
          <button 
            onClick={onCerrar} 
            className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* CUERPO - AREA IMPRIMIBLE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 print:p-0 print:bg-white">
          
          {/* TARJETA / CREDENCIAL */}
          <div id="credencial-imprimible" className="relative bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 mx-auto max-w-md md:max-w-none">
            
            {/* Patrón de fondo sutil */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', size: '20px 20px' }}></div>
            
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 relative z-10">
              
              {/* LADO IZQUIERDO: INFORMACIÓN */}
              <div className="flex-1 space-y-8">
                
                {/* Logo e Identidad */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#0d1b2e] rounded-xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="text-sky-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-none">SIGIC 2026</h3>
                      <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mt-1">Ceremonia de Colación</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Código de Acceso</p>
                    <p className="text-xl font-mono font-black text-slate-800 tracking-tighter">{egresado.token}</p>
                  </div>
                </div>

                {/* Datos Personales */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-2 uppercase tracking-tight">
                    {egresado.nombre}
                  </h1>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Legajo</p>
                      <p className="font-black text-slate-700">{egresado.legajo}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Documento</p>
                      <p className="font-black text-slate-700">{egresado.dni}</p>
                    </div>
                  </div>
                </div>

                {/* Ubicaciones / Asientos */}
                <div className="pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-2 mb-4">
                      <Armchair size={16} className="text-sky-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ubicaciones Asignadas</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {/* Egresado */}
                      <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm shadow-indigo-200">
                        <span className="text-[8px] font-black uppercase opacity-70">Tú:</span>
                        <span className="text-xs font-black">{egresado.asiento_id || 'S/A'}</span>
                      </div>
                      
                      {/* Entregador */}
                      {egresado.entregador_asiento_id && (
                        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                           <span className="text-[8px] font-black uppercase opacity-70">Entreg:</span>
                           <span className="text-xs font-black">{egresado.entregador_asiento_id}</span>
                        </div>
                      )}

                      {/* Invitados */}
                      {egresado.invitados?.map(inv => inv.asiento_id && (
                        <div key={inv.id} className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-sky-200">
                           <span className="text-[8px] font-black uppercase opacity-50">Inv:</span>
                           <span className="text-xs font-black">{inv.asiento_id}</span>
                        </div>
                      ))}
                   </div>
                </div>

              </div>

              {/* LADO DERECHO: QR */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[28px] border border-slate-100 md:w-48 shadow-inner">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-white mb-4">
                  <QRCodeSVG 
                    value={qrData} 
                    size={120} 
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <Ticket size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Pase Grupal</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 leading-tight">Válido para todo el grupo familiar</p>
                </div>
              </div>

            </div>

            {/* Footer de la credencial */}
            <div className="bg-slate-50/80 p-4 border-t border-slate-100 flex items-center justify-center gap-8">
               <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Diciembre 2026</span>
               </div>
               <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sede Beltrán - Anfiteatro</span>
               </div>
            </div>

          </div>

          <div className="mt-8 text-center max-w-sm mx-auto">
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Esta credencial es obligatoria para ingresar al teatro. Podés llevarla en tu celular o imprimirla.
            </p>
          </div>

        </div>

        {/* ACCIONES FOOTER */}
        <div className="p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-[#0d1b2e] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
          >
            <Printer size={18} /> Imprimir Credencial
          </button>
          <button 
            onClick={onCerrar}
            className="flex-1 bg-white text-slate-600 border-2 border-slate-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
