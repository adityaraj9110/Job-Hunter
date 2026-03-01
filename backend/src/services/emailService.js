const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Send email via user's SMTP configuration with CV attached
 */
async function sendEmail(userInfo, toEmail, subject, body, cvPath) {
  if (!userInfo.smtpHost || !userInfo.smtpEmail) {
    throw new Error('SMTP settings not configured. Please update Info settings.');
  }

  const transporter = nodemailer.createTransport({
    host: userInfo.smtpHost,
    port: userInfo.smtpPort || 587,
    secure: userInfo.smtpPort === 465,
    auth: {
      user: userInfo.smtpEmail,
      pass: userInfo.smtpPassword, // TODO: decrypt if encrypted
    },
  });

  const mailOptions = {
    from: `"${userInfo.senderName}" <${userInfo.smtpEmail}>`,
    to: toEmail,
    subject,
    text: body,
    attachments: cvPath ? [
      {
        filename: path.basename(cvPath),
        path: cvPath,
        contentType: 'application/pdf',
      },
    ] : [],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${toEmail}: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail };
