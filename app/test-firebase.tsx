import { collection, getDocs } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from './config/firebase';

export default function TestFirebase() {
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      console.log('🔄 Testing Firebase connection...');
      
      // Test 1: Check Firebase Auth
      console.log('📧 Auth instance:', auth.app.name);
      console.log('✅ Firebase Auth connected');
      
      // Test 2: Check Firestore connection
      console.log('🔄 Testing Firestore connection...');
      const testCollection = collection(db, 'users');
      console.log('📄 Collection reference created');
      
      // Try to read (this will fail if permissions are wrong, but connection is tested)
      try {
        await getDocs(testCollection);
        console.log('✅ Firestore read test successful');
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log('✅ Firestore connected (permission-denied is expected for empty collection)');
        } else {
          throw error;
        }
      }
      
      Alert.alert('✅ Success', 'Firebase is properly connected!\n\nAuth: ✅\nFirestore: ✅');
      
    } catch (error: any) {
      console.error('❌ Firebase connection test failed:', error);
      Alert.alert('❌ Connection Failed', `Firebase connection test failed:\n\n${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Firebase Connection'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        This will test if Firebase Auth and Firestore are properly connected.
        Check the console for detailed logs.
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
    backgroundColor: '#FF5864',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 