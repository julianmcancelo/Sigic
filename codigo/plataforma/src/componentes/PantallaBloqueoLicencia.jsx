import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  SmartphoneNfc,
  Fingerprint,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Globe,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import {
  activarSerialLicenciaCriptografica,
  desbloquearConTarjetaNFC,
  conmutarBloqueoSeguridad,
} from '@/servicios/api';

function bufferABase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binario += String.fromCharCode(bytes[i]);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function PantallaBloqueoLicencia({ estadoLicencia, onDesbloqueado }) {
  const [metodoActivo, setMetodoActivo] = useState('totp'); // 'totp' | 'nfc' | 'fido2' | 'serial'
  const [serialInput, setSerialInput] = useState('');
  const [codigoTotp, setCodigoTotp] = useState('');
  const [tokenNfcManual, setTokenNfcManual] = useState('');
  const [escaneandoNfc, setEscaneandoNfc] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const limpiarMensajes = () => {
    setMensajeError('');
    setMensajeExito('');
  };

  const manejarDesbloqueoTOTP = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (codigoTotp.trim().length !== 6) {
      setMensajeError('Ingresa el codigo TOTP de 6 digitos generado por tu autenticador.');
      return;
    }
    setCargando(true);
    try {
      const res = await conmutarBloqueoSeguridad({
        bloquear: false,
        codigoTotp: codigoTotp.trim(),
      });
      setMensajeExito(res.mensaje || 'Autorizacion TOTP verificada.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 600);
    } catch (err) {
      setMensajeError(err.message || 'Codigo TOTP incorrecto o expirado.');
    } finally {
      setCargando(false);
    }
  };

  const manejarActivacionSerial = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (!serialInput.trim().startsWith('SIGIC-LIC-v1.')) {
      setMensajeError('El certificado debe comenzar con el encabezado criptografico SIGIC-LIC-v1.');
      return;
    }
    setCargando(true);
    try {
      const res = await activarSerialLicenciaCriptografica(serialInput.trim());
      setMensajeExito(res.mensaje || 'Certificado Ed25519 verificado y activado.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 600);
    } catch (err) {
      setMensajeError(err.message || 'Certificado Ed25519 rechazado por firma invalida.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarLecturaNFCFisico = async () => {
    limpiarMensajes();
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setMensajeError(
        'Este navegador o dispositivo no expone hardware Web NFC directo. Usa Chrome en Android con NFC activo o pega el token firmado de tu tarjeta.'
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
              }, 600);
              return;
            }
          }
          setMensajeError('La tarjeta NFC leida no contiene un certificado SIGIC-NFC-v1 valido.');
        } catch (err) {
          setMensajeError(err.message || 'Error al verificar la firma Ed25519 del chip NFC.');
        } finally {
          setCargando(false);
          setEscaneandoNfc(false);
        }
      };
    } catch (err) {
      setEscaneandoNfc(false);
      setMensajeError(err.message || 'No se pudo iniciar el lector NFC del dispositivo.');
    }
  };

  const manejarDesbloqueoNFCManual = async (e) => {
    e.preventDefault();
    limpiarMensajes();
    if (!tokenNfcManual.trim().startsWith('SIGIC-NFC-v1.')) {
      setMensajeError('Ingresa un payload criptografico SIGIC-NFC-v1 valido.');
      return;
    }
    setCargando(true);
    try {
      const res = await desbloquearConTarjetaNFC(tokenNfcManual.trim(), false);
      setMensajeExito(res.mensaje || 'Tarjeta NFC verificada.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 600);
    } catch (err) {
      setMensajeError(err.message || 'Firma NFC rechazada.');
    } finally {
      setCargando(false);
    }
  };

  const manejarDesbloqueoFido2 = async () => {
    limpiarMensajes();
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setMensajeError('Este navegador no soporta autenticacion de hardware WebAuthn / FIDO2.');
      return;
    }

    setCargando(true);
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        },
      });

      if (!assertion || !assertion.rawId) {
        throw new Error('No se recibio respuesta de la llave de seguridad FIDO2.');
      }

      const credencialFidoId = bufferABase64Url(assertion.rawId);
      const res = await conmutarBloqueoSeguridad({
        bloquear: false,
        credencialFidoId,
      });

      setMensajeExito(res.mensaje || 'Passkey FIDO2 verificada.');
      setTimeout(() => {
        if (onDesbloqueado) onDesbloqueado(res.estado);
      }, 600);
    } catch (err) {
      setMensajeError(
        err.message || 'No se pudo validar la Passkey FIDO2. Verifica que haya sido registrada previamente en el Centro de Control.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.12),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Cabecera de Seguridad */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60 border-b border-slate-800 px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-red-500/15 text-red-300 border border-red-500/30 mb-1.5">
                <Lock className="w-3 h-3" /> Proteccion Criptografica Activa
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                SiGIC — Control de Licenciamiento y Propiedad Intelectual
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tecnicatura Superior en Analista de Sistemas · Autoridad Criptografica: Cancelo Julian
              </p>
            </div>
          </div>
        </div>

        {/* Estado Forense */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" /> Estado de Verificacion Ed25519:
              </span>
              <span className="font-mono font-semibold text-red-400 bg-red-950/50 border border-red-800/50 px-2.5 py-0.5 rounded-md">
                {estadoLicencia?.motivo || 'BLOQUEO_REMOTO_SEGURIDAD'}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              {estadoLicencia?.mensaje ||
                'La ejecucion de esta instancia requiere autorizacion criptografica firmada por el autor del sistema.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Host detectado:</span>
                <code className="text-sky-300 font-mono">{estadoLicencia?.dominioDetectado || 'localhost'}</code>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>Algoritmo de firma:</span>
                <code className="text-emerald-300 font-mono">Ed25519 (RFC 8032) + SHA-256</code>
              </div>
            </div>
          </div>

          {/* Selector de Metodo de Desbloqueo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Selecciona el metodo de autorizacion del autor:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setMetodoActivo('totp');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metodoActivo === 'totp'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 mb-1" />
                <span>Codigo TOTP</span>
                <span className="text-[10px] opacity-75">6 Digitos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setMetodoActivo('nfc');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metodoActivo === 'nfc'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <SmartphoneNfc className="w-4 h-4 mb-1" />
                <span>Tarjeta NFC</span>
                <span className="text-[10px] opacity-75">Tag Fisico</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setMetodoActivo('fido2');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metodoActivo === 'fido2'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-4 h-4 mb-1" />
                <span>Passkey FIDO2</span>
                <span className="text-[10px] opacity-75">Biometria / USB</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setMetodoActivo('serial');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  metodoActivo === 'serial'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-4 h-4 mb-1" />
                <span>Serial Ed25519</span>
                <span className="text-[10px] opacity-75">Certificado</span>
              </button>
            </div>
          </div>

          {/* Formulario segun metodo */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-4">
            {metodoActivo === 'totp' && (
              <form onSubmit={manejarDesbloqueoTOTP} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Codigo Temporal TOTP (RFC 6238 — Google Authenticator / Authy)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Ingresa los 6 digitos rotativos del autenticador vinculado por Cancelo Julian para desbloquear la instancia.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigoTotp}
                      onChange={(e) => setCodigoTotp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-center font-mono text-lg tracking-[0.35em] text-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={cargando}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      {cargando ? 'Verificando...' : 'Autorizar'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {metodoActivo === 'nfc' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">
                      Desbloqueo por Proximidad con Tarjeta / Llavero NFC (Ed25519)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Acerca tu tarjeta NFC maestra al lector del dispositivo o introduce el token firmado de emergencia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={iniciarLecturaNFCFisico}
                    disabled={escaneandoNfc || cargando}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    <SmartphoneNfc className="w-4 h-4" />
                    {escaneandoNfc ? 'Acerca la tarjeta NFC...' : 'Escanear Tag NFC'}
                  </button>
                </div>

                <form onSubmit={manejarDesbloqueoNFCManual} className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="block text-[11px] text-slate-400">
                    Token NDEF firmado de la tarjeta NFC (SIGIC-NFC-v1...):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tokenNfcManual}
                      onChange={(e) => setTokenNfcManual(e.target.value)}
                      placeholder="SIGIC-NFC-v1.eyJ1aWRfbGxhdmUi..."
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={cargando}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold"
                    >
                      Verificar Token
                    </button>
                  </div>
                </form>
              </div>
            )}

            {metodoActivo === 'fido2' && (
              <div className="space-y-3 text-center py-2">
                <Fingerprint className="w-9 h-9 text-sky-400 mx-auto" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    Autenticacion Hardware FIDO2 / WebAuthn Passkey
                  </h3>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                    Utiliza tu huella digital (Windows Hello / TouchID / Android) o llave de seguridad fisica USB/NFC registrada por el autor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={manejarDesbloqueoFido2}
                  disabled={cargando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  <Fingerprint className="w-4 h-4" />
                  {cargando ? 'Esperando llave FIDO2...' : 'Autenticar con Passkey / Llave Fisica'}
                </button>
              </div>
            )}

            {metodoActivo === 'serial' && (
              <form onSubmit={manejarActivacionSerial} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Certificado de Licencia Asimetrico (SIGIC-LIC-v1)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Pega el serial criptografico emitido con la Clave Privada Ed25519 para autorizar este dominio.
                  </p>
                  <textarea
                    rows={3}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="SIGIC-LIC-v1.eyJzZXJpYWxfaWQiOi..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={cargando}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    {cargando ? 'Verificando firma Ed25519...' : 'Verificar y Activar Licencia'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Alertas de resultado */}
          {mensajeError && (
            <div className="rounded-xl bg-red-950/60 border border-red-800/70 px-4 py-3 text-xs text-red-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/70 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}
        </div>

        {/* Pie Institucional */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>SiGIC — Sistema de Gestion Institucional de Colaciones</span>
          <span>Contacto de Autorizacion: jcancelo.dev@gmail.com</span>
        </div>
      </div>
    </div>
  );
}
