# Firebase Setup Guide

## Files Created

1. **`app/config/firebase.ts`** - Firebase configuration and initialization
2. **`app/contexts/AuthContext.tsx`** - Authentication context with Firebase Auth and Firestore
3. **`app/auth.tsx`** - Login/Register screen with "Stay logged in" option
4. **Updated `app/_layout.tsx`** - Added AuthProvider wrapper
5. **Updated `app/index.tsx`** - Added authentication routing with login persistence
6. **Updated `app/(tabs)/profile.tsx`** - Added Firebase user data and logout

## Firebase Features Included

### Authentication
- Email/password registration and login
- "Stay logged in" checkbox option
- Automatic user state persistence (when enabled)
- Profile management in Firestore

### Login Behavior
- **Default**: Auth screen is shown first on app launch
- **"Stay logged in" checked**: User automatically redirects to feed on subsequent app launches
- **"Stay logged in" unchecked**: User must log in each time they open the app
- Login preference is stored locally using AsyncStorage

### Database Structure
User documents are stored in Firestore under the `users` collection with the following structure:
```javascript
{
  uid: string,
  email: string,
  name: string,
  role?: string,
  bio?: string,
  skills?: string[],
  location?: string,
  experience?: number,
  github?: string,
  linkedin?: string,
  website?: string,
  looking?: boolean,
  avatarUrl?: string
}
```

## How to Use

1. **First Launch**: Auth screen is shown by default
2. **Registration**: Users can create accounts with name, email, and password
3. **Login**: Existing users can sign in with email and password
4. **Stay Logged In**: Check the box to remain logged in on future app launches
5. **Profile**: View user data from Firebase and logout (clears "stay logged in" preference)
6. **Data Persistence**: User profiles are stored in Firestore

## Packages Added

- `firebase` - Firebase SDK for authentication and Firestore
- `@react-native-async-storage/async-storage` - Local storage for login preferences

## Next Steps

To extend the app, you can:
1. Add profile editing functionality
2. Implement Google Sign-In (requires additional setup)
3. Add photo uploads to Firebase Storage
4. Create matching algorithms using Firestore queries
5. Add real-time messaging with Firestore

## Firebase Console

Your Firebase project: https://console.firebase.google.com/project/foundit-fd4bf

Make sure to:
1. Enable Authentication > Sign-in method > Email/Password
2. Create Firestore Database in production mode
3. Set up Firestore security rules as needed 