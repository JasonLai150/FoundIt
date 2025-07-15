import React, { createContext, useContext, useEffect, useState } from 'react';
import { Developer, Skill } from '../models/Developer';
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
  userProfile: Developer | null;
  profileLastFetch: number | null;
}

interface CacheContextType {
  cache: CacheState;
  updateFeedCache: (profiles: Developer[], currentIndex: number, hasMore: boolean) => void;
  updateLikeRequestsCache: (requests: LikeRequest[]) => void;
  updateProfileCache: (userData: any, experienceData: any) => void;
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
    
    userProfile: null,
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
        userProfile: null,
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

  const updateProfileCache = (userData: any, experienceData: any) => {
    if (!userData) {
      setCache(prev => ({
        ...prev,
        userProfile: null,
        profileLastFetch: Date.now(),
      }));
      return;
    }

    // Transform skills from experience data
    const skills: Skill[] = experienceData?.skills ? 
      experienceData.skills.map((skillName: string, index: number) => ({
        id: `${userData.id}_${index}`,
        name: skillName,
        level: 'Intermediate' as const
      })) : [];

    // Get education info (legacy fallback)
    const education = experienceData?.education?.[0];
    const educationString = education ? 
      `${education.degree || ''} ${education.major || ''}, ${education.school_name || ''}`.trim() : 
      undefined;

    // Get work experience info (legacy fallback)
    const workExperience = experienceData?.work_experience?.[0];
    const company = workExperience?.company;
    const position = workExperience?.position;
    
    const userProfile: Developer = {
      id: userData.id,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Your Name',
      bio: userData.bio || '',
      role: userData.role || 'Developer',
      skills,
      avatarUrl: userData.avatar_url || '',
      location: userData.location || '',
      company,
      position,
      education: educationString,
      // Rich structured data
      educationEntries: experienceData?.education || [],
      workExperiences: experienceData?.work_experience || [],
      graduation_date: experienceData?.graduation_date || undefined,
      experience_id: experienceData?.id || undefined,
      github: userData.github || '',
      linkedin: userData.linkedin || '',
      website: userData.website || '',
      looking: userData.goal === 'searching',
      experience: calculateExperienceYears(experienceData?.work_experience || []),
    };

    setCache(prev => ({
      ...prev,
      userProfile,
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

  // Helper function to calculate years of experience
  const calculateExperienceYears = (workExperiences: any[]): number => {
    if (!workExperiences || workExperiences.length === 0) return 0;
    
    let totalMonths = 0;
    const currentDate = new Date();
    
    workExperiences.forEach(exp => {
      if (!exp.startDate) return;
      
      const startDate = new Date(exp.startDate + '-01'); // Add day for valid date
      const endDate = exp.current ? currentDate : 
        exp.endDate ? new Date(exp.endDate + '-01') : currentDate;
      
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
        (endDate.getMonth() - startDate.getMonth());
      
      totalMonths += Math.max(0, monthsDiff);
    });
    
    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
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