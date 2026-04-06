// backend/src/utils/email.util.js
// Simple email utility using nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@holora.vn',
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = { sendMail };