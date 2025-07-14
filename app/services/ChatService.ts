import { supabase } from '../config/supabase';
import {
    ChatMessage,
    ChatUser,
    Conversation,
    ConversationDetails,
    ConversationListItem,
    Message
} from '../models/Chat';

class ChatService {
  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationListItem[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform to ConversationListItem
      const transformed = data.map(conv => this.transformToConversationListItem(conv, userId));
      
      return transformed;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      if (!data) return [];

      // Transform to ChatMessage
      return data.map(msg => this.transformToChatMessage(msg, userId));
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      if (!data) return null;

      return this.transformToChatMessage(data, senderId);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null)
        .select();

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation details by ID
   */
  async getConversationDetails(conversationId: string, userId: string): Promise<ConversationListItem | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation details:', error);
        throw error;
      }

      if (!data) return null;

      return this.transformToConversationListItem(data, userId);
    } catch (error) {
      console.error('Error in getConversationDetails:', error);
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToConversationMessages(
    conversationId: string, 
    userId: string,
    onNewMessage: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = this.transformToChatMessage(payload.new as Message, userId);
          onNewMessage(newMessage);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to conversation updates (for conversation list)
   */
  subscribeToUserConversations(
    userId: string,
    onConversationUpdate: (conversation: ConversationListItem) => void
  ) {
    return supabase
      .channel(`user-conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id_1=eq.${userId}`
        },
        async (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const details = await this.getConversationDetails(payload.new.id as string, userId);
            if (details) {
              onConversationUpdate(details);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id_2=eq.${userId}`
        },
        async (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const details = await this.getConversationDetails(payload.new.id as string, userId);
            if (details) {
              onConversationUpdate(details);
            }
          }
        }
      )
      .subscribe();
  }

  /**
   * Get unread message count for user (direct query to avoid view cache issues)
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      // Get user's conversation IDs
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (convError) {
        console.error('Error fetching conversations for unread count:', convError);
        return 0;
      }

      if (!conversations || conversations.length === 0) {
        return 0;
      }

      const conversationIds = conversations.map(c => c.id);

      // Count unread messages
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', userId)
        .is('read_at', null)
        .in('conversation_id', conversationIds);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadMessageCount:', error);
      return 0;
    }
  }

  /**
   * Helper: Transform ConversationDetails to ConversationListItem
   */
  private transformToConversationListItem(
    details: ConversationDetails, 
    currentUserId: string
  ): ConversationListItem {
    const isUser1 = currentUserId === details.user_id_1;
    const otherUser: ChatUser = {
      id: isUser1 ? details.user_id_2 : details.user_id_1,
      name: isUser1 
        ? `${details.user2_first_name || ''} ${details.user2_last_name || ''}`.trim() || 'Unknown'
        : `${details.user1_first_name || ''} ${details.user1_last_name || ''}`.trim() || 'Unknown',
      avatar_url: isUser1 ? details.user2_avatar_url : details.user1_avatar_url,
      role: isUser1 ? details.user2_role : details.user1_role
    };

    return {
      id: details.id,
      match_id: details.match_id,
      otherUser,
      latestMessage: details.latest_message,
      latestMessageTime: details.latest_message_time,
      unreadCount: isUser1 ? details.unread_count_user1 : details.unread_count_user2,
      isOwnMessage: details.latest_message_sender === currentUserId
    };
  }

  /**
   * Helper: Transform Message to ChatMessage
   */
  private transformToChatMessage(message: Message, currentUserId: string): ChatMessage {
    return {
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      message_type: message.message_type,
      timestamp: message.created_at,
      read_at: message.read_at,
      isOwnMessage: message.sender_id === currentUserId
    };
  }
}

export const chatService = new ChatService();
export default chatService; 