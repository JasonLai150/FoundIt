import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, logoutTriggered, navigationTrigger } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [lastLogoutTriggered, setLastLogoutTriggered] = useState(0);

  // Reset navigation state when auth state changes OR logout is triggered
  useEffect(() => {
    setHasNavigated(false);
  }, [isAuthenticated, logoutTriggered]);

  // Force navigation when logout is detected
  useEffect(() => {
    if (logoutTriggered > lastLogoutTriggered) {
      console.log('🚨 Logout detected! Force navigating to auth...');
      setLastLogoutTriggered(logoutTriggered);
      setHasNavigated(false);
      
      // Immediate navigation to auth screen
      router.replace('/auth' as any);
    }
  }, [logoutTriggered, lastLogoutTriggered, router]);

  useEffect(() => {
    console.log('🔄 Index routing check:', {
      isLoading,
      isAuthenticated,
      hasNavigated,
      logoutTriggered
    });

    if (!isLoading && !hasNavigated) {
      if (isAuthenticated) {
        console.log('🔄 User is authenticated, navigating to feed...');
        try {
          router.replace('/(tabs)/feed');
          setHasNavigated(true);
          console.log('✅ Navigation to feed initiated');
        } catch (error) {
          console.error('❌ Navigation to feed failed:', error);
          setHasNavigated(false); // Reset if navigation fails
        }
      } else {
        console.log('🔄 User not authenticated, navigating to auth...');
        try {
          router.replace('/auth' as any);
          setHasNavigated(true);
          console.log('✅ Navigation to auth initiated');
        } catch (error) {
          console.error('❌ Navigation to auth failed:', error);
          setHasNavigated(false); // Reset if navigation fails
        }
      }
    } else {
      console.log('ℹ️ Skipping navigation:', {
        isLoading: isLoading ? 'still loading' : 'loaded',
        hasNavigated: hasNavigated ? 'already navigated' : 'not navigated yet'
      });
    }
  }, [isAuthenticated, isLoading, router, hasNavigated, logoutTriggered]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF5864" />
      <Text style={styles.loadingText}>
        {isLoading ? 'Loading...' : 'Redirecting...'}
      </Text>
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
