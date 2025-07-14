import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CacheProvider } from './contexts/CacheContext';
import { AuthProvider } from './contexts/SupabaseAuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CacheProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </CacheProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
