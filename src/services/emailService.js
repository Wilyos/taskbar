const nodemailer = require('nodemailer');
require('dotenv').config();

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Envía el correo de recuperación de contraseña con enlace directo y código/token.
 */
async function sendPasswordResetEmail({ to, name, resetUrl, token }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'Taskbar <no-reply@taskbar.local>';
  const subject = 'Recuperación de contraseña - Taskbar';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <span style="font-size: 24px;">⚡</span>
        <h2 style="margin: 0; color: #00ff88;">Taskbar</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
        Hola <strong>${name || 'Usuario'}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña (válido por 30 minutos):
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #00ff88; color: #022c22; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
          Restablecer Contraseña
        </a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
        También puedes copiar y pegar este código de recuperación en la pantalla de inicio de sesión:
      </p>
      <div style="background: #020617; border: 1px solid #334155; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #00ff88; word-break: break-all; text-align: center;">
        ${token}
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
      </p>
    </div>
  `;

  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS). Enlace de recuperación generado en consola:');
    console.log(`📧 Para: ${to}`);
    console.log(`🔗 Enlace: ${resetUrl}`);
    console.log(`🔑 Token: ${token}`);
    return { sent: false, previewOnly: true };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to,
    subject,
    text: `Hola ${name || 'Usuario'}, usa este enlace para restablecer tu contraseña (válido 30 min): ${resetUrl}\nO ingresa el código: ${token}`,
    html
  });

  return { sent: true, previewOnly: false };
}

module.exports = {
  isSmtpConfigured,
  sendPasswordResetEmail
};
