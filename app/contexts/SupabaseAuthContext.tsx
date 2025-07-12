import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { showAlert } from '../utils/alert';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  dob?: string; // date of birth
  location?: string;
  goal?: 'recruiting' | 'searching' | 'investing' | 'other';
  role?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
  profile_complete?: boolean; // Track if user has completed profile setup
}

interface Experience {
  id?: string;
  profile_id: string;
  education?: {
    school_name: string;
    degree?: string;
    major?: string;
  }[];
  work_experience?: any; // JSON field
  skills?: string[];
  graduation_date?: string;
  created_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  register: (email: string, password: string, stayLoggedIn?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  createUserExperience: (experienceData: Omit<Experience, 'id' | 'created_at'>) => Promise<boolean>;
  isLoading: boolean;
  shouldAutoLogin: boolean;
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          setIsLoading(false);
          return;
        }
        
        console.log('📊 Initial session:', session ? session.user.email : 'none');
        
        // Process initial session the same way as auth state changes
        if (session?.user) {
          console.log('✅ Initial session found, setting authenticated state...');
          setSession(session);
          setSupabaseUser(session.user);
          setIsAuthenticated(true);
          await fetchUserData(session.user.id);
        } else {
          console.log('ℹ️ No initial session found');
          setSession(null);
          setSupabaseUser(null);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        setIsLoading(false);
      }
    };

    // Get initial session first
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', {
        event,
        userEmail: session?.user?.email || 'none'
      });

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        // User is signed in
        console.log('✅ User authenticated, loading profile...');
        setIsAuthenticated(true);
        await fetchUserData(session.user.id);
      } else {
        // User is signed out
        console.log('🔄 User signed out, clearing state...');
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [shouldAutoLogin]); // Only depend on shouldAutoLogin

  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔄 Fetching user data for ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user data:', error);
        console.error('❌ Error details:', error.message);
        // Don't throw - just log and continue, user will be null
        return;
      }

      if (data) {
        console.log('✅ User data loaded successfully');
        const userData: User = {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          avatar_url: data.avatar_url,
          dob: data.dob,
          location: data.location,
          goal: data.goal,
          role: data.role,
          bio: data.bio,
          github: data.github,
          linkedin: data.linkedin,
          website: data.website,
          created_at: data.created_at,
          updated_at: data.updated_at,
          profile_complete: data.profile_complete,
        };
        console.log('🔍 Profile complete status:', userData.profile_complete);
        setUser(userData);
      } else {
        console.log('⚠️ No user data found for ID:', userId);
        // User is authenticated but no profile exists - this is an edge case
        // The user will be null, and the app will handle this appropriately
      }
    } catch (error) {
      console.error('❌ Exception in fetchUserData:', error);
      // Don't throw - just log and continue
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

  const register = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      console.log('🔄 Starting Supabase registration process...');
      console.log('📧 Email:', email);
      
      // Create user account
      console.log('🔄 Creating Supabase user account...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      // Debug: Log the full response structure
      console.log('📊 Full Supabase signup response:', {
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at,
          confirmed_at: data.user.confirmed_at,
          identity_data: data.user.identities?.[0]?.identity_data
        } : null,
        session: data?.session ? {
          access_token: data.session.access_token ? 'present' : 'missing',
          refresh_token: data.session.refresh_token ? 'present' : 'missing',
          expires_at: data.session.expires_at
        } : null,
        error: error ? {
          message: error.message,
          status: error.status,
          code: error.code
        } : null
      });

      if (error) {
        console.error('❌ Supabase signup error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user object returned from Supabase');
        throw new Error('User creation failed - no user data returned');
      }

      // Better logging based on what actually happened
      console.log('📊 Signup result analysis:');
      console.log('- User object exists:', !!data.user);
      console.log('- User ID:', data.user.id);
      console.log('- Email confirmed:', !!data.user.email_confirmed_at);
      console.log('- Session exists:', !!data.session);
      console.log('- User confirmed at:', data.user.confirmed_at);
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required - no session created');
        console.log('📧 Email confirmation status:', data.user.email_confirmed_at ? 'already confirmed' : 'pending confirmation');
        
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
        console.log('✅ Registration initiated - email confirmation required');
        return true; // Registration successful, just needs confirmation
      }

      // If we have a session, the user is automatically confirmed
      if (data.session) {
        console.log('✅ User automatically confirmed and logged in');
        console.log('📧 Email confirmation not required for this setup');
        
        // Create profile manually since no trigger exists
        console.log('🔄 Creating user profile manually...');
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              profile_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });
          
          if (profileError) {
            console.error('❌ Profile creation failed:', profileError);
            throw profileError;
          }
          
          console.log('✅ User profile created successfully');
        } catch (profileError) {
          console.error('❌ Failed to create profile:', profileError);
          showAlert(
            '⚠️ Profile Creation Failed',
            'Your account was created but we couldn\'t set up your profile. Please try logging in again.',
            [{ text: 'OK', style: 'default' }]
          );
          return false;
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

      console.log('✅ Registration process completed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error status:', error.status);
      
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
      
      // Show error message - navigation will be triggered manually
      showAlert(
        '⚠️ Logout Issue',
        'There was a problem signing out completely, but your local session has been cleared.\n\nYou are now logged out of this device.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      console.log('🔄 Updating user profile...', userData);
      console.log('🔍 Auth state:', { 
        supabaseUser: !!supabaseUser, 
        user: !!user, 
        session: !!session,
        isAuthenticated 
      });

      if (!supabaseUser || !session) {
        console.error('❌ Missing authentication - supabaseUser:', !!supabaseUser, 'session:', !!session);
        showAlert(
          '⚠️ Not Logged In',
          'You must be logged in to update your profile.\n\nPlease sign in and try again.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      // For new users during profile setup, user object might not be loaded yet
      const currentUserData = user || {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        profile_complete: false
      };

      const updatedUserData = { ...currentUserData, ...userData };
      
      console.log('🔄 Sending profile update to database...');
      console.log('📋 Update data:', userData);
      console.log('🆔 Updating for user ID:', supabaseUser.id);
      
      // Direct update - profile should exist from signup trigger
      console.log('🔄 Updating profile directly...');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', supabaseUser.id)
        .select();
      
      if (error) {
        console.error('❌ Database update error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No rows updated - profile may not exist');
        throw new Error('Profile not found. Please try logging out and back in.');
      }
      
      console.log('✅ Profile updated successfully');
      console.log('📋 Updated data:', data[0]);
      
      // Update local state with the returned data
      setUser(data[0] as User);
      
      console.log('✅ Local user state updated');
      
      // Removed success alert - only show final alert when profile is complete
      
      return true;
    } catch (error: any) {
      console.error('❌ Update profile error:', error.message);
      console.error('❌ Full error object:', error);
      console.error('❌ Error stack:', error.stack);
      
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
          userMessage = 'Profile database table is missing.\n\nPlease contact support for assistance.';
          alertTitle = '🛠️ Database Error';
        } else if (error.message.includes('Profile not found')) {
          userMessage = 'Your profile was not found in the database.\n\nPlease try logging out and back in to recreate it.';
          alertTitle = '👤 Profile Not Found';
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

  const createUserExperience = async (experienceData: Omit<Experience, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      if (!supabaseUser || !user) {
        showAlert(
          '⚠️ Not Logged In',
          'You must be logged in to add experience.\n\nPlease sign in and try again.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      const newExperience = {
        ...experienceData,
        profile_id: supabaseUser.id,
      };

      const { error } = await supabase
        .from('experience')
        .insert(newExperience);

      if (error) {
        throw error;
      }

      // Refresh user data to include new experience
      await fetchUserData(supabaseUser.id);

      // Removed success alert - only show final alert when profile is complete
      
      return true;
    } catch (error: any) {
      console.error('Add experience error:', error.message);
      let userMessage = 'Failed to add experience. Please try again.';
      let alertTitle = '❌ Add Experience Failed';

      if (error.message) {
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          userMessage = 'You don\'t have permission to add this experience.\n\nPlease make sure you\'re logged in with the correct account.';
          alertTitle = '🔒 Permission Denied';
        } else if (error.message.includes('Network request failed')) {
          userMessage = 'Network connection error.\n\nPlease check your internet connection and try again.';
          alertTitle = '🌐 Connection Error';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          userMessage = 'Experience database is not set up correctly.\n\nPlease contact support for assistance.';
          alertTitle = '🛠️ Database Error';
        } else {
          userMessage = `Add experience failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`;
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
    createUserExperience,
    isLoading,
    shouldAutoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 