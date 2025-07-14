import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Express } from 'express';
import session from 'express-session';

interface User {
  id: string;
  username: string;
  password: string;
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

function createUser(username: string, password: string): User {
  const users = getUsers();
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function setupAuth(app: Express) {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register endpoint
  app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (findUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    try {
      const user = createUser(username, password);
      const sessionData = { userId: user.id, username: user.username };
      req.session.user = sessionData;
      
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = findUserByUsername(username);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    res.json(req.session.user);
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
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}