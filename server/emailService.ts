import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Add connection pooling and better error handling
    this.transporter = nodemailer.createTransport({
      ...config,
      pool: true, // Enable connection pooling
      maxConnections: 5, // Maximum concurrent connections
      maxMessages: 100, // Maximum messages per connection
      rateDelta: 1000, // Rate limiting: 1 second between messages
      rateLimit: 5, // Rate limiting: max 5 messages per rateDelta
    });
    
    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      console.log('📧 SMTP server details verified for:', this.fromEmail);
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    }
  }

  private async ensureConnection(): Promise<void> {
    // Create a fresh transporter for each email send to avoid stale connections
    // This fixes the issue where emails don't send after the first one
    console.log('🔄 Creating fresh SMTP connection...');
    
    // Get the original config from environment/file
    const emailConfig = loadEmailConfig();
    const config = {
      host: emailConfig.host,
      port: parseInt(emailConfig.port),
      secure: emailConfig.secure !== null ? emailConfig.secure : parseInt(emailConfig.port) === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    };
    
    this.transporter = nodemailer.createTransport(config);
    await this.transporter.verify();
    console.log('✅ Fresh SMTP connection created and verified');
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure connection is alive before sending
        await this.ensureConnection();
        const mailOptions = {
          from: this.fromEmail,
          to: params.to,
          subject: params.subject,
          text: params.text,
          html: params.html,
        };

        console.log(`📧 Sending email (attempt ${attempt}/${maxRetries}):`, {
          to: params.to,
          subject: params.subject,
          from: this.fromEmail
        });

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', params.to);
        console.log('📧 Message info:', {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          pending: info.pending,
          envelope: info.envelope
        });
        
        // Additional delivery info
        if (info.rejected && info.rejected.length > 0) {
          console.log('⚠️ Some emails were rejected:', info.rejected);
        }
        if (info.pending && info.pending.length > 0) {
          console.log('⏳ Some emails are pending:', info.pending);
        }
        return true;
      } catch (error) {
        lastError = error;
        console.error(`❌ SMTP email error (attempt ${attempt}/${maxRetries}):`, error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        
        // If it's the last attempt, don't wait
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ Failed to send email after all retries:', lastError);
    return false;
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

  async sendTestEmail(email: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; text-align: center;">Test Email - TicTac 3x5</h2>
        <p>This is a test email to verify that the SMTP service is working correctly.</p>
        <p>If you receive this email, the email service is properly configured and working.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
          Test sent at: ${new Date().toISOString()}
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Test Email from TicTac 3x5',
      html,
      text: 'This is a test email to verify that the SMTP service is working correctly.',
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

// Singleton email service instance
let emailServiceInstance: EmailService | null = null;
let emailServiceInitialized = false;

// Create email service instance if SMTP settings are provided (singleton pattern)
export function loadEmailConfig() {
  try {
    // Try to load from config file first
    const configPath = path.join(__dirname, 'config', 'email.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      console.log('✅ Email configuration loaded from config file');
      return {
        host: config.smtp.host,
        port: config.smtp.port.toString(),
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
        fromEmail: config.fromEmail,
        secure: config.smtp.secure
      };
    }
  } catch (error) {
    console.log('⚠️ Could not load email config file, falling back to environment variables:', error.message);
  }

  // Fall back to environment variables
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL,
    secure: null // Will be determined based on port
  };
}

export function createEmailService(): EmailService | null {
  // Return cached instance if already created
  if (emailServiceInitialized) {
    return emailServiceInstance;
  }

  const emailConfig = loadEmailConfig();
  const { host, port, user, pass, fromEmail, secure } = emailConfig;

  emailServiceInitialized = true; // Mark as initialized to prevent multiple attempts

  if (!host || !port || !user || !pass || !fromEmail) {
    console.log('SMTP configuration not complete - email verification disabled');
    console.log('Missing:', {
      smtpHost: !!host,
      smtpPort: !!port,
      smtpUser: !!user,
      smtpPass: !!pass,
      fromEmail: !!fromEmail
    });
    emailServiceInstance = null;
    return null;
  }

  console.log('✅ SMTP configuration complete - email service enabled');
  console.log('SMTP settings:', {
    host,
    port,
    user,
    from: fromEmail
  });

  const config: EmailConfig = {
    host,
    port: parseInt(port),
    secure: secure !== null ? secure : parseInt(port) === 465, // Use config value or determine from port
    auth: {
      user,
      pass,
    },
  };

  emailServiceInstance = new EmailService(config, fromEmail);
  return emailServiceInstance;
}

// Function to reset email service (for testing or configuration changes)
export function resetEmailService(): void {
  emailServiceInitialized = false;
  emailServiceInstance = null;
  console.log('🔄 Email service reset - will recreate on next use');
}