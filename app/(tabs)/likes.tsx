import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { matchService, UserLike } from '../services/MatchService';

const { height: screenHeight } = Dimensions.get('window');

interface LikeWithProfile extends UserLike {
  profile?: {
    first_name?: string;
    last_name?: string;
    role?: string;
    location?: string;
    avatar_url?: string;
  };
}

export default function LikesScreen() {
  const { user } = useAuth();
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLikes();
  }, [user?.id]);

  const fetchLikes = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get all likes for this user
      const userLikes = await matchService.getUserLikes(user.id);
      
      // Get profile details for each liked user
      const likesWithProfiles = await Promise.all(
        userLikes.map(async (like) => {
          try {
            // Get profile details from profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name, role, location, avatar_url')
              .eq('id', like.target_user_id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              return like;
            }
            
            return {
              ...like,
              profile
            };
          } catch (error) {
            console.error('Error fetching profile for like:', error);
            return like;
          }
        })
      );

      setLikes(likesWithProfiles);
    } catch (error) {
      console.error('Error fetching likes:', error);
      setError('Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const renderLikeItem = ({ item }: { item: LikeWithProfile }) => {
    const profile = item.profile;
    const displayName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : 'Unknown User';
    
    return (
      <TouchableOpacity style={styles.likeItem}>
        <View style={styles.likeAvatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.likeAvatar} />
          ) : (
            <View style={styles.likeAvatarPlaceholder}>
              <Ionicons name="person" size={30} color="#ccc" />
            </View>
          )}
          {item.is_mutual && (
            <View style={styles.mutualBadge}>
              <Ionicons name="heart" size={16} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.likeInfo}>
          <Text style={styles.likeName}>
            {displayName}
          </Text>
          <Text style={styles.likeRole}>
            {profile?.role || 'Developer'}
          </Text>
          {profile?.location && (
            <Text style={styles.likeLocation}>
              {profile.location}
            </Text>
          )}
        </View>
        
        <View style={styles.likeStatus}>
          {item.is_mutual ? (
            <View style={styles.mutualIndicator}>
              <Ionicons name="heart" size={20} color="#FF5864" />
              <Text style={styles.mutualText}>Match!</Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Pending</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Likes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5864" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Likes</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Separate mutual matches from pending likes
  const mutualMatches = likes.filter(like => like.is_mutual);
  const pendingLikes = likes.filter(like => !like.is_mutual);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Likes</Text>
        <Text style={styles.headerSubtitle}>
          {mutualMatches.length} matches • {pendingLikes.length} pending
        </Text>
      </View>
      
      {likes.length === 0 ? (
        <View style={styles.content}>
          <Text style={styles.emptyText}>
            People you like will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(item) => `${item.user_id}-${item.target_user_id}`}
          renderItem={renderLikeItem}
          contentContainerStyle={styles.listContainer}
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
    paddingHorizontal: 24,
    paddingTop: screenHeight < 700 ? 4 : 8,
    paddingBottom: screenHeight < 700 ? 8 : 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4d',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  likeAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  likeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutualBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5864',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeInfo: {
    flex: 1,
  },
  likeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  likeRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  likeLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  likeStatus: {
    alignItems: 'center',
  },
  mutualIndicator: {
    alignItems: 'center',
  },
  mutualText: {
    fontSize: 12,
    color: '#FF5864',
    fontWeight: '600',
    marginTop: 2,
  },
  pendingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
}); 