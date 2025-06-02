import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from './contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, shouldAutoLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Index routing check:', {
      isLoading,
      isAuthenticated,
      shouldAutoLogin
    });

    if (!isLoading) {
      if (isAuthenticated && shouldAutoLogin) {
        console.log('🔄 Navigating to feed...');
        router.replace('/(tabs)/feed');
      } else {
        console.log('🔄 Navigating to auth...');
        router.replace('/auth' as any);
      }
    }
  }, [isAuthenticated, isLoading, shouldAutoLogin, router]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF5864" />
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
});
