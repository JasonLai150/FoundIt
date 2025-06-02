# Firestore Security Rules Setup

## Problem
You're getting "Missing or insufficient permissions" when trying to create user documents in Firestore.

## ⚠️ IMPORTANT: Use Secure Rules

**DO NOT use overly permissive rules in production!** Here's how to set up secure rules:

### 1. Go to Firebase Console
- Open: https://console.firebase.google.com/project/foundit-fd4bf
- Click on "Firestore Database" in the sidebar
- Click on the "Rules" tab

### 2. Use These SECURE Rules
Replace the current rules with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read other users' profiles (for matching)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Future: Add rules for matches, chats, etc.
    // match /matches/{matchId} {
    //   allow read, write: if request.auth != null && 
    //     (resource.data.user1 == request.auth.uid || resource.data.user2 == request.auth.uid);
    // }
  }
}
```

### 3. Publish the Rules
- Click "Publish" to save the new rules

## What These Secure Rules Do:

- **✅ Allow**: Authenticated users to create/read/update their own profile
- **✅ Allow**: Authenticated users to read other users' profiles (needed for browsing/matching)
- **❌ Deny**: Unauthenticated users from accessing any data
- **❌ Deny**: Users from modifying other users' profiles
- **❌ Deny**: Any access to non-existent collections

## 🚨 ONLY If Secure Rules Don't Work:

If you're still getting permission errors with the secure rules above, you can **temporarily** use these for debugging:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null; // Only authenticated users
    }
  }
}
```

**⚠️ Critical Warning**: 
- The testing rules above still allow any authenticated user to modify any data
- Use them ONLY for debugging
- Switch back to the secure rules immediately after testing
- NEVER deploy to production with testing rules

## After Updating Rules:
1. Try registering a new user
2. Check Firebase Console → Authentication → Users to see if the user was created
3. Check Firebase Console → Firestore Database → Data to see if the user document was created

## Troubleshooting:
If you still get permission errors with the secure rules:
1. Make sure the user is actually authenticated (check Firebase Auth console)
2. Verify the document path is `/users/{uid}` where `{uid}` matches the authenticated user's UID
3. Check the browser console for detailed error messages 