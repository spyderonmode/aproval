import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccountKey } from './firebase-config';

// Initialize Firebase Admin with error handling
let app: any;
try {
  app = initializeApp({
    credential: cert(serviceAccountKey as ServiceAccount)
  });
} catch (error) {
  console.error('Firebase initialization error. Please update firebase-config.ts with valid credentials:', error);
  // Temporary fallback - comment out when you have valid credentials
  app = null;
}

// Initialize Firestore
export const db = app ? getFirestore(app) : null;

// Initialize Auth
export const auth = app ? getAuth(app) : null;

// Collection references
export const collections = {
  users: 'users',
  rooms: 'rooms',
  games: 'games',
  moves: 'moves',
  roomParticipants: 'roomParticipants',
  blockedUsers: 'blockedUsers',
  sessions: 'sessions'
};