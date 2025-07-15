// ==========================================
// FIREBASE CLIENT CONFIGURATION
// ==========================================
// Please update these values with your actual Firebase project settings
// Get these from: Firebase Console > Project Settings > General > Your apps

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "105943580282",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-S4YPG2TT1T"
};