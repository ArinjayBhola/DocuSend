const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
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

async function sendViewNotification({ ownerEmail, documentTitle, viewerEmail, viewerIp }) {
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

module.exports = { sendEmail, sendViewNotification };
