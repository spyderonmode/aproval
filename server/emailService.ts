import nodemailer from 'nodemailer';

// Get SMTP configuration from environment variables
function getSMTPConfig() {
  const port = parseInt(process.env.SMTP_PORT || '587');
  
  // Try basic configuration with extended timeout
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: false, // Use STARTTLS instead of secure connection
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000 // 10 seconds
  };
}

// Create transporter with SMTP config
function createTransporter() {
  const config = getSMTPConfig();
  return nodemailer.createTransport(config);
}

// Email templates
export const emailTemplates = {
  verification: (verificationLink: string, username: string) => ({
    subject: 'Verify Your Email - TicTac 3x5',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Welcome to TicTac 3x5!</h2>
        <p>Hi ${username},</p>
        <p>Thanks for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          TicTac 3x5 - Strategic Tic-Tac-Toe Game
        </p>
      </div>
    `,
  }),

  passwordReset: (resetLink: string, username: string) => ({
    subject: 'Password Reset - TicTac 3x5',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          TicTac 3x5 - Strategic Tic-Tac-Toe Game
        </p>
      </div>
    `,
  }),
};

// Send email function
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, username: string, verificationToken: string) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tic-tac-master-zanv1.replit.app' 
      : 'http://localhost:5000';
    
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    const template = emailTemplates.verification(verificationLink, username);
    
    const result = await sendEmail(email, template.subject, template.html);
    return result;
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, username: string, resetToken: string) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tic-tac-master-zanv1.replit.app' 
      : 'http://localhost:5000';
    
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(resetLink, username);
    
    const result = await sendEmail(email, template.subject, template.html);
    return result;
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

// Test SMTP configuration
export async function testSMTPConfig() {
  try {
    const transporter = createTransporter();
    const smtpConfig = getSMTPConfig();
    
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      return { success: false, error: 'SMTP credentials not configured' };
    }
    
    await transporter.verify();
    console.log('SMTP configuration is valid');
    return { success: true, message: 'SMTP configuration is valid' };
  } catch (error: any) {
    console.error('SMTP configuration test failed:', error);
    return { success: false, error: error.message };
  }
}