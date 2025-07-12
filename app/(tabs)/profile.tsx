import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { showConfirmAlert } from '../utils/alert';

const { height: screenHeight } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Navigate to auth page if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔄 Profile: User not authenticated, navigating to auth...');
      // Use setTimeout to ensure navigation happens after component render
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    console.log('🚪 Logout button pressed!');
    
    // Use cross-platform confirm alert
    showConfirmAlert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => {
        console.log('🔄 User confirmed logout');
        performLogout();
      },
      () => {
        console.log('❌ Logout cancelled');
      }
    );
  };

  const performLogout = async () => {
    try {
      console.log('🔄 Starting logout process from profile...');
      await logout();
      console.log('✅ Logout completed - navigation should be handled by auth context');
      // No need to manually navigate here - the auth context handles it
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // The auth context will handle showing error messages
    }
  };

  // Add loading state check
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not authenticated, show redirecting message
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirecting to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If authenticated but no user data loaded yet
  if (!user) {
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
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
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bio}>
              {user.bio || 'Share information about your skills, experience, and what kind of developers you\'re looking to connect with.'}
            </Text>
          </View>

          {user.github || user.linkedin || user.website ? (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Connect</Text>
              <View style={styles.socialLinks}>
                {user.github && (
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-github" size={20} color="#333" />
                    <Text style={styles.socialText}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {user.linkedin && (
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                    <Text style={styles.socialText}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {user.website && (
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="globe-outline" size={20} color="#333" />
                    <Text style={styles.socialText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={20} color="#FF5864" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
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
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  socialLink: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5864',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
}); 