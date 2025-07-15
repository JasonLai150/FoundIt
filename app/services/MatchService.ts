import { supabase } from '../config/supabase';

export interface UserAction {
  id: string;
  user_id: string;
  target_user_id: string;
  action_type: 'like' | 'pass';
  message?: string;
  created_at: string;
}

export interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  is_active: boolean;
}

export interface UserLike {
  user_id: string;
  target_user_id: string;
  created_at: string;
  is_mutual: boolean;
}

export interface LikeRequest {
  id: string;
  user_id: string; // Person who liked the current user
  target_user_id: string; // Current user (who was liked)
  created_at: string;
  message?: string; // Message attached to the like
  profile?: {
    first_name?: string;
    last_name?: string;
    role?: string;
    location?: string;
    avatar_url?: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

class MatchService {
  /**
   * Record a user action (swipe right = like, swipe left = pass)
   */
  async recordUserAction(userId: string, targetUserId: string, actionType: 'like' | 'pass', message?: string): Promise<boolean> {
    try {
      // Check if user has already swiped on this profile
      const { data: existingAction } = await supabase
        .from('user_actions')
        .select('id')
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId)
        .single();

      if (existingAction) {
        console.error('User has already swiped on this profile');
        return false;
      }

      // Record the action
      const { data, error } = await supabase
        .from('user_actions')
        .insert({
          user_id: userId,
          target_user_id: targetUserId,
          action_type: actionType,
          message: message || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording user action:', error);
        return false;
      }

      // If it's a like, check for mutual match
      if (actionType === 'like') {
        await this.checkForMutualMatch(userId, targetUserId);
      }

      return true;
    } catch (error) {
      console.error('Error in recordUserAction:', error);
      return false;
    }
  }

  /**
   * Record a pass action
   */
  async recordPass(userId: string, targetUserId: string): Promise<boolean> {
    return this.recordUserAction(userId, targetUserId, 'pass');
  }

  private async checkForMutualMatch(userId: string, targetUserId: string): Promise<void> {
    try {
      // Check if the target user has also liked this user
      const { data: mutualLike } = await supabase
        .from('user_actions')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('target_user_id', userId)
        .eq('action_type', 'like')
        .single();

      if (mutualLike) {
        // Check if match already exists
        const isAlreadyMatched = await this.areUsersMatched(userId, targetUserId);
        if (isAlreadyMatched) {
          console.log('Match already exists between users');
          return;
        }

        // Create a match with consistent ordering (smaller ID first)
        const [user_id_1, user_id_2] = [userId, targetUserId].sort();
        
        const { error } = await supabase
          .from('matches')
          .insert({
            user_id_1,
            user_id_2,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating match:', error);
        }
      }
    } catch (error) {
      console.error('Error checking for mutual match:', error);
    }
  }

  /**
   * Create a match (for swipe right) - simplified method
   */
  async createMatch(userId: string, targetUserId: string, message?: string): Promise<boolean> {
    return this.recordUserAction(userId, targetUserId, 'like', message);
  }

  /**
   * Check if a new match was created and log it
   */
  private async checkForNewMatch(userId: string, targetUserId: string): Promise<void> {
    try {
      // Use the existing areUsersMatched function to check if match was created
      const isMatched = await this.areUsersMatched(userId, targetUserId);
      
      if (isMatched) {
        // Match was created - could trigger notifications here
      }
    } catch (error) {
      console.error('Error in checkForNewMatch:', error);
    }
  }

  /**
   * Get user's likes (both one-way and mutual)
   */
  async getUserLikes(userId: string): Promise<UserLike[]> {
    try {
      const { data, error } = await supabase
        .from('user_likes') // Using the view we created
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user likes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserLikes:', error);
      return [];
    }
  }

  /**
   * Get incoming like requests - people who liked the current user but haven't been matched yet
   */
  async getLikeRequests(userId: string): Promise<LikeRequest[]> {
    try {
      // Get all users who liked the current user
      const { data: likeActions, error: likesError } = await supabase
        .from('user_actions')
        .select('id, user_id, target_user_id, created_at, message')
        .eq('target_user_id', userId)
        .eq('action_type', 'like')
        .order('created_at', { ascending: false }); // Newest first

      if (likesError) {
        console.error('❌ Error fetching like requests:', likesError);
        return [];
      }

      if (!likeActions || likeActions.length === 0) {
        return [];
      }

      // Get all actions the current user has taken
      const { data: userActions, error: userActionsError } = await supabase
        .from('user_actions')
        .select('target_user_id, action_type')
        .eq('user_id', userId);

      if (userActionsError) {
        console.error('❌ Error fetching user actions:', userActionsError);
        return [];
      }

      // Only exclude users where current user has 'liked' them (not passed)
      const userLikedTargets = new Set(
        userActions?.filter(action => action.action_type === 'like')
          .map(action => action.target_user_id) || []
      );

      // Filter out users step by step
      const validLikeRequests = [];
      
      for (const like of likeActions) {
        // Only skip if current user has already LIKED this person (allow if they passed)
        if (userLikedTargets.has(like.user_id)) {
          continue;
        }
        
        // Check if already matched
        const isMatched = await this.areUsersMatched(like.user_id, userId);
        if (isMatched) {
          continue;
        }
        
        validLikeRequests.push(like);
      }

      if (validLikeRequests.length === 0) {
        return [];
      }

      // Get profile data for all valid like requests
      const userIds = validLikeRequests.map(like => like.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, location, avatar_url, bio, github, linkedin, website')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles for like requests:', profilesError);
        return [];
      }

      // Combine like data with profile data
      const result = validLikeRequests.map(like => {
        const profile = profiles?.find(profile => profile.id === like.user_id);
        return {
          ...like,
          profile: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
            location: profile.location,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            github: profile.github,
            linkedin: profile.linkedin,
            website: profile.website,
          } : undefined
        };
      });

      return result;
    } catch (error) {
      console.error('❌ Error in getLikeRequests:', error);
      return [];
    }
  }

  /**
   * Accept a like request (create a mutual match)
   */
  async acceptLikeRequest(currentUserId: string, likerUserId: string, message?: string): Promise<boolean> {
    try {
      // Check if user has already swiped on this profile
      const hasAlreadySwiped = await this.hasUserSwiped(currentUserId, likerUserId);
      
      if (hasAlreadySwiped) {
        // User already swiped - check what action they took
        const { data: existingAction } = await supabase
          .from('user_actions')
          .select('action_type')
          .eq('user_id', currentUserId)
          .eq('target_user_id', likerUserId)
          .single();

        if (existingAction?.action_type === 'like') {
          // User already liked - check if match exists
          const isMatched = await this.areUsersMatched(currentUserId, likerUserId);
          if (isMatched) {
            console.log('Match already exists between users');
            return true; // Success - match already exists
          } else {
            // Like exists but no match - create match manually
            return await this.createMatchFromExistingLikes(currentUserId, likerUserId);
          }
        } else if (existingAction?.action_type === 'pass') {
          // User previously passed - update to like
          return await this.updatePassToLike(currentUserId, likerUserId, message);
        }
      }

      // User hasn't swiped yet - record the like action
      const success = await this.recordUserAction(currentUserId, likerUserId, 'like', message);
      
      if (!success) {
        console.error('Failed to record like action for accepting request');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in acceptLikeRequest:', error);
      return false;
    }
  }

  /**
   * Create a match from existing likes (when both users have liked each other but match doesn't exist)
   */
  private async createMatchFromExistingLikes(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Check if match already exists
      const isAlreadyMatched = await this.areUsersMatched(userId1, userId2);
      if (isAlreadyMatched) {
        console.log('Match already exists between users');
        return true;
      }

      // Ensure consistent ordering (smaller ID first)
      const [user_id_1, user_id_2] = [userId1, userId2].sort();
      
      const { error } = await supabase
        .from('matches')
        .insert({
          user_id_1,
          user_id_2,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating match from existing likes:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createMatchFromExistingLikes:', error);
      return false;
    }
  }

  /**
   * Update a previous pass action to a like
   */
  private async updatePassToLike(userId: string, targetUserId: string, message?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_actions')
        .update({
          action_type: 'like',
          message: message || null,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId);

      if (error) {
        console.error('Error updating pass to like:', error);
        return false;
      }

      // Check for mutual match after updating
      await this.checkForMutualMatch(userId, targetUserId);
      return true;
    } catch (error) {
      console.error('Error in updatePassToLike:', error);
      return false;
    }
  }

  /**
   * Ignore a like request (record as pass)
   */
  async ignoreLikeRequest(currentUserId: string, likerUserId: string): Promise<boolean> {
    try {
      // Check if user has already swiped on this profile
      const hasAlreadySwiped = await this.hasUserSwiped(currentUserId, likerUserId);
      
      if (hasAlreadySwiped) {
        // User already swiped - check what action they took
        const { data: existingAction } = await supabase
          .from('user_actions')
          .select('action_type')
          .eq('user_id', currentUserId)
          .eq('target_user_id', likerUserId)
          .single();

        if (existingAction?.action_type === 'pass') {
          console.log('User already passed on this profile');
          return true; // Success - already passed
        } else if (existingAction?.action_type === 'like') {
          // User previously liked - update to pass
          return await this.updateLikeToPass(currentUserId, likerUserId);
        }
      }

      // User hasn't swiped yet - record the pass action
      const success = await this.recordUserAction(currentUserId, likerUserId, 'pass');
      
      if (!success) {
        console.error('Failed to record pass action for ignoring request');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in ignoreLikeRequest:', error);
      return false;
    }
  }

  /**
   * Update a previous like action to a pass
   */
  private async updateLikeToPass(userId: string, targetUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_actions')
        .update({
          action_type: 'pass',
          message: null, // Clear message when changing to pass
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId);

      if (error) {
        console.error('Error updating like to pass:', error);
        return false;
      }

      // If there was a match, we should deactivate it
      await this.deactivateMatchIfExists(userId, targetUserId);
      return true;
    } catch (error) {
      console.error('Error in updateLikeToPass:', error);
      return false;
    }
  }

  /**
   * Deactivate a match if it exists between two users
   */
  private async deactivateMatchIfExists(userId1: string, userId2: string): Promise<void> {
    try {
      // Ensure consistent ordering (smaller ID first)
      const [user_id_1, user_id_2] = [userId1, userId2].sort();
      
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .eq('user_id_1', user_id_1)
        .eq('user_id_2', user_id_2)
        .eq('is_active', true);

      if (error) {
        console.error('Error deactivating match:', error);
      }
    } catch (error) {
      console.error('Error in deactivateMatchIfExists:', error);
    }
  }

  /**
   * Get user's matches (only mutual matches)
   */
  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      // Use two separate queries instead of complex OR
      const [query1Promise, query2Promise] = [
        supabase
          .from('matches')
          .select('*')
          .eq('user_id_1', userId)
          .eq('is_active', true),
        supabase
          .from('matches')
          .select('*')
          .eq('user_id_2', userId)
          .eq('is_active', true)
      ];

      const [result1, result2] = await Promise.all([query1Promise, query2Promise]);

      if (result1.error) {
        console.error('❌ Error fetching user matches (query 1):', result1.error);
        return [];
      }

      if (result2.error) {
        console.error('❌ Error fetching user matches (query 2):', result2.error);
        return [];
      }

      // Combine results and remove duplicates
      const allMatches = [...(result1.data || []), ...(result2.data || [])];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );

      return uniqueMatches;
    } catch (error) {
      console.error('❌ Error in getUserMatches:', error);
      return [];
    }
  }

  /**
   * Get detailed match info with conversation data
   */
  async getUserMatchesDetailed(userId: string): Promise<any[]> {
    try {
      // Use two separate queries instead of complex OR
      const [query1Promise, query2Promise] = [
        supabase
          .from('user_matches_detailed') // Using the view we created
          .select('*')
          .eq('user_id_1', userId),
        supabase
          .from('user_matches_detailed') // Using the view we created
          .select('*')
          .eq('user_id_2', userId)
      ];

      const [result1, result2] = await Promise.all([query1Promise, query2Promise]);

      if (result1.error) {
        console.error('❌ Error fetching detailed matches (query 1):', result1.error);
        return [];
      }

      if (result2.error) {
        console.error('❌ Error fetching detailed matches (query 2):', result2.error);
        return [];
      }

      // Combine results and remove duplicates
      const allMatches = [...(result1.data || []), ...(result2.data || [])];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );

      return uniqueMatches;
    } catch (error) {
      console.error('❌ Error in getUserMatchesDetailed:', error);
      return [];
    }
  }

  /**
   * Check if user has already swiped on someone
   */
  async hasUserSwiped(userId: string, targetUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_actions')
        .select('id')
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId)
        .single();

      if (error) {
        // Handle "not found" error (user hasn't swiped)
        if (error.code === 'PGRST116') {
          return false;
        }
        // Handle RLS or other permission errors gracefully
        console.error('❌ Error checking if user swiped (treating as not swiped):', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Error in hasUserSwiped (treating as not swiped):', error);
      return false;
    }
  }

  /**
   * Check if two users have matched
   */
  async areUsersMatched(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Try both possible orderings since we're not sure how they were stored
      const { data: match1, error: error1 } = await supabase
        .from('matches')
        .select('id, is_active')
        .eq('user_id_1', userId1)
        .eq('user_id_2', userId2)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle to avoid error when no match found

      const { data: match2, error: error2 } = await supabase
        .from('matches')
        .select('id, is_active')
        .eq('user_id_1', userId2)
        .eq('user_id_2', userId1)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle to avoid error when no match found

      if (error1 && error1.code !== 'PGRST116') {
        console.error('❌ Error checking match (query 1):', error1);
      }
      
      if (error2 && error2.code !== 'PGRST116') {
        console.error('❌ Error checking match (query 2):', error2);
      }

      return !!(match1 || match2);
    } catch (error) {
      console.error('❌ Error in areUsersMatched:', error);
      return false;
    }
  }

  /**
   * Get user's action history
   */
  async getUserActions(userId: string, actionType?: 'like' | 'pass'): Promise<UserAction[]> {
    try {
      let query = supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching user actions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserActions:', error);
      return [];
    }
  }

  /**
   * Unmatch two users (remove match and set inactive)
   */
  async unmatchUsers(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Update the match to inactive
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .or(`and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`);

      if (error) {
        console.error('Error unmatching users:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unmatchUsers:', error);
      return false;
    }
  }
}

export const matchService = new MatchService(); 