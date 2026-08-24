import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

let transportador: nodemailer.Transporter | null = null;

async function inicializarTransportador() {
  if (process.env.RESEND_API_KEY) {
    console.log('Resend configurado como proveedor principal.');
    return;
  }
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transportador = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Nodemailer configurado con SMTP del entorno.');
  } else if (process.env.NODE_ENV !== 'production') {
    try {
      // Intentamos crear una cuenta SMTP de prueba temporal con Ethereal
      const cuentaPrueba = await nodemailer.createTestAccount();
      transportador = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 465,
        secure: true,
        auth: {
          user: cuentaPrueba.user,
          pass: cuentaPrueba.pass,
        },
      });
      console.log('Nodemailer configurado con SMTP de prueba dinámico (Ethereal).');
      console.log(`   Usuario: ${cuentaPrueba.user}`);
    } catch (e) {
      console.error('Error al inicializar cuenta SMTP de prueba (Ethereal):', e);
    }
  }
}

// Inicializar de forma asíncrona pero sin bloquear la carga del módulo
inicializarTransportador();

type ArchivoAdjunto = { filename: string; content: Buffer; contentType?: string };

export async function enviarCorreo(destinatario: string, asunto: string, cuerpoHTML: string, adjuntos: ArchivoAdjunto[] = []) {
  const remitente = process.env.EMAIL_FROM || 'SiGIC <no-responder@notificaciones.sigic.com.ar>';

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
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

  if (!transportador) {
    // Si no está inicializado, esperar 1 segundo por si está cargando Ethereal
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!transportador) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('El servicio de correo no está configurado.');
    }
    console.log('\n=========================================');
    console.log('SIMULACIÓN DE ENVÍO DE CORREO (Modo Local - Sin Transporte)');
    console.log(`Destinatario: ${destinatario}`);
    console.log(`Asunto: ${asunto}`);
    console.log('=========================================\n');
    return { ok: true, id: 'mock-id-local' };
  }

  try {
    const opcionesTransporte = transportador.options as unknown as {
      auth?: { user?: string };
      host?: string;
    };
    const info = await transportador.sendMail({
      from: process.env.EMAIL_FROM || `"${process.env.EMAIL_FROM_NAME || 'SiGIC'}" <${opcionesTransporte.auth?.user}>`,
      to: destinatario,
      subject: asunto,
      html: cuerpoHTML,
      attachments: adjuntos,
    });
    console.log(`Correo enviado a [${destinatario}]`);
    if (opcionesTransporte.host?.includes('ethereal.email')) {
      console.log(`Previsualización del correo: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { ok: true, id: info.messageId };
  } catch (error: any) {
    console.error('Error en envío SMTP por red:', error.message);
    console.log('\n=========================================');
    console.log('AVISO: ENVÍO SMTP BLOQUEADO EN TU RED LOCAL (TIMEOUT/REFUSED)');
    console.log('Tu ISP o proveedor de red tiene bloqueados los puertos SMTP.');
    console.log('Se activó la SIMULACIÓN AUTOMÁTICA para desarrollo.');
    console.log(`Destinatario: ${destinatario}`);
    console.log(`Asunto: ${asunto}`);
    
    // Buscar código de 6 dígitos (OTP) en el HTML para mostrarlo visiblemente en consola
    const matchOtp = cuerpoHTML.match(/>\s*([A-Z0-9]{6})\s*</) || cuerpoHTML.match(/([A-Z0-9]{6})/);
    if (matchOtp) {
      console.log(`CÓDIGO OTP DE ACCESO: ${matchOtp[1]}`);
    }
    console.log('=========================================\n');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No se pudo entregar el correo mediante SMTP.');
    }
    return { ok: true, simulado: true, id: 'simulado-' + Date.now() };
  }
}

/**
 * PLANTILLA: Invitación / Registro de Invitados
 */
export function generarPlantillaInvitacion(nombreEgresado: string, linkRegistro: string, hostBase: string) {
  const linkLogo = `${hostBase}/logo-oficial.png`;
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f0f4f8">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <!-- HEADER -->
            <tr>
              <td align="center" bgcolor="#2A3448" style="padding: 40px; border-bottom: 4px solid #29ABE2;">
                <!-- Logo desde URL absoluta -->
                <img src="${linkLogo}" alt="SiGIC" width="120" style="display: block; margin-bottom: 20px; outline: none; border: none; text-decoration: none;">
                <h1 style="color: #ffffff; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Portal del Graduado</h1>
                <p style="color: #94a3b8; margin: 8px 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Instituto Tecnológico Beltrán</p>
              </td>
            </tr>

            <!-- CUERPO -->
            <tr>
              <td style="padding: 50px 40px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <h2 style="color: #1e293b; font-size: 24px; margin-top: 0; font-weight: 800;">¡Felicidades, ${nombreEgresado}!</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">
                  Es un gran honor para nosotros invitarte a formalizar tu participación y la de tus seres queridos en la <strong>Ceremonia de Graduación 2026</strong>. 
                  <br><br>
                  Tu esfuerzo y dedicación han rendido frutos, y queremos celebrarlo a lo grande.
                </p>

                <!-- CAJA DE PASOS -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 40px;">
                  <tr>
                    <td style="padding: 30px; text-align: left;">
                      <p style="color: #0f172a; font-size: 14px; font-weight: 800; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Instrucciones para tu registro:</p>
                      <table border="0" cellspacing="0" cellpadding="0" style="color: #475569; font-size: 14px; line-height: 1.6;">
                        <tr>
                          <td valign="top" style="padding-bottom: 12px; color: #29ABE2; font-weight: bold; padding-right: 10px;">1.</td>
                          <td style="padding-bottom: 12px;">Haz clic en el botón <strong>"Confirmar Asistencia"</strong> que aparece a continuación.</td>
                        </tr>
                        <tr>
                          <td valign="top" style="padding-bottom: 12px; color: #29ABE2; font-weight: bold; padding-right: 10px;">2.</td>
                          <td style="padding-bottom: 12px;">Valida tu identidad de forma segura con el código de 6 dígitos (OTP) que recibirás en tu correo.</td>
                        </tr>
                        <tr>
                          <td valign="top" style="padding-bottom: 0; color: #29ABE2; font-weight: bold; padding-right: 10px;">3.</td>
                          <td style="padding-bottom: 0;"><strong>Acepta o rechaza</strong> tu invitación formal. Si aceptas, podrás registrar a tus acompañantes y elegir tus asientos.</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- BOTON -->
                <table border="0" cellspacing="0" cellpadding="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#29ABE2" style="border-radius: 12px; box-shadow: 0 4px 6px rgba(41, 171, 226, 0.25);">
                      <a href="${linkRegistro}" target="_blank" style="font-size: 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 12px; padding: 18px 45px; display: inline-block; font-weight: bold; letter-spacing: 0.5px;">
                        Confirmar Asistencia
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; line-height: 1.5;">
                  ¿Problemas con el botón? Copia y pega este enlace en tu navegador de preferencia:<br>
                  <a href="${linkRegistro}" style="color: #29ABE2; text-decoration: underline; word-break: break-all;">${linkRegistro}</a>
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" bgcolor="#1e293b" style="padding: 30px; border-top: 1px solid #334155;">
                <p style="color: #94a3b8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                  © 2026 Instituto Tecnológico Beltrán
                </p>
                <p style="color: #64748b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; margin: 10px 0 0 0;">
                  Sistema de Gestión de Invitados y Ceremonias (SiGIC)
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * PLANTILLA: Código de Verificación (OTP)
 */
export function generarPlantillaOTP(codigo: string, hostBase: string) {
  const linkLogo = `${hostBase}/logo-oficial.png`;
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f0f4f8">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="500" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 500px; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr>
              <td align="center" bgcolor="#2A3448" style="padding: 35px;">
                <img src="${linkLogo}" alt="SiGIC" width="100">
              </td>
            </tr>
            <tr>
              <td style="padding: 50px 40px; text-align: center; font-family: Arial, sans-serif;">
                <h2 style="color: #2A3448; font-size: 20px; margin-top: 0; font-weight: bold;">Código de Verificación</h2>
                <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 30px;">
                  Utiliza el siguiente código para completar tu inicio de sesión:
                </p>
                
                <table align="center" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f5f9" style="border: 2px dashed #cbd5e1; border-radius: 16px;">
                  <tr>
                    <td style="padding: 20px 40px; font-family: Courier, monospace; font-size: 40px; font-weight: bold; color: #2A3448; letter-spacing: 10px;">
                      ${codigo}
                    </td>
                  </tr>
                </table>
                
                <p style="color: #f43f5e; font-size: 12px; font-weight: bold; margin-top: 30px;">Expira en 10 minutos.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/** Aviso único tras finalizar la autogestión; el graduado conserva acceso para corregir datos. */
export function generarPlantillaCierreInscripcion(nombre: string, hostBase: string) {
  const acceso = `${hostBase}/`;
  return `
    <div style="max-width:560px;margin:0 auto;padding:32px;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
      <div style="overflow:hidden;border-radius:20px;background:#ffffff;border:1px solid #e2e8f0">
        <div style="padding:28px 32px;background:#0d1b2e;color:#ffffff">
          <p style="margin:0;color:#67e8f9;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase">SiGIC · inscripción guardada</p>
          <h1 style="margin:10px 0 0;font-size:24px">Hola, ${nombre}</h1>
        </div>
        <div style="padding:30px 32px;font-size:15px;line-height:1.6">
          <p>Tu información quedó guardada correctamente. Podés volver cuando lo necesites para completar, corregir o modificar tus datos y acompañantes.</p>
          <p>Ingresá al portal con tu <strong>DNI o correo electrónico</strong>; recibirás un código de acceso seguro.</p>
          <p style="margin:26px 0;text-align:center"><a href="${acceso}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:bold">Volver a mi inscripción</a></p>
          <p style="margin:0;color:#64748b;font-size:12px">Este aviso se envía una sola vez. Tus cambios posteriores seguirán disponibles desde el mismo acceso.</p>
        </div>
      </div>
    </div>`;
}

/** Comunicación final con el pase digital y la información operativa de la ceremonia. */
export function generarPlantillaCredencialCeremonia({ nombre, ceremonia, fecha, lugar, asiento, acceso, googleWalletUrl }: { nombre: string; ceremonia: string; fecha: string; lugar: string; asiento?: string | null; acceso: string; googleWalletUrl?: string | null }) {
  return `
    <div style="margin:0;padding:32px 14px;background:#edf3f7;font-family:'Helvetica Neue',Helvetica,sans-serif;color:#172033">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;background:#ffffff;border:1px solid #d7e2ea;border-radius:24px;box-shadow:0 14px 40px rgba(7,27,52,.12)">
        <tr><td style="padding:13px 34px;background:#071b34;color:#a5f3fc;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase">SiGIC · Pase digital de ceremonia</td></tr>
        <tr><td style="padding:30px 34px 22px;background:linear-gradient(135deg,#071b34,#123f5b);color:#ffffff">
          <p style="margin:0 0 9px;color:#67e8f9;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase">Credencial confirmada</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;letter-spacing:-.5px">Todo listo para tu ceremonia</h1>
          <p style="margin:12px 0 0;color:#dbeafe;font-size:15px;line-height:1.55">Hola, <strong>${nombre}</strong>. Tu grupo tiene ubicaciones confirmadas.</p>
        </td></tr>
        <tr><td style="padding:26px 34px 10px">
          <p style="margin:0;color:#516276;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase">Ceremonia</p>
          <p style="margin:6px 0 20px;color:#172033;font-size:20px;font-weight:800">${ceremonia}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#f4f9fc;border:1px solid #d9ebf5;border-radius:16px">
            <tr><td style="padding:16px 18px;width:50%;border-right:1px solid #d9ebf5"><span style="display:block;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Fecha</span><strong style="display:block;margin-top:5px;color:#0f2740;font-size:14px">${fecha || 'A confirmar'}</strong></td><td style="padding:16px 18px"><span style="display:block;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Ubicación</span><strong style="display:block;margin-top:5px;color:#0f2740;font-size:14px">${asiento || 'Consultar en el portal'}</strong></td></tr>
          </table>
          <p style="margin:16px 0 0;color:#516276;font-size:14px;line-height:1.55"><strong style="color:#172033">Lugar:</strong> ${lugar || 'A confirmar'}. Presentate con anticipación y exhibí el QR de tu credencial en portería.</p>
        </td></tr>
        <tr><td style="padding:22px 34px 30px;text-align:center">
          <a href="${acceso}" style="display:inline-block;margin:0 0 12px;padding:14px 24px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800">Abrir mi credencial y QR</a><br>
          ${googleWalletUrl ? `<a href="${googleWalletUrl}" style="display:inline-block;padding:12px 20px;border:1px solid #123f5b;border-radius:10px;background:#ffffff;color:#071b34;text-decoration:none;font-size:13px;font-weight:800">Guardar en Google Wallet</a><br>` : ''}
          <p style="margin:16px 0 0;color:#7b8b9d;font-size:11px;line-height:1.45">Este acceso es personal. Conservá este correo para consultar tu grupo y tus ubicaciones.</p>
        </td></tr>
      </table>
    </div>`;
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
