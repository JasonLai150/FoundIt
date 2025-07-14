// Chat Models

export interface Conversation {
  id: string;
  match_id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'initial_like';
  created_at: string;
  read_at?: string;
}

export interface ConversationDetails {
  id: string;
  match_id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  updated_at: string;
  latest_message?: string;
  latest_message_time?: string;
  latest_message_sender?: string;
  user1_first_name?: string;
  user1_last_name?: string;
  user1_avatar_url?: string;
  user1_role?: string;
  user2_first_name?: string;
  user2_last_name?: string;
  user2_avatar_url?: string;
  user2_role?: string;
  unread_count_user1: number;
  unread_count_user2: number;
}

// Helper types for UI
export interface ChatUser {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
}

export interface ConversationListItem {
  id: string;
  match_id: string;
  otherUser: ChatUser;
  latestMessage?: string;
  latestMessageTime?: string;
  unreadCount: number;
  isOwnMessage: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'initial_like';
  timestamp: string;
  read_at?: string;
  isOwnMessage: boolean;
} 