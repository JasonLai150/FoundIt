import { supabase } from '../config/supabase';

export interface UserAction {
  id: string;
  user_id: string;
  target_user_id: string;
  action_type: 'like' | 'pass';
  created_at: string;
}

export interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  is_active?: boolean;
}

export interface UserLike {
  user_id: string;
  target_user_id: string;
  created_at: string;
  is_mutual: boolean;
}

class MatchService {
  /**
   * Record a user action (swipe right = like, swipe left = pass)
   */
  async recordUserAction(userId: string, targetUserId: string, actionType: 'like' | 'pass'): Promise<boolean> {
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
        // Create a match
        const { error } = await supabase
          .from('matches')
          .insert({
            user_id_1: userId,
            user_id_2: targetUserId,
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
  async createMatch(userId: string, targetUserId: string): Promise<boolean> {
    return this.recordUserAction(userId, targetUserId, 'like');
  }

  /**
   * Record a pass (for swipe left)
   */
  async recordPass(userId: string, targetUserId: string): Promise<boolean> {
    return this.recordUserAction(userId, targetUserId, 'pass');
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

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking if user swiped:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Error in hasUserSwiped:', error);
      return false;
    }
  }

  /**
   * Check if two users have matched
   */
  async areUsersMatched(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Use a simpler approach - check both possible orderings separately
      const [smallerId, largerId] = [userId1, userId2].sort();
      
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id_1', smallerId)
        .eq('user_id_2', largerId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('❌ Error checking if users matched:', error);
        return false;
      }

      return data && data.length > 0;
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