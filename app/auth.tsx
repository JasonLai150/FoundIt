import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from './contexts/AuthContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleAuthentication = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !formData.name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (isSignUp) {
        console.log('🔄 Attempting registration...');
        success = await register(formData.name, formData.email, formData.password, stayLoggedIn);
        if (!success) {
          // The AuthContext will now return specific error messages
          // No need for a generic alert here
        } else {
          Alert.alert('Success', 'Account created successfully!');
        }
      } else {
        console.log('🔄 Attempting login...');
        success = await login(formData.email, formData.password, stayLoggedIn);
        if (!success) {
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: '', email: '', password: '' });
  };

  const toggleStayLoggedIn = () => {
    setStayLoggedIn(!stayLoggedIn);
  };

  const goToFirebaseTest = () => {
    router.push('/test-firebase' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FoundIt</Text>
        <Text style={styles.subtitle}>Connect with talented developers</Text>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={toggleStayLoggedIn}
          >
            <View style={[styles.checkbox, stayLoggedIn && styles.checkboxChecked]}>
              {stayLoggedIn && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Stay logged in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuthentication}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Log In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={toggleAuthMode}
            disabled={isLoading}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Already have an account? Log In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.debugButton}
            onPress={goToFirebaseTest}
          >
            <Text style={styles.debugText}>🔧 Test Firebase Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF5864',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#FF5864',
    borderColor: '#FF5864',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#FF5864',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#FF5864',
    fontSize: 14,
  },
  debugButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  debugText: {
    color: '#999',
    fontSize: 12,
  },
}); 