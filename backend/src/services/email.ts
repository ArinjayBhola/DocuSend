import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: any = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST as string,
    port: env.SMTP_PORT as number,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return;
  }
  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

export async function sendViewNotification({ ownerEmail, documentTitle, viewerEmail, viewerIp }: { ownerEmail: string, documentTitle: string, viewerEmail: string | null, viewerIp: string }) {
  await sendEmail({
    to: ownerEmail,
    subject: `Someone viewed "${documentTitle}" on DocuSend`,
    html: `
      <h2>New View on "${documentTitle}"</h2>
      <p><strong>Viewer:</strong> ${viewerEmail || "Anonymous"}</p>
      <p><strong>IP:</strong> ${viewerIp}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p><a href="${env.APP_URL}/dashboard">View Analytics →</a></p>
    `,
  });
}
