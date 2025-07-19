// Debug utility for monitoring auth and profile creation flow
export const debugAuth = {
  log: (context: string, data: any) => {
    console.log(`[AUTH_DEBUG] ${context}:`, JSON.stringify(data, null, 2));
  },
  
  logUserState: (context: string, user: any) => {
    if (!user) {
      console.log(`[AUTH_DEBUG] ${context}: User is null/undefined`);
      return;
    }
    
    console.log(`[AUTH_DEBUG] ${context}:`, {
      id: user.id,
      email: user.email,
      profile_complete: user.profile_complete,
      goal: user.goal,
      has_personal_info: !!(user.first_name && user.last_name),
      has_goal_specific_data: !!(
        user.company_name || 
        user.firm_name || 
        (user.desired_skills && user.desired_skills.length > 0) ||
        (user.investment_areas && user.investment_areas.length > 0)
      ),
      funding: user.funding,
      investment_amount: user.investment_amount
    });
  },
  
  logNavigation: (from: string, to: string, reason: string) => {
    console.log(`[AUTH_DEBUG] Navigation: ${from} -> ${to} (${reason})`);
  },
  
  logError: (context: string, error: any) => {
    console.error(`[AUTH_DEBUG] ERROR in ${context}:`, error);
  }
};

// Hook to monitor auth state changes
export const useAuthDebug = (context: string) => {
  return {
    logUserState: (user: any) => debugAuth.logUserState(context, user),
    log: (data: any) => debugAuth.log(context, data),
    logError: (error: any) => debugAuth.logError(context, error)
  };
}; 