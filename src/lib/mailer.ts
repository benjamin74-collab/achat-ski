// src/lib/mailer.ts

// TS ne trouve pas les types de nodemailer dans cet environnement.
// On sait ce qu'on fait : on supprime juste l'erreur de typage.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for nodemailer in this env
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

// OVH : souvent 465 = secure: true, sinon false
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom =
  process.env.SMTP_FROM ||
  `"Meilleur-Ski" <no-reply@${process.env.MAIL_FROM_DOMAIN || "meilleur-ski.com"}>`;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "[mailer] SMTP_HOST / SMTP_USER / SMTP_PASS manquants. Les emails ne seront pas envoyés."
  );
}

export const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
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
    console.error("[mailer] Config SMTP manquante. Email non envoyé.");
    return;
  }

  await mailer.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""), // fallback texte brut si besoin
  });
}
