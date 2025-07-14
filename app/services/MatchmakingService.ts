import { supabase } from '../config/supabase';
import { Developer, Skill } from '../models/Developer';

export interface MatchmakingFilters {
  skills?: string[];
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  lookingForWork?: boolean;
}

export interface MatchmakingResult {
  profiles: Developer[];
  hasMore: boolean;
  totalCount: number;
}

class MatchmakingService {
  /**
   * Get matched profiles for a user based on their goal and preferences
   */
  async getMatchedProfiles(
    currentUserId: string,
    userGoal: 'recruiting' | 'searching' | 'investing' | 'other',
    filters?: MatchmakingFilters,
    limit: number = 50
  ): Promise<MatchmakingResult> {
    try {
      // Get prioritized goals based on user's goal
      const prioritizedGoals = this.getPrioritizedGoals(userGoal);
      
      // Fetch profiles in priority order
      const allProfiles: Developer[] = [];
      
      // First: Get high-priority matches
      if (prioritizedGoals.high.length > 0) {
        const highPriorityProfiles = await this.fetchProfilesByGoals(
          currentUserId,
          prioritizedGoals.high,
          filters,
          limit
        );
        allProfiles.push(...highPriorityProfiles);
      }
      
      // Second: Get medium-priority matches if we need more
      if (allProfiles.length < limit && prioritizedGoals.medium.length > 0) {
        const remainingLimit = limit - allProfiles.length;
        const mediumPriorityProfiles = await this.fetchProfilesByGoals(
          currentUserId,
          prioritizedGoals.medium,
          filters,
          remainingLimit
        );
        allProfiles.push(...mediumPriorityProfiles);
      }
      
      // Third: Get low-priority matches if we still need more
      if (allProfiles.length < limit && prioritizedGoals.low.length > 0) {
        const remainingLimit = limit - allProfiles.length;
        const lowPriorityProfiles = await this.fetchProfilesByGoals(
          currentUserId,
          prioritizedGoals.low,
          filters,
          remainingLimit
        );
        allProfiles.push(...lowPriorityProfiles);
      }
      
      // Remove duplicates (shouldn't happen, but safety check)
      const uniqueProfiles = this.removeDuplicateProfiles(allProfiles);
      
      // Shuffle profiles within priority groups for variety
      const shuffledProfiles = this.shuffleProfiles(uniqueProfiles);
      
      return {
        profiles: shuffledProfiles.slice(0, limit),
        hasMore: shuffledProfiles.length === limit,
        totalCount: shuffledProfiles.length
      };
      
    } catch (error) {
      console.error('Error in getMatchedProfiles:', error);
      throw new Error('Failed to fetch matched profiles');
    }
  }

  /**
   * Determine goal priorities based on user's goal
   */
  private getPrioritizedGoals(userGoal: string): {
    high: string[];
    medium: string[];
    low: string[];
  } {
    switch (userGoal) {
      case 'recruiting':
        return {
          high: ['searching'], // Recruiters want developers
          medium: ['other'],   // Open to networking
          low: ['investing']   // Investors might have opportunities
        };
        
      case 'searching':
        return {
          high: ['recruiting'], // Developers want recruiters
          medium: ['investing', 'other'], // Investors might have opportunities, networking
          low: []
        };
        
      case 'investing':
        return {
          high: ['recruiting', 'searching'], // Investors want to connect with both
          medium: ['other'],
          low: []
        };
        
      case 'other':
        return {
          high: ['other'], // Networking with similar goal
          medium: ['searching', 'recruiting', 'investing'], // Open to everyone
          low: []
        };
        
      default:
        return {
          high: ['searching', 'recruiting', 'investing', 'other'],
          medium: [],
          low: []
        };
    }
  }

  /**
   * Fetch profiles by specific goals with optional filters
   */
  private async fetchProfilesByGoals(
    currentUserId: string,
    goals: string[],
    filters?: MatchmakingFilters,
    limit: number = 50
  ): Promise<Developer[]> {
    try {
      // Build the query
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          location,
          goal,
          role,
          bio,
          github,
          linkedin,
          website,
          avatar_url,
          experience:experience(*)
        `)
        .neq('id', currentUserId) // Exclude current user
        .eq('profile_complete', true) // Only complete profiles
        .in('goal', goals);

      // Apply filters
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Add limit
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      // Filter out profiles that the user has already interacted with (swiped on or matched with)
      const filteredProfiles = await this.filterOutAlreadyInteractedProfiles(currentUserId, data);

      // Transform database results to Developer model
      return this.transformProfilesToDevelopers(filteredProfiles);
      
    } catch (error) {
      console.error('Error fetching profiles by goals:', error);
      return [];
    }
  }

  /**
   * Filter out profiles that the user has already interacted with (swiped on or matched with)
   */
  private async filterOutAlreadyInteractedProfiles(userId: string, profiles: any[]): Promise<any[]> {
    try {
      // Get profiles that user has already swiped on (liked or passed)
      const { data: swipedProfiles, error: swipedError } = await supabase
        .from('user_actions')
        .select('target_user_id')
        .eq('user_id', userId);

      if (swipedError) {
        console.error('Error fetching user actions:', swipedError);
      }

      // Get profiles that user has already matched with
      const { data: matchedProfiles, error: matchedError } = await supabase
        .from('matches')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (matchedError) {
        console.error('Error fetching matches:', matchedError);
      }

      // Collect all user IDs to exclude
      const excludedUserIds = new Set<string>();

      // Add swiped profiles
      if (swipedProfiles && swipedProfiles.length > 0) {
        swipedProfiles.forEach(action => {
          excludedUserIds.add(action.target_user_id);
        });
      }

      // Add matched profiles
      if (matchedProfiles && matchedProfiles.length > 0) {
        matchedProfiles.forEach(match => {
          // Add the other user in the match
          const otherUserId = match.user_id_1 === userId ? match.user_id_2 : match.user_id_1;
          excludedUserIds.add(otherUserId);
        });
      }

      // Filter out excluded profiles
      const filteredProfiles = profiles.filter(profile => !excludedUserIds.has(profile.id));
      
      return filteredProfiles;
    } catch (error) {
      console.error('Error filtering already interacted profiles:', error);
      return profiles;
    }
  }

  /**
   * Transform database profiles to Developer model
   */
  private transformProfilesToDevelopers(profiles: any[]): Developer[] {
    return profiles.map(profile => {
      // Get experience data
      const experience = profile.experience?.[0];
      const skills: Skill[] = experience?.skills ? 
        experience.skills.map((skillName: string, index: number) => ({
          id: `${profile.id}_${index}`,
          name: skillName,
          level: 'Intermediate' as const // Default level, could be enhanced later
        })) : [];

      // Get education info
      const education = experience?.education?.[0];
      const educationString = education ? 
        `${education.degree || ''} ${education.major || ''}, ${education.school_name || ''}`.trim() : 
        undefined;

      // Get work experience info  
      const workExperience = experience?.work_experience?.[0];
      const company = workExperience?.company;
      const position = workExperience?.position;

      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous',
        bio: profile.bio || 'No bio available',
        role: profile.role || 'Developer',
        skills,
        avatarUrl: profile.avatar_url,
        location: profile.location,
        company,
        position,
        education: educationString,
        github: profile.github,
        linkedin: profile.linkedin,
        website: profile.website,
        looking: profile.goal === 'searching', // Developers are "looking"
        experience: this.calculateExperience(workExperience)
      };
    });
  }

  /**
   * Calculate years of experience from work history
   */
  private calculateExperience(workExperience?: any): number | undefined {
    if (!workExperience?.startDate) return undefined;
    
    try {
      const startDate = new Date(workExperience.startDate + '-01'); // Add day for parsing
      const endDate = workExperience.current ? new Date() : 
        workExperience.endDate ? new Date(workExperience.endDate + '-01') : new Date();
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25));
      
      return diffYears;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Remove duplicate profiles based on ID
   */
  private removeDuplicateProfiles(profiles: Developer[]): Developer[] {
    const seen = new Set<string>();
    return profiles.filter(profile => {
      if (seen.has(profile.id)) {
        return false;
      }
      seen.add(profile.id);
      return true;
    });
  }

  /**
   * Shuffle profiles for variety while maintaining some priority order
   */
  private shuffleProfiles(profiles: Developer[]): Developer[] {
    // Simple shuffle - could be enhanced with more sophisticated algorithms
    const shuffled = [...profiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Future extension point: Add skill-based matching
   */
  async getSkillBasedMatches(
    currentUserId: string,
    userSkills: string[],
    limit: number = 20
  ): Promise<Developer[]> {
    // TODO: Implement skill-based matching algorithm
    // This could use similarity scoring, complementary skills, etc.
    return [];
  }

  /**
   * Future extension point: Add location-based matching
   */
  async getLocationBasedMatches(
    currentUserId: string,
    userLocation: string,
    radiusMiles: number = 50,
    limit: number = 20
  ): Promise<Developer[]> {
    // TODO: Implement location-based matching with geospatial queries
    return [];
  }

  /**
   * Future extension point: Add experience level matching
   */
  async getExperienceLevelMatches(
    currentUserId: string,
    experienceRange: { min: number; max: number },
    limit: number = 20
  ): Promise<Developer[]> {
    // TODO: Implement experience level matching
    return [];
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService(); 