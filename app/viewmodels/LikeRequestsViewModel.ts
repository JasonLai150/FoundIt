import { useEffect, useState } from 'react';
import { useCache } from '../contexts/CacheContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Developer } from '../models/Developer';
import { LikeRequest, matchService } from '../services/MatchService';

export const useLikeRequestsViewModel = () => {
  const { user } = useAuth();
  const { cache, updateLikeRequestsCache, isCacheValid, invalidateCache } = useCache();
  
  const [loading, setLoading] = useState<boolean>(false); // Only for initial empty state
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false); // Background refresh

  // Use cache data immediately
  const likeRequests = cache.likeRequests;

  // Background fetch when cache is invalid or on mount
  useEffect(() => {
    if (!user?.id) return;

    const shouldRefresh = !isCacheValid('likes') || likeRequests.length === 0;
    
    if (shouldRefresh) {
      fetchLikeRequests(false); // Background refresh
    }
  }, [user?.id]);

  const fetchLikeRequests = async (showLoading = true) => {
    if (!user?.id) return;

    try {
      if (showLoading && likeRequests.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const requests = await matchService.getLikeRequests(user.id);
      updateLikeRequestsCache(requests);
    } catch (err: any) {
      console.error('Error fetching like requests:', err);
      setError('Failed to load like requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptLikeRequest = async (likerUserId: string, message?: string) => {
    if (!user?.id) return false;

    try {
      // Optimistic update - remove from cache immediately
      const updatedRequests = likeRequests.filter(request => request.user_id !== likerUserId);
      updateLikeRequestsCache(updatedRequests);

      const success = await matchService.acceptLikeRequest(user.id, likerUserId, message);
      
      if (!success) {
        // Rollback on failure
        updateLikeRequestsCache(likeRequests);
      } else {
        // Invalidate feed cache since there's a new match
        invalidateCache('feed');
      }
      
      return success;
    } catch (error) {
      console.error('Error accepting like request:', error);
      // Rollback on error
      updateLikeRequestsCache(likeRequests);
      return false;
    }
  };

  const ignoreLikeRequest = async (likerUserId: string) => {
    if (!user?.id) return false;

    try {
      // Optimistic update - remove from cache immediately
      const updatedRequests = likeRequests.filter(request => request.user_id !== likerUserId);
      updateLikeRequestsCache(updatedRequests);

      const success = await matchService.ignoreLikeRequest(user.id, likerUserId);
      
      if (!success) {
        // Rollback on failure
        updateLikeRequestsCache(likeRequests);
      }
      
      return success;
    } catch (error) {
      console.error('Error ignoring like request:', error);
      // Rollback on error
      updateLikeRequestsCache(likeRequests);
      return false;
    }
  };

  // Convert LikeRequest to Developer format for ProfileModal
  const convertToDeveloper = (likeRequest: LikeRequest): Developer | null => {
    if (!likeRequest.profile) return null;

    const profile = likeRequest.profile;
    return {
      id: likeRequest.user_id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
      bio: profile.bio || 'No bio available',
      role: profile.role || 'Developer',
      skills: [], // Will be populated if needed
      avatarUrl: profile.avatar_url,
      location: profile.location,
      github: profile.github,
      linkedin: profile.linkedin,
      website: profile.website,
      looking: false, // Not relevant for like requests
    };
  };

  const refreshRequests = async () => {
    invalidateCache('likes');
    await fetchLikeRequests(true);
  };

  return {
    likeRequests,
    loading: loading && likeRequests.length === 0, // Only show loading for initial empty state
    refreshing,
    error,
    acceptLikeRequest,
    ignoreLikeRequest,
    refreshRequests,
    convertToDeveloper,
  };
}; 