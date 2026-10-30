import React, { useState, useEffect } from 'react';
import {
  SmartphoneNfc,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Laptop,
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
  const [nombreAutorizado, setNombreAutorizado] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [codigoPin, setCodigoPin] = useState('');
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

  const autorizarConSesionMovil = async () => {
    setMensajeError('');
    setCargando(true);
    try {
      const res = await autorizarDesafioLoginQrNfc({
        challengeId,
        usarSesionActual: true,
      });
      localStorage.removeItem('sigic_pending_qr_nfc');
      setNombreAutorizado(res?.usuario?.nombre || adminUser?.nombre || 'Administrador');
      setAutorizadoExito(true);
    } catch (err) {
      setMensajeError(err.message || 'No pudimos validar la sesion activa. Apoya tu tarjeta NFC.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarLecturaNFC = async () => {
    setMensajeError('');
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setMensajeError(
        'Para leer con un toque directo necesitas Chrome en Android con NFC prendido. Si tu celular ya abrio el link al apoyar la tarjeta, se autoriza solo.'
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
              setNombreAutorizado(res?.usuario?.nombre || 'Miembro del Equipo');
              setAutorizadoExito(true);
              setEscaneandoNfc(false);
              return;
            }
          }
          setMensajeError('La tarjeta no corresponde a una credencial oficial de SiGIC.');
        } catch (err) {
          setMensajeError(err.message || 'Ocurrio un problema al leer la tarjeta.');
        } finally {
          setCargando(false);
          setEscaneandoNfc(false);
        }
      };
    } catch (err) {
      setEscaneandoNfc(false);
      setMensajeError('No pudimos activar el lector NFC del telefono.');
    }
  };

  const autorizarConPin = async (e) => {
    e.preventDefault();
    setMensajeError('');
    if (codigoPin.trim().length < 6) {
      setMensajeError('Ingresa tu clave de acceso o PIN de 8 digitos.');
      return;
    }
    setCargando(true);
    try {
      const res = await autorizarDesafioLoginQrNfc({
        challengeId,
        codigoTotp: codigoPin.trim(),
      });
      localStorage.removeItem('sigic_pending_qr_nfc');
      setNombreAutorizado(res?.usuario?.nombre || 'Administrador');
      setAutorizadoExito(true);
    } catch (err) {
      setMensajeError(err.message || 'El codigo ingresado no es valido.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 transition-all duration-700"
      style={{
        background: `linear-gradient(145deg, ${tema.colores[0]} 0%, ${tema.colores[1]} 55%, ${tema.colores[2]}44 100%)`,
      }}
    >
      {/* Cabecera Institucional Superior */}
      <header className="w-full max-w-sm pt-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/95 p-1.5 shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="Logo Beltrán" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              Instituto Beltrán
            </p>
            <p className="text-sm font-black text-white leading-tight">SiGIC</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-xs">
          <ShieldCheck size={13} className="text-sky-400" />
          <span>Acceso Directo</span>
        </div>
      </header>

      {/* Tarjeta Principal de Vinculación */}
      <main className="w-full max-w-sm my-auto">
        <div
          className={`w-full rounded-[28px] border shadow-2xl p-6 sm:p-7 backdrop-blur-2xl transition-all duration-500 animate-scale-up ${
            esClaro
              ? 'bg-white/95 border-slate-200/90 text-slate-800'
              : 'bg-slate-900/90 border-white/15 text-slate-100 shadow-sky-950/40'
          }`}
        >
          {autorizadoExito ? (
            /* Vista de Éxito: Cálida, clara y reconfortante */
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative h-18 w-18 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 size={38} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles size={11} /> Listo para usar
                </span>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  ¡Entraste a la compu!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
                  La sesión ya se abrió en la pantalla de tu computadora como{' '}
                  <strong className="text-slate-900 dark:text-white">{nombreAutorizado}</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onFinalizado}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar en este celu</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Interacción: Amigable, sin tecnicismos */
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-2xl opacity-20 animate-pulse"
                    style={{ backgroundColor: acento }}
                  />
                  <div
                    className="relative h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: acento }}
                  >
                    <Laptop size={26} />
                  </div>
                </div>

                <div className="pt-1">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Abrir sesión en la compu
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                    Autorizá el ingreso sin necesidad de tipear contraseñas en el teclado.
                  </p>
                </div>
              </div>

              {/* Opción 1: Un solo toque si ya tiene sesión en el teléfono */}
              {adminActivo && adminUser?.nombre ? (
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-sky-50 to-blue-50/70 border border-sky-200/90 dark:from-sky-950/40 dark:to-slate-900/80 dark:border-sky-500/30 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="h-8 w-8 rounded-full bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Hola, {adminUser.nombre.split(' ')[0]}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tu teléfono ya te reconoce como usuario oficial.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={autorizarConSesionMovil}
                    disabled={cargando}
                    className="w-full py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: acento }}
                  >
                    {cargando ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Ingresar a la compu ahora</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {/* Opción 2: Tocar con la Tarjeta NFC */}
              <div
                className={`p-4 rounded-2xl border text-center space-y-3 transition-colors ${
                  escaneandoNfc
                    ? 'border-sky-400 bg-sky-50/80 dark:bg-sky-950/40'
                    : esClaro
                    ? 'bg-slate-50/90 border-slate-200/90'
                    : 'bg-slate-950/60 border-white/10'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <SmartphoneNfc size={15} style={{ color: acento }} />
                    <span>Con tu tarjeta o llavero</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[250px] mx-auto">
                    Apoyá tu credencial detrás del celu y se abre al instante en la pantalla.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={iniciarLecturaNFC}
                  disabled={escaneandoNfc || cargando}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    escaneandoNfc
                      ? 'bg-sky-600 text-white animate-pulse'
                      : esClaro
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                      : 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
                  }`}
                >
                  <SmartphoneNfc size={15} />
                  <span>{escaneandoNfc ? 'Acercá la tarjeta al dorso...' : 'Tocar con mi tarjeta'}</span>
                </button>
              </div>

              {/* Mensajes de error claros y directos */}
              {mensajeError ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{mensajeError}</span>
                </div>
              ) : null}

              {/* Opción alternativa discreta: Ingreso por PIN */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setMostrarPinManual((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <KeyRound size={12} />
                  <span>{mostrarPinManual ? 'Ocultar ingreso por clave' : '¿Preferís ingresar con clave?'}</span>
                </button>

                {mostrarPinManual ? (
                  <form onSubmit={autorizarConPin} className="mt-3 flex gap-2 animate-fade-in">
                    <input
                      type="password"
                      inputMode="numeric"
                      value={codigoPin}
                      onChange={(e) => setCodigoPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN o clave"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold outline-none bg-white dark:bg-slate-950 dark:border-white/15"
                    />
                    <button
                      type="submit"
                      disabled={cargando}
                      className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: acento }}
                    >
                      Entrar
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onFinalizado}
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pie Institucional Oficial */}
      <footer className="w-full max-w-sm pb-4 text-center animate-fade-in">
        <p className="text-[10px] text-white/70 font-semibold tracking-wide">
          Tecnicatura Superior en Analista de Sistemas
        </p>
      </footer>
    </div>
  );
}
