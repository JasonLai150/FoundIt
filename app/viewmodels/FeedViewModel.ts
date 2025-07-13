import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Developer } from '../models/Developer';
import { MatchmakingFilters, matchmakingService } from '../services/MatchmakingService';
import { matchService } from '../services/MatchService';

export const useFeedViewModel = () => {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasMoreProfiles, setHasMoreProfiles] = useState<boolean>(true);

  // Fetch developers from database using matchmaking service
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Need authenticated user to fetch matches
        if (!user?.id || !user?.goal) {
          setLoading(false);
          return;
        }

        // Use matchmaking service to get prioritized profiles
        const matchResult = await matchmakingService.getMatchedProfiles(
          user.id,
          user.goal,
          {}, // No additional filters for now
          50  // Fetch up to 50 profiles
        );
        
        setDevelopers(matchResult.profiles);
        setHasMoreProfiles(matchResult.hasMore);
        setCurrentIndex(0); // Reset to first profile
        
      } catch (err: any) {
        console.error('Error fetching developers:', err);
        setError('Failed to load developers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, [user?.id, user?.goal]); // Re-fetch when user data changes

  const getCurrentDeveloper = (): Developer | null => {
    if (developers.length === 0 || currentIndex >= developers.length) {
      return null;
    }
    return developers[currentIndex];
  };

  const swipeLeft = async () => {
    // Prevent rapid swipes during async operations
    if (loading) return;
    
    // Capture current state before any updates
    const currentDeveloper = developers[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Update index immediately to prevent race conditions
    if (nextIndex < developers.length) {
      setCurrentIndex(nextIndex);
    }
    
    // Record the pass action (async, but index is already updated)
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
    // Prevent rapid swipes during async operations
    if (loading) return;
    
    // Capture current state before any updates
    const currentDeveloper = developers[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Update index immediately to prevent race conditions
    if (nextIndex < developers.length) {
      setCurrentIndex(nextIndex);
    }
    
    // Save this like to the database (async, but index is already updated)
    if (user?.id && currentDeveloper?.id) {
      try {
        const success = await matchService.createMatch(user.id, currentDeveloper.id);
        if (!success) {
          console.error('Failed to record like for:', currentDeveloper.name);
        }
      } catch (error) {
        console.error('Error recording like:', error);
      }
    }
  };

  const refreshProfiles = async (filters?: MatchmakingFilters) => {
    // Allow manual refresh with optional filters
    if (!user?.id || !user?.goal) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const matchResult = await matchmakingService.getMatchedProfiles(
        user.id,
        user.goal,
        filters || {},
        50
      );
      
      setDevelopers(matchResult.profiles);
      setHasMoreProfiles(matchResult.hasMore);
      setCurrentIndex(0);
      
    } catch (err: any) {
      console.error('❌ Error refreshing profiles:', err);
      setError('Failed to refresh profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProfiles = async () => {
    if (!user?.id || !user?.goal) return;

    try {
      setLoading(true);
      
      const matchResult = await matchmakingService.getMatchedProfiles(
        user.id,
        user.goal,
        {}, // No additional filters for now
        50  // Fetch up to 50 more profiles
      );
      
      if (matchResult.profiles.length > 0) {
        setDevelopers(prevDevelopers => [...prevDevelopers, ...matchResult.profiles]);
        setHasMoreProfiles(matchResult.hasMore);
      } else {
        setHasMoreProfiles(false);
      }
      
    } catch (error) {
      console.error('Error loading more profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    developer: getCurrentDeveloper(),
    loading,
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