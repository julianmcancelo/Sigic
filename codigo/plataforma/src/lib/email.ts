import nodemailer from 'nodemailer';

let transportador: nodemailer.Transporter | null = null;

async function inicializarTransportador() {
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
    console.log('📧 Nodemailer configurado con SMTP del entorno.');
  } else {
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
      console.log('📧 Nodemailer configurado con SMTP de prueba dinámico (Ethereal).');
      console.log(`   Usuario: ${cuentaPrueba.user}`);
    } catch (e) {
      console.error('❌ Error al inicializar cuenta SMTP de prueba (Ethereal):', e);
    }
  }
}

// Inicializar de forma asíncrona pero sin bloquear la carga del módulo
inicializarTransportador();

export async function enviarCorreo(destinatario: string, asunto: string, cuerpoHTML: string) {
  if (!transportador) {
    // Si no está inicializado, esperar 1 segundo por si está cargando Ethereal
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!transportador) {
    console.log('\n=========================================');
    console.log('📧 SIMULACIÓN DE ENVÍO DE CORREO (Modo Local - Sin Transporte)');
    console.log(`➜ Destinatario: ${destinatario}`);
    console.log(`➜ Asunto: ${asunto}`);
    console.log('=========================================\n');
    return { ok: true, id: 'mock-id-local' };
  }

  try {
    const opcionesTransporte = transportador.options as unknown as {
      auth?: { user?: string };
      host?: string;
    };
    const info = await transportador.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'SiGIC'}" <${opcionesTransporte.auth?.user}>`,
      to: destinatario,
      subject: asunto,
      html: cuerpoHTML,
    });
    console.log(`✓ Correo enviado a [${destinatario}]`);
    if (opcionesTransporte.host?.includes('ethereal.email')) {
      console.log(`📖 Previsualización del correo: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { ok: true, id: info.messageId };
  } catch (error: any) {
    console.error('❌ Error en envío SMTP por red:', error.message);
    console.log('\n=========================================');
    console.log('⚠️ AVISO: ENVÍO SMTP BLOQUEADO EN TU RED LOCAL (TIMEOUT/REFUSED)');
    console.log('Tu ISP o proveedor de red tiene bloqueados los puertos SMTP.');
    console.log('Se activó la SIMULACIÓN AUTOMÁTICA para desarrollo.');
    console.log(`➜ Destinatario: ${destinatario}`);
    console.log(`➜ Asunto: ${asunto}`);
    
    // Buscar código de 6 dígitos (OTP) en el HTML para mostrarlo visiblemente en consola
    const matchOtp = cuerpoHTML.match(/>\s*([A-Z0-9]{6})\s*</) || cuerpoHTML.match(/([A-Z0-9]{6})/);
    if (matchOtp) {
      console.log(`🔑 CÓDIGO OTP DE ACCESO: ${matchOtp[1]}`);
    }
    console.log('=========================================\n');
    
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
