import { Resend } from 'resend';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

let clienteResend: Resend | null = null;

function obtenerClienteResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY no está configurada.');
  if (!clienteResend) clienteResend = new Resend(apiKey);
  return clienteResend;
}

type ArchivoAdjunto = { filename: string; content: Buffer; contentType?: string };
const REMITENTE_PREDETERMINADO = 'SiGIC <no-responder@notificaciones.sigic.com.ar>';

export function normalizarRemitente(valor?: string) {
  const limpio = String(valor || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[\r\n]/g, ' ')
    .trim();
  const correo = limpio.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  if (!correo) return REMITENTE_PREDETERMINADO;

  const nombreCrudo = limpio.includes('<') ? limpio.slice(0, limpio.indexOf('<')) : '';
  const nombre = nombreCrudo.replace(/["'<>]/g, '').trim() || 'SiGIC';
  return `${nombre} <${correo}>`;
}

function escaparHTML(valor: string) {
  return String(valor || '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[caracter] || caracter);
}

export async function enviarCorreo(destinatario: string, asunto: string, cuerpoHTML: string, adjuntos: ArchivoAdjunto[] = []) {
  const remitente = normalizarRemitente(process.env.EMAIL_FROM);
  const { data, error } = await obtenerClienteResend().emails.send({
    from: remitente,
    to: [destinatario],
    subject: asunto,
    html: cuerpoHTML,
    attachments: adjuntos,
  });

  if (error) {
    console.error('Resend rechazó el correo:', error.message);
    throw new Error(`No se pudo enviar el correo: ${error.message}`);
  }

  console.log(`Correo enviado por Resend a [${destinatario}]`);
  return { ok: true, proveedor: 'resend', id: data?.id };
}

/**
 * PLANTILLA: Invitación / Registro de Graduados
 */
export function generarPlantillaInvitacion(nombreEgresado: string, linkRegistro: string, hostBase: string) {
  const linkLogo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación Oficial a la Ceremonia de Colación</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f5f9">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);">
              
              <!-- HEADER INSTITUCIONAL -->
              <tr>
                <td align="center" bgcolor="#071b34" style="padding: 45px 30px; background: linear-gradient(135deg, #071b34 0%, #0c2d54 100%); border-bottom: 4px solid #0284c7;">
                  <img src="${linkLogo}" alt="Instituto Tecnológico Beltrán" width="90" height="90" style="display: block; margin-bottom: 20px; outline: none; border: none; border-radius: 16px; background: #ffffff; padding: 6px;">
                  <span style="display: inline-block; padding: 4px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; color: #38bdf8; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Convocatoria Oficial</span>
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">Ceremonia de Graduación</h1>
                  <p style="color: #94a3b8; margin: 8px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Instituto Tecnológico Beltrán · SiGIC</p>
                </td>
              </tr>

              <!-- CUERPO PRINCIPAL -->
              <tr>
                <td style="padding: 45px 35px 35px;">
                  <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 800; letter-spacing: -0.3px;">
                    ¡Felicitaciones, ${escaparHTML(nombreEgresado)}!
                  </h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 28px;">
                    Nos complace invitarte formalmente a la <strong>Ceremonia de Colación</strong>. Tu esfuerzo, constancia y dedicación académica culminan en este momento solemne, y es un honor para toda la comunidad celebrarlo junto a vos y tus seres queridos.
                  </p>

                  <!-- CAJA DESTACADA DE PASOS -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 20px; margin-bottom: 35px;">
                    <tr>
                      <td style="padding: 26px 28px;">
                        <p style="color: #0f172a; font-size: 12px; font-weight: 800; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                          Pasos para autogestionar tu participación:
                        </p>
                        
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.55; color: #334155;">
                          <tr>
                            <td width="32" valign="top" style="padding-bottom: 14px;">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">1</span>
                            </td>
                            <td style="padding-bottom: 14px;">
                              <strong style="color: #0f172a;">Confirmá tu asistencia:</strong> Validá tu identidad y elegí tu fórmula de juramento académico.
                            </td>
                          </tr>
                          <tr>
                            <td width="32" valign="top" style="padding-bottom: 14px;">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">2</span>
                            </td>
                            <td style="padding-bottom: 14px;">
                              <strong style="color: #0f172a;">Registrá tu grupo:</strong> Añadí a tus acompañantes y asigná a tu padrino o docente entregador.
                            </td>
                          </tr>
                          <tr>
                            <td width="32" valign="top" style="padding-bottom: 0;">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">3</span>
                            </td>
                            <td style="padding-bottom: 0;">
                              <strong style="color: #0f172a;">Obtené tu credencial:</strong> Descargá el pase grupal QR y guardalo directamente en <strong>Google Wallet</strong>.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- BOTON DE LLAMADA A LA ACCIÓN (CTA) -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" bgcolor="#0284c7" style="border-radius: 14px; box-shadow: 0 8px 16px rgba(2, 132, 199, 0.25);">
                              <a href="${linkRegistro}" target="_blank" style="font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; padding: 18px 40px; display: inline-block; letter-spacing: 0.5px; border-radius: 14px;">
                                Ingresar al Portal del Graduado &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- ENLACE DE CONTINGENCIA -->
                  <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; text-align: center;">
                    <p style="margin: 0 0 6px; color: #64748b; font-size: 11px; font-weight: 600;">
                      ¿No podés abrir el botón? Copiá y pegá este enlace seguro en tu navegador:
                    </p>
                    <a href="${linkRegistro}" style="color: #0284c7; font-size: 11px; word-break: break-all; text-decoration: underline; font-weight: 700;">${linkRegistro}</a>
                  </div>
                </td>
              </tr>

              <!-- FOOTER INSTITUCIONAL -->
              <tr>
                <td align="center" bgcolor="#0f172a" style="padding: 30px 25px; border-top: 1px solid #1e293b; color: #94a3b8; font-size: 11px; line-height: 1.6;">
                  <p style="margin: 0 0 6px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
                    Instituto Tecnológico Beltrán
                  </p>
                  <p style="margin: 0 0 10px; color: #64748b; font-size: 10px;">
                    Av. Manuel Belgrano 1191, Avellaneda, Buenos Aires · Sede Central
                  </p>
                  <p style="margin: 0; color: #475569; font-size: 10px;">
                    SiGIC © 2026 · Sistema Institucional de Gestión de Colaciones
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * PLANTILLA: Código de Verificación (OTP)
 */
export function generarPlantillaOTP(codigo: string, hostBase: string) {
  const linkLogo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Seguridad</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f5f9">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table width="500" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 500px; width: 100%; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);">
              
              <!-- HEADER -->
              <tr>
                <td align="center" bgcolor="#071b34" style="padding: 35px 25px; border-bottom: 4px solid #0284c7;">
                  <img src="${linkLogo}" alt="SiGIC" width="70" height="70" style="display: block; margin-bottom: 12px; border-radius: 12px; background: #ffffff; padding: 4px;">
                  <span style="color: #38bdf8; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Autenticación Segura</span>
                  <h1 style="color: #ffffff; margin: 4px 0 0; font-size: 20px; font-weight: 800;">Código de Verificación</h1>
                </td>
              </tr>

              <!-- CUERPO -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 26px;">
                    Ingresá el siguiente código de 6 dígitos en el portal para validar tu identidad:
                  </p>
                  
                  <!-- BLOQUE OTP -->
                  <table align="center" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="border: 2px dashed #0284c7; border-radius: 18px; margin: 0 auto 26px;">
                    <tr>
                      <td style="padding: 18px 36px; font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #071b34; letter-spacing: 12px;">
                        ${codigo}
                      </td>
                    </tr>
                  </table>
                  
                  <div style="display: inline-block; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px; padding: 6px 18px; color: #e11d48; font-size: 12px; font-weight: 700;">
                    Válido durante los próximos 10 minutos
                  </div>

                  <p style="color: #94a3b8; font-size: 12px; margin: 26px 0 0; line-height: 1.5;">
                    Si no solicitaste este código, podés desestimar este mensaje con total seguridad.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" bgcolor="#0f172a" style="padding: 20px; border-top: 1px solid #1e293b; color: #64748b; font-size: 10px;">
                  Instituto Tecnológico Beltrán · SiGIC
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function generarPlantillaRecuperacionContrasena(nombre: string, enlace: string, hostBase: string) {
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Restablecer Contraseña</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9">
        <tr><td align="center" style="padding:40px 15px;">
          <table width="560" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:560px;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 15px 30px rgba(0,0,0,0.06);">
            <tr><td bgcolor="#071b34" style="padding:35px;text-align:center;border-bottom:4px solid #0284c7;">
              <img src="${logo}" alt="SiGIC" width="60" height="60" style="display:inline-block;border-radius:12px;background:#ffffff;padding:4px;" />
              <p style="margin:12px 0 0;color:#38bdf8;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Acceso Institucional</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Restablecer Contraseña</h1>
            </td></tr>
            <tr><td style="padding:40px 35px;color:#1e293b;">
              <h2 style="margin:0 0 14px;font-size:18px;font-weight:800;">Hola, ${escaparHTML(nombre)}</h2>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta administrativa en SiGIC.</p>
              <p style="margin:0 0 30px;color:#475569;font-size:14px;line-height:1.6;">Hacé clic en el siguiente botón para generar una nueva clave. Este enlace es de un solo uso y expira en 30 minutos.</p>
              <table cellspacing="0" cellpadding="0" border="0" align="center">
                <tr><td bgcolor="#0284c7" style="border-radius:12px;box-shadow:0 6px 14px rgba(2,132,199,0.25);">
                  <a href="${enlace}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:.3px;">Crear Nueva Contraseña &rarr;</a>
                </td></tr>
              </table>
              <p style="margin:35px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.55;text-align:center;">Si no solicitaste este cambio, podés ignorar este correo sin que tu contraseña actual se vea afectada.</p>
            </td></tr>
            <tr><td bgcolor="#0f172a" style="padding:18px;text-align:center;color:#64748b;font-size:10px;">Instituto Tecnológico Beltrán · SiGIC</td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

/** Aviso único tras finalizar la autogestión; el graduado conserva acceso para corregir datos. */
export function generarPlantillaCierreInscripcion(nombre: string, hostBase: string) {
  const acceso = `${hostBase}/`;
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Inscripción Confirmada</title></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9">
        <tr><td align="center" style="padding:40px 15px;">
          <table width="560" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:560px;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 15px 30px rgba(0,0,0,0.06);">
            <tr><td bgcolor="#071b34" style="padding:32px;text-align:center;border-bottom:4px solid #0284c7;">
              <img src="${logo}" alt="SiGIC" width="60" height="60" style="display:inline-block;border-radius:12px;background:#ffffff;padding:4px;" />
              <p style="margin:10px 0 0;color:#38bdf8;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Datos Guardados</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Hola, ${escaparHTML(nombre)}</h1>
            </td></tr>
            <tr><td style="padding:35px;font-size:15px;line-height:1.65;color:#334155;">
              <p style="margin:0 0 16px;">Tus datos de participación, fórmula de juramento y registro de acompañantes quedaron guardados correctamente en el sistema.</p>
              <p style="margin:0 0 28px;">Podés reingresar en cualquier momento antes de la fecha límite para consultar tus butacas o actualizar información.</p>
              <table cellspacing="0" cellpadding="0" border="0" align="center">
                <tr><td bgcolor="#0284c7" style="border-radius:12px;">
                  <a href="${acceso}" style="display:inline-block;padding:15px 32px;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;border-radius:12px;">Revisar Mi Inscripción</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td bgcolor="#0f172a" style="padding:18px;text-align:center;color:#64748b;font-size:10px;">Instituto Tecnológico Beltrán · SiGIC</td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
}

/** Comunicación final con el pase digital y la información operativa de la ceremonia. */
export function generarPlantillaCredencialCeremonia({ nombre, ceremonia, fecha, lugar, asiento, acceso, googleWalletUrl }: { nombre: string; ceremonia: string; fecha: string; lugar: string; asiento?: string | null; acceso: string; googleWalletUrl?: string | null }) {
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu Credencial Oficial de Ceremonia</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9">
        <tr>
          <td align="center" style="padding:40px 15px;">
            <table width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 20px 40px rgba(15,23,42,0.08);">
              
              <!-- HEADER -->
              <tr>
                <td bgcolor="#071b34" style="padding:40px 30px;text-align:center;background:linear-gradient(135deg,#071b34,#0c2d54);border-bottom:4px solid #0284c7;">
                  <img src="${logo}" alt="SiGIC" width="80" height="80" style="display:inline-block;margin-bottom:14px;border-radius:14px;background:#ffffff;padding:5px;" />
                  <span style="display:inline-block;padding:4px 14px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:20px;color:#38bdf8;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Pase Grupal Habilitado</span>
                  <h1 style="color:#ffffff;margin:0;font-size:25px;font-weight:800;letter-spacing:-.4px;">Todo Listo Para Tu Ceremonia</h1>
                  <p style="color:#94a3b8;margin:6px 0 0;font-size:12px;font-weight:600;">Hola, <strong>${escaparHTML(nombre)}</strong>. Tus ubicaciones están confirmadas.</p>
                </td>
              </tr>

              <!-- CUERPO DE DATOS OPERATIVOS -->
              <tr>
                <td style="padding:40px 35px 30px;">
                  <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Ceremonia Oficial</p>
                  <h2 style="margin:0 0 22px;color:#0f172a;font-size:20px;font-weight:800;">${escaparHTML(ceremonia)}</h2>

                  <!-- TABLA DE DETALLES (FECHA Y BUTACA) -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="border:1px solid #e2e8f0;border-radius:18px;margin-bottom:24px;">
                    <tr>
                      <td width="50%" style="padding:18px 22px;border-right:1px solid #e2e8f0;">
                        <span style="display:block;color:#64748b;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Fecha & Horario</span>
                        <strong style="display:block;margin-top:4px;color:#071b34;font-size:15px;">${fecha || '27 de Agosto de 2026'}</strong>
                      </td>
                      <td width="50%" style="padding:18px 22px;">
                        <span style="display:block;color:#64748b;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Butaca del Graduado</span>
                        <strong style="display:block;margin-top:4px;color:#0284c7;font-size:15px;">${asiento ? `Butaca ${asiento}` : 'Ubicación General'}</strong>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 30px;color:#475569;font-size:14px;line-height:1.6;">
                    <strong style="color:#0f172a;">Sede del Acto:</strong> ${escaparHTML(lugar || 'Auditorio Central · Instituto Tecnológico Beltrán')}.<br>
                    Presentate con 30 minutos de anticipación y mostrá el código QR de tu credencial al personal de portería para ingresar junto a tus acompañantes.
                  </p>

                  <!-- BOTONES DE ACCIÓN (PORTAL Y GOOGLE WALLET) -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                    <tr>
                      <td align="center" style="padding-bottom:12px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td bgcolor="#0284c7" style="border-radius:14px;box-shadow:0 6px 16px rgba(2,132,199,0.25);">
                              <a href="${acceso}" target="_blank" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:.3px;">
                                Ver Mi Credencial & Código QR &rarr;
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${googleWalletUrl ? `
                    <tr>
                      <td align="center">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td bgcolor="#071b34" style="border-radius:12px;border:1px solid #1e293b;">
                              <a href="${googleWalletUrl}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
                                Guardar en Google Wallet
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                  </table>

                  <!-- NOTA DE ADJUNTO PDF -->
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:12px 18px;text-align:center;">
                    <p style="margin:0;color:#166534;font-size:12px;font-weight:700;">
                      Tu credencial oficial también se encuentra adjunta a este correo en formato PDF.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" bgcolor="#0f172a" style="padding:25px;border-top:1px solid #1e293b;color:#64748b;font-size:10px;">
                  Instituto Tecnológico Beltrán · SiGIC © 2026
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

/** Credencial PDF diseñada para descargar, imprimir o presentar en portería. */
export async function generarPdfCredencial({ nombre, ceremonia, fecha, lugar, asiento, acompanantes, acceso }: { nombre: string; ceremonia: string; fecha: string; lugar: string; asiento?: string | null; acompanantes: string[]; acceso: string }) {
  const qrDataUrl = await QRCode.toDataURL(acceso, { width: 360, margin: 1, color: { dark: '#071b34', light: '#ffffff' } });
  const qr = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const partes: Buffer[] = [];
    doc.on('data', (parte) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    doc.rect(0, 0, 595, 842).fill('#f1f5f9');
    doc.rect(0, 0, 595, 230).fill('#071b34');
    doc.circle(555, 26, 120).fill('#0e5771');
    doc.circle(70, 250, 80).fill('#e0f2fe');
    doc.fillColor('#67e8f9').font('Helvetica-Bold').fontSize(10).text('SiGIC  |  CREDENCIAL DIGITAL', 48, 54, { characterSpacing: 1.5 });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('Ceremonia de colación', 48, 82);
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(12).text(ceremonia, 48, 122, { width: 330 });
    doc.roundedRect(48, 160, 178, 28, 14).fill('#ffffff');
    doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(9).text('CREDENCIAL VÁLIDA', 67, 170, { characterSpacing: 1 });

    doc.roundedRect(40, 205, 515, 520, 22).fill('#ffffff');
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('GRADUADO/A', 68, 245, { characterSpacing: 1.2 });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(25).text(nombre, 68, 263, { width: 285, lineBreak: true });
    doc.fillColor('#475569').font('Helvetica').fontSize(11).text(`Fecha: ${fecha || 'A confirmar'}\nLugar: ${lugar || 'A confirmar'}`, 68, 335, { lineGap: 5, width: 285 });

    doc.roundedRect(370, 242, 145, 145, 16).fill('#f8fafc');
    doc.image(qr, 385, 257, { width: 115, height: 115 });
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8).text('PRESENTAR EN PORTERÍA', 380, 405, { width: 125, align: 'center' });

    doc.roundedRect(68, 425, 447, 86, 14).fill('#e0f2fe');
    doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(9).text('UBICACIÓN DEL GRADUADO', 88, 445, { characterSpacing: 1 });
    doc.fillColor('#071b34').font('Helvetica-Bold').fontSize(22).text(asiento || 'SIN ASIGNAR', 88, 464);
    doc.fillColor('#475569').font('Helvetica').fontSize(10).text(asiento ? 'Butaca reservada para el acto.' : 'La asignación se informará desde el portal.', 88, 491);

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('ACOMPAÑANTES Y UBICACIONES', 68, 545, { characterSpacing: 1 });
    doc.fillColor('#1e293b').font('Helvetica').fontSize(11).text(acompanantes.length ? acompanantes.join('\n') : 'Sin acompañantes registrados.', 68, 565, { width: 447, lineGap: 5 });
    doc.moveTo(68, 661).lineTo(515, 661).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Guardá esta credencial en tu teléfono o imprimila. El código QR es personal e intransferible.', 68, 680, { width: 447, align: 'center' });
    doc.end();
  });
}
