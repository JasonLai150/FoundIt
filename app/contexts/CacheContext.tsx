import React, { createContext, useContext, useEffect, useState } from 'react';
import { Developer } from '../models/Developer';
import { LikeRequest } from '../services/MatchService';
import { useAuth } from './SupabaseAuthContext';

interface CacheState {
  // Feed data
  feedProfiles: Developer[];
  feedCurrentIndex: number;
  feedHasMore: boolean;
  feedLastFetch: number | null;

  // Like requests data
  likeRequests: LikeRequest[];
  likeRequestsLastFetch: number | null;

  // Profile data cache
  userProfileData: any | null;
  userExperienceData: any | null;
  profileLastFetch: number | null;
}

interface CacheContextType {
  cache: CacheState;
  updateFeedCache: (profiles: Developer[], currentIndex: number, hasMore: boolean) => void;
  updateLikeRequestsCache: (requests: LikeRequest[]) => void;
  updateProfileCache: (profileData: any, experienceData: any) => void;
  invalidateCache: (cacheType?: 'feed' | 'likes' | 'profile' | 'all') => void;
  isCacheValid: (cacheType: 'feed' | 'likes' | 'profile', maxAgeMinutes?: number) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const CACHE_DURATION = {
  feed: 5, // 5 minutes
  likes: 2, // 2 minutes (more frequent for likes)
  profile: 10, // 10 minutes
};

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [cache, setCache] = useState<CacheState>({
    feedProfiles: [],
    feedCurrentIndex: 0,
    feedHasMore: true,
    feedLastFetch: null,
    
    likeRequests: [],
    likeRequestsLastFetch: null,
    
    userProfileData: null,
    userExperienceData: null,
    profileLastFetch: null,
  });

  // Clear cache when user changes
  useEffect(() => {
    if (user?.id) {
      // Reset cache for new user
      setCache(prev => ({
        ...prev,
        feedProfiles: [],
        feedCurrentIndex: 0,
        feedHasMore: true,
        feedLastFetch: null,
        likeRequests: [],
        likeRequestsLastFetch: null,
        userProfileData: null,
        userExperienceData: null,
        profileLastFetch: null,
      }));
    }
  }, [user?.id]);

  const updateFeedCache = (profiles: Developer[], currentIndex: number, hasMore: boolean) => {
    setCache(prev => ({
      ...prev,
      feedProfiles: profiles,
      feedCurrentIndex: currentIndex,
      feedHasMore: hasMore,
      feedLastFetch: Date.now(),
    }));
  };

  const updateLikeRequestsCache = (requests: LikeRequest[]) => {
    setCache(prev => ({
      ...prev,
      likeRequests: requests,
      likeRequestsLastFetch: Date.now(),
    }));
  };

  const updateProfileCache = (profileData: any, experienceData: any) => {
    setCache(prev => ({
      ...prev,
      userProfileData: profileData,
      userExperienceData: experienceData,
      profileLastFetch: Date.now(),
    }));
  };

  const invalidateCache = (cacheType: 'feed' | 'likes' | 'profile' | 'all' = 'all') => {
    setCache(prev => {
      const newCache = { ...prev };
      
      if (cacheType === 'feed' || cacheType === 'all') {
        newCache.feedLastFetch = null;
      }
      if (cacheType === 'likes' || cacheType === 'all') {
        newCache.likeRequestsLastFetch = null;
      }
      if (cacheType === 'profile' || cacheType === 'all') {
        newCache.profileLastFetch = null;
      }
      
      return newCache;
    });
  };

  const isCacheValid = (cacheType: 'feed' | 'likes' | 'profile', maxAgeMinutes?: number): boolean => {
    const lastFetch = cacheType === 'feed' ? cache.feedLastFetch :
                     cacheType === 'likes' ? cache.likeRequestsLastFetch :
                     cache.profileLastFetch;
    
    if (!lastFetch) return false;
    
    const maxAge = maxAgeMinutes || CACHE_DURATION[cacheType];
    const cacheAge = (Date.now() - lastFetch) / (1000 * 60); // in minutes
    
    return cacheAge < maxAge;
  };

  return (
    <CacheContext.Provider value={{
      cache,
      updateFeedCache,
      updateLikeRequestsCache,
      updateProfileCache,
      invalidateCache,
      isCacheValid,
    }}>
      {children}
    </CacheContext.Provider>
  );
}

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}; 