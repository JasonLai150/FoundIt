import { useEffect, useState } from 'react';
import { useConversationListRefresh, useConversationListViewModel } from '../contexts/ConversationListContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { ChatMessage, ConversationListItem } from '../models/Chat';
import { chatService } from '../services/ChatService';

// Hook for managing individual chat
export const useChatViewModel = (conversationId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationDetails, setConversationDetails] = useState<ConversationListItem | null>(null);
  
  // Get refresh function from context
  const refreshConversationList = useConversationListRefresh();

  // Fetch messages and conversation details
  const fetchMessages = async () => {
    if (!user?.id || !conversationId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [messagesData, detailsData] = await Promise.all([
        chatService.getConversationMessages(conversationId, user.id),
        chatService.getConversationDetails(conversationId, user.id)
      ]);

      setMessages(messagesData);
      setConversationDetails(detailsData);

      // Mark messages as read and refresh conversation list
      await chatService.markMessagesAsRead(conversationId, user.id);
      
      // Small delay to ensure database update is committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh conversation list to update unread counts
      refreshConversationList();
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user?.id || !conversationId || !content.trim()) return;

    try {
      setSending(true);
      setError(null);

      const newMessage = await chatService.sendMessage(conversationId, user.id, content.trim());
      
      if (newMessage) {
        // Message will be added via real-time subscription
        // But we can add it optimistically for immediate UI feedback
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [user?.id, conversationId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id || !conversationId) return;

    const subscription = chatService.subscribeToConversationMessages(
      conversationId,
      user.id,
      (newMessage) => {
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });

        // Mark as read if it's not from current user and refresh conversation list
        if (newMessage.sender_id !== user.id) {
          chatService.markMessagesAsRead(conversationId, user.id).then(async () => {
            // Small delay to ensure database update is committed
            await new Promise(resolve => setTimeout(resolve, 200));
            
            refreshConversationList();
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, conversationId]);

  // Mark messages as read when component mounts or becomes active
  useEffect(() => {
    if (!user?.id || !conversationId) return;

    const markAsRead = async () => {
      try {
        await chatService.markMessagesAsRead(conversationId, user.id);
        
        // Small delay to ensure database update is committed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Refresh conversation list to update unread counts
        refreshConversationList();
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };

    markAsRead();
  }, [user?.id, conversationId]);

  return {
    messages,
    loading,
    sending,
    error,
    conversationDetails,
    sendMessage,
    refetch: fetchMessages
  };
};

// Hook for getting unread message count (derived from conversation list)
export const useUnreadMessageCount = () => {
  const { conversations } = useConversationListViewModel();
  
  // Simply sum up unread counts from conversation list
  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  
  return { unreadCount, refetch: () => {} }; // No separate refetch needed
}; 