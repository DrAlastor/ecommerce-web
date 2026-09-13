import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromAddress =
      this.configService.get<string>('RESEND_FROM') || 'Dressly Store <onboarding@resend.dev>';

    if (apiKey && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      this.logger.log('Servicio Resend inicializado correctamente con API Key.');
    } else {
      this.logger.warn('RESEND_API_KEY no configurada. Los correos se registrarán únicamente en los logs.');
    }
  }

  /**
   * Envía un correo con el código de verificación y enlace para restablecer contraseña
   */
  async sendPasswordResetEmail(to: string, resetCode: string, resetLink: string): Promise<boolean> {
    const subject = 'Código de Recuperación de Contraseña — Dressly';

    const text = `Hola,\n\nHas solicitado restablecer tu contraseña en Dressly Fashion Store.\n\nTu código de verificación de 6 dígitos es: ${resetCode}\n\nTambién puedes restablecer tu contraseña directamente ingresando al siguiente enlace:\n${resetLink}\n\nEste código y enlace expirarán en 15 minutos.\nSi no solicitaste este cambio, puedes ignorar este correo.\n\nAtentamente,\nEquipo Dressly`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f6f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1c1917;
    }
    .container {
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid #ede8df;
    }
    .header {
      background: #1c1917;
      padding: 35px 30px;
      text-align: center;
    }
    .brand-title {
      font-family: Georgia, 'Playfair Display', serif;
      font-size: 28px;
      letter-spacing: 0.15em;
      color: #f5efe6;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #b45309;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      margin-top: 6px;
    }
    .content {
      padding: 40px 35px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.65;
      color: #57534e;
      margin-bottom: 25px;
    }
    .code-wrapper {
      background: #faf8f5;
      border: 1.5px dashed #d97706;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 25px 0;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #854d0e;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #1c1917;
      margin: 0;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn-reset {
      display: inline-block;
      background: #1c1917;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .expiration-note {
      font-size: 12px;
      color: #a8a29e;
      text-align: center;
      margin-top: 15px;
    }
    .footer {
      background: #faf8f5;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #78716c;
      border-top: 1px solid #ede8df;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">D R E S S L Y</h1>
      <div class="brand-subtitle">Fashion Store — Seguridad de Cuenta</div>
    </div>
    <div class="content">
      <div class="greeting">Restablecer Contraseña</div>
      <p class="message">
        Recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta en <strong>Dressly</strong>.
        Introduce el siguiente código numérico en la pantalla de verificación o pulsa directamente en el botón:
      </p>

      <div class="code-wrapper">
        <div class="code-label">Código de verificación</div>
        <div class="code-digits">${resetCode}</div>
      </div>

      <div class="btn-container">
        <a href="${resetLink}" class="btn-reset" target="_blank">Restablecer mi Contraseña</a>
      </div>

      <p class="expiration-note">
        ⏱ Este código y enlace son válidos durante <strong>15 minutos</strong>.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Si tú no solicitaste este cambio, ignora este correo con tranquilidad. Tu contraseña permanecerá intacta.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Dressly Fashion Store. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

    this.logger.log(`[RESEND] Preparando envío para: ${to} con código: ${resetCode}`);

    if (!this.resend) {
      this.logger.warn(`[MODO DESARROLLO SIN RESEND] Código para ${to}: ${resetCode} | Enlace: ${resetLink}`);
      return true;
    }

    try {
      // Intentar envío inicial al destinatario original
      let response = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });

      // Si Resend está en modo sandbox (onboarding@resend.dev) y restringe destinatarios externos:
      if (response.error && response.error.name === 'validation_error' && response.error.message?.includes('testing emails')) {
        this.logger.warn(
          `[RESEND SANDBOX] Resend restringe el envío al buzón del propietario. Redirigiendo a yevaraponcealessandro@gmail.com con asunto detallado...`,
        );

        response = await this.resend.emails.send({
          from: this.fromAddress,
          to: 'yevaraponcealessandro@gmail.com',
          subject: `[Para: ${to}] ${subject}`,
          text,
          html,
        });
      }

      if (response.error) {
        this.logger.error(`Error reportado por Resend API: ${JSON.stringify(response.error)}`);
        this.logger.warn(`[DEV FALLBACK] Código generado para ${to}: ${resetCode} | Enlace: ${resetLink}`);
        return false;
      }

      this.logger.log(`✓ Correo enviado exitosamente mediante Resend (ID: ${response.data?.id})`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error al conectar con la API de Resend: ${error?.message || error}`);
      this.logger.warn(`[DEV FALLBACK] Código generado para ${to}: ${resetCode} | Enlace: ${resetLink}`);
      return false;
    }
  }
}
