import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

const IS_DEV = process.env.NODE_ENV === 'development';

// Configuración de transporte de correo
function createTransporter() {
  // Si hay API key de SendGrid, usar SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Si hay configuración SMTP, usar SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });
  }

  // En desarrollo sin configuración, retornar null (se logueará)
  return null;
}

// Leer plantilla HTML
function loadTemplate(variant: 'A' | 'B', token: string, communityColor?: string): { subject: string; html: string } {
  const templatePath = path.join(process.cwd(), 'emails', `followup_${variant}.html`);
  let html = '';
  
  try {
    html = fs.readFileSync(templatePath, 'utf-8');
  } catch (err) {
    console.error(`Error leyendo plantilla ${templatePath}:`, err);
    // Fallback básico
    html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Gracias por tu sesión</h1>
          <p>Te invitamos a completar tu seguimiento haciendo clic <a href="{{baseUrl}}/after/{{token}}">aquí</a>.</p>
        </body>
      </html>
    `;
  }

  // Reemplazar placeholders
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  html = html.replace(/\{\{token\}\}/g, token);
  html = html.replace(/\{\{baseUrl\}\}/g, baseUrl);
  if (communityColor) {
    html = html.replace(/\{\{communityColor\}\}/g, communityColor);
  }

  // Subject según variante
  const subject = variant === 'A' 
    ? 'Seguimiento de tu sesión de mentoría - Mood Meter'
    : '¿Cómo te sientes después de tu sesión? - Mood Meter';

  return { subject, html };
}

/**
 * Envía correo de follow-up post-sesión
 * @param to - Email del destinatario
 * @param token - Token único para /after/[token]
 * @param variant - Variante A o B del A/B test
 * @param communityColor - Color de la comunidad para branding (opcional)
 * @returns Promise que resuelve cuando el correo fue enviado/logueado
 */
export async function sendFollowupEmail(
  to: string,
  token: string,
  variant: 'A' | 'B',
  communityColor?: string
): Promise<void> {
  const { subject, html } = loadTemplate(variant, token, communityColor);
  const from = process.env.MAIL_FROM || 'noreply@moodmeter.tec.mx';

  // En modo desarrollo sin SMTP configurado, solo loguear
  if (IS_DEV && !process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
    console.log('[EMAIL DEV MODE]');
    console.log('To:', to);
    console.log('From:', from);
    console.log('Subject:', subject);
    console.log('Token:', token);
    console.log('Variant:', variant);
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[EMAIL] No hay configuración de correo. En modo dev, esto es normal.');
    return;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    console.log(`[EMAIL] Correo enviado a ${to} (variante ${variant})`);
  } catch (error) {
    console.error('[EMAIL] Error enviando correo:', error);
    throw error;
  }
}

