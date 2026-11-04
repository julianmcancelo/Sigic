import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

let clienteResend: Resend | null = null;

function obtenerClienteResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY no está configurada.');
  if (!clienteResend) clienteResend = new Resend(apiKey);
  return clienteResend;
}

function obtenerTransporteSMTP() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' && process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  });
}

export type CorreoBuzon = {
  id: string;
  destinatario: string;
  asunto: string;
  cuerpoHTML: string;
  adjuntosCount: number;
  proveedor: string;
  fecha: string;
};

// Buzón virtual global en memoria para guardar el historial de despachos
const buzonVirtualGlobal: CorreoBuzon[] = [];

export function registrarEnBuzon(
  destinatario: string,
  asunto: string,
  cuerpoHTML: string,
  adjuntosCount: number,
  proveedor: string,
  id: string
) {
  const item: CorreoBuzon = {
    id,
    destinatario,
    asunto,
    cuerpoHTML,
    adjuntosCount,
    proveedor,
    fecha: new Date().toISOString(),
  };
  buzonVirtualGlobal.unshift(item);
  if (buzonVirtualGlobal.length > 50) buzonVirtualGlobal.pop();
}

export function obtenerBuzonVirtual(): CorreoBuzon[] {
  return [...buzonVirtualGlobal];
}

export function limpiarBuzonVirtual(): void {
  buzonVirtualGlobal.length = 0;
}

type ArchivoAdjunto = { filename: string; content: Buffer; contentType?: string };
const REMITENTE_PREDETERMINADO = 'SiGIC Beltrán <no-responder@notificaciones.sigic.com.ar>';

export function normalizarRemitente(valor?: string) {
  const limpio = String(valor || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[\r\n]/g, ' ')
    .trim();
  const correo = limpio.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase();
  if (!correo) return REMITENTE_PREDETERMINADO;

  const nombreCrudo = limpio.includes('<') ? limpio.slice(0, limpio.indexOf('<')) : '';
  const nombre = nombreCrudo.replace(/["'<>]/g, '').trim() || 'SiGIC Beltrán';
  return `${nombre} <${correo}>`;
}

function escaparHTML(valor: string) {
  return String(valor || '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[caracter] || caracter);
}

export async function enviarCorreo(destinatario: string, asunto: string, cuerpoHTML: string, adjuntos: ArchivoAdjunto[] = []) {
  const remitente = normalizarRemitente(process.env.EMAIL_FROM || process.env.SMTP_FROM);

  // 1. Intentar con Resend si está disponible
  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await obtenerClienteResend().emails.send({
        from: remitente,
        to: [destinatario],
        subject: asunto,
        html: cuerpoHTML,
        attachments: adjuntos,
      });

      if (!error && data?.id) {
        console.log(`[EMAIL] Correo enviado vía Resend a [${destinatario}]`);
        registrarEnBuzon(destinatario, asunto, cuerpoHTML, adjuntos.length, 'resend', data.id);
        return { ok: true, proveedor: 'resend', id: data.id };
      }
      console.warn('[EMAIL] Resend retornó error:', error?.message);
    } catch (e: any) {
      console.warn('[EMAIL] Excepción al enviar por Resend:', e?.message || e);
    }
  }

  // 2. Intentar con SMTP institucional
  const transportador = obtenerTransporteSMTP();
  if (transportador) {
    try {
      const info = await transportador.sendMail({
        from: remitente,
        to: destinatario,
        subject: asunto,
        html: cuerpoHTML,
        attachments: adjuntos.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      console.log(`[EMAIL] Correo enviado vía SMTP a [${destinatario}] (ID: ${info.messageId})`);
      registrarEnBuzon(destinatario, asunto, cuerpoHTML, adjuntos.length, 'smtp', info.messageId);
      return { ok: true, proveedor: 'smtp', id: info.messageId };
    } catch (e: any) {
      console.warn('[EMAIL] Excepción al enviar por SMTP:', e?.message || e);
    }
  }

  // 3. Fallback inteligente: Buzón Virtual / Simulador Offline
  // Permite operar en modo demostración, evaluación o entornos sin salida a internet
  const simId = 'buzon-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  console.log(`[EMAIL-BUZÓN] Registrado en Buzón Virtual para [${destinatario}] (${asunto})`);
  registrarEnBuzon(destinatario, asunto, cuerpoHTML, adjuntos.length, 'buzon_virtual', simId);

  return {
    ok: true,
    proveedor: 'buzon_virtual',
    id: simId,
    simulado: true,
    mensaje: 'Correo procesado y registrado en el Buzón Virtual de SiGIC.'
  };
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
                <td align="center" bgcolor="#002b49" style="padding: 45px 30px; background: linear-gradient(135deg, #002038 0%, #002b49 55%, #084370 100%); border-bottom: 4px solid #0284c7;">
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
                  <p style="margin: 0 0 6px; color: #38bdf8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Tecnicatura Superior en Analista de Sistemas
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
                <td align="center" bgcolor="#002b49" style="padding: 35px 25px; border-bottom: 4px solid #0284c7;">
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
                <td align="center" bgcolor="#002b49" style="padding: 45px 30px; background: linear-gradient(135deg, #002038 0%, #002b49 55%, #084370 100%); border-bottom: 4px solid #0284c7;">
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
                  <p style="margin: 0 0 6px; color: #38bdf8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Tecnicatura Superior en Analista de Sistemas
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
            <tr><td bgcolor="#002b49" style="padding:35px;text-align:center;border-bottom:4px solid #0284c7;">
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

export type DetalleCierreInscripcion = {
  formulaJuramento?: string;
  acompanantes?: Array<{ nombre: string; relacion?: string; discapacidad?: boolean }>;
  padrinos?: Array<{ nombre: string; tipo?: string; orden?: number }>;
  ceremonia?: string;
  fecha?: string;
  lugar?: string;
  fechaLimite?: string;
};

/** Aviso tras finalizar o confirmar la autogestión con resumen detallado y plazos de modificación. */
export function generarPlantillaCierreInscripcion(
  nombre: string,
  hostBase: string,
  detalle: DetalleCierreInscripcion = {}
) {
  const acceso = `${hostBase}/`;
  const logo = 'https://raw.githubusercontent.com/julianmcancelo/Sigic/master/codigo/plataforma/public/logo-oficial.png';
  
  const formulas: Record<string, string> = { DIOS_Y_PATRIA: 'Por Dios y por la Patria', PATRIA: 'Por la Patria' };
  const formulaTexto = formulas[detalle.formulaJuramento || 'PATRIA'] || detalle.formulaJuramento || 'Por la Patria';
  const fechaCeremonia = formatearFechaLegible(detalle.fecha || '');
  const fechaLimiteTexto = detalle.fechaLimite ? formatearFechaLegible(detalle.fechaLimite) : null;
  const listaAcompanantes = detalle.acompanantes || [];
  const listaPadrinos = detalle.padrinos || [];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Inscripción Confirmada · SiGIC</title></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu registro está confirmado. Consultá el resumen de tu selección y accedé al portal del graduado.</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f5f9">
        <tr><td align="center" style="padding:40px 15px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            
            <tr><td bgcolor="#002b49" style="padding:32px 28px;text-align:left;border-bottom:4px solid #38bdf8;">
              <img src="${logo}" alt="SiGIC" width="60" height="60" style="display:inline-block;border-radius:12px;background:#ffffff;padding:4px;" />
              <p style="margin:20px 0 10px;color:#7dd3fc;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Portal del graduado / Registro confirmado</p>
              <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:700;">Todo listo para<br>tu próximo paso.</h1>
              <p style="margin:16px 0 0;color:#cbd5e1;font-size:15px;line-height:1.6;">${escaparHTML(nombre)}, tu selección quedó guardada.</p>
            </td></tr>

            <tr><td style="padding:32px 28px;font-size:14px;line-height:1.6;color:#334155;">
              <p style="margin:0 0 18px;font-size:15px;color:#1e293b;">
                Este es el resumen de tu registro para <strong>${escaparHTML(detalle.ceremonia || 'la ceremonia de colación')}</strong>. Conservá este correo para consultar tus elecciones.
              </p>
              ${detalle.fecha || detalle.lugar ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-left:3px solid #0ea5e9;background:#f0f9ff;"><tr><td style="padding:14px 18px;font-size:13px;line-height:1.7;color:#0c4a6e;">${detalle.fecha ? `<strong>Fecha</strong><br>${escaparHTML(fechaCeremonia)}<br>` : ''}${detalle.lugar ? `<strong>Lugar</strong><br>${escaparHTML(detalle.lugar)}` : ''}</td></tr></table>` : ''}
              <h2 style="margin:0 0 14px;font-size:18px;color:#0f172a;font-weight:700;">Tu selección</h2>

              <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc" style="border:1px solid #e2e8f0;border-radius:16px;margin:0 0 24px;overflow:hidden;">
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                  <span style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;display:block;">Fórmula de Juramento</span>
                  <strong style="font-size:14px;color:#0f172a;display:block;margin-top:2px;">${escaparHTML(formulaTexto)}</strong>
                </td></tr>

                <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                  <span style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;display:block;">Acompañantes Registrados (${listaAcompanantes.length})</span>
                  ${listaAcompanantes.length > 0
                    ? `<ul style="margin:6px 0 0;padding-left:18px;color:#334155;font-size:13px;">
                        ${listaAcompanantes.map(a => `<li style="padding:6px 0;line-height:1.6;"><strong>${escaparHTML(a.nombre)}</strong>${a.relacion ? `<br><span style="color:#64748b;">${escaparHTML(a.relacion)}</span>` : ''} ${a.discapacidad ? '· <em>Accesible</em>' : ''}</li>`).join('')}
                       </ul>`
                    : '<span style="font-size:13px;color:#64748b;display:block;margin-top:2px;">Asistencia individual sin acompañantes.</span>'
                  }
                </td></tr>

                ${listaPadrinos.length > 0 ? `
                  <tr><td style="padding:16px 20px;">
                    <span style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;display:block;">Padrinos / Entregadores (${listaPadrinos.length}/3)</span>
                    <ul style="margin:6px 0 0;padding-left:18px;color:#334155;font-size:13px;">
                      ${listaPadrinos.map(p => `<li style="padding:6px 0;line-height:1.6;">${p.orden ? `${p.orden}° ` : ''}<strong>${escaparHTML(p.nombre)}</strong><br><span style="color:#64748b;">${p.tipo === 'PROFESOR' ? 'Docente' : 'Familiar'}</span></li>`).join('')}
                    </ul>
                  </td></tr>
                ` : ''}
              </table>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px 18px;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-weight:800;font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">
                  Plazos y modificaciones
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#15803d;line-height:1.5;">
                  Podés volver a ingresar al portal y actualizar tus datos <strong>en cualquier momento antes de la fecha límite institucional${fechaLimiteTexto ? ` (${fechaLimiteTexto} hs)` : ''}</strong>.
                </p>
                <p style="margin:0;font-size:12px;color:#166534;line-height:1.5;">
                  <strong>Si cambia tu grupo:</strong> Retirá del portal a quienes no puedan asistir, antes de la fecha límite. Así podremos reasignar sus lugares.
                </p>
              </div>

              <table cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 10px;">
                <tr><td bgcolor="#0369a1" style="border-radius:8px;text-align:center;">
                  <a href="${escaparHTML(acceso)}" style="display:inline-block;padding:16px 28px;background:#0369a1;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
                    Abrir mi portal
                  </a>
                </td></tr>
              </table>

            </td></tr>

            <tr><td bgcolor="#0f172a" style="padding:20px;text-align:center;color:#64748b;font-size:10px;border-top:1px solid #1e293b;">
              <p style="margin:0 0 4px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;">Instituto Tecnológico Beltrán</p>
              <p style="margin:0;color:#64748b;">SiGIC · Sistema Institucional de Gestión de Colaciones</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
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
                <td bgcolor="#002b49" style="padding: 45px 35px 35px; text-align: center; background: linear-gradient(135deg, #002038 0%, #002b49 55%, #084370 100%); border-bottom: 4px solid #0284c7;">
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
                      <td bgcolor="#002b49" style="padding: 16px 22px; color: #ffffff;">
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
                            <td bgcolor="#002b49" style="border-radius: 12px; border: 1px solid #1e293b;">
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
                  <p style="margin: 0 0 6px; color: #38bdf8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Tecnicatura Superior en Analista de Sistemas
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

/** Credencial PDF ejecutiva oficial de colación para presentar en portería o imprimir. */
/** Credencial PDF ejecutiva oficial con credencial principal y credenciales individuales desglosadas por familiar/padrino */
export async function generarPdfCredencial({
  nombre,
  ceremonia,
  fecha,
  lugar,
  asiento,
  acompanantes,
  invitadosDetallados,
  padrinosDocentes,
  acceso,
}: {
  nombre: string;
  ceremonia: string;
  fecha: string;
  lugar: string;
  asiento?: string | null;
  acompanantes: string[];
  invitadosDetallados?: Array<{
    nombre: string;
    asiento?: string | null;
    esPadrino?: boolean;
    ordenPadrino?: number | null;
    relacion?: string | null;
  }>;
  padrinosDocentes?: string[];
  acceso: string;
}) {
  const qrDataUrl = await QRCode.toDataURL(acceso, {
    width: 400,
    margin: 1,
    color: { dark: '#002038', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });
  const qrPrincipal = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const fechaTexto = formatearFechaLegible(fecha);

  // Buscar logo recortado o logo oficial
  let logoBuffer: Buffer | null = null;
  try {
    const posiblesRutas = [
      path.join(process.cwd(), 'codigo', 'plataforma', 'public', 'logo-escudo-recortado.png'),
      path.join(process.cwd(), 'public', 'logo-escudo-recortado.png'),
      path.join(process.cwd(), 'codigo', 'plataforma', 'public', 'logo-oficial.png'),
      path.join(process.cwd(), 'public', 'logo-oficial.png'),
    ];
    for (const r of posiblesRutas) {
      if (fs.existsSync(/*turbopackIgnore: true*/ r)) {
        logoBuffer = fs.readFileSync(/*turbopackIgnore: true*/ r);
        break;
      }
    }
  } catch (err) {}

  // Estructurar nómina completa de integrantes
  type Integrante = {
    nombre: string;
    rol: string;
    tipo: 'PADRINO_DOCENTE' | 'PADRINO_DIPLOMA' | 'FAMILIAR' | 'ACOMPANANTE';
    asiento: string;
    esPadrino: boolean;
  };

  const integrantes: Integrante[] = [];

  if (invitadosDetallados && Array.isArray(invitadosDetallados) && invitadosDetallados.length > 0) {
    invitadosDetallados.forEach((inv) => {
      let rol = 'Acompañante';
      let tipo: Integrante['tipo'] = 'ACOMPANANTE';

      if (inv.esPadrino) {
        rol = inv.ordenPadrino ? `Padrino/Madrina de Diploma (${inv.ordenPadrino}°) · Estrado` : 'Padrino/Madrina de Diploma · Estrado';
        tipo = 'PADRINO_DIPLOMA';
      } else if (inv.relacion) {
        rol = `Familiar (${inv.relacion})`;
        tipo = 'FAMILIAR';
      }

      integrantes.push({
        nombre: inv.nombre,
        rol,
        tipo,
        asiento: inv.asiento ? `Butaca ${inv.asiento}` : 'Ubicación General',
        esPadrino: Boolean(inv.esPadrino),
      });
    });
  } else if (acompanantes && Array.isArray(acompanantes)) {
    acompanantes.forEach((str) => {
      const esPad = str.toLowerCase().includes('padrino') || str.toLowerCase().includes('madrina');
      integrantes.push({
        nombre: str.split('·')[0].split('(')[0].trim(),
        rol: esPad ? 'Padrino/Madrina de Diploma' : 'Acompañante',
        tipo: esPad ? 'PADRINO_DIPLOMA' : 'ACOMPANANTE',
        asiento: str.includes('Butaca') ? str.split('Butaca')[1].split('(')[0].trim() : 'Ubicación General',
        esPadrino: esPad,
      });
    });
  }

  // Agregar padrinos docentes
  if (padrinosDocentes && Array.isArray(padrinosDocentes)) {
    padrinosDocentes.forEach((docente) => {
      integrantes.push({
        nombre: docente.startsWith('Prof.') ? docente : `Prof. ${docente}`,
        rol: 'Padrino Docente Institucional · Estrado',
        tipo: 'PADRINO_DOCENTE',
        asiento: 'Estrado Oficial Beltrán',
        esPadrino: true,
      });
    });
  }

  // Pre-generar QR individuales para cada invitado/familiar
  const qrsIntegrantes: Buffer[] = [];
  for (let i = 0; i < integrantes.length; i++) {
    const intItem = integrantes[i];
    const urlIndividual = `${acceso}&invitado=${encodeURIComponent(intItem.nombre)}&asiento=${encodeURIComponent(intItem.asiento)}`;
    try {
      const dataUrl = await QRCode.toDataURL(urlIndividual, {
        width: 280,
        margin: 1,
        color: { dark: '#002038', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      qrsIntegrantes.push(Buffer.from(dataUrl.split(',')[1], 'base64'));
    } catch {
      qrsIntegrantes.push(qrPrincipal);
    }
  }

  return new Promise<Buffer>((resolve, reject) => {
    // Hoja A4 estándar: 595.28 x 841.89 puntos
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const partes: Buffer[] = [];
    doc.on('data', (parte) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    // ==========================================
    // PÁGINA 1: CREDENCIAL PRINCIPAL Y PASE GRUPAL
    // ==========================================
    doc.rect(0, 0, 595, 842).fill('#f8fafc');

    // Header Azul Beltrán
    doc.rect(0, 0, 595, 118).fill('#002038');
    doc.rect(0, 115, 595, 3).fill('#0284c7');
    doc.circle(535, 18, 75).fillOpacity(0.08).fill('#38bdf8');
    doc.circle(580, 95, 55).fillOpacity(0.06).fill('#0284c7');
    doc.fillOpacity(1.0);

    // Caja blanca destacada para el Escudo Oficial Beltrán
    const logoX = 36;
    const logoY = 16;
    const logoBoxW = 78;
    const logoBoxH = 84;
    doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 10).fill('#ffffff');
    doc.roundedRect(logoX, logoY, logoBoxW, logoBoxH, 10).lineWidth(1.5).strokeColor('#38bdf8').stroke();

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, logoX + 11, logoY + 6, { width: 56, height: 72 });
      } catch (e) {}
    }

    // Textos institucionales del encabezado
    const tx = 126;
    doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(9.5).text('INSTITUTO TECNOLÓGICO BELTRÁN', tx, 25, { characterSpacing: 1.1 });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16.5).text('CREDENCIAL DIGITAL OFICIAL & PASE GRUPAL', tx, 39);
    doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(9).text('TECNICATURA SUPERIOR EN ANALISTA DE SISTEMAS', tx, 61, { characterSpacing: 0.6 });

    // Badge de Validación Institucional
    doc.roundedRect(tx, 76, 220, 20, 5).fill('#084370');
    doc.roundedRect(tx, 76, 220, 20, 5).lineWidth(1).strokeColor('#0284c7').stroke();
    doc.fillColor('#e0f2fe').font('Helvetica-Bold').fontSize(8).text('HABILITACIÓN OFICIAL · PASE GRUPAL AUTORIZADO', tx + 12, 82, { characterSpacing: 0.6 });

    // Tarjeta del Egresado Titular y QR Principal (y: 132 a 352)
    doc.roundedRect(36, 132, 523, 222, 12).fill('#ffffff');
    doc.roundedRect(36, 132, 523, 222, 12).lineWidth(1).strokeColor('#e2e8f0').stroke();

    // Columna Izquierda: Datos del Egresado
    doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(9).text('EGRESADO / A TITULAR DE CEREMONIA', 56, 150, { characterSpacing: 1 });
    doc.fillColor('#002038').font('Helvetica-Bold').fontSize(22).text(nombre, 56, 166, { width: 300 });

    const yInfo = 216;
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text('CEREMONIA:', 56, yInfo);
    doc.fillColor('#0f172a').font('Helvetica').fontSize(9).text(ceremonia, 132, yInfo, { width: 224 });

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text('FECHA Y HORA:', 56, yInfo + 25);
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(fechaTexto || 'Fecha a confirmar', 132, yInfo + 25);

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text('SEDE Y LUGAR:', 56, yInfo + 50);
    doc.fillColor('#0f172a').font('Helvetica').fontSize(9).text(lugar || 'Instituto Tecnológico Beltrán (Av. Belgrano 1191)', 132, yInfo + 50, { width: 224 });

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text('CONVOCATORIA:', 56, yInfo + 82);
    doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(8.5).text('Presentarse 45 min antes para acreditación en portería', 132, yInfo + 82);

    // Columna Derecha: QR Principal
    const qrX = 380;
    const qrY = 148;
    const qrW = 160;
    const qrH = 190;
    doc.roundedRect(qrX, qrY, qrW, qrH, 10).fill('#f8fafc');
    doc.roundedRect(qrX, qrY, qrW, qrH, 10).lineWidth(1).strokeColor('#cbd5e1').stroke();

    doc.image(qrPrincipal, qrX + 18, qrY + 12, { width: 124, height: 124 });

    doc.roundedRect(qrX + 12, qrY + 142, 136, 20, 5).fill('#002038');
    doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(7.5).text('ESCANEAR EN PORTERÍA', qrX + 12, qrY + 148, { width: 136, align: 'center', characterSpacing: 0.5 });

    const tokenSeguridad = acceso.length > 26 ? acceso.slice(-18).toUpperCase() : acceso;
    doc.fillColor('#64748b').font('Helvetica').fontSize(6.5).text('COD: ' + tokenSeguridad, qrX + 10, qrY + 168, { width: 140, align: 'center' });

    // Tarjeta Butaca Asignada Egresado (y: 366 a 442)
    doc.roundedRect(36, 366, 523, 76, 10).fill('#f0f9ff');
    doc.roundedRect(36, 366, 523, 76, 10).lineWidth(1.2).strokeColor('#7dd3fc').stroke();

    doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(8.5).text('UBICACIÓN ASIGNADA DEL EGRESADO EN ANFITEATRO', 56, 378, { characterSpacing: 0.8 });
    const textoButacaEgresado = asiento ? `Butaca ${asiento}` : 'Ubicación General Reservada';
    doc.fillColor('#002038').font('Helvetica-Bold').fontSize(22).text(textoButacaEgresado, 56, 393);
    doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(
      asiento
        ? 'Sector Egresados Beltrán. Butaca numerada y nominada exclusivamente a tu nombre.'
        : 'Sector Egresados Beltrán. Tu butaca se confirmará en el portal o al ingresar en portería.',
      56,
      422
    );

    // Módulo de Padrinos y Acompañantes Detallados (y: 454 a 705)
    doc.roundedRect(36, 454, 523, 252, 10).fill('#ffffff');
    doc.roundedRect(36, 454, 523, 252, 10).lineWidth(1).strokeColor('#e2e8f0').stroke();

    doc.fillColor('#002038').font('Helvetica-Bold').fontSize(11).text('INTEGRANTES DEL GRUPO, PADRINOS DE DIPLOMA Y ACOMPAÑANTES', 56, 470);
    doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('Detalle formal de personas autorizadas a ingresar y sus butacas asignadas:', 56, 485);
    doc.moveTo(56, 500).lineTo(539, 500).lineWidth(0.8).strokeColor('#e2e8f0').stroke();

    if (integrantes.length > 0) {
      let yFila = 510;
      integrantes.slice(0, 6).forEach((item, idx) => {
        const bgFila = item.esPadrino ? '#fefce8' : (idx % 2 === 0 ? '#f8fafc' : '#ffffff');
        const borderFila = item.esPadrino ? '#fef08a' : '#e2e8f0';

        doc.roundedRect(54, yFila - 2, 487, 28, 6).fill(bgFila);
        doc.roundedRect(54, yFila - 2, 487, 28, 6).lineWidth(0.8).strokeColor(borderFila).stroke();

        // Badge numérico
        doc.roundedRect(62, yFila + 2, 20, 20, 4).fill(item.esPadrino ? '#ca8a04' : '#0284c7');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(String(idx + 1), 62, yFila + 6, { width: 20, align: 'center' });

        // Nombre
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(item.nombre, 90, yFila + 3, { width: 175 });

        // Rol con badge
        if (item.tipo === 'PADRINO_DIPLOMA') {
          doc.roundedRect(268, yFila + 2, 142, 20, 4).fill('#fef3c7');
          doc.fillColor('#854d0e').font('Helvetica-Bold').fontSize(7.5).text(item.rol, 272, yFila + 7, { width: 134, align: 'center' });
        } else if (item.tipo === 'PADRINO_DOCENTE') {
          doc.roundedRect(268, yFila + 2, 142, 20, 4).fill('#e0e7ff');
          doc.fillColor('#3730a3').font('Helvetica-Bold').fontSize(7.5).text(item.rol, 272, yFila + 7, { width: 134, align: 'center' });
        } else {
          doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(item.rol, 272, yFila + 7, { width: 138 });
        }

        // Asiento
        doc.roundedRect(418, yFila + 2, 115, 20, 4).fill('#002038');
        doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(8).text(item.asiento, 418, yFila + 7, { width: 115, align: 'center' });

        yFila += 32;
      });
    } else {
      doc.fillColor('#64748b').font('Helvetica-Oblique').fontSize(9).text('Sin acompañantes ni padrinos registrados en este grupo.', 56, 520);
    }

    // Pie de Seguridad de Página 1 (y: 718 a 808)
    doc.roundedRect(36, 718, 523, 90, 8).fill('#f1f5f9');
    doc.roundedRect(36, 718, 523, 90, 8).lineWidth(1).strokeColor('#cbd5e1').stroke();

    doc.fillColor('#002038').font('Helvetica-Bold').fontSize(8.5).text('AVISO DE SEGURIDAD, PROTOCOLO Y VALIDEZ INSTITUCIONAL', 54, 729, { characterSpacing: 0.6 });
    doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(
      'Este documento oficial habilita el ingreso del egresado titular y de cada acompañante registrado.\n' +
      'En la siguiente hoja encontrará las CREDENCIALES INDIVIDUALES DESGLOSADAS para cada miembro de la familia o padrino.\n' +
      'Instituto Tecnológico Beltrán · Av. Manuel Belgrano 1191, Avellaneda · Sede Central · www.ibeltran.com.ar',
      54,
      744,
      { width: 487, lineGap: 3 }
    );

    // =========================================================================
    // PÁGINA 2+: TARJETAS / CREDENCIALES INDIVIDUALES DE FAMILIARES Y PADRINOS
    // =========================================================================
    if (integrantes.length > 0) {
      const porPagina = 4;
      for (let p = 0; p < integrantes.length; p += porPagina) {
        doc.addPage({ size: 'A4', margin: 0 });
        doc.rect(0, 0, 595, 842).fill('#f8fafc');

        // Header secundario superior
        doc.rect(0, 0, 595, 80).fill('#002038');
        doc.rect(0, 78, 595, 2).fill('#0284c7');

        // Escudo en header secundario
        doc.roundedRect(36, 12, 54, 56, 6).fill('#ffffff');
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, 44, 16, { width: 38, height: 48 });
          } catch {}
        }

        doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(8.5).text('INSTITUTO TECNOLÓGICO BELTRÁN', 102, 18, { characterSpacing: 1 });
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('PASE INDIVIDUAL DE ACCESO · FAMILIARES Y PADRINOS', 102, 31);
        doc.fillColor('#cbd5e1').font('Helvetica').fontSize(8).text(`Egresado Titular: ${nombre} · ${ceremonia}`, 102, 50, { width: 440 });

        // Grilla de 4 tarjetas individuales
        const grupo = integrantes.slice(p, p + porPagina);
        const cardW = 252;
        const cardH = 320;
        const startX = 36;
        const startY = 96;
        const gapX = 19;
        const gapY = 18;

        grupo.forEach((persona, gIdx) => {
          const col = gIdx % 2;
          const row = Math.floor(gIdx / 2);
          const cX = startX + col * (cardW + gapX);
          const cY = startY + row * (cardH + gapY);

          // Fondo tarjeta
          doc.roundedRect(cX, cY, cardW, cardH, 10).fill('#ffffff');
          doc.roundedRect(cX, cY, cardW, cardH, 10).lineWidth(persona.esPadrino ? 1.5 : 1).strokeColor(persona.esPadrino ? '#ca8a04' : '#cbd5e1').stroke();

          // Header de la tarjeta individual
          const bgCardHeader = persona.esPadrino ? '#002038' : '#084370';
          doc.roundedRect(cX, cY, cardW, 46, 10).fill(bgCardHeader);
          doc.rect(cX, cY + 36, cardW, 10).fill(bgCardHeader);
          doc.rect(cX, cY + 44, cardW, 2).fill(persona.esPadrino ? '#eab308' : '#0284c7');

          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text(
            persona.esPadrino ? 'PADRINO DE DIPLOMA' : 'PASE DE ACOMPAÑANTE',
            cX + 12,
            cY + 10,
            { characterSpacing: 0.5 }
          );
          doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5).text('INSTITUTO TECNOLÓGICO BELTRÁN', cX + 12, cY + 25);

          // Nombre del integrante
          doc.fillColor('#002038').font('Helvetica-Bold').fontSize(13).text(persona.nombre, cX + 12, cY + 56, { width: cardW - 24 });

          // Rol o parentesco
          doc.roundedRect(cX + 12, cY + 76, cardW - 24, 20, 4).fill(persona.esPadrino ? '#fef3c7' : '#f1f5f9');
          doc.fillColor(persona.esPadrino ? '#854d0e' : '#0369a1').font('Helvetica-Bold').fontSize(8).text(
            persona.rol,
            cX + 16,
            cY + 81,
            { width: cardW - 32, align: 'center' }
          );

          // Código QR Individual
          const qrIndiv = qrsIntegrantes[p + gIdx] || qrPrincipal;
          const qrIndW = 105;
          doc.roundedRect(cX + (cardW - qrIndW) / 2, cY + 104, qrIndW, qrIndW, 8).fill('#f8fafc');
          doc.roundedRect(cX + (cardW - qrIndW) / 2, cY + 104, qrIndW, qrIndW, 8).lineWidth(1).strokeColor('#e2e8f0').stroke();
          doc.image(qrIndiv, cX + (cardW - qrIndW) / 2 + 5, cY + 109, { width: 95, height: 95 });

          // Ubicación en la tarjeta
          doc.roundedRect(cX + 12, cY + 218, cardW - 24, 42, 6).fill('#f0f9ff');
          doc.roundedRect(cX + 12, cY + 218, cardW - 24, 42, 6).lineWidth(1).strokeColor('#7dd3fc').stroke();
          doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(7).text('UBICACIÓN ASIGNADA EN SALA', cX + 18, cY + 224, { characterSpacing: 0.5 });
          doc.fillColor('#002038').font('Helvetica-Bold').fontSize(14).text(persona.asiento, cX + 18, cY + 236);

          // Microtextos de pie de tarjeta
          doc.fillColor('#64748b').font('Helvetica').fontSize(6.5).text(`Egresado: ${nombre}`, cX + 12, cY + 268, { width: cardW - 24 });
          doc.fillColor('#64748b').font('Helvetica').fontSize(6.5).text(`Fecha: ${fechaTexto || 'Colación 2026'}`, cX + 12, cY + 279, { width: cardW - 24 });
          doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(6.5).text('PRESENTAR AL INGRESAR EN PORTERÍA', cX + 12, cY + 296, { width: cardW - 24, align: 'center' });
        });

        // Footer inferior de la página de credenciales individuales
        doc.roundedRect(36, 764, 523, 48, 6).fill('#ffffff');
        doc.roundedRect(36, 764, 523, 48, 6).lineWidth(1).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(
          'Cada pase individual puede ser recortado o exhibido directamente desde el celular por el familiar o padrino correspondiente.\n' +
          'SiGIC · Sistema de Gestión Institucional de Colaciones · Instituto Tecnológico Beltrán',
          50,
          776,
          { width: 495, align: 'center', lineGap: 3 }
        );
      }
    }

    doc.end();
  });
}
