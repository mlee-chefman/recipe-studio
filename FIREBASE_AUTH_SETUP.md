# Firebase Authentication Setup Guide

## Overview
Firebase authentication has been successfully integrated into your Recipe Studio app with user profiles containing email and name fields.

## What's Been Implemented

### 1. Firebase Configuration
- **File**: `src/services/firebase.ts`
- Initializes Firebase app, Authentication, and Firestore
- **Action Required**: Replace placeholder values with your actual Firebase project credentials

### 2. User Authentication Module
- **File**: `src/modules/user/userAuth.ts`
- Functions for sign up, sign in, sign out
- Auth state management
- User conversion utilities

### 3. User Profile Service
- **File**: `src/modules/user/userService.ts`
- Creates and manages user profiles in Firestore
- User profile contains: uid, email, name, createdAt, updatedAt

### 4. State Management
- **File**: `src/store/store.ts`
- Added `useAuthStore` with Zustand
- Persists auth state with AsyncStorage
- Manages user and userProfile data

### 5. Authentication Screens
- **Sign Up**: `src/screens/signup.tsx`
- **Sign In**: `src/screens/signin.tsx`
- Form validation and error handling
- Automatic profile creation on sign up

### 6. Navigation Integration
- **File**: `src/navigation/index.tsx`
- Conditional navigation based on auth state
- AuthWrapper component for auth state listening
- Separate stacks for authenticated/unauthenticated users

### 7. Settings Screen
- **File**: `src/screens/settings.tsx`
- Displays user profile information
- Sign out functionality with confirmation

### 8. Auth Wrapper Component
- **File**: `src/components/AuthWrapper.tsx`
- Listens to Firebase auth state changes
- Shows loading screen during auth state resolution

## Setup Instructions

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register your app and copy the config object

### 3. Update Firebase Configuration
Replace the placeholder values in `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

### 4. Firestore Security Rules
Set up these basic security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## User Flow

### New User Registration
1. User opens app → sees Sign In screen
2. Taps "Sign Up" → goes to Sign Up screen
3. Enters name, email, password → creates Firebase account
4. User profile automatically created in Firestore
5. User is signed in and sees main app

### Existing User Sign In
1. User opens app → sees Sign In screen
2. Enters email/password → signs in
3. User profile loaded from Firestore
4. User sees main app

### Sign Out
1. User goes to Settings screen
2. Taps "Sign Out" → confirmation dialog
3. Confirms → signed out and returns to Sign In screen

## User Profile Structure
```typescript
interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication State
The auth state is managed globally and includes:
- `user`: Firebase auth user data (uid, email, displayName)
- `userProfile`: Extended profile from Firestore (name, etc.)
- `isAuthenticated`: Boolean auth status
- `isLoading`: Loading state during auth resolution

## Testing
1. Run the app: `npm start`
2. Test sign up with a new email
3. Test sign in with existing credentials
4. Test sign out functionality
5. Verify user profile data in Settings screen

## Notes
- All authentication screens have proper form validation
- Error handling for common Firebase auth errors
- User profile is automatically created on sign up
- Auth state persists across app restarts
- Loading states handled during auth resolution

The implementation is complete and ready for use once you configure your Firebase project credentials!
