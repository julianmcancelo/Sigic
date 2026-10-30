import React, { useState, useEffect } from 'react';
import {
  SmartphoneNfc,
  CheckCircle2,
  AlertTriangle,
  Shield,
  QrCode,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { autorizarDesafioLoginQrNfc } from '@/servicios/api';
import { obtenerTemaActual } from '@/datos/fondos-pantalla';

export default function PantallaPuenteQrNfcMovil({
  challengeId,
  adminActivo,
  adminUser,
  onFinalizado,
}) {
  const [escaneandoNfc, setEscaneandoNfc] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [autorizadoExito, setAutorizadoExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [codigoMaestro, setCodigoMaestro] = useState('');
  const [mostrarPinManual, setMostrarPinManual] = useState(false);

  const [temaId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'
  );
  const tema = obtenerTemaActual(temaId);
  const esClaro = tema.tipo === 'claro';
  const acento = tema.colorPrincipal || '#0ea5e9';

  useEffect(() => {
    if (typeof window !== 'undefined' && challengeId) {
      localStorage.setItem('sigic_pending_qr_nfc', challengeId);
    }
  }, [challengeId]);

  const limpiarMensajes = () => {
    setMensajeError('');
    setMensajeExito('');
  };

  const autorizarConSesionMovil = async () => {
    limpiarMensajes();
    setCargando(true);
    try {
      const res = await autorizarDesafioLoginQrNfc({
        challengeId,
        usarSesionActual: true,
      });
      localStorage.removeItem('sigic_pending_qr_nfc');
      setAutorizadoExito(true);
      setMensajeExito(res.mensaje || 'Acceso en PC autorizado correctamente.');
    } catch (err) {
      setMensajeError(err.message || 'No se pudo autorizar con la sesion actual.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarLecturaNFCFisico = async () => {
    limpiarMensajes();
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setMensajeError(
        'Tu navegador no tiene Web NFC directo. Simplemente apoya tu Tag NFC con la pantalla encendida (Android abrira el enlace y autorizara tu PC automaticamente).'
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
            let tokenExtraido = texto.trim();
            if (tokenExtraido.includes('nfc=')) {
              try {
                const urlObj = new URL(tokenExtraido);
                tokenExtraido = urlObj.searchParams.get('nfc') || tokenExtraido;
              } catch (_) {
                const partes = tokenExtraido.split('nfc=');
                if (partes[1]) tokenExtraido = decodeURIComponent(partes[1].split('&')[0]);
              }
            }
            if (tokenExtraido.includes('SIGIC-NFC-v1.')) {
              setCargando(true);
              const res = await autorizarDesafioLoginQrNfc({
                challengeId,
                tokenNfc: tokenExtraido,
              });
              localStorage.removeItem('sigic_pending_qr_nfc');
              setAutorizadoExito(true);
              setMensajeExito(res.mensaje || 'PC autorizada con tu Tag NFC.');
              setEscaneandoNfc(false);
              return;
            }
          }
          setMensajeError('El Tag NFC leido no contiene una firma SIGIC-NFC-v1 valida.');
        } catch (err) {
          setMensajeError(err.message || 'Error al autorizar con el Tag NFC.');
        } finally {
          setCargando(false);
          setEscaneandoNfc(false);
        }
      };
    } catch (err) {
      setEscaneandoNfc(false);
      setMensajeError(err.message || 'No se pudo activar el lector NFC.');
    }
  };

  const autorizarConPinMaestro = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (codigoMaestro.trim().length < 6) {
      setMensajeError('Ingresa el Codigo Maestro (8 digitos) o TOTP.');
      return;
    }
    setCargando(true);
    try {
      const res = await autorizarDesafioLoginQrNfc({
        challengeId,
        codigoTotp: codigoMaestro.trim(),
      });
      localStorage.removeItem('sigic_pending_qr_nfc');
      setAutorizadoExito(true);
      setMensajeExito(res.mensaje || 'PC autorizada con Codigo Maestro.');
    } catch (err) {
      setMensajeError(err.message || 'Codigo Maestro incorrecto.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{
        background: `linear-gradient(135deg, ${tema.colores[0]} 0%, ${tema.colores[1]} 65%, ${tema.colores[2]}33 100%)`,
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
          esClaro
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-slate-900/90 border-white/10 text-slate-100'
        }`}
      >
        <div className="px-6 pt-7 pb-5 text-center space-y-2">
          <div
            className="mx-auto h-13 w-13 rounded-2xl flex items-center justify-center shadow-md text-white"
            style={{ backgroundColor: acento }}
          >
            <SmartphoneNfc size={25} />
          </div>

          <div className="pt-1">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{
                backgroundColor: esClaro ? tema.colorAcentoLight : `${acento}22`,
                color: acento,
                border: `1px solid ${esClaro ? tema.colorAcentoBorder : `${acento}44`}`,
              }}
            >
              <QrCode size={11} /> {challengeId}
            </span>
          </div>

          <h1 className="text-lg font-black tracking-tight">Autorizar Inicio de Sesion en PC</h1>
          <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            Vincula tu tarjeta o llavero NFC para abrir la sesion administrativa en la computadora.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {autorizadoExito ? (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-emerald-500">PC Autorizada Correctamente</h2>
                <p className={`text-xs ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                  {mensajeExito || 'La pantalla de tu computadora ya ingreso al panel administrativo.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onFinalizado}
                className="w-full py-3 rounded-2xl text-white text-xs font-bold shadow-md cursor-pointer"
                style={{ backgroundColor: acento }}
              >
                Ir al Panel en este Celular
              </button>
            </div>
          ) : (
            <>
              {adminActivo && adminUser?.nombre && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    esClaro ? 'bg-sky-50/70 border-sky-200' : 'bg-sky-950/30 border-sky-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield size={18} style={{ color: acento }} />
                    <div className="text-left">
                      <p className="text-xs font-bold">Sesion NFC activa en este celular</p>
                      <p className={`text-[11px] ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                        {adminUser.nombre} ({adminUser.correo || adminUser.email})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={autorizarConSesionMovil}
                    disabled={cargando}
                    className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: acento }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{cargando ? 'Autorizando PC...' : `Autorizar PC como ${adminUser.nombre}`}</span>
                  </button>
                </div>
              )}

              <div
                className={`p-4 rounded-2xl border space-y-3 text-center ${
                  esClaro ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/10'
                }`}
              >
                <p className={`text-xs font-bold ${esClaro ? 'text-slate-700' : 'text-slate-200'}`}>
                  Acerca tu Tarjeta o Llavero NFC ahora
                </p>
                <p className={`text-[11px] leading-relaxed ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  Apoya tu Tag NFC detras del celular. El sistema validara tu firma Ed25519 y abrira la sesion en la PC al instante.
                </p>
                <button
                  type="button"
                  onClick={iniciarLecturaNFCFisico}
                  disabled={escaneandoNfc || cargando}
                  className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: acento }}
                >
                  <SmartphoneNfc size={16} />
                  <span>{escaneandoNfc ? 'Esperando tarjeta NFC...' : 'Escanear Tag NFC con el Celular'}</span>
                </button>
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setMostrarPinManual((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold hover:underline cursor-pointer ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <KeyRound size={12} />
                  <span>{mostrarPinManual ? 'Ocultar Codigo Maestro' : 'Autorizar con Codigo Maestro'}</span>
                </button>

                {mostrarPinManual && (
                  <form onSubmit={autorizarConPinMaestro} className="mt-3 flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      value={codigoMaestro}
                      onChange={(e) => setCodigoMaestro(e.target.value.replace(/\D/g, ''))}
                      placeholder="Codigo Maestro"
                      className={`flex-1 rounded-xl border px-3 py-2 text-center font-mono text-sm font-bold outline-none ${
                        esClaro
                          ? 'bg-white border-slate-200 text-slate-900'
                          : 'bg-slate-950 border-white/15 text-white'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={cargando}
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: acento }}
                    >
                      Autorizar
                    </button>
                  </form>
                )}
              </div>

              {mensajeError && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{mensajeError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={onFinalizado}
                className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  esClaro
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <ArrowLeft size={13} />
                <span>Cancelar y volver</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
