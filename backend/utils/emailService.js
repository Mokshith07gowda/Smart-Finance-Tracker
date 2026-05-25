const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use a test account from Ethereal
  // For production, use a real email service (Gmail, SendGrid, etc.)
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'Password Reset') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Salary Expense Manager <noreply@salarymanager.com>',
      to: email,
      subject: `${purpose} OTP - Salary & Expense Manager`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Salary & Expense Manager</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">${purpose} Request</h2>
            <p style="color: #6b7280; font-size: 16px;">
              You have requested: <strong>${purpose}</strong>. Please use the following OTP to proceed:
            </p>
            <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0;">
                ${otp}
              </h1>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This OTP will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              If you did not request a password reset, please ignore this email.
            </p>
          </div>
          <div style="background-color: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2026 Salary & Expense Manager. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };
