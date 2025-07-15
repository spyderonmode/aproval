import nodemailer from 'nodemailer';
import { db } from './firebase-admin';

// Get SMTP configuration from Firebase or environment variables
async function getSMTPConfig() {
  try {
    // First try to get from Firebase
    if (db) {
      const configDoc = await db.collection('config').doc('smtp').get();
      if (configDoc.exists) {
        const config = configDoc.data();
        return {
          host: config.host || 'smtp.gmail.com',
          port: config.port || 587,
          secure: config.secure || false,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        };
      }
    }
    
    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  } catch (error) {
    console.error('Error getting SMTP config:', error);
    // Return environment variables as fallback
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  }
}

// Create transporter with dynamic config
async function createTransporter() {
  const config = await getSMTPConfig();
  return nodemailer.createTransporter(config);
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
    const transporter = await createTransporter();
    const smtpConfig = await getSMTPConfig();
    
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('SMTP credentials not configured, email not sent');
      return { success: false, error: 'SMTP not configured' };
    }

    const mailOptions = {
      from: `"TicTac 3x5" <${smtpConfig.auth.user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, username: string, verificationToken: string) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://tic-tac-master-zanv1.replit.app'
    : `http://localhost:5000`;
  
  const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
  const template = emailTemplates.verification(verificationLink, username);
  
  return await sendEmail(email, template.subject, template.html);
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, username: string, resetToken: string) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://tic-tac-master-zanv1.replit.app'
    : `http://localhost:5000`;
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(resetLink, username);
  
  return await sendEmail(email, template.subject, template.html);
}