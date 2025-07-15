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

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('SMTP email error:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Verify Your Email - TicTac 3x5</h2>
        <p>Thanks for signing up for TicTac 3x5! Please verify your email address to secure your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - TicTac 3x5',
      html,
      text: `Please verify your email by clicking this link: ${verificationUrl}`,
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
    return null;
  }

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