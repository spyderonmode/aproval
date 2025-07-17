import crypto from 'crypto';
import { Express } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { storage } from './storage';
import { createEmailService } from './emailService';

import { User } from '@shared/schema';

interface Session {
  userId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: Session;
    }
  }
}

// Simple hash function for passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createUser(username: string, password: string, email?: string): Promise<User> {
  const verificationToken = email ? crypto.randomUUID() : undefined;
  const verificationExpiry = email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined; // 24 hours
  
  const newUser = await storage.createUser({
    username,
    password: hashPassword(password),
    email,
    displayName: username,
    profilePicture: null,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
  });
  
  return newUser;
}

async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const updatedUser = await storage.updateUser(userId, updates);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

async function getUserById(userId: string): Promise<User | undefined> {
  return await storage.getUser(userId);
}

async function findUserByEmail(email: string): Promise<User | undefined> {
  return await storage.getUserByEmail(email);
}

async function findUserByUsername(username: string): Promise<User | undefined> {
  return await storage.getUserByUsername(username);
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const emailService = createEmailService();
  if (!emailService) {
    console.log('Email service not configured - verification email not sent');
    return;
  }
  
  try {
    await emailService.sendVerificationEmail(email, token);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const emailService = createEmailService();
  if (!emailService) {
    console.log('Email service not configured - password reset email not sent');
    return;
  }
  
  try {
    await emailService.sendPasswordResetEmail(email, token);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

export function setupAuth(app: Express): void {
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 86400000
    }
  }));

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
      // Check if user already exists
      const existingUser = await findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      if (email) {
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }
      
      const newUser = await createUser(username, password, email);
      
      // Send verification email if email is provided
      if (email && newUser.emailVerificationToken) {
        try {
          await sendVerificationEmail(email, newUser.emailVerificationToken);
        } catch (error) {
          console.error('Failed to send verification email:', error);
        }
      }
      
      res.json({ 
        message: 'User created successfully', 
        user: { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email,
          displayName: newUser.displayName,
          profilePicture: newUser.profilePicture,
          isEmailVerified: newUser.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
      // Try to find user by username or email
      let user = await findUserByUsername(username);
      if (!user && username.includes('@')) {
        user = await findUserByEmail(username);
      }
      
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Update profile endpoint
  app.put('/api/auth/profile', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { displayName, profilePicture } = req.body;
    
    try {
      const updatedUser = await updateUser(req.session.userId, {
        displayName,
        profilePicture
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        isEmailVerified: updatedUser.isEmailVerified
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
      const user = await storage.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }
      
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }
      
      if (!user.email) {
        return res.status(400).json({ error: 'No email address on file' });
      }
      
      const verificationToken = crypto.randomUUID();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });
      
      await sendVerificationEmail(user.email, verificationToken);
      
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }
      
      const resetToken = crypto.randomUUID();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.setPasswordResetToken(email, resetToken, resetExpiry);
      await sendPasswordResetEmail(email, resetToken);
      
      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    try {
      const success = await storage.resetPassword(token, hashPassword(newPassword));
      
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  });

  // Manual sync endpoint for admin
  app.post('/api/auth/sync-users', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await getUserById(req.session.userId);
      if (!user || user.username !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      res.json({ message: 'Database authentication is now active - no sync needed' });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Add user info to request
  req.user = {
    userId: req.session.userId,
    username: req.session.username
  };
  
  next();
}

// Middleware to get user info (optional auth)
export async function getUserInfo(req: any, res: any, next: any) {
  if (req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      if (user) {
        req.user = {
          userId: user.id,
          username: user.username
        };
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  }
  
  next();
}