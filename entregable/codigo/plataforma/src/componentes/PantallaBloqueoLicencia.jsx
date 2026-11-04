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
  crearDesafioLoginQrNfc,
  consultarEstadoDesafioQrNfc,
  guardarTokenSesion,
} from '@/servicios/api';
import { obtenerTemaActual } from '@/datos/fondos-pantalla';

export default function PantallaBloqueoLicencia({ estadoLicencia, onDesbloqueado, onLoginExitoso }) {
  const [metodoActivo, setMetodoActivo] = useState('totp'); // 'totp' | 'nfc' | 'serial'
  const [serialInput, setSerialInput] = useState('');
  const [codigoTotp, setCodigoTotp] = useState('');
  const [tokenNfcManual, setTokenNfcManual] = useState('');
  const [escaneandoNfc, setEscaneandoNfc] = useState(false);
  const [mostrarQrAyuda, setMostrarQrAyuda] = useState(false);
  const [desafioQrNfc, setDesafioQrNfc] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (metodoActivo !== 'nfc') return undefined;
    let cancelado = false;
    const origen = typeof window !== 'undefined' ? window.location.origin : undefined;
    crearDesafioLoginQrNfc(origen)
      .then((res) => {
        if (!cancelado) setDesafioQrNfc(res);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [metodoActivo]);

  useEffect(() => {
    if (metodoActivo !== 'nfc' || !desafioQrNfc?.challengeId) return undefined;
    let cancelado = false;
    const intervalo = window.setInterval(async () => {
      try {
        const res = await consultarEstadoDesafioQrNfc(desafioQrNfc.challengeId);
        if (cancelado) return;
        if (res.estado === 'AUTORIZADO' && res.sesion?.token && res.sesion?.usuario) {
          window.clearInterval(intervalo);
          guardarTokenSesion(res.sesion.token);
          localStorage.setItem('sesion_admin', 'true');
          localStorage.setItem('admin_user', JSON.stringify(res.sesion.usuario));
          setMensajeExito(`Autorizado por NFC (${res.sesion.usuario.nombre}). Desbloqueando...`);
          setTimeout(() => {
            if (onLoginExitoso) onLoginExitoso(res.sesion.usuario);
            if (onDesbloqueado) onDesbloqueado({ bloqueado: false, valida: true });
          }, 350);
        }
      } catch (_) {}
    }, 1700);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [metodoActivo, desafioQrNfc?.challengeId]);

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

  const procesarDesbloqueoConTokenNFC = async (tokenExtraido) => {
    limpiarMensajes();
    let tokenLimpio = (tokenExtraido || '').trim();
    if (tokenLimpio.includes('nfc=')) {
      try {
        const urlObj = new URL(tokenLimpio);
        tokenLimpio = urlObj.searchParams.get('nfc') || tokenLimpio;
      } catch (_) {
        const partes = tokenLimpio.split('nfc=');
        if (partes[1]) tokenLimpio = decodeURIComponent(partes[1].split('&')[0]);
      }
    }
    if (tokenLimpio.includes('SIGIC-NFC-v1.')) {
      const idx = tokenLimpio.indexOf('SIGIC-NFC-v1.');
      tokenLimpio = tokenLimpio.substring(idx);
    } else {
      setMensajeError('El enlace o certificado no contiene un token oficial SIGIC-NFC-v1 válido.');
      return;
    }

    setCargando(true);
    try {
      const res = await desbloquearConTarjetaNFC(tokenLimpio, false);
      const usuarioLogueado = res?.sesion?.usuario || {
        nombre: res?.datosLlave?.propietario || 'Autoridad SiGIC',
        email: res?.datosLlave?.correo || 'juliancancelo@gmail.com',
        correo: res?.datosLlave?.correo || 'juliancancelo@gmail.com',
        rol: res?.datosLlave?.rol || 'SUPER_ADMIN',
      };

      if (res?.sesion?.token) {
        guardarTokenSesion(res.sesion.token);
        localStorage.setItem('sesion_admin', 'true');
        localStorage.setItem('admin_user', JSON.stringify(usuarioLogueado));
      }

      setMensajeExito(
        `Plataforma desbloqueada con éxito a nombre de ${usuarioLogueado.nombre}. Ingresando...`
      );
      setEscaneandoNfc(false);
      setTimeout(() => {
        if (onLoginExitoso) onLoginExitoso(usuarioLogueado);
        if (onDesbloqueado) onDesbloqueado(res.estado || { bloqueado: false, valida: true });
      }, 450);
    } catch (err) {
      setMensajeError(err.message || 'Error al verificar la tarjeta NFC.');
    } finally {
      setCargando(false);
      setEscaneandoNfc(false);
    }
  };

  const iniciarLecturaNFCFisico = async () => {
    limpiarMensajes();
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setMensajeError(
        'El navegador actual no habilita lectura web NFC directa. Si tu tarjeta tiene el enlace grabado, acercála a tu celular o pegá su enlace/certificado abajo.'
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
            if (texto && (texto.includes('SIGIC-NFC-v1.') || texto.includes('nfc='))) {
              await procesarDesbloqueoConTokenNFC(texto);
              return;
            }
          }
          setMensajeError('La tarjeta NFC leída no contiene un certificado SIGIC-NFC-v1 válido.');
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
    await procesarDesbloqueoConTokenNFC(tokenNfcManual);
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
              {desafioQrNfc?.urlMovil && (
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2 ${
                    esClaro ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/10'
                  }`}
                >
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <QRCodeSVG value={desafioQrNfc.urlMovil} size={136} level="M" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-white">
                    {desafioQrNfc.challengeId}
                  </span>
                  <p className={`text-[11px] leading-snug ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                    Escanea este QR con tu celular y apoya tu <strong>Tag NFC</strong> para desbloquear esta PC automaticamente.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={iniciarLecturaNFCFisico}
                disabled={escaneandoNfc || cargando}
                className="w-full py-3 rounded-2xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: acento }}
              >
                <SmartphoneNfc size={15} />
                <span>{escaneandoNfc ? 'Acerca tu tarjeta NFC...' : 'Leer Tarjeta NFC en este Dispositivo'}</span>
              </button>

              <form onSubmit={manejarDesbloqueoNFCManual} className="space-y-2 pt-2 border-t border-slate-500/15">
                <label className={`block text-[11px] font-semibold ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  O pega el link o certificado firmado de cualquier miembro (Julián, Sol, Alan, Gaby, Mati):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenNfcManual}
                    onChange={(e) => setTokenNfcManual(e.target.value)}
                    placeholder="https://app.sigic.com.ar/?nfc=SIGIC-NFC-v1..."
                    className={`flex-1 rounded-xl border px-3 py-2 font-mono text-xs outline-none ${
                      esClaro
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-950/80 border-white/15 text-slate-200'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={cargando || !tokenNfcManual.trim()}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: acento }}
                  >
                    Desbloquear
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
