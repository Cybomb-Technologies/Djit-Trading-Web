const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true, // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(mailOptions) {
    try {
      const result = await this.transporter.sendMail({
        from: `"Djit Trading" <${process.env.SMTP_USER}>`,
        ...mailOptions
      });
      console.log('✅ Email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return false;
    }
  }

  async sendWelcomeEmail({ to, userName }) {
    const subject = 'Welcome to Djit Trading!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome, ${userName}! 🎉</h2>
        <p>We're excited to have you on board at Djit Trading.</p>
        <p>Explore our courses and start your trading journey today.</p>
        <p>Happy Trading!<br>The Djit Trading Team</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  // ADD THESE NEW METHODS FOR PASSWORD RESET
  async sendPasswordResetCode({ to, userName, code }) {
    const subject = 'Password Reset Code - Djit Trading';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Request</h2>
        <p>Dear ${userName},</p>
        <p>You have requested to reset your password. Use the following 6-digit code to reset your password:</p>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 8px;">${code}</h1>
        </div>
        <p style="color: #7f8c8d; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
        </p>
        <p>Happy Trading!<br>The Djit Trading Team</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetConfirmation({ to, userName }) {
    const subject = 'Password Reset Successful - Djit Trading';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Password Reset Successful ✅</h2>
        <p>Dear ${userName},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Happy Trading!<br>The Djit Trading Team</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendPaymentConfirmation({ to, userName, courseName, amount, paymentDate }) {
    const subject = 'Payment Confirmation - Djit Trading';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Payment Confirmed ✅</h2>
        <p>Dear ${userName},</p>
        <p>Your payment for the course <strong>${courseName}</strong> was successful.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p><strong>Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
        </div>
        <p>You can now access the course from your dashboard.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendRefundConfirmation({ to, userName, courseName, amount, refundDate }) {
    const subject = 'Refund Processed - Djit Trading';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Refund Processed 💰</h2>
        <p>Dear ${userName},</p>
        <p>Your refund for <strong>${courseName}</strong> has been processed successfully.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p><strong>Refund Amount:</strong> ₹${amount}</p>
          <p><strong>Refund Date:</strong> ${new Date(refundDate).toLocaleDateString()}</p>
        </div>
        <p>It may take 5–7 business days to reflect in your account.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendCourseCompletion({ to, userName, courseName, completionDate }) {
    const subject = 'Course Completion - Djit Trading';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9b59b6;">Congratulations 🎓</h2>
        <p>Dear ${userName},</p>
        <p>You have successfully completed the course <strong>${courseName}</strong>.</p>
        <p>Your certificate is available in your dashboard.</p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendNewsletter({ to, subject, content }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">${subject}</h2>
        <div>${content}</div>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }
}

module.exports = new EmailService();