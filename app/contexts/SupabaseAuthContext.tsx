import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { showAlert } from '../utils/alert';

interface User {
  id: string;
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
  avatar_url?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  register: (name: string, email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
  shouldAutoLogin: boolean;
  logoutTriggered: number;
  navigationTrigger: number;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAutoLogin, setShouldAutoLogin] = useState(false);
  const [logoutTriggered, setLogoutTriggered] = useState(0);
  const [navigationTrigger, setNavigationTrigger] = useState(0);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Supabase auth state changed:', {
        event,
        session: session ? session.user.email : 'none',
        shouldAutoLogin,
        currentIsAuthenticated: isAuthenticated
      });

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        // User is signed in
        console.log('✅ Supabase user detected, setting authenticated state...');
        setIsAuthenticated(true);
        
        console.log('✅ User authenticated, fetching user data...');
        // Fetch user data from Supabase
        await fetchUserData(session.user.id);
        
        if (!shouldAutoLogin) {
          console.log('ℹ️ User logged in without auto-login preference');
        }
        
        console.log('🎉 Authentication complete! Navigation will be handled by components');
        setNavigationTrigger(prev => prev + 1);
        
      } else {
        // User is signed out
        console.log('🔄 User signed out, clearing state...');
        setUser(null);
        setIsAuthenticated(false);
        
        // Trigger navigation to auth page
        setNavigationTrigger(prev => prev + 1);
      }
      setIsLoading(false);
      console.log('📊 Final auth state:', {
        isAuthenticated: session?.user ? true : false,
        isLoading: false
      });
    });

    return () => subscription.unsubscribe();
  }, [shouldAutoLogin, isAuthenticated]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (data) {
        const userData: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          bio: data.bio,
          skills: data.skills,
          location: data.location,
          experience: data.experience,
          github: data.github,
          linkedin: data.linkedin,
          website: data.website,
          looking: data.looking,
          avatar_url: data.avatar_url,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      console.log('🔄 Starting Supabase login attempt...');
      console.log('📧 Email:', email);
      console.log('🔒 Stay logged in:', stayLoggedIn);
      
      // Store login preference BEFORE login
      console.log('🔄 Storing login preference...');
      await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
      setShouldAutoLogin(stayLoggedIn);
      console.log('✅ Login preference stored');
      
      console.log('🔄 Sending login request to Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Supabase login successful');
      console.log('👤 Logged in user:', data.user?.email || 'unknown');
      
      // Wait a moment for the auth state listener to process
      console.log('⏳ Waiting for auth state listener to process...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🎉 Login completed successfully!');
      return true;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Show specific error messages to user
      let userMessage = 'Login failed. Please try again.';
      let alertTitle = '❌ Login Failed';
      
      console.log('🚨 About to show alert with title:', alertTitle);
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password.\n\nPlease check your credentials and try again.';
          alertTitle = '🔒 Invalid Credentials';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.\n\n📧 Look for a confirmation email from FoundIt.';
          alertTitle = '📧 Email Not Confirmed';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many failed login attempts.\n\nPlease wait a few minutes before trying again.';
          alertTitle = '⏱️ Rate Limited';
        } else if (error.message.includes('signups are disabled')) {
          userMessage = 'Account access is temporarily disabled.\n\nPlease try again later or contact support.';
          alertTitle = '🚫 Access Disabled';
        } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          userMessage = 'Network connection error.\n\nPlease check your internet connection and try again.';
          alertTitle = '🌐 Connection Error';
        } else if (error.message.includes('User not found')) {
          userMessage = 'No account found with this email address.\n\nTry creating an account instead.';
          alertTitle = '👤 Account Not Found';
        } else {
          userMessage = `Login failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`;
        }
      }
      
      console.log('🚨 Final alert details:', { alertTitle, userMessage });
      
      showAlert(alertTitle, userMessage);
      
      console.log('🚨 Alert.alert() called');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      console.log('🔄 Starting Supabase registration process...');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);
      
      // Create user account
      console.log('🔄 Creating Supabase user account...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      console.log('✅ Supabase user created:', data.user.id);

      // Check if this is actually an existing user trying to register again
      // This happens when Supabase returns a user but no session for existing emails
      if (data.user && !data.session && !data.user.email_confirmed_at) {
        // This could be an existing unconfirmed user OR a duplicate registration attempt
        // Check if user already exists by trying to sign in
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: 'dummy-check-password'
          });
          
          // If we get "Invalid login credentials", the email exists but password is wrong
          // This means they're trying to register with an existing email
          if (signInError && signInError.message.includes('Invalid login credentials')) {
            showAlert(
              '👤 Account Already Exists',
              `An account with the email "${email}" already exists.\n\nPlease try logging in instead, or use a different email address.`
            );
            return false;
          }
        } catch (checkError) {
          console.log('Error checking existing user:', checkError);
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        showAlert(
          '📧 Check Your Email!', 
          `We've sent a confirmation link to ${email}.\n\nPlease check your email and click the confirmation link to activate your account.\n\n💡 Tip: Check your spam folder if you don't see it in your inbox.`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
        console.log('📧 Email confirmation required for user:', email);
        return true; // Registration successful, just needs confirmation
      }

      // If we have a session, the user is automatically confirmed
      if (data.session) {
        console.log('✅ User automatically confirmed and logged in');
        
        // Create user profile in database
        console.log('🔄 Creating user profile...');
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
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

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          showAlert(
            '⚠️ Profile Setup Issue',
            'Your account was created successfully, but we couldn\'t set up your profile. You can update it later from the profile page.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          console.log('✅ User profile created');
        }

        // Store login preference
        console.log('🔄 Storing login preference...');
        await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
        setShouldAutoLogin(stayLoggedIn);
        console.log('✅ Login preference stored');

        showAlert(
          '🎉 Welcome to FoundIt!', 
          'Your account has been created and you\'re now logged in!',
          [{ text: 'Get Started', style: 'default' }]
        );
      }

      console.log('🎉 Registration completed successfully!');
      return true;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Show specific error messages to user
      let userMessage = 'Unable to create account. Please try again.';
      let alertTitle = '❌ Registration Failed';
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          userMessage = 'An account with this email already exists.\n\nTry logging in instead, or use a different email address.';
          alertTitle = '👤 Account Exists';
        } else if (error.message.includes('Password should be at least')) {
          userMessage = 'Password must be at least 6 characters long.\n\nPlease choose a stronger password.';
          alertTitle = '🔒 Weak Password';
        } else if (error.message.includes('Unable to validate email address') || error.message.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.\n\nExample: user@example.com';
          alertTitle = '📧 Invalid Email';
        } else if (error.message.includes('signup is disabled')) {
          userMessage = 'New account registration is temporarily disabled.\n\nPlease try again later or contact support.';
          alertTitle = '🚫 Signup Disabled';
        } else if (error.message.includes('rate limit')) {
          userMessage = 'Too many signup attempts.\n\nPlease wait a few minutes before trying again.';
          alertTitle = '⏱️ Rate Limited';
        } else {
          userMessage = `Registration failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`;
        }
      }
      
      showAlert(alertTitle, userMessage, [
        { text: 'OK', style: 'default' }
      ]);
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
      
      // Sign out from Supabase
      console.log('🔄 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Supabase signout completed');
      console.log('🎉 Logout completed successfully!');
      
      // Show success message - navigation will be handled by auth state listener
      showAlert(
        '👋 Logged Out', 
        'You have been successfully logged out.\n\nThanks for using FoundIt!',
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error: any) {
      console.error('❌ Logout error:', error.message);
      
      // If Supabase signout fails, still clear local state
      console.log('🔄 Supabase signout failed, clearing local state manually...');
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setIsAuthenticated(false);
      
      // Show error message - navigation will be triggered by auth state change
      showAlert(
        '⚠️ Logout Issue',
        'There was a problem signing out completely, but your local session has been cleared.\n\nYou are now logged out of this device.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!supabaseUser || !user) {
        showAlert(
          '⚠️ Not Logged In',
          'You must be logged in to update your profile.\n\nPlease sign in and try again.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      const updatedUserData = { ...user, ...userData };
      
      // Update Supabase profile
      const { error } = await supabase
        .from('profiles')
        .update(updatedUserData)
        .eq('id', supabaseUser.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUser(updatedUserData);
      
      showAlert(
        '✅ Profile Updated',
        'Your profile has been updated successfully!',
        [{ text: 'OK', style: 'default' }]
      );
      
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      
      let userMessage = 'Failed to update profile. Please try again.';
      let alertTitle = '❌ Update Failed';
      
      if (error.message) {
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          userMessage = 'You don\'t have permission to update this profile.\n\nPlease make sure you\'re logged in with the correct account.';
          alertTitle = '🔒 Permission Denied';
        } else if (error.message.includes('Network request failed')) {
          userMessage = 'Network connection error.\n\nPlease check your internet connection and try again.';
          alertTitle = '🌐 Connection Error';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          userMessage = 'Profile database is not set up correctly.\n\nPlease contact support for assistance.';
          alertTitle = '🛠️ Database Error';
        } else {
          userMessage = `Profile update failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`;
        }
      }
      
      showAlert(alertTitle, userMessage, [
        { text: 'OK', style: 'default' }
      ]);
      
      return false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    supabaseUser,
    session,
    login,
    register,
    logout,
    updateUserProfile,
    isLoading,
    shouldAutoLogin,
    logoutTriggered,
    navigationTrigger,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 