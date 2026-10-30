import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  SmartphoneNfc,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Lock,
  QrCode,
  Unlock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  activarSerialLicenciaCriptografica,
  desbloquearConTarjetaNFC,
  conmutarBloqueoSeguridad,
} from '@/servicios/api';
import { obtenerTemaActual } from '@/datos/fondos-pantalla';

export default function PantallaBloqueoLicencia({ estadoLicencia, onDesbloqueado }) {
  const [metodoActivo, setMetodoActivo] = useState('totp'); // 'totp' | 'nfc' | 'serial'
  const [serialInput, setSerialInput] = useState('');
  const [codigoTotp, setCodigoTotp] = useState('');
  const [tokenNfcManual, setTokenNfcManual] = useState('');
  const [escaneandoNfc, setEscaneandoNfc] = useState(false);
  const [mostrarQrAyuda, setMostrarQrAyuda] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const [temaId, setTemaId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'
  );

  useEffect(() => {
    const manejarCambioTema = (e) => {
      if (e?.detail) setTemaId(e.detail);
      else if (typeof window !== 'undefined') setTemaId(localStorage.getItem('sigic_fondo') || 'beltran');
    };
    window.addEventListener('sigic-fondo-cambiado', manejarCambioTema);
    return () => window.removeEventListener('sigic-fondo-cambiado', manejarCambioTema);
  }, []);

  const tema = obtenerTemaActual(temaId);
  const esClaro = tema.tipo === 'claro';
  const acento = tema.colorPrincipal || '#0ea5e9';

  const uriQrTotp =
    estadoLicencia?.totpProvisioning?.uri ||
    'otpauth://totp/SiGIC:juliancancelo@gmail.com?secret=SIGICJCANCELO2026CYBERSECKEY7777&issuer=SiGIC';

  const limpiarMensajes = () => {
    setMensajeError('');
    setMensajeExito('');
  };

  const manejarDesbloqueoTOTP = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (codigoTotp.trim().length < 6) {
      setMensajeError('Ingresa tu Codigo Maestro personal (8 digitos) o los 6 digitos de tu celular.');
      return;
    }
    setCargando(true);
    try {
      const res = await conmutarBloqueoSeguridad({
        bloquear: false,
        codigoTotp: codigoTotp.trim(),
      });
      setMensajeExito(res.mensaje || 'Autorizacion verificada correctamente.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 450);
    } catch (err) {
      setMensajeError(err.message || 'Codigo Maestro o TOTP incorrecto.');
    } finally {
      setCargando(false);
    }
  };

  const manejarActivacionSerial = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (!serialInput.trim().startsWith('SIGIC-LIC-v1.')) {
      setMensajeError('El certificado debe comenzar con SIGIC-LIC-v1.');
      return;
    }
    setCargando(true);
    try {
      const res = await activarSerialLicenciaCriptografica(serialInput.trim());
      setMensajeExito(res.mensaje || 'Certificado Ed25519 verificado.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 450);
    } catch (err) {
      setMensajeError(err.message || 'Certificado Ed25519 rechazado.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarLecturaNFCFisico = async () => {
    limpiarMensajes();
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setMensajeError(
        'Para escanear por aproximacion usa Chrome en Android con NFC activo, o pega el token firmado abajo.'
      );
      return;
    }

    try {
      setEscaneandoNfc(true);
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.onreading = async (event) => {
        try {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const texto = decoder.decode(record.data);
            if (texto.includes('SIGIC-NFC-v1.')) {
              setCargando(true);
              const res = await desbloquearConTarjetaNFC(texto.trim(), false);
              setMensajeExito(res.mensaje || 'Llave fisica NFC verificada.');
              setEscaneandoNfc(false);
              setTimeout(() => {
                if (onDesbloqueado) onDesbloqueado(res.estado);
              }, 450);
              return;
            }
          }
          setMensajeError('La tarjeta NFC leida no contiene un certificado SIGIC-NFC-v1 valido.');
        } catch (err) {
          setMensajeError(err.message || 'Error al verificar la tarjeta NFC.');
        } finally {
          setCargando(false);
          setEscaneandoNfc(false);
        }
      };
    } catch (err) {
      setEscaneandoNfc(false);
      setMensajeError(err.message || 'No se pudo iniciar el lector NFC.');
    }
  };

  const manejarDesbloqueoNFCManual = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (!tokenNfcManual.trim().startsWith('SIGIC-NFC-v1.')) {
      setMensajeError('Ingresa un certificado SIGIC-NFC-v1 valido.');
      return;
    }
    setCargando(true);
    try {
      const res = await desbloquearConTarjetaNFC(tokenNfcManual.trim(), false);
      setMensajeExito(res.mensaje || 'Tarjeta NFC verificada.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 450);
    } catch (err) {
      setMensajeError(err.message || 'Firma NFC rechazada.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-500"
      style={{
        background: `linear-gradient(135deg, ${tema.colores[0]} 0%, ${tema.colores[1]} 65%, ${tema.colores[2]}33 100%)`,
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${
          esClaro
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-slate-900/90 border-white/10 text-slate-100'
        }`}
      >
        {/* Cabecera Minimalista */}
        <div className="px-6 pt-7 pb-5 text-center space-y-2">
          <div
            className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center shadow-md text-white"
            style={{ backgroundColor: acento }}
          >
            <Shield size={22} />
          </div>

          <div className="pt-1">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: esClaro ? tema.colorAcentoLight : `${acento}22`,
                color: acento,
                border: `1px solid ${esClaro ? tema.colorAcentoBorder : `${acento}44`}`,
              }}
            >
              <Lock size={10} /> Acceso Protegido
            </span>
          </div>

          <h1 className="text-lg font-black tracking-tight">SiGIC — Autorizacion Requerida</h1>
          <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            Tecnicatura Superior en Analista de Sistemas · Cancelo Julian
          </p>
        </div>

        {/* Selector Minimalista de 3 pestañas */}
        <div className="px-6">
          <div
            className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border ${
              esClaro ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/70 border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                limpiarMensajes();
                setMetodoActivo('totp');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                metodoActivo === 'totp'
                  ? 'text-white shadow-xs'
                  : esClaro
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
              style={metodoActivo === 'totp' ? { backgroundColor: acento } : undefined}
            >
              <Smartphone size={13} />
              <span>PIN / QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                limpiarMensajes();
                setMetodoActivo('nfc');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                metodoActivo === 'nfc'
                  ? 'text-white shadow-xs'
                  : esClaro
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
              style={metodoActivo === 'nfc' ? { backgroundColor: acento } : undefined}
            >
              <SmartphoneNfc size={13} />
              <span>Tag NFC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                limpiarMensajes();
                setMetodoActivo('serial');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                metodoActivo === 'serial'
                  ? 'text-white shadow-xs'
                  : esClaro
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
              style={metodoActivo === 'serial' ? { backgroundColor: acento } : undefined}
            >
              <KeyRound size={13} />
              <span>Serial</span>
            </button>
          </div>
        </div>

        {/* Contenido segun pestaña */}
        <div className="p-6 space-y-4">
          {metodoActivo === 'totp' && (
            <form onSubmit={manejarDesbloqueoTOTP} className="space-y-3.5">
              <div className="text-center">
                <label className={`block text-xs font-bold mb-1 ${esClaro ? 'text-slate-700' : 'text-slate-200'}`}>
                  Ingresa tu Codigo Maestro o TOTP del Celular
                </label>
                <p className={`text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  Escribe tu clave personal o los 6 digitos de Android / iOS.
                </p>
              </div>

              <input
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={12}
                value={codigoTotp}
                onChange={(e) => setCodigoTotp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••••"
                className={`w-full rounded-2xl border px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.35em] outline-none transition ${
                  esClaro
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    : 'bg-slate-950/80 border-white/15 text-white focus:border-white/30'
                }`}
              />

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 rounded-2xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: acento }}
              >
                <Unlock size={14} />
                <span>{cargando ? 'Verificando...' : 'Desbloquear Plataforma'}</span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setMostrarQrAyuda((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold hover:underline cursor-pointer ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <QrCode size={12} />
                  <span>{mostrarQrAyuda ? 'Ocultar QR Movil' : 'Vincular con camara Android / iOS (QR)'}</span>
                </button>

                {mostrarQrAyuda && (
                  <div className="mt-3 p-3 rounded-2xl bg-white border border-slate-200 inline-flex flex-col items-center gap-2 shadow-sm">
                    <QRCodeSVG value={uriQrTotp} size={128} level="M" />
                    <span className="text-[10px] font-semibold text-slate-600 max-w-[200px] leading-tight">
                      Escanea con iPhone (Passwords) o Android (Authenticator)
                    </span>
                  </div>
                )}
              </div>
            </form>
          )}

          {metodoActivo === 'nfc' && (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={iniciarLecturaNFCFisico}
                disabled={escaneandoNfc || cargando}
                className="w-full py-3 rounded-2xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: acento }}
              >
                <SmartphoneNfc size={15} />
                <span>{escaneandoNfc ? 'Acerca tu tarjeta NFC...' : 'Leer Tarjeta / Llavero NFC'}</span>
              </button>

              <form onSubmit={manejarDesbloqueoNFCManual} className="space-y-2 pt-2 border-t border-slate-500/15">
                <label className={`block text-[11px] font-semibold ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  O pega el certificado firmado de tu tarjeta (SIGIC-NFC-v1):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenNfcManual}
                    onChange={(e) => setTokenNfcManual(e.target.value)}
                    placeholder="SIGIC-NFC-v1.eyJ..."
                    className={`flex-1 rounded-xl border px-3 py-2 font-mono text-xs outline-none ${
                      esClaro
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950/80 border-white/15 text-slate-200'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={cargando}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: acento }}
                  >
                    Validar
                  </button>
                </div>
              </form>
            </div>
          )}

          {metodoActivo === 'serial' && (
            <form onSubmit={manejarActivacionSerial} className="space-y-3">
              <label className={`block text-xs font-bold ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                Certificado Serial Ed25519 (SIGIC-LIC-v1)
              </label>
              <textarea
                rows={3}
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="SIGIC-LIC-v1.eyJzZXJpYWxfaWQiOi..."
                className={`w-full rounded-2xl border p-3 font-mono text-xs outline-none ${
                  esClaro
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950/80 border-white/15 text-slate-200'
                }`}
              />
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-2.5 rounded-2xl text-white text-xs font-bold cursor-pointer"
                style={{ backgroundColor: acento }}
              >
                {cargando ? 'Verificando firma...' : 'Activar Licencia'}
              </button>
            </form>
          )}

          {mensajeError && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2.5 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}
        </div>

        {/* Pie minimalista */}
        <div
          className={`px-6 py-3 border-t text-[10px] flex items-center justify-between ${
            esClaro ? 'bg-slate-50 border-slate-200/80 text-slate-400' : 'bg-slate-950/60 border-white/10 text-slate-500'
          }`}
        >
          <span>Host: {estadoLicencia?.dominioDetectado || 'localhost'}</span>
          <span>Ed25519 · Tema {tema.nombre.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}
