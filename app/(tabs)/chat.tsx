import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useConversationListViewModel } from '../contexts/ConversationListContext';
import { ConversationListItem } from '../models/Chat';

const { height: screenHeight } = Dimensions.get('window');

export default function ChatScreen() {
  const router = useRouter();
  const { conversations, loading, refreshing, error, refreshConversations } = useConversationListViewModel();

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    const days = diff / (1000 * 60 * 60 * 24);

    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else if (days < 7) {
      return `${Math.floor(days)}d ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }: { item: ConversationListItem }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.avatar_url ? (
          <Image source={{ uri: item.otherUser.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.otherUser.name}
          </Text>
          <Text style={styles.timeText}>
            {formatMessageTime(item.latestMessageTime)}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          <Text 
            style={[
              styles.messageText,
              item.unreadCount > 0 && !item.isOwnMessage && styles.unreadMessageText
            ]} 
            numberOfLines={1}
          >
            {item.isOwnMessage ? 'You: ' : ''}
            {item.latestMessage || 'Start a conversation...'}
          </Text>
          {item.otherUser.role && (
            <Text style={styles.roleText} numberOfLines={1}>
              {item.otherUser.role}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Your conversations with matched developers will appear here
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF5864" />
      </View>
      <Text style={styles.errorTitle}>Unable to load conversations</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={refreshConversations}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5864" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {conversations.length > 0 && (
          <TouchableOpacity onPress={refreshConversations} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#FF5864" />
          </TouchableOpacity>
        )}
      </View>

      {error && conversations.length === 0 ? (
        renderErrorState()
      ) : conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.conversationList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshConversations}
              colors={['#FF5864']}
              tintColor="#FF5864"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: screenHeight < 700 ? 4 : 8,
    paddingBottom: screenHeight < 700 ? 8 : 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5864',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  unreadMessageText: {
    color: '#000',
    fontWeight: '500',
  },
  roleText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF5864',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 