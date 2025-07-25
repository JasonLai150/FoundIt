export type Skill = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
};

export type Education = {
  school_name: string;
  degree?: string;
  major?: string;
};

export type WorkExperience = {
  company: string;
  position: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
};

export type Developer = {
  id: string;
  name: string;
  bio: string;
  role: string;
  skills: Skill[];
  avatarUrl?: string;
  location?: string;
  experience?: number; // In years
  company?: string;
  position?: string; // Actual job title/position at the company
  education?: string;
  // Rich structured data (new)
  educationEntries?: Education[];
  workExperiences?: WorkExperience[];
  graduation_date?: string;
  experience_id?: string; // Database ID for the experience record
  github?: string;
  linkedin?: string;
  website?: string;
  looking: boolean; // Whether they're looking for collaborators
  goal?: 'recruiting' | 'searching' | 'investing' | 'other'; // User's goal for profile card styling
  
  // Goal-specific fields for recruiters
  companyName?: string;
  companyDescription?: string;
  desiredSkills?: string[];
  funding?: {
    round?: string;
    amount?: string;
    investors?: string[];
  };
  
  // Goal-specific fields for investors
  firmName?: string;
  firmDescription?: string;
  investmentAreas?: string[];
  investmentAmount?: {
    min?: number;
    max?: number;
  };
};

export const createDeveloper = (
  id: string,
  name: string,
  bio: string,
  role: string,
  skills: Skill[],
  looking: boolean,
  options?: Partial<Omit<Developer, 'id' | 'name' | 'bio' | 'role' | 'skills' | 'looking'>>
): Developer => {
  return {
    id,
    name,
    bio,
    role,
    skills,
    looking,
    ...options,
  };
}; 