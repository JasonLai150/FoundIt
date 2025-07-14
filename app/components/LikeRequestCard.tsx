import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LikeRequest } from '../services/MatchService';
import MessageBubble from './MessageBubble';

interface LikeRequestCardProps {
  likeRequest: LikeRequest;
  onAccept: (likerUserId: string) => Promise<boolean>;
  onIgnore: (likerUserId: string) => Promise<boolean>;
  onPress: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isLandscape = screenWidth > screenHeight;

export default function LikeRequestCard({ 
  likeRequest, 
  onAccept, 
  onIgnore, 
  onPress 
}: LikeRequestCardProps) {
  const profile = likeRequest.profile;
  const hasMessage = !!likeRequest.message;
  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : 'Unknown User';

  const handleAccept = async () => {
    await onAccept(likeRequest.user_id);
  };

  const handleIgnore = async () => {
    await onIgnore(likeRequest.user_id);
  };

  return (
    <View style={[
      styles.container, 
      isLandscape && styles.containerLandscape
    ]}>
      <TouchableOpacity 
        style={[styles.cardContent, hasMessage && styles.cardContentWithMessage]} 
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
      >
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
          <Text style={styles.role} numberOfLines={1} ellipsizeMode="tail">
            {profile?.role || 'Developer'}
          </Text>
          {profile?.location && (
            <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
              {profile.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      {hasMessage ? (
        <View style={styles.messageSection}>
          <MessageBubble message={likeRequest.message!} isPreview />
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.ignoreButton]} 
            onPress={handleIgnore}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#ff6b6b" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]} 
            onPress={handleAccept}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={24} color="#51cf66" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
    minHeight: 100, // Ensure consistent card height
  },
  containerLandscape: {
    width: '60%',
    alignSelf: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 100,
  },
  cardContentWithMessage: {
    flex: 0.5, // Take up exactly 50% when message is present
    paddingRight: 8, // Reduce right padding when sharing space with message
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#999',
    marginBottom: 0,
  },
  messageSection: {
    flex: 0.5, // Take up exactly 50% when message is present
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
    paddingLeft: 8,
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingRight: 16,
    gap: 8,
    alignItems: 'center',
    // No flex specified - takes only the space it needs
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ignoreButton: {
    backgroundColor: '#ffe0e0',
  },
  acceptButton: {
    backgroundColor: '#e0f7e0',
  },
}); 