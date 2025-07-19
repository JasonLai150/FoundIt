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
  // Goal-specific JSONB fields
  company_name?: string;
  company_description?: string;
  firm_name?: string;
  firm_description?: string;
  desired_skills?: string[];
  funding?: {
    round?: string;
    amount?: string;
    investors?: string[];
  };
  investment_areas?: string[];
  investment_amount?: {
    min?: number;
    max?: number;
  };
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
  fetchUserExperience: (userId: string) => Promise<Experience | null>;
  updateUserExperience: (experienceId: string, experienceData: Omit<Experience, 'id' | 'created_at'>) => Promise<boolean>;
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setIsLoading(false);
          return;
        }
        
        // Process initial session the same way as auth state changes
        if (session?.user) {
          setSession(session);
          setSupabaseUser(session.user);
          setIsAuthenticated(true);
          await fetchUserData(session.user.id);
        } else {
          setSession(null);
          setSupabaseUser(null);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setIsLoading(false);
      }
    };

    // Get initial session first
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        setIsAuthenticated(true);
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [shouldAutoLogin]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Handle specific case where profile doesn't exist (PGRST116)
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          console.log('No profile found for authenticated user, clearing auth state');
          
          // Clear local auth state
          setUser(null);
          setIsAuthenticated(false);
          setSupabaseUser(null);
          setSession(null);
          
          // Sign out from Supabase (but don't show alert)
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
          
          // Clear stay logged in preference
          try {
            await AsyncStorage.removeItem('stayLoggedIn');
            setShouldAutoLogin(false);
          } catch (storageError) {
            console.error('Error clearing storage:', storageError);
          }
          
          return;
        }
        
        console.error('Error fetching user data:', error);
        return;
      }

      if (data) {
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
          // Goal-specific JSONB fields - handle null/undefined properly
          company_name: data.company_name || undefined,
          company_description: data.company_description || undefined,
          firm_name: data.firm_name || undefined,
          firm_description: data.firm_description || undefined,
          desired_skills: Array.isArray(data.desired_skills) ? data.desired_skills : undefined,
          funding: data.funding && typeof data.funding === 'object' ? data.funding : undefined,
          investment_areas: Array.isArray(data.investment_areas) ? data.investment_areas : undefined,
          investment_amount: data.investment_amount && typeof data.investment_amount === 'object' ? data.investment_amount : undefined,
        };
        
        setUser(userData);
        
        // Automatically fetch and cache experience data for immediate use
        try {
          const experienceData = await fetchUserExperience(userId);
          // Note: We can't directly call updateProfileCache here due to circular dependency
          // The cache will be populated when components load and check for valid cache
        } catch (expError) {
          console.error('Error fetching experience data during login:', expError);
        }
      }
    } catch (error) {
      console.error('Exception in fetchUserData:', error);
      
      // For any unexpected errors, also clear auth state
      setUser(null);
      setIsAuthenticated(false);
      setSupabaseUser(null);
      setSession(null);
    }
  };

  const login = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
      setShouldAutoLogin(stayLoggedIn);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Wait for auth state listener to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show specific error messages to user
      let userMessage = 'Login failed. Please try again.';
      let alertTitle = '❌ Login Failed';
      
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
      
      showAlert(alertTitle, userMessage);
      return false;
    }
  };

  const register = async (email: string, password: string, stayLoggedIn: boolean = false): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('No user object returned from Supabase');
        throw new Error('User creation failed - no user data returned');
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        showAlert(
          '📧 Check Your Email!', 
          `We've sent a confirmation link to ${email}.\n\nPlease check your email and click the confirmation link to activate your account.\n\n💡 Tip: Check your spam folder if you don't see it in your inbox.`,
          [{ text: 'OK', style: 'default' }]
        );
        return true;
      }

      // If we have a session, the user is automatically confirmed
      if (data.session) {
        // Create profile manually since no trigger exists
        try {
          const profileData = {
            id: data.user.id,
            email: data.user.email!,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single();
          
          if (profileError) {
            console.error('Profile creation failed:', profileError);
            throw profileError;
          }
          
          if (!profileResult) {
            throw new Error('Profile creation failed - no data returned');
          }
          
        } catch (profileError) {
          console.error('Failed to create profile:', profileError);
          
          // Try to clean up the auth user if profile creation failed
          try {
            await supabase.auth.signOut();
          } catch (cleanupError) {
            console.error('Failed to cleanup auth after profile creation error:', cleanupError);
          }
          
          showAlert(
            '⚠️ Profile Creation Failed',
            'Your account was created but we couldn\'t set up your profile. Please try logging in again or contact support.',
            [{ text: 'OK', style: 'default' }]
          );
          return false;
        }

        await AsyncStorage.setItem('stayLoggedIn', stayLoggedIn.toString());
        setShouldAutoLogin(stayLoggedIn);
      }

      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
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
      
      showAlert(alertTitle, userMessage, [{ text: 'OK', style: 'default' }]);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('stayLoggedIn');
      setShouldAutoLogin(false);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      showAlert(
        '👋 Logged Out', 
        'You have been successfully logged out.\n\nThanks for using FoundIt!',
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error: any) {
      console.error('Logout error:', error.message);
      
      // If Supabase signout fails, still clear local state
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setIsAuthenticated(false);
      
      showAlert(
        '⚠️ Logout Issue',
        'There was a problem signing out completely, but your local session has been cleared.\n\nYou are now logged out of this device.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!supabaseUser || !session) {
        console.error('Missing authentication for profile update');
        return false;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', supabaseUser.id)
        .select();
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('No rows updated - profile may not exist');
        throw new Error('Profile not found');
      }
      
      setUser(data[0] as User);
      return true;
    } catch (error) {
      console.error('Exception in updateUserProfile:', error);
      throw error;
    }
  };

  const createUserExperience = async (experienceData: Omit<Experience, 'id' | 'created_at'>): Promise<boolean> => {
      if (!supabaseUser || !user) {
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

      await fetchUserData(supabaseUser.id);
    return true;
  };

  const fetchUserExperience = async (userId: string): Promise<Experience | null> => {
    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user experience:', error);
      return null;
    }

    return data as Experience;
  };

  const updateUserExperience = async (experienceId: string, experienceData: Omit<Experience, 'id' | 'created_at'>): Promise<boolean> => {
    if (!supabaseUser || !session) {
      console.error('Missing authentication for experience update');
      return false;
    }

    const { error } = await supabase
      .from('experience')
      .update(experienceData)
      .eq('id', experienceId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    return true;
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
    fetchUserExperience,
    updateUserExperience,
    isLoading,
    shouldAutoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 