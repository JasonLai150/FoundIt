import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CacheProvider } from './contexts/CacheContext';
import { ConversationListProvider } from './contexts/ConversationListContext';
import { AuthProvider } from './contexts/SupabaseAuthContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CacheProvider>
          <ConversationListProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </ConversationListProvider>
        </CacheProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
