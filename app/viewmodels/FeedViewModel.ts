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
    bio: 'Full stack developer with 5 years of experience. Passionate about clean code and user experience.',
    role: 'Full Stack Developer',
    skills: [mockSkills[0], mockSkills[1], mockSkills[2]],
    looking: true,
    location: 'San Francisco, CA',
    experience: 5,
    github: 'github.com/janedoe',
  },
  {
    id: '2',
    name: 'John Smith',
    bio: 'Backend developer specializing in Python and cloud infrastructure. Looking for frontend collaborators.',
    role: 'Backend Developer',
    skills: [mockSkills[3], mockSkills[4], mockSkills[5]],
    looking: true,
    location: 'New York, NY',
    experience: 3,
    github: 'github.com/johnsmith',
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