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
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "105943580282",
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-S4YPG2TT1T"
};

// Firebase Admin Service Account Key
// Download this from Firebase Console > Project Settings > Service accounts > Generate new private key
export const serviceAccountKey = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: "ebc75377c120eff749103fef2cca1aeb347d157a",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC9KgYvdUl6B9LV\nG+9rGDSJF9wX+MGfWGpYRcm88hj1C1W/oyv6XOmaGFewxgaKHyRoWjUTUnX05KLb\nbljiXFy0guP309crqwaue3PXTYGvwwD2Tc2A5Bs78YIkR+allUuLHaJxo85tnYSR\nqb0Sw6jhNTmVCpzsk3YMhbknHs6+j+qPin92o2yzKDG2myI0lHy4WmvplIWOELVn\ntndRgYhTenNYs0opghhewX1uhiStAZmZApxKuKd5qMqrSZbGAxpaaF6IG+v9jstD\nsU7e6tQA2R1ZmDfVMhpCD+IHKvzaWtErvdjjwFlBOsekJxBLcl+oOKkDVvOriyFH\n0H0SH5rHAgMBAAECggEAOSApSQi6/UrCjVAH4AgpyWL2uRiK5IOvbeP5dgGIruvS\n4/IzdEK92ybRyJUs4WZhONBRKfojnCa11d1/ozBwYKUMkkmbt9jIxkWK6LDD4t/Z\neQhq8KsyXEplWm6KRWQOMb9r0LS+wNSqddDURAfphsVrk8pmNH2dz09M6HcByYMo\ngorljeEK3EYAWgSyLItoD0VhmMEme50LQz/JOVY4vP4KXFfN+Y+OdjWEiP8yOdnB\njmdzPl3MtNai4p6to4q0XOPEgQ6Er2UHes7vy08ZImOrnznXhchG10ICNAbbsymM\n2PUeuCxgD3MTpBGcxpWz2B++2JdVxk+EG6Ps0FaGNQKBgQDrk9jvGeOtagI5B5qF\nI49zdHMiDRA0gC3BgBMFXVxGhpBVDxKAifrTEcEm2qT7WZKCwLFh+BnsXPqpS1yZ\n/hDOYoDxlNJezxPWetW6ZM4cQHIvAol26Fn75eknCBWMwsCkW6AgHC5e6GXioIWj\nNmHUozOqYfkJPK7vci18JjYWowKBgQDNkCDugvAZ3Uer6j/1ny3WexJEKW5EH1kl\ngZT3BPLXriHof+M60v7pSQskYJiqSszXmr2qSgSPPeEnyyX38nCA1p1Pb2+IEswF\nPw0MSGerYtIsdgSE2QE3rEqD5L267tW4ccuuJLGEOm7WZVtE/qEhMgZv8RNUJczk\nz9xjvy+BjQKBgQCFwuE+gljAspyofSTDzDk7uTdWckxtQwq4AFzMgwJOGUICyhgb\nXD1Lc51Uznk3Ltj93SPbGOC/UNwTHHNsDNLGHTBR+8qngrUk54JL38kYSY+MGcir\n96qAWT9VpkV2M27m5A+7q8S4pwSS9cprrglGj5Rafl7FW+uIkjA5egjkOQKBgQCo\ns6VjOVCFWYYNf+TX1rhOsphOGlZlT/jggBVaGNSXz1ACuJoq16jemdSsGR6Re2vb\nciJAFBjj2dvjxaQ2deCAzCE0ZPb6jLqlf5ZcwztZe3OTi5Ov10xZfWt2DQ7s0D/T\n7IhFNdX999qo12vtFq/0R1LjIc1EHPWnvzNXJTt+rQKBgQDUdd4D4hpZiKzWWEDR\nkmgVoQsjsFEHNzI58lmPFK/Q2gPVJQYxmddaG5oJfaRgykUKmqYdrtUd3M3b0YYn\nLdn7cJ2uUy8pCBiVkFfW64BU/JEvdw1ddRENQ/xEmNB5FWzPvrFFkYxSsiTmQpn/\nvVPgMXwpgBfmMgthIcOEBssnyw==\n-----END PRIVATE KEY-----\n",
  client_email: `firebase-adminsdk-fbsvc@${process.env.VITE_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
  client_id: "106405713307509197281",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40${process.env.VITE_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`
};