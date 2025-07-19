import * as nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: any;
  private fromEmail: string;

  constructor(config: EmailConfig, fromEmail: string) {
    this.fromEmail = fromEmail;
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      };

      console.log('📧 Sending email:', {
        to: params.to,
        subject: params.subject,
        from: this.fromEmail
      });

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', params.to);
      return true;
    } catch (error) {
      console.error('❌ SMTP email error:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; text-align: center;">Verify Your Email - TicTac 3x5</h2>
        <p>Thanks for signing up for TicTac 3x5! Please use the verification code below to verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 2px dashed #1e40af;">
          <h3 style="margin: 0; color: #1e40af;">Your Verification Code:</h3>
          <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 10px 0;">
            ${verificationCode}
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">Enter this code on the verification page</p>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
          <strong>Code expires in 24 hours</strong>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Your Verification Code - TicTac 3x5',
      html,
      text: `Your TicTac 3x5 verification code is: ${verificationCode}. This code expires in 24 hours.`,
    });
  }

  async sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; text-align: center;">Password Reset - TicTac 3x5</h2>
        <p>You requested a password reset for your TicTac 3x5 account.</p>
        <p>Use the verification code below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fef2f2; border-radius: 8px; border: 2px dashed #dc2626;">
          <h3 style="margin: 0; color: #dc2626;">Your Password Reset Code:</h3>
          <div style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px; margin: 10px 0;">
            ${resetCode}
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">Enter this code on the password reset page</p>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
          <strong>Code expires in 1 hour</strong>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Your Password Reset Code - TicTac 3x5',
      html,
      text: `Your TicTac 3x5 password reset code is: ${resetCode}. This code expires in 1 hour.`,
    });
  }
}

// Create email service instance if SMTP settings are provided
export function createEmailService(): EmailService | null {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    console.log('SMTP configuration not complete - email verification disabled');
    console.log('Missing:', {
      smtpHost: !!smtpHost,
      smtpPort: !!smtpPort,
      smtpUser: !!smtpUser,
      smtpPass: !!smtpPass,
      fromEmail: !!fromEmail
    });
    return null;
  }

  console.log('✅ SMTP configuration complete - email service enabled');
  console.log('SMTP settings:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser,
    from: fromEmail
  });

  const config: EmailConfig = {
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  return new EmailService(config, fromEmail);
}