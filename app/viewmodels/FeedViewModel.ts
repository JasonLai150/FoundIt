import { useEffect, useState } from 'react';
import { Developer, Skill } from '../models/Developer';

// Sample data for initial testing
const mockSkills: Skill[] = [
  { id: '1', name: 'React', level: 'Expert' },
  { id: '2', name: 'TypeScript', level: 'Advanced' },
  { id: '3', name: 'Node.js', level: 'Intermediate' },
  { id: '4', name: 'Python', level: 'Advanced' },
  { id: '5', name: 'AWS', level: 'Intermediate' },
  { id: '6', name: 'Docker', level: 'Beginner' },
];

const mockDevelopers: Developer[] = [
  {
    id: '1',
    name: 'Jane Doe',
    bio: 'Full stack developer with 5 years of experience. Passionate about clean code and user experience. I love building scalable web applications and mentoring junior developers.',
    role: 'Full Stack Developer',
    skills: [mockSkills[0], mockSkills[1], mockSkills[2]],
    looking: true,
    location: 'San Francisco, CA',
    experience: 5,
    company: 'Tech Startup Inc.',
    education: 'BS Computer Science, Stanford',
    github: 'github.com/janedoe',
    linkedin: 'linkedin.com/in/janedoe',
    website: 'janedoe.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'John Smith',
    bio: 'Backend developer specializing in Python and cloud infrastructure. Looking for frontend collaborators to build amazing products together.',
    role: 'Backend Developer',
    skills: [mockSkills[3], mockSkills[4], mockSkills[5]],
    looking: true,
    location: 'New York, NY',
    experience: 3,
    company: 'CloudSoft Solutions',
    education: 'MS Software Engineering, MIT',
    github: 'github.com/johnsmith',
    linkedin: 'linkedin.com/in/johnsmith',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Alex Chen',
    bio: 'Mobile app developer with expertise in React Native and Flutter. Passionate about creating intuitive user interfaces and performance optimization.',
    role: 'Mobile Developer',
    skills: [mockSkills[0], mockSkills[1], { id: '7', name: 'Flutter', level: 'Advanced' }, { id: '8', name: 'iOS', level: 'Intermediate' }],
    looking: true,
    location: 'Seattle, WA',
    experience: 4,
    company: 'AppCraft Studios',
    education: 'BS Computer Engineering, UC Berkeley',
    github: 'github.com/alexchen',
    linkedin: 'linkedin.com/in/alexchen',
    website: 'alexchen.tech',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  },
];

export const useFeedViewModel = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // In a real app, this would fetch from an API
  useEffect(() => {
    // Simulate API call
    const fetchDevelopers = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDevelopers(mockDevelopers);
        setLoading(false);
      } catch (err) {
        setError('Failed to load developers');
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  const getCurrentDeveloper = (): Developer | null => {
    if (developers.length === 0 || currentIndex >= developers.length) {
      return null;
    }
    return developers[currentIndex];
  };

  const swipeLeft = () => {
    // Swipe left (not interested)
    if (currentIndex < developers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const swipeRight = () => {
    // Swipe right (interested)
    // In a real app, you would save this match to a database
    console.log(`Liked developer: ${developers[currentIndex].name}`);
    if (currentIndex < developers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    developer: getCurrentDeveloper(),
    loading,
    error,
    swipeLeft,
    swipeRight,
    noMoreDevelopers: currentIndex >= developers.length,
  };
}; 