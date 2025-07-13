import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useAuth } from './contexts/SupabaseAuthContext';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    if (hasNavigated) return;
    
    if (!isAuthenticated) {
      router.replace('/auth');
      setHasNavigated(true);
      return;
    }
    
    // Wait for user data to load
    if (!user) return;
    
    // Navigate based on profile completion
    if (user.profile_complete) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/profile-setup/personal');
    }
    
    setHasNavigated(true);
  }, [isAuthenticated, user, isLoading, hasNavigated, router]);

  // Reset navigation state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasNavigated(false);
    }
  }, [isAuthenticated]);

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
