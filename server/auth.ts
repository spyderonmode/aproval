import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Express } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { storage } from './storage';
import { createEmailService } from './emailService';

interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
  profileTheme?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  createdAt: string;
}

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

const usersFilePath = path.join(process.cwd(), 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

// Simple hash function for passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getUsers(): User[] {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveUsers(users: User[]): void {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function findUserByUsername(username: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.username === username);
}

async function createUser(username: string, password: string, email?: string): Promise<User> {
  const users = getUsers();
  const verificationToken = email ? crypto.randomUUID() : undefined;
  const verificationExpiry = email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined; // 24 hours
  
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    password: hashPassword(password),
    email,
    displayName: username,
    profilePicture: null,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  
  // Also create user in database
  try {
    await storage.upsertUser({
      id: newUser.id,
      email: email || null,
      firstName: newUser.displayName || newUser.username,
      lastName: null,
      profileImageUrl: newUser.profilePicture || null,
    });
    console.log('User created in database:', newUser.id);
  } catch (error) {
    console.error('Error creating user in database:', error);
    // Don't return error here as the user is already created in JSON
  }
  
  return newUser;
}

function updateUser(userId: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  
  // Also update user in database
  try {
    storage.upsertUser({
      id: userId,
      email: users[userIndex].email || null,
      firstName: users[userIndex].displayName || users[userIndex].username,
      lastName: null,
      profileImageUrl: users[userIndex].profilePicture || null,
    });
  } catch (error) {
    console.error('Error updating user in database:', error);
  }
  
  return users[userIndex];
}

function getUserById(userId: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.id === userId);
}

function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.email === email);
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

export function setupAuth(app: Express) {
  // Memory store for sessions
  const MemoryStoreSession = MemoryStore(session);
  
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    if (findUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    try {
      const user = await createUser(username, password, email);
      
      // DO NOT create session until email is verified
      // const sessionData = { userId: user.id, username: user.username };
      // req.session.user = sessionData;
      
      // Sync user to database
      try {
        await storage.upsertUser({
          id: user.id,
          email: user.email || null,
          firstName: user.displayName || user.username || 'Anonymous',
          lastName: null,
          profileImageUrl: user.profilePicture || null,
          profileTheme: user.profileTheme || null,
        });
      } catch (error) {
        console.error('Error syncing new user to database:', error);
      }
      
      // Send verification email (mandatory)
      if (email && user.emailVerificationToken) {
        try {
          await sendVerificationEmail(email, user.emailVerificationToken);
        } catch (error) {
          console.error('Failed to send verification email:', error);
          return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }
      }
      
      res.json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        message: 'Registration successful! Please check your email to verify your account before logging in.'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Try to find user by username first, then by email
    let user = findUserByUsername(username);
    if (!user) {
      user = findUserByEmail(username);
    }

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Check if email is verified (mandatory)
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email before logging in. Check your email for the verification link.',
        needsVerification: true 
      });
    }

    // Ensure user exists in database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email || null,
        firstName: user.displayName || user.username || 'Anonymous',
        lastName: null,
        profileImageUrl: user.profilePicture || null,
        profileTheme: user.profileTheme || null,
      });
      console.log('User synced to database:', user.id);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return res.status(500).json({ error: 'Failed to sync user data' });
    }

    const sessionData = { userId: user.id, username: user.username };
    req.session.user = sessionData;
    
    res.json({ id: user.id, username: user.username, email: user.email, isEmailVerified: user.isEmailVerified });
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get full user info including profile data
    const user = getUserById(req.session.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      profileTheme: user.profileTheme,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    });
  });

  // Email verification endpoint
  app.post('/api/auth/verify-email', async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const users = getUsers();
    const user = users.find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Check if token is expired
    if (user.emailVerificationExpiry && new Date() > new Date(user.emailVerificationExpiry)) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark user as verified
    const updatedUser = updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpiry: undefined
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    res.json({ message: 'Email verified successfully! You can now log in.' });
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const newToken = crypto.randomUUID();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const updatedUser = updateUser(user.id, {
      emailVerificationToken: newToken,
      emailVerificationExpiry: newExpiry
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to generate new verification token' });
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, newToken);
      res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  // Update user profile endpoint
  app.put('/api/auth/profile', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { displayName, profilePicture, profileTheme } = req.body;
    const userId = req.session.user.userId;
    
    try {
      const updates: Partial<User> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (profilePicture !== undefined) updates.profilePicture = profilePicture;
      if (profileTheme !== undefined) updates.profileTheme = profileTheme;
      
      // Update user in JSON file
      const updatedUser = updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Also update user in database to keep session valid
      try {
        await storage.upsertUser({
          id: updatedUser.id,
          email: updatedUser.email || null,
          firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
          lastName: null,
          profileImageUrl: updatedUser.profilePicture || null,
          profileTheme: updatedUser.profileTheme || null,
        });
        console.log('User profile synced to database:', updatedUser.id);
      } catch (error) {
        console.error('Error syncing updated user to database:', error);
        // Continue even if database sync fails to avoid breaking the session
      }
      
      // Keep session alive - update session data if needed
      req.session.user = {
        ...req.session.user,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        profileTheme: updatedUser.profileTheme
      };
      
      res.json({
        userId: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        profileTheme: updatedUser.profileTheme,
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Send email verification
  app.post('/api/auth/send-verification', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    try {
      const verificationToken = crypto.randomUUID();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });
      
      await sendVerificationEmail(email, verificationToken);
      
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    try {
      const resetToken = crypto.randomUUID();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      });

      await sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const users = getUsers();
    const user = users.find(u => u.passwordResetToken === token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    try {
      // Update password and clear reset token
      const updatedUser = updateUser(user.id, {
        password: hashPassword(newPassword),
        passwordResetToken: undefined,
        passwordResetExpiry: undefined
      });

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Middleware to check authentication
  app.use((req, res, next) => {
    if (req.session.user) {
      req.user = req.session.user;
    }
    next();
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if user's email is verified
  const user = getUserById(req.session.user.userId);
  if (user && user.email && !user.isEmailVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  
  req.user = req.session.user;
  next();
}