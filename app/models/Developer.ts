export type Skill = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
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
  github?: string;
  linkedin?: string;
  website?: string;
  looking: boolean; // Whether they're looking for collaborators
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