import nodemailer from 'nodemailer';

export function getMailTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // pour ignorer l'erreur de certificat en dev
    }
  });
}

export const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'; 