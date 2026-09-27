import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!env.smtpConfigured) {
    // No SMTP provider configured. In development, log the reset URL so the
    // flow can still be tested end-to-end. Never do this in production —
    // that would leak a live reset token to logs.
    if (!env.isProduction) {
      console.log(`[DEV] Password reset URL for ${to}: ${resetUrl}`);
      return;
    }
    throw new Error('Email service is not configured');
  }

  await getTransporter().sendMail({
    from: env.mailFrom,
    to,
    subject: 'Reset your password',
    text: `We received a request to reset your password. Open this link to choose a new password (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Click here to choose a new password</a> (expires in 30 minutes).</p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}
