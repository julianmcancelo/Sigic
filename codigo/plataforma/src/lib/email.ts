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

/**
 * PLANTILLA: Invitación y Activación de Cuenta para Personal del Equipo
 */
export function generarPlantillaInvitacionEquipo({
  nombre,
  email,
  rol,
  enlace,
  hostBase
}: {
  nombre: string;
  email: string;
  rol: string;
  enlace: string;
  hostBase?: string;
}) {
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  
  const descripcionesRol: Record<string, { titulo: string; desc: string }> = {
ADMINISTRATIVO: {
      titulo: 'Personal Administrativo',
      desc: 'Gestión y edición de ceremonias, graduados, anfiteatro y despacho de convocatorias.'
    },
PORTERIA: {
      titulo: 'Personal de Acreditación y Portería',
      desc: 'Escaneo y validación de credenciales QR y control de accesos el día del evento.'
    }
  };

  const infoRol = descripcionesRol[rol] || {
    titulo: rol || 'Operador de Sistema',
    desc: 'Acceso a las herramientas operativas de SiGIC según los permisos asignados.'
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido al equipo de SiGIC</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f5f9">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);">
              
              <!-- HEADER INSTITUCIONAL -->
              <tr>
                <td align="center" bgcolor="#071b34" style="padding: 45px 30px; background: linear-gradient(135deg, #071b34 0%, #0c2d54 100%); border-bottom: 4px solid #0284c7;">
                  <img src="${logo}" alt="Instituto Tecnológico Beltrán" width="90" height="90" style="display: block; margin-bottom: 20px; outline: none; border: none; border-radius: 16px; background: #ffffff; padding: 6px;">
                  <span style="display: inline-block; padding: 4px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; color: #38bdf8; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Acceso Institucional</span>
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">Bienvenido/a al Equipo</h1>
                  <p style="color: #94a3b8; margin: 8px 0 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Instituto Tecnológico Beltrán · SiGIC</p>
                </td>
              </tr>

              <!-- CUERPO PRINCIPAL -->
              <tr>
                <td style="padding: 45px 35px 35px;">
                  <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 800; letter-spacing: -0.3px;">
                    Hola, ${escaparHTML(nombre)}
                  </h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 28px;">
                    Se ha generado tu cuenta institucional en <strong>SiGIC (Sistema de Gestión Integral de Colaciones)</strong> para colaborar en la organización y operación de las ceremonias de graduación.
                  </p>

                  <!-- CAJA DE DETALLES DE LA CUENTA -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 20px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 24px 28px;">
                        <p style="color: #0f172a; font-size: 11px; font-weight: 800; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                          Detalles de tu cuenta de acceso:
                        </p>
                        
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #334155;">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Usuario / Email:</td>
                            <td style="padding: 6px 0; font-weight: 800; color: #0f172a; font-family: monospace;">${escaparHTML(email)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Rol Asignado:</td>
                            <td style="padding: 6px 0;">
                              <span style="display: inline-block; padding: 3px 10px; border-radius: 8px; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                                ${infoRol.titulo}
                              </span>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 14px 0 0; padding-top: 12px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                          ${infoRol.desc}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- BOTÓN DE ACCIÓN (CTA) -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" bgcolor="#0284c7" style="border-radius: 14px; box-shadow: 0 8px 16px rgba(2, 132, 199, 0.25);">
                              <a href="${enlace}" target="_blank" style="font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; padding: 18px 40px; display: inline-block; letter-spacing: 0.5px; border-radius: 14px;">
                                Activar Cuenta y Crear Mi Contraseña &rarr;
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
                      ¿No podés hacer clic en el botón? Copiá y pegá este enlace seguro en tu navegador:
                    </p>
                    <a href="${enlace}" style="color: #0284c7; font-size: 11px; word-break: break-all; text-decoration: underline; font-weight: 700;">${enlace}</a>
                  </div>

                  <p style="color: #94a3b8; font-size: 12px; margin: 26px 0 0; line-height: 1.5; text-align: center;">
                    Este enlace de activación es personal, de un solo uso y tiene una validez de <strong>48 horas</strong>.
                  </p>
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

export type AcompananteCredencial = {
  nombre: string;
  asiento?: string | null;
  esPadrino?: boolean;
  ordenPadrino?: number | null;
  relacion?: string | null;
};

export type ParametrosCredencialCeremonia = {
  nombre: string;
  ceremonia: string;
  fecha: string;
  hora?: string;
  lugar: string;
  asiento?: string | null;
  acceso: string;
  googleWalletUrl?: string | null;
  acompanantes?: AcompananteCredencial[];
  padrinosDocentes?: string[];
  indicaciones?: string;
};

function formatearFechaLegible(fechaStr: string) {
  if (!fechaStr) return 'Fecha a confirmar';
  try {
    const limpia = fechaStr.includes('T') ? fechaStr : `${fechaStr.trim()}T12:00:00`;
    const d = new Date(limpia);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
  } catch {}
  return fechaStr;
}

/** Comunicación final con el pase digital, confirmación de butacas e instrucciones operativas de la ceremonia. */
export function generarPlantillaCredencialCeremonia({
  nombre,
  ceremonia,
  fecha,
  hora,
  lugar,
  asiento,
  acceso,
  googleWalletUrl,
  acompanantes = [],
  padrinosDocentes = [],
  indicaciones,
}: ParametrosCredencialCeremonia) {
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  const fechaTexto = formatearFechaLegible(fecha);
  const horaTexto = hora ? `${hora} hs` : '18:30 hs';

  // Separar acompanantes regulares de padrinos familiares
  const padrinosFamiliares = acompanantes.filter(item => item.esPadrino);
  const acompanantesRegulares = acompanantes.filter(item => !item.esPadrino);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Ubicaciones y Credencial Digital · ${escaparHTML(ceremonia)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9">
        <tr>
          <td align="center" style="padding: 40px 15px;">
            <table width="620" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width: 620px; width: 100%; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.09);">
              
              <!-- HEADER INSTITUCIONAL -->
              <tr>
                <td bgcolor="#071b34" style="padding: 45px 35px 35px; text-align: center; background: linear-gradient(135deg, #071b34 0%, #0c2d54 100%); border-bottom: 4px solid #0284c7;">
                  <img src="${logo}" alt="SiGIC" width="80" height="80" style="display: inline-block; margin-bottom: 16px; border-radius: 16px; background: #ffffff; padding: 6px;" />
                  <div>
                    <span style="display: inline-block; padding: 5px 16px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 20px; color: #38bdf8; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">
                      Pase Grupal Habilitado · Ubicaciones Confirmadas
                    </span>
                  </div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25;">
                    Todo Listo Para Tu Ceremonia
                  </h1>
                  <p style="color: #94a3b8; margin: 10px 0 0; font-size: 13px; font-weight: 600;">
                    Estimado/a <strong>${escaparHTML(nombre)}</strong>: Tus butacas y las de tu grupo han sido formalmente confirmadas.
                  </p>
                </td>
              </tr>

              <!-- CONTENIDO PRINCIPAL -->
              <tr>
                <td style="padding: 38px 32px 30px;">
                  
                  <!-- FICHA DE LA CEREMONIA -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 20px; margin-bottom: 30px; overflow: hidden;">
                    <tr>
                      <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                        <span style="display: block; color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Acto Académico Oficial</span>
                        <h2 style="margin: 4px 0 0; color: #071b34; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                          ${escaparHTML(ceremonia)}
                        </h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0;">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="33.3%" style="padding: 16px 20px; border-right: 1px solid #e2e8f0;">
                              <span style="display: block; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Fecha</span>
                              <strong style="display: block; margin-top: 4px; color: #0f172a; font-size: 13px;">${fechaTexto}</strong>
                            </td>
                            <td width="33.3%" style="padding: 16px 20px; border-right: 1px solid #e2e8f0;">
                              <span style="display: block; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Convocatoria</span>
                              <strong style="display: block; margin-top: 4px; color: #0284c7; font-size: 13px;">45 min antes</strong>
                            </td>
                            <td width="33.3%" style="padding: 16px 20px;">
                              <span style="display: block; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Inicio del Acto</span>
                              <strong style="display: block; margin-top: 4px; color: #0f172a; font-size: 13px;">${horaTexto}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="3" style="padding: 14px 20px; border-top: 1px solid #e2e8f0; background: #ffffff;">
                              <span style="display: block; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Sede Institucional</span>
                              <p style="margin: 4px 0 0; color: #334155; font-size: 12px; line-height: 1.4;">
                                <strong>${escaparHTML(lugar || 'Auditorio Central · Instituto Tecnológico Beltrán')}</strong> · Av. Manuel Belgrano 1191, Avellaneda
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- SECCIÓN DE BUTACAS CONFIRMADAS -->
                  <div style="margin-bottom: 32px;">
                    <p style="margin: 0 0 12px; color: #0f172a; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 2px solid #0284c7; padding-bottom: 6px;">
                      Distribución de Butacas Confirmadas
                    </p>

                    <!-- GRADUADO -->
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f9ff" style="border: 1px solid #bae6fd; border-radius: 14px; margin-bottom: 12px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td>
                                <span style="display: inline-block; padding: 2px 8px; background: #0284c7; color: #ffffff; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px;">
                                  Graduado / Titulado
                                </span>
                                <h3 style="margin: 0; color: #071b34; font-size: 15px; font-weight: 800;">
                                  ${escaparHTML(nombre)}
                                </h3>
                              </td>
                              <td align="right" style="vertical-align: middle;">
                                <div style="display: inline-block; background: #071b34; border: 1px solid #1e3a5f; border-radius: 10px; padding: 8px 16px; text-align: center;">
                                  <span style="display: block; color: #38bdf8; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Ubicación</span>
                                  <strong style="color: #ffffff; font-size: 14px; font-weight: 800;">${asiento ? `Butaca ${asiento}` : 'Ubicación Reservada'}</strong>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- PADRINO FAMILIAR (SI EXISTE) -->
                    ${padrinosFamiliares.map(pad => `
                      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffbeb" style="border: 1px solid #fde68a; border-radius: 14px; margin-bottom: 12px;">
                        <tr>
                          <td style="padding: 14px 20px;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td>
                                  <span style="display: inline-block; padding: 2px 8px; background: #d97706; color: #ffffff; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 4px;">
                                    Padrino de Diploma / Entregador ${pad.ordenPadrino ? `(${pad.ordenPadrino}°)` : ''}
                                  </span>
                                  <h4 style="margin: 0; color: #78350f; font-size: 14px; font-weight: 800;">
                                    ${escaparHTML(pad.nombre)}
                                  </h4>
                                </td>
                                <td align="right" style="vertical-align: middle;">
                                  <div style="display: inline-block; background: #78350f; border-radius: 10px; padding: 6px 14px; text-align: center;">
                                    <span style="display: block; color: #fde68a; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">Butaca Padrino</span>
                                    <strong style="color: #ffffff; font-size: 13px; font-weight: 800;">${pad.asiento ? `Butaca ${pad.asiento}` : 'Por asignar'}</strong>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    `).join('')}

                    <!-- ACOMPAÑANTES REGULARES -->
                    ${acompanantesRegulares.length > 0 ? `
                      <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 12px 18px; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                              Acompañantes del Graduado (${acompanantesRegulares.length})
                            </span>
                          </td>
                        </tr>
                        ${acompanantesRegulares.map((inv, idx) => `
                          <tr>
                            <td style="padding: 12px 18px; border-bottom: ${idx === acompanantesRegulares.length - 1 ? 'none' : '1px solid #f1f5f9'};">
                              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="color: #1e293b; font-size: 13px; font-weight: 700;">
                                    ${escaparHTML(inv.nombre)}
                                    ${inv.relacion ? `<span style="color: #64748b; font-size: 11px; font-weight: 500;"> · ${escaparHTML(inv.relacion)}</span>` : ''}
                                  </td>
                                  <td align="right" style="color: #0284c7; font-size: 12px; font-weight: 800;">
                                    ${inv.asiento ? `Butaca ${inv.asiento}` : 'Ubicación General'}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                    ` : ''}

                    <!-- PADRINO DOCENTE (SI APLICA) -->
                    ${padrinosDocentes.length > 0 ? `
                      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px;">
                        <span style="display: block; color: #475569; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase;">Padrino/a Docente Institucional</span>
                        <p style="margin: 4px 0 0; color: #071b34; font-size: 12px; font-weight: 700;">
                          ${padrinosDocentes.map(p => `Prof. ${escaparHTML(p)}`).join(', ')} · <span style="color: #64748b; font-weight: 500;">Ubicación en Estrado Académico</span>
                        </p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- SECCIÓN CRUCIAL: PREPARACIÓN E INDICACIONES PARA EL DÍA DEL EVENTO -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="border: 1px solid #cbd5e1; border-radius: 20px; margin-bottom: 32px; overflow: hidden;">
                    <tr>
                      <td bgcolor="#071b34" style="padding: 16px 22px; color: #ffffff;">
                        <span style="display: block; color: #38bdf8; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Guía Oficial</span>
                        <h3 style="margin: 2px 0 0; font-size: 15px; font-weight: 800; color: #ffffff;">
                          Instrucciones y Preparación para el Día del Acto
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 22px 24px;">
                        
                        <!-- PUNTO 1 -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="30" valign="top">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">1</span>
                            </td>
                            <td>
                              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">
                                Presentación anticipada (45 minutos antes)
                              </strong>
                              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.55;">
                                Los graduados deben presentarse con 45 minutos de anticipación al horario de inicio en la mesa de recepción institucional para la acreditación, colocación de atributos protocolares y firma del Libro de Actas de Graduados.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- PUNTO 2 -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="30" valign="top">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">2</span>
                            </td>
                            <td>
                              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">
                                Acreditación en portería con Código QR (Pase Grupal)
                              </strong>
                              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.55;">
                                El código QR de tu credencial es tu pase grupal oficial. El egresado y sus acompañantes deben ingresar juntos o exhibir la credencial en el puesto de acreditación de portería para validar el acceso simultáneo de todo el grupo.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- PUNTO 3 -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="30" valign="top">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">3</span>
                            </td>
                            <td>
                              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">
                                Ocupación estricta de las butacas asignadas
                              </strong>
                              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.55;">
                                Las butacas se encuentran numeradas y organizadas por sectores. El graduado ocupará su lugar en las filas reservadas de egresados, y los acompañantes y padrino tomarán asiento en las butacas asignadas que figuran en esta confirmación.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- PUNTO 4 -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="30" valign="top">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">4</span>
                            </td>
                            <td>
                              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">
                                Protocolo en el estrado y entrega del diploma
                              </strong>
                              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.55;">
                                Al ser convocado por el maestro de ceremonias, el graduado subirá al estrado académico acompañado por su padrino o madrina de diploma asignado para la entrega solemne y la fotografía institucional.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- PUNTO 5 -->
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="30" valign="top">
                              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800;">5</span>
                            </td>
                            <td>
                              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">
                                Código de vestimenta y accesibilidad
                              </strong>
                              <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.55;">
                                Se solicita vestimenta formal o elegante sport. En caso de requerir asistencia o butaca adaptada para personas con movilidad reducida, comunicarlo al personal de portería al ingresar.
                              </p>
                            </td>
                          </tr>
                        </table>

                        ${indicaciones ? `
                          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #334155; font-size: 12px;">
                            <strong>Nota institucional adicional:</strong> ${escaparHTML(indicaciones)}
                          </div>
                        ` : ''}

                      </td>
                    </tr>
                  </table>

                  <!-- BOTONES DE ACCIÓN (PORTAL Y GOOGLE WALLET) -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="padding-bottom: 12px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td bgcolor="#0284c7" style="border-radius: 14px; box-shadow: 0 8px 18px rgba(2, 132, 199, 0.28);">
                              <a href="${acceso}" target="_blank" style="display: inline-block; padding: 16px 36px; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; letter-spacing: 0.3px;">
                                Ver Mi Credencial Digital & Código QR &rarr;
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
                            <td bgcolor="#071b34" style="border-radius: 12px; border: 1px solid #1e293b;">
                              <a href="${googleWalletUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">
                                Guardar en Google Wallet
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>` : ''}
                  </table>

                  <!-- NOTA DE ADJUNTO PDF -->
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 14px 20px; text-align: center;">
                    <strong style="display: block; color: #166534; font-size: 13px; margin-bottom: 3px;">
                      Credencial Oficial Adjunta en Formato PDF
                    </strong>
                    <p style="margin: 0; color: #15803d; font-size: 11px; line-height: 1.45;">
                      Tu credencial con el código QR de alta resolución se encuentra adjunta a este correo. Podés guardarla en tu teléfono o llevarla impresa el día de la ceremonia.
                    </p>
                  </div>

                </td>
              </tr>

              <!-- FOOTER INSTITUCIONAL -->
              <tr>
                <td align="center" bgcolor="#0f172a" style="padding: 28px 24px; border-top: 1px solid #1e293b; color: #94a3b8; font-size: 11px; line-height: 1.6;">
                  <p style="margin: 0 0 4px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
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
    </html>`;
}

/** Credencial PDF diseñada para descargar, imprimir o presentar en portería. */
export async function generarPdfCredencial({
  nombre,
  ceremonia,
  fecha,
  lugar,
  asiento,
  acompanantes,
  acceso,
}: {
  nombre: string;
  ceremonia: string;
  fecha: string;
  lugar: string;
  asiento?: string | null;
  acompanantes: string[];
  acceso: string;
}) {
  const qrDataUrl = await QRCode.toDataURL(acceso, { width: 360, margin: 1, color: { dark: '#071b34', light: '#ffffff' } });
  const qr = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const fechaTexto = formatearFechaLegible(fecha);

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
    doc.fillColor('#67e8f9').font('Helvetica-Bold').fontSize(10).text('SiGIC  |  CREDENCIAL DIGITAL OFICIAL', 48, 54, { characterSpacing: 1.5 });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('Ceremonia de Colación', 48, 82);
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(12).text(ceremonia, 48, 122, { width: 330 });
    doc.roundedRect(48, 160, 200, 28, 14).fill('#ffffff');
    doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(9).text('PASE GRUPAL HABILITADO', 65, 170, { characterSpacing: 1 });

    doc.roundedRect(40, 205, 515, 520, 22).fill('#ffffff');
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('GRADUADO/A', 68, 245, { characterSpacing: 1.2 });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(24).text(nombre, 68, 263, { width: 285, lineBreak: true });
    doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`Fecha: ${fechaTexto || 'A confirmar'}\nLugar: ${lugar || 'Sede Beltrán'}\nPresentación: 45 minutos antes`, 68, 330, { lineGap: 4, width: 285 });

    doc.roundedRect(370, 235, 150, 155, 16).fill('#f8fafc');
    doc.image(qr, 385, 245, { width: 120, height: 120 });
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8).text('PRESENTAR EN PORTERÍA', 375, 375, { width: 140, align: 'center' });

    doc.roundedRect(68, 415, 452, 80, 14).fill('#e0f2fe');
    doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(9).text('UBICACIÓN DEL GRADUADO', 88, 430, { characterSpacing: 1 });
    doc.fillColor('#071b34').font('Helvetica-Bold').fontSize(20).text(asiento ? `Butaca ${asiento}` : 'UBICACIÓN GENERAL', 88, 448);
    doc.fillColor('#475569').font('Helvetica').fontSize(9).text(asiento ? 'Butaca numerada reservada en sector egresados.' : 'La asignación se confirmará desde el portal.', 88, 474);

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('INTEGRANTES DEL GRUPO Y UBICACIONES', 68, 515, { characterSpacing: 1 });
    doc.fillColor('#1e293b').font('Helvetica').fontSize(10).text(
      acompanantes.length ? acompanantes.slice(0, 6).join('\n') : 'Sin acompañantes registrados.',
      68, 535,
      { width: 452, lineGap: 5 }
    );

    doc.moveTo(68, 655).lineTo(520, 655).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text(
      'Pase grupal válido para el graduado y sus acompañantes registrados. Presentar en el puesto de acreditación de portería.',
      68, 670,
      { width: 452, align: 'center' }
    );
    doc.end();
  });
}
