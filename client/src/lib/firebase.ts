import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const login = async (credentials: { username: string; password: string }) => {
  try {
    // For backward compatibility, we'll use email/password authentication
    // If username is provided, we'll treat it as email for now
    const email = credentials.username.includes('@') ? credentials.username : `${credentials.username}@${firebaseConfig.projectId}.com`;
    
    const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    return {
      id: user.uid,
      email: user.email,
      username: userData?.username || user.email?.split('@')[0],
      displayName: userData?.displayName || user.displayName,
      profilePicture: userData?.profilePicture || user.photoURL,
      isEmailVerified: user.emailVerified
    };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const register = async (credentials: { username: string; password: string; email: string }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      username: credentials.username,
      email: credentials.email,
      displayName: credentials.username,
      profilePicture: '',
      isEmailVerified: user.emailVerified,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Send email verification through backend
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: credentials.email, 
          username: credentials.username 
        })
      });
    } catch (emailError) {
      console.warn('Email verification failed to send:', emailError);
    }
    
    return {
      id: user.uid,
      email: user.email,
      username: credentials.username,
      displayName: credentials.username,
      profilePicture: '',
      isEmailVerified: user.emailVerified
    };
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const sendEmailVerification = async (email: string) => {
  // Firebase handles email verification automatically
  // This is kept for backward compatibility
  return { success: true };
};

export const verifyEmail = async (token: string) => {
  // Firebase handles email verification automatically
  // This is kept for backward compatibility
  return { success: true };
};

export const logout = async () => {
  await signOut(auth);
  // Force page refresh after logout
  window.location.href = '/';
};

export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    return {
      id: user.uid,
      email: user.email,
      username: userData?.username || user.email?.split('@')[0],
      displayName: userData?.displayName || user.displayName,
      profilePicture: userData?.profilePicture || user.photoURL,
      isEmailVerified: user.emailVerified,
      wins: userData?.wins || 0,
      losses: userData?.losses || 0,
      draws: userData?.draws || 0
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: { displayName?: string; profilePicture?: string }) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await updateDoc(doc(db, 'users', user.uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update profile');
  }
};