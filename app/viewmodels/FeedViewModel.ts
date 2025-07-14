import { useEffect, useState } from 'react';
import { useCache } from '../contexts/CacheContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Developer } from '../models/Developer';
import { MatchmakingFilters, matchmakingService } from '../services/MatchmakingService';
import { matchService } from '../services/MatchService';

export const useFeedViewModel = () => {
  const { user } = useAuth();
  const { cache, updateFeedCache, isCacheValid, invalidateCache } = useCache();
  
  const [loading, setLoading] = useState<boolean>(false); // Only for errors or initial empty state
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false); // Background refresh

  // Use cache data immediately
  const developers = cache.feedProfiles;
  const currentIndex = cache.feedCurrentIndex;
  const hasMoreProfiles = cache.feedHasMore;

  // Background fetch data when cache is invalid or on mount
  useEffect(() => {
    if (!user?.id || !user?.goal) return;

    const shouldRefresh = !isCacheValid('feed') || developers.length === 0;
    
    if (shouldRefresh) {
      fetchDevelopers(false); // Background refresh
    }
  }, [user?.id, user?.goal]);

  const fetchDevelopers = async (showLoading = true, filters?: MatchmakingFilters) => {
    try {
      if (showLoading && developers.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      if (!user?.id || !user?.goal) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const matchResult = await matchmakingService.getMatchedProfiles(
        user.id,
        user.goal,
        filters || {},
        50
      );
      
      updateFeedCache(matchResult.profiles, 0, matchResult.hasMore);
      
    } catch (err: any) {
      console.error('Error fetching developers:', err);
      setError('Failed to load developers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentDeveloper = (): Developer | null => {
    if (developers.length === 0 || currentIndex >= developers.length) {
      return null;
    }
    return developers[currentIndex];
  };

  const swipeLeft = async () => {
    if (refreshing) return;
    
    const currentDeveloper = developers[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Update cache immediately for responsive UI
    updateFeedCache(developers, nextIndex, hasMoreProfiles);
    
    if (user?.id && currentDeveloper?.id) {
      try {
        const success = await matchService.recordPass(user.id, currentDeveloper.id);
        if (!success) {
          console.error('Failed to record pass for:', currentDeveloper.name);
        }
      } catch (error) {
        console.error('Error recording pass:', error);
      }
    }
  };

  const swipeRight = async () => {
    if (refreshing) return;
    
    const currentDeveloper = developers[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Update cache immediately for responsive UI
    updateFeedCache(developers, nextIndex, hasMoreProfiles);
    
    if (user?.id && currentDeveloper?.id) {
      try {
        const success = await matchService.createMatch(user.id, currentDeveloper.id);
        if (!success) {
          console.error('Failed to record like for:', currentDeveloper.name);
        }
        // Invalidate likes cache since there might be a new match
        invalidateCache('likes');
      } catch (error) {
        console.error('Error recording like:', error);
      }
    }
  };

  const refreshProfiles = async (filters?: MatchmakingFilters) => {
    if (!user?.id || !user?.goal) return;
    
    // Force refresh with new filters
    invalidateCache('feed');
    await fetchDevelopers(true, filters);
  };

  const loadMoreProfiles = async () => {
    if (!user?.id || !user?.goal || refreshing) return;

    try {
      setRefreshing(true);
      
      const matchResult = await matchmakingService.getMatchedProfiles(
        user.id,
        user.goal,
        {},
        50
      );
      
      if (matchResult.profiles.length > 0) {
        const newProfiles = [...developers, ...matchResult.profiles];
        updateFeedCache(newProfiles, currentIndex, matchResult.hasMore);
      } else {
        updateFeedCache(developers, currentIndex, false);
      }
      
    } catch (error) {
      console.error('Error loading more profiles:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    developer: getCurrentDeveloper(),
    loading: loading && developers.length === 0, // Only show loading for initial empty state
    refreshing,
    error,
    swipeLeft,
    swipeRight,
    refreshProfiles,
    loadMoreProfiles,
    noMoreDevelopers: currentIndex >= developers.length,
    hasMoreProfiles,
    totalProfiles: developers.length,
    currentIndex: currentIndex + 1, // 1-based for UI display
  };
}; 