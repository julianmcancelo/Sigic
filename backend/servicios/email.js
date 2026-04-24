/**
 * Servicio de envío de correos utilizando Nodemailer (SMTP).
 * Plantillas rediseñadas para máxima compatibilidad con clientes de correo (Gmail, Outlook, etc).
 */
const nodemailer = require('nodemailer')
const path = require('path')
require('dotenv').config()

const RUTA_LOGO = path.join(__dirname, '../../assets/logo.png')

const transportador = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function enviarCorreo(destinatario, asunto, cuerpoHTML) {
  try {
    const info = await transportador.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'SiGIC'}" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: cuerpoHTML,
      attachments: [
        {
          filename: 'logo.png',
          path: RUTA_LOGO,
          cid: 'logo_sigic', 
        },
      ],
    })
    console.log(`✓ Correo enviado a [${destinatario}]`)
    return { ok: true, id: info.messageId }
  } catch (error) {
    console.error('❌ Error en envío:', error)
    throw new Error(error.message || 'No se pudo procesar el envío del correo.')
  }
}

/**
 * PLANTILLA: Invitación / Registro de Invitados
 * Optimizada para Outlook y Gmail con atributos bgcolor y tablas anidadas.
 */
function generarPlantillaInvitacion(nombreEgresado, linkRegistro) {
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f0f4f8">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
            
            <!-- HEADER (Uso de bgcolor para Outlook) -->
            <tr>
              <td align="center" bgcolor="#2A3448" style="padding: 40px;">
                <!-- Logo con ancho fijo y display block para evitar espacios raros -->
                <img src="cid:logo_sigic" alt="SiGIC" width="120" style="display: block; margin-bottom: 20px; outline: none; border: none; text-decoration: none;">
                <h1 style="color: #29ABE2; margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">Portal del Egresado</h1>
                <p style="color: #64748b; margin: 5px 0 0; font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">SiGIC 2026 - Instituto Beltrán</p>
              </td>
            </tr>

            <!-- CUERPO -->
            <tr>
              <td style="padding: 50px 40px; text-align: center; font-family: Arial, sans-serif;">
                <h2 style="color: #2A3448; font-size: 22px; margin-top: 0; font-weight: bold;">Hola, ${nombreEgresado}</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Es un honor invitarte a formalizar el registro de tus acompañantes para el <strong>Evento de Graduación 2026</strong>.
                </p>

                <!-- CAJA DE PASOS (Tabla interna para mejor renderizado) -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 40px;">
                  <tr>
                    <td style="padding: 25px; text-align: left;">
                      <p style="color: #2A3448; font-size: 13px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Pasos para tu registro:</p>
                      <table border="0" cellspacing="0" cellpadding="0" style="color: #64748b; font-size: 13px; line-height: 1.6;">
                        <tr><td style="padding-bottom: 8px;">• Haz clic en el botón <strong>"Registrar Invitados Ahora"</strong></td></tr>
                        <tr><td style="padding-bottom: 8px;">• Valida tu acceso con el código de 6 dígitos que recibirás</td></tr>
                        <tr><td style="padding-bottom: 8px;">• Carga los datos de tus acompañantes y confirma selección</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- BOTON -->
                <table border="0" cellspacing="0" cellpadding="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#29ABE2" style="border-radius: 12px;">
                      <a href="${linkRegistro}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 12px; padding: 18px 40px; border: 1px solid #29ABE2; display: inline-block; font-weight: bold;">
                        Registrar Invitados Ahora
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #94a3b8; font-size: 11px; margin-top: 40px;">
                  Si el botón no funciona, copia este enlace en tu navegador:<br>
                  <a href="${linkRegistro}" style="color: #29ABE2; text-decoration: underline;">${linkRegistro}</a>
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" bgcolor="#f8fafc" style="padding: 30px; border-top: 1px solid #e2e8f0;">
                <p style="color: #cbd5e1; font-family: Arial, sans-serif; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                  © 2026 Instituto Beltrán - Sistema SiGIC
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * PLANTILLA: Código de Verificación (OTP)
 */
function generarPlantillaOTP(codigo) {
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f0f4f8">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="500" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 500px; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr>
              <td align="center" bgcolor="#2A3448" style="padding: 35px;">
                <img src="cid:logo_sigic" alt="SiGIC" width="100">
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
  `
}

module.exports = {
  enviarCorreo,
  generarPlantillaInvitacion,
  generarPlantillaOTP,
}
