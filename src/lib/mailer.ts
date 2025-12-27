// src/lib/mailer.ts
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || "no-reply@meilleur-ski.com";

if (!smtpHost || !smtpUser || !smtpPass) {
  // En prod il faudra les variables, en dev on peut loguer un warning
  console.warn(
    "[mailer] SMTP environment variables are missing. Emails will fail if you try to send."
  );
}

export const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail({ to, subject, html, text }: SendMailArgs) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("[mailer] Missing SMTP config, not sending email.");
    return;
  }

  await mailer.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
    text,
  });
}
