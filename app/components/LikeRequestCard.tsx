import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LikeRequest } from '../services/MatchService';

interface LikeRequestCardProps {
  likeRequest: LikeRequest;
  onAccept: (likerUserId: string) => Promise<boolean>;
  onIgnore: (likerUserId: string) => Promise<boolean>;
  onPress: () => void;
}

export default function LikeRequestCard({ 
  likeRequest, 
  onAccept, 
  onIgnore, 
  onPress 
}: LikeRequestCardProps) {
  const profile = likeRequest.profile;
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.cardContent} onPress={onPress}>
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
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.role}>{profile?.role || 'Developer'}</Text>
          {profile?.location && (
            <Text style={styles.location}>{profile.location}</Text>
          )}
          {profile?.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {profile.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.ignoreButton]} 
          onPress={handleIgnore}
        >
          <Ionicons name="close" size={24} color="#ff6b6b" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]} 
          onPress={handleAccept}
        >
          <Ionicons name="heart" size={24} color="#51cf66" />
        </TouchableOpacity>
      </View>
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
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingRight: 16,
    gap: 8,
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