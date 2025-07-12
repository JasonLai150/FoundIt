import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './contexts/SupabaseAuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Don't navigate if still loading
    if (isLoading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

    // Don't navigate if already navigated
    if (hasNavigated) {
      console.log('✅ Already navigated');
      return;
    }

    console.log('🔄 Navigation check:', {
      isAuthenticated,
      user: user ? { id: user.id, profile_complete: user.profile_complete } : null
    });

    // Case 1: Not authenticated -> Go to auth
    if (!isAuthenticated) {
      console.log('🔄 Not authenticated -> Auth page');
      router.replace('/auth');
      setHasNavigated(true);
      return;
    }

    // Case 2: Authenticated but no user data -> Wait (loading state)
    if (!user) {
      console.log('⏳ Authenticated but no user data, waiting...');
      return;
    }

    // Case 3: Authenticated with user data
    if (user.profile_complete === true) {
      console.log('🔄 Profile complete -> Feed');
      router.replace('/(tabs)/feed');
    } else {
      console.log('🔄 Profile incomplete -> Setup');
      router.replace('/profile-setup/personal');
    }
    
    setHasNavigated(true);

  }, [isAuthenticated, isLoading, user, hasNavigated, router]);

  // Reset navigation state when user logs out
  useEffect(() => {
    if (!isAuthenticated && hasNavigated) {
      console.log('🔄 User logged out, resetting navigation');
      setHasNavigated(false);
    }
  }, [isAuthenticated, hasNavigated]);

  // Show appropriate loading message
  let loadingMessage = 'Loading...';
  if (!isLoading) {
    if (!isAuthenticated) {
      loadingMessage = 'Redirecting to login...';
    } else if (!user) {
      loadingMessage = 'Loading profile...';
    } else {
      loadingMessage = user.profile_complete ? 'Redirecting to feed...' : 'Redirecting to setup...';
    }
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF5864" />
      <Text style={styles.loadingText}>{loadingMessage}</Text>
    </View>
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
});
