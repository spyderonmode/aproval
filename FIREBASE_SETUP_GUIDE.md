# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "tictac-3x5-game")
4. Choose whether to enable Google Analytics
5. Click "Create project"

## Step 2: Get Web App Configuration

1. In your Firebase project, click the gear icon ⚙️ and select "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon `</>`
4. Register your app with a nickname (e.g., "TicTac Game")
5. Copy the config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef...",
  measurementId: "G-ABC123DEF4"
};
```

## Step 3: Get Service Account Key

1. Still in "Project settings", click on "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. Open the JSON file and copy its contents

## Step 4: Update Configuration Files

### Update `server/firebase-config.ts`:
- Replace the `firebaseConfig` object with your web app config
- Replace the `serviceAccountKey` object with your service account JSON

### Update `client/src/lib/firebase-config.ts`:
- Replace the `firebaseConfig` object with your web app config

## Step 5: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 6: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll set up security rules later)
4. Select a location for your database
5. Click "Done"

## Step 7: Configure Security Rules

In Firestore Database, go to "Rules" tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All authenticated users can read/write game data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 8: Test the Setup

After updating the configuration files, the application should connect to Firebase and you'll be able to:
- Register new users
- Login with email/password
- Store game data in Firestore
- Use real-time multiplayer features

## Example Configuration

Here's what your configuration should look like (with your actual values):

**server/firebase-config.ts:**
```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyC5xyz...",
  authDomain: "tictac-game-abc123.firebaseapp.com",
  projectId: "tictac-game-abc123",
  storageBucket: "tictac-game-abc123.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:xyz123abc",
  measurementId: "G-XYZ123ABC"
};

export const serviceAccountKey = {
  "type": "service_account",
  "project_id": "tictac-game-abc123",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@tictac-game-abc123.iam.gserviceaccount.com",
  // ... other fields
};
```

Once you've updated both configuration files with your actual Firebase credentials, the application will automatically connect to Firebase and start using it for data storage and authentication.