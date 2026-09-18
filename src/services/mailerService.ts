import nodemailer, { Transporter } from 'nodemailer';
import config from '../configs/config';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER
        ? {
            user: config.SMTP_USER,
            pass: config.SMTP_PASSWORD,
          }
        : undefined,
    });
  }
  return transporter;
}

export class MailerService {
  static async sendMail({ to, subject, html }: SendMailInput) {
    await getTransporter().sendMail({
      from: `"${config.SMTP_FROM_NAME}" <${config.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
  }

  static async sendOtpEmail(to: string, code: string, purpose: 'rider_login' | 'booking_completion') {
    const subject =
      purpose === 'rider_login' ? 'Your Dezenmart Express login code' : 'Your delivery/ride completion code';
    const html = `<p>Your Dezenmart Express OTP is <strong>${code}</strong>. It expires in ${config.OTP_EXPIRY_MINUTES} minutes.</p>`;
    await this.sendMail({ to, subject, html });
  }
}
