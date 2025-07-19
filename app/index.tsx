import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useAuth } from './contexts/SupabaseAuthContext';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [authCheckTimeout, setAuthCheckTimeout] = useState<number | null>(null);

  useEffect(() => {
    // Don't navigate if still loading
    if (isLoading) {
      return;
    }
    
    // Don't navigate if already navigated
    if (hasNavigated) {
      return;
    }
    
    // If not authenticated, go to auth
    if (!isAuthenticated) {
      router.replace('/auth');
      setHasNavigated(true);
      return;
    }
    
    // Wait for user data to be fully loaded, but with a timeout
    if (!user) {
      // Set a timeout to prevent infinite waiting
      if (!authCheckTimeout) {
        const timeout = setTimeout(() => {
          console.log('Timeout waiting for user data, redirecting to auth');
          router.replace('/auth');
          setHasNavigated(true);
        }, 5000); // 5 second timeout
        
        setAuthCheckTimeout(timeout);
      }
      return;
    }
    
    // Clear timeout if user data loaded
    if (authCheckTimeout) {
      clearTimeout(authCheckTimeout);
      setAuthCheckTimeout(null);
    }
    
    // Navigate based on profile completion
    if (user.profile_complete) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/profile-setup/personal');
    }
    
    setHasNavigated(true);
  }, [isAuthenticated, user, isLoading, hasNavigated, router, authCheckTimeout]);

  // Reset navigation state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasNavigated(false);
      
      // Clear any pending timeout
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
        setAuthCheckTimeout(null);
      }
    }
  }, [isAuthenticated, authCheckTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, [authCheckTimeout]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color="#FF5864" />
      <Text style={styles.text}>Loading...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
