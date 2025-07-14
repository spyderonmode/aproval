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
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
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
      const sessionData = { userId: user.id, username: user.username };
      req.session.user = sessionData;
      
      // Sync user to database
      try {
        await storage.upsertUser({
          id: user.id,
          email: user.email || null,
          firstName: user.displayName || user.username || 'Anonymous',
          lastName: null,
          profileImageUrl: user.profilePicture || null,
        });
      } catch (error) {
        console.error('Error syncing new user to database:', error);
      }
      
      // If email is provided, send verification email
      if (email && user.emailVerificationToken) {
        try {
          await sendVerificationEmail(email, user.emailVerificationToken);
        } catch (error) {
          console.error('Failed to send verification email:', error);
        }
      }
      
      res.json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = findUserByUsername(username);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure user exists in database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email || null,
        firstName: user.displayName || user.username || 'Anonymous',
        lastName: null,
        profileImageUrl: user.profilePicture || null,
      });
      console.log('User synced to database:', user.id);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return res.status(500).json({ error: 'Failed to sync user data' });
    }

    const sessionData = { userId: user.id, username: user.username };
    req.session.user = sessionData;
    
    res.json({ id: user.id, username: user.username });
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
      profilePicture: user.profilePicture
    });
  });

  // Update user profile endpoint
  app.put('/api/auth/profile', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { displayName, profilePicture } = req.body;
    const userId = req.session.user.userId;
    
    const updates: Partial<User> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    
    const updatedUser = updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      userId: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      profilePicture: updatedUser.profilePicture
    });
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

  // Verify email
  app.post('/api/auth/verify-email', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const users = getUsers();
    const user = users.find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }
    
    if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({ error: 'Verification token expired' });
    }
    
    try {
      updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpiry: undefined
      });
      
      // Update database
      await storage.upsertUser({
        id: user.id,
        email: user.email || null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });
      
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Failed to verify email' });
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
  req.user = req.session.user;
  next();
}