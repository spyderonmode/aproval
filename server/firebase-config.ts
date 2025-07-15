// ==========================================
// FIREBASE CONFIGURATION SETUP
// ==========================================
// To complete the Firebase migration, please:
// 1. Go to the Firebase Console (https://console.firebase.google.com/)
// 2. Create a new project or select an existing one
// 3. Get your web app config from Project Settings > General > Your apps
// 4. Get your service account key from Project Settings > Service accounts > Generate new private key
// 5. Replace the placeholder values below with your actual Firebase credentials

// Firebase Web App Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCExample123456789",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789",
  measurementId: "G-ABC123DEF4"
};

// Firebase Admin Service Account Key
// Download this from Firebase Console > Project Settings > Service accounts > Generate new private key
export const serviceAccountKey = {
  type: "service_account",
  project_id: "your-project-id",
  private_key_id: "abc123def456ghi789",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7... (paste your full private key here)\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-abc123@your-project-id.iam.gserviceaccount.com",
  client_id: "123456789012345678901",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abc123%40your-project-id.iam.gserviceaccount.com"
};