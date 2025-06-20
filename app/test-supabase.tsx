import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from './config/supabase';
import { showAlert } from './utils/alert';

export default function TestSupabase() {
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      console.log('🔄 Testing Supabase connection...');
      
      // Test 1: Check Supabase Auth
      console.log('🔄 Testing Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.log('⚠️ Auth check error (expected if not logged in):', authError.message);
      }
      
      console.log('✅ Supabase Auth connected');
      
      // Test 2: Check Supabase Database connection
      console.log('🔄 Testing Supabase Database connection...');
      
      // Try to read from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .limit(0);
      
      if (error) {
        console.log('Database error:', error.message);
        showAlert('⚠️ Database Issue', `Database connection test failed:\n\n${error.message}\n\nYou may need to create the 'profiles' table in Supabase.`);
        return;
      }
      
      console.log('✅ Supabase Database connected');
      
      showAlert('✅ Success', 'Supabase is properly connected!\n\nAuth: ✅\nDatabase: ✅');
      
    } catch (error: any) {
      console.error('❌ Supabase connection test failed:', error);
      showAlert('❌ Connection Failed', `Supabase connection test failed:\n\n${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testAuth = async () => {
    setTesting(true);
    try {
      console.log('🔄 Testing Supabase Auth with test user...');
      
      // Test sign up with a dummy email
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        console.log('Auth test result:', error.message);
        showAlert('Auth Test', `Auth test result:\n\n${error.message}`);
      } else {
        console.log('✅ Auth test successful - user created');
        showAlert('✅ Auth Test Success', 'Test user creation successful!\n\nNote: Check your email confirmation settings in Supabase.');
        
        // Clean up - sign out
        await supabase.auth.signOut();
      }
      
    } catch (error: any) {
      console.error('❌ Auth test failed:', error);
      showAlert('❌ Auth Test Failed', `Auth test failed:\n\n${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testAuthErrors = async () => {
    setTesting(true);
    try {
      console.log('🔄 Testing authentication errors...');
      
      // Test 1: Invalid login credentials
      console.log('Testing invalid login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: 'wrongpassword123',
      });
      
      if (error) {
        console.log('Login error (expected):', error.message);
        showAlert('Login Error Test', `Error caught: ${error.message}`);
      } else {
        showAlert('Unexpected', 'Login succeeded when it should have failed');
      }
      
    } catch (error: any) {
      console.error('❌ Auth error test failed:', error);
      showAlert('Test Error', `Auth error test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Supabase Connection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary, testing && styles.buttonDisabled]}
        onPress={testAuth}
        disabled={testing}
      >
        <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
          {testing ? 'Testing...' : 'Test Auth System'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.buttonTertiary, testing && styles.buttonDisabled]}
        onPress={testAuthErrors}
        disabled={testing}
      >
        <Text style={[styles.buttonText, styles.buttonTertiaryText]}>
          {testing ? 'Testing...' : 'Test Auth Errors'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        This will test if Supabase Auth and Database are properly connected.
        Check the console for detailed logs.
      </Text>
      
      <Text style={styles.warning}>
        ⚠️ Make sure to update the Supabase URL and API key in config/supabase.ts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSecondaryText: {
    color: '#10B981',
  },
  buttonTertiary: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonTertiaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
  },
  warning: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
}); 