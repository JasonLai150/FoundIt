import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './contexts/SupabaseAuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, navigationTrigger } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('🔄 Index routing check:', {
      isLoading,
      isAuthenticated,
      hasNavigated,
      navigationTrigger
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
          // Reset after a delay to try again
          setTimeout(() => setHasNavigated(false), 1000);
        }
      } else {
        console.log('🔄 User not authenticated, navigating to auth...');
        try {
          router.replace('/auth');
          setHasNavigated(true);
          console.log('✅ Navigation to auth initiated');
        } catch (error) {
          console.error('❌ Navigation to auth failed:', error);
          // Reset after a delay to try again
          setTimeout(() => setHasNavigated(false), 1000);
        }
      }
    } else {
      console.log('ℹ️ Skipping navigation:', {
        isLoading: isLoading ? 'still loading' : 'loaded',
        hasNavigated: hasNavigated ? 'already navigated' : 'not navigated yet'
      });
    }
  }, [isAuthenticated, isLoading, navigationTrigger, router, hasNavigated]);

  // Reset navigation state when auth state changes OR when navigationTrigger changes
  useEffect(() => {
    console.log('🔄 Auth state or navigation trigger changed, resetting navigation flag');
    setHasNavigated(false);
  }, [isAuthenticated, navigationTrigger]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF5864" />
      <Text style={styles.loadingText}>
        {isLoading ? 'Loading...' : isAuthenticated ? 'Redirecting to app...' : 'Redirecting to login...'}
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
