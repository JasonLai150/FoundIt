import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';

interface User {
  uid: string;
  email: string;
  name: string;
  role?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  experience?: number;
  github?: string;
  linkedin?: string;
  website?: string;
  looking?: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  register: (name: string, email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
  shouldAutoLogin: boolean;
  logoutTriggered: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAutoLogin, setShouldAutoLogin] = useState(false);
  const [logoutTriggered, setLogoutTriggered] = useState(0);

  // Check if user should auto-login on app start
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const stayLoggedInPref = await AsyncStorage.getItem('stayLoggedIn');
        setShouldAutoLogin(stayLoggedInPref === 'true');
      } catch (error) {
        console.error('Error checking auto-login preference:', error);
        setShouldAutoLogin(false);
      }
    };
    
    checkAutoLogin();
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', {
        firebaseUser: firebaseUser ? firebaseUser.email : 'none',
        shouldAutoLogin
      });

      if (firebaseUser) {
        // User is signed in
        setFirebaseUser(firebaseUser);
        setIsAuthenticated(true);
        
        console.log('✅ User authenticated, fetching user data...');
        // Fetch user data from Firestore
        await fetchUserData(firebaseUser.uid);
        
        // If user shouldn't auto-login but they're manually logging in, that's okay
        // We only sign them out if they have an existing session but don't want auto-login
        if (!shouldAutoLogin) {
          console.log('ℹ️ User logged in without auto-login preference');
        }
      } else {
        // User is signed out
        console.log('🔄 User signed out, clearing state...');
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [shouldAutoLogin]);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      console.log('🔄 Starting login attempt...');
      console.log('📧 Email:', email);
      console.log('🔒 Stay logged in:', stayLoggedIn);
      
      // Store login preference BEFORE login to ensure auth state listener has it
      console.log('🔄 Storing login preference...');
      await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
      setShouldAutoLogin(stayLoggedIn);
      console.log('✅ Login preference stored');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout - request took too long')), 10000); // 10 second timeout
      });
      
      // Race between login and timeout
      const loginPromise = signInWithEmailAndPassword(auth, email, password);
      
      console.log('🔄 Sending login request to Firebase...');
      await Promise.race([loginPromise, timeoutPromise]);
      console.log('✅ Firebase login successful');
      
      console.log('🎉 Login completed successfully!');
      return true;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Show specific error messages to user
      let userMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          userMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          userMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          if (error.message.includes('timeout')) {
            userMessage = 'Login request timed out. This might be due to network blocking. Try disabling browser extensions or using incognito mode.';
          } else {
            userMessage = error.message || 'An unexpected error occurred.';
          }
      }
      
      Alert.alert('Login Failed', userMessage);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      console.log('🔄 Starting registration process...');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);
      
      // Create user account
      console.log('🔄 Creating Firebase user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created:', firebaseUser.uid);

      // Update the user's display name
      console.log('🔄 Updating user profile...');
      await updateProfile(firebaseUser, {
        displayName: name,
      });
      console.log('✅ User profile updated');

      // Create user document in Firestore
      console.log('🔄 Creating Firestore document...');
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        role: '',
        bio: '',
        skills: [],
        location: '',
        experience: 0,
        github: '',
        linkedin: '',
        website: '',
        looking: true,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ Firestore document created');
      setUser(userData);

      // Store login preference
      console.log('🔄 Storing login preference...');
      await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
      setShouldAutoLogin(stayLoggedIn);
      console.log('✅ Login preference stored');

      console.log('🎉 Registration completed successfully!');
      return true;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Show specific error messages to user
      let userMessage = 'Unable to create account. Please try again.';
      
      switch (error.code) {
        case 'auth/weak-password':
          userMessage = 'Password must be at least 6 characters long.';
          break;
        case 'auth/email-already-in-use':
          userMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          userMessage = 'Please enter a valid email address.';
          break;
        case 'permission-denied':
          userMessage = 'Database permissions error. The user account was created but profile data could not be saved. Please contact support.';
          break;
        default:
          userMessage = error.message || 'An unexpected error occurred.';
      }
      
      Alert.alert('Registration Failed', userMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      
      // Clear login preference first
      console.log('🔄 Clearing login preference...');
      await AsyncStorage.removeItem('stayLoggedIn');
      setShouldAutoLogin(false);
      console.log('✅ Cleared login preference');
      
      // Clear local state
      console.log('🔄 Clearing local state...');
      setUser(null);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      console.log('✅ Cleared local state');
      
      // Sign out from Firebase (this will trigger onAuthStateChanged)
      console.log('🔄 Signing out from Firebase...');
      await signOut(auth);
      console.log('✅ Signed out from Firebase');
      
      console.log('🎉 Logout completed successfully!');
      setLogoutTriggered(logoutTriggered + 1);
    } catch (error: any) {
      console.error('❌ Logout error:', error.message);
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!firebaseUser || !user) return false;

      const updatedUserData = { ...user, ...userData };
      
      // Update Firestore document
      await setDoc(doc(db, 'users', firebaseUser.uid), updatedUserData, { merge: true });
      
      // Update local state
      setUser(updatedUserData);
      
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      return false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    firebaseUser,
    login,
    register,
    logout,
    updateUserProfile,
    isLoading,
    shouldAutoLogin,
    logoutTriggered,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 