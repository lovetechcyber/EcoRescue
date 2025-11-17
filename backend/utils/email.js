const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * sendMail({ to, subject, html, text })
 */
async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || 'no-reply@ecorescue.org';
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return info;
}

module.exports = { sendMail };
