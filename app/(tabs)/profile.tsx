import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileCard from '../components/ProfileCard';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Developer, Skill } from '../models/Developer';
import { showConfirmAlert } from '../utils/alert';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, isLoading, fetchUserExperience } = useAuth();
  const router = useRouter();
  const [experienceData, setExperienceData] = useState<any>(null);
  const [loadingExperience, setLoadingExperience] = useState(true);

  // Navigate to auth page if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch experience data
  useEffect(() => {
    if (user?.id) {
      loadExperienceData();
    }
  }, [user?.id]);

  const loadExperienceData = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingExperience(true);
      const experience = await fetchUserExperience(user.id);
      setExperienceData(experience);
    } catch (error) {
      console.error('Error loading experience data:', error);
    } finally {
      setLoadingExperience(false);
    }
  };

  // Convert user data to Developer format for the profile card
  const userAsDeveloper: Developer | null = useMemo(() => {
    if (!user) return null;
    
    // Transform skills from experience data
    const skills: Skill[] = experienceData?.skills ? 
      experienceData.skills.map((skillName: string, index: number) => ({
        id: `${user.id}_${index}`,
        name: skillName,
        level: 'Intermediate' as const
      })) : [];

    // Get education info
    const education = experienceData?.education?.[0];
    const educationString = education ? 
      `${education.degree || ''} ${education.major || ''}, ${education.school_name || ''}`.trim() : 
      undefined;

    // Get work experience info  
    const workExperience = experienceData?.work_experience?.[0];
    const company = workExperience?.company;
    
    return {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Your Name',
      bio: user.bio || 'Add a bio to tell others about yourself...',
      role: user.role || 'Developer',
      skills,
      avatarUrl: user.avatar_url,
      location: user.location,
      company,
      education: educationString,
      github: user.github,
      linkedin: user.linkedin,
      website: user.website,
      looking: user.goal === 'searching',
    };
  }, [user, experienceData]);

  const handleLogout = () => {
    showConfirmAlert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => {
        performLogout();
      },
      () => {
        // Logout cancelled
      }
    );
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no user
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Please log in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderProfileCard = () => {
    if (!userAsDeveloper) return null;

    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Your Profile Card</Text>
        <ProfileCard developer={userAsDeveloper} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF5864" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={styles.avatar}
                cachePolicy="memory-disk"
                onError={(error) => {
                  console.error('Profile avatar load error:', error.error);
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Your Name'}</Text>
          <Text style={styles.email}>{user.email || 'your.email@example.com'}</Text>
          <Text style={styles.role}>{user.role || 'Full Stack Developer'}</Text>
          
          {user.goal && (
            <View style={styles.goalContainer}>
              <Text style={styles.goalLabel}>Goal:</Text>
              <Text style={styles.goalText}>
                {user.goal === 'searching' ? 'Job Searching' :
                 user.goal === 'recruiting' ? 'Recruiting' :
                 user.goal === 'investing' ? 'Investing' : 'Networking'}
              </Text>
            </View>
          )}

          {user.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Ionicons name="create-outline" size={20} color="#FF5864" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {renderProfileCard()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: screenHeight < 700 ? 4 : 8,
    paddingBottom: screenHeight < 700 ? 8 : 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
    lineHeight: screenHeight < 700 ? 26 : 28,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    marginTop: -4,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  goalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5864',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF5864',
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  editProfileText: {
    fontSize: 16,
    color: '#FF5864',
    fontWeight: '600',
  },
  cardContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
}); 