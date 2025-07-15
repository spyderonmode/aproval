import { Express } from 'express';
import { auth } from './firebase-admin';
import { storage } from './storage';

export interface FirebaseUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        displayName?: string;
        email?: string;
        firebaseUser?: FirebaseUser;
      };
    }
  }
}

export async function setupFirebaseAuth(app: Express) {
  // Firebase token verification middleware
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      if (!auth) {
        console.error('Firebase auth not initialized');
        return next();
      }
      
      const decodedToken = await auth.verifyIdToken(token);
      const firebaseUser: FirebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false
      };
      
      // Get or create user in our system
      let user = await storage.getUser(decodedToken.uid);
      if (!user) {
        user = await storage.upsertUser({
          id: decodedToken.uid,
          email: decodedToken.email || '',
          firstName: decodedToken.name || '',
          lastName: '',
          profileImageUrl: decodedToken.picture || ''
        });
      }
      
      req.user = {
        userId: user.id,
        username: user.email?.split('@')[0] || user.firstName || user.id,
        displayName: user.firstName || decodedToken.name || user.email,
        email: user.email,
        firebaseUser
      };
      
    } catch (error) {
      console.error('Token verification failed:', error);
    }
    
    next();
  });
}

export function requireFirebaseAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Legacy auth compatibility - for backward compatibility with existing routes
export function setupAuth(app: Express) {
  return setupFirebaseAuth(app);
}

export function requireAuth(req: any, res: any, next: any) {
  return requireFirebaseAuth(req, res, next);
}