import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, shouldAutoLogin, logoutTriggered } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Reset navigation state when auth state changes OR logout is triggered
  useEffect(() => {
    setHasNavigated(false);
  }, [isAuthenticated, logoutTriggered]);

  useEffect(() => {
    console.log('🔄 Index routing check:', {
      isLoading,
      isAuthenticated,
      shouldAutoLogin,
      hasNavigated,
      logoutTriggered
    });

    if (!isLoading && !hasNavigated) {
      if (isAuthenticated) {
        console.log('🔄 User is authenticated, navigating to feed...');
        router.replace('/(tabs)/feed');
        setHasNavigated(true);
      } else {
        console.log('🔄 User not authenticated, navigating to auth...');
        router.replace('/auth' as any);
        setHasNavigated(true);
      }
    }
  }, [isAuthenticated, isLoading, shouldAutoLogin, router, hasNavigated, logoutTriggered]);

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
