import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ConversationListItem } from '../models/Chat';
import { chatService } from '../services/ChatService';
import { useAuth } from './SupabaseAuthContext';

// Context interface
interface ConversationListContextType {
  conversations: ConversationListItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshConversations: () => Promise<void>;
  refetch: () => Promise<void>;
}

const ConversationListContext = createContext<ConversationListContextType | undefined>(undefined);

// Provider component
export const ConversationListProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = async (showLoading = true) => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const data = await chatService.getUserConversations(user.id);
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh conversations (pull to refresh)
  const refreshConversations = async () => {
    setRefreshing(true);
    await fetchConversations(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [user?.id]);

  // Subscribe to conversation updates (only once per provider)
  useEffect(() => {
    if (!user?.id) return;

    const subscription = chatService.subscribeToUserConversations(
      user.id,
      (updatedConversation) => {
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.id === updatedConversation.id);
          if (existingIndex !== -1) {
            // Update existing conversation
            const updated = [...prev];
            updated[existingIndex] = updatedConversation;
            // Sort by updated_at (latest first)
            return updated.sort((a, b) => 
              new Date(b.latestMessageTime || b.id).getTime() - 
              new Date(a.latestMessageTime || a.id).getTime()
            );
          } else {
            // Add new conversation
            return [updatedConversation, ...prev];
          }
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return (
    <ConversationListContext.Provider value={{
      conversations,
      loading,
      refreshing,
      error,
      refreshConversations,
      refetch: fetchConversations
    }}>
      {children}
    </ConversationListContext.Provider>
  );
};

// Hook to use the shared conversation list data
export const useConversationListViewModel = () => {
  const context = useContext(ConversationListContext);
  if (context === undefined) {
    throw new Error('useConversationListViewModel must be used within a ConversationListProvider');
  }
  return context;
};

// Hook to get just the refresh function for other components
export const useConversationListRefresh = () => {
  const context = useContext(ConversationListContext);
  if (context === undefined) {
    throw new Error('useConversationListRefresh must be used within a ConversationListProvider');
  }
  return context.refetch;
};
