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
          console.log('⏳ Waiting for user data to load...');
          setLoading(false);
          return;
        }

        console.log('🔄 Fetching matched profiles for user:', user.id, 'goal:', user.goal);

        // Use matchmaking service to get prioritized profiles
        const matchResult = await matchmakingService.getMatchedProfiles(
          user.id,
          user.goal,
          {}, // No additional filters for now
          50  // Fetch up to 50 profiles
        );

        console.log('✅ Fetched', matchResult.profiles.length, 'matched profiles');
        
        setDevelopers(matchResult.profiles);
        setHasMoreProfiles(matchResult.hasMore);
        setCurrentIndex(0); // Reset to first profile
        
      } catch (err: any) {
        console.error('❌ Error fetching developers:', err);
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
    
    console.log(`👎 Passed on: ${currentDeveloper?.name} (index: ${currentIndex})`);
    
    // Update index immediately to prevent race conditions
    if (nextIndex < developers.length) {
      setCurrentIndex(nextIndex);
    } else {
      console.log('📭 No more profiles to show');
    }
    
    // Record the pass action (async, but index is already updated)
    if (user?.id && currentDeveloper?.id) {
      try {
        const success = await matchService.recordPass(user.id, currentDeveloper.id);
        if (success) {
          console.log('✅ Pass recorded successfully for:', currentDeveloper.name);
        } else {
          console.log('⚠️ Failed to record pass for:', currentDeveloper.name);
        }
      } catch (error) {
        console.error('❌ Error recording pass:', error);
      }
    }
  };

  const swipeRight = async () => {
    // Prevent rapid swipes during async operations
    if (loading) return;
    
    // Capture current state before any updates
    const currentDeveloper = developers[currentIndex];
    const nextIndex = currentIndex + 1;
    
    console.log(`❤️ Liked developer: ${currentDeveloper?.name} (index: ${currentIndex})`);
    
    // Update index immediately to prevent race conditions
    if (nextIndex < developers.length) {
      setCurrentIndex(nextIndex);
    } else {
      console.log('📭 No more profiles to show');
    }
    
    // Save this like to the database (async, but index is already updated)
    if (user?.id && currentDeveloper?.id) {
      try {
        const success = await matchService.createMatch(user.id, currentDeveloper.id);
        if (success) {
          console.log('✅ Like recorded successfully for:', currentDeveloper.name);
        } else {
          console.log('⚠️ Failed to record like for:', currentDeveloper.name);
        }
      } catch (error) {
        console.error('❌ Error recording like:', error);
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
    // Load additional profiles (for future pagination)
    if (!hasMoreProfiles || !user?.id || !user?.goal) return;
    
    try {
      // TODO: Implement pagination logic
      // This would involve tracking offset/cursor and appending new profiles
      console.log('🔄 Loading more profiles...');
      
    } catch (err: any) {
      console.error('❌ Error loading more profiles:', err);
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