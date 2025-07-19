import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileCard from '../components/ProfileCard';
import { useCache } from '../contexts/CacheContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { showConfirmAlert } from '../utils/alert';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, isLoading, fetchUserExperience } = useAuth();
  const { cache, updateProfileCache, isCacheValid } = useCache();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);

  // Use cached Developer profile directly
  const userAsDeveloper = cache.userProfile;

  // Navigate to auth page if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => {
        router.replace('/auth' as RelativePathString);
      }, 100);
    }
  }, [isAuthenticated, isLoading, router]);

  // Background fetch experience data when cache is invalid
  useEffect(() => {
    if (user?.id) {
      const shouldRefresh = !isCacheValid('profile') || !userAsDeveloper;
      
      if (shouldRefresh) {
        loadExperienceData(false);
      }
    }
  }, [user?.id, userAsDeveloper]);

  const loadExperienceData = async (showRefreshing = true) => {
    if (!user?.id) return;
    
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }
      
      const experience = await fetchUserExperience(user.id);
      updateProfileCache(user, experience);
    } catch (error) {
      console.error('Error loading experience data:', error);
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleRefresh = () => {
    loadExperienceData(true);
  };

  // Show user data immediately (no loading screen)
  if (!isLoading && !isAuthenticated) {
    return null; // Will redirect to auth
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF5864']}
            tintColor="#FF5864"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button */}
        <View style={styles.editProfileContainer}>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/profile-setup/edit-profile' as RelativePathString)}
          >
            <Ionicons name="create-outline" size={20} color="#FF5864" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        {userAsDeveloper && (
          <View style={styles.profileCardContainer}>
            <ProfileCard developer={userAsDeveloper} />
          </View>
        )}
      </ScrollView>

      {/* Profile Status - Bottom Right Corner */}
      <View style={styles.statusCorner}>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={16} color="#51cf66" />
          <Text style={styles.statusText}>Active</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="eye" size={16} color="#007AFF" />
          <Text style={styles.statusText}>Visible</Text>
        </View>
      </View>
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
  scrollContent: {
    paddingBottom: 20, // Add some padding at the bottom for the refresh indicator
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  refreshButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  profileCardContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  editProfileContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
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
    gap: 8,
    width: '60%',
  },
  editProfileText: {
    fontSize: 16,
    color: '#FF5864',
    fontWeight: '600',
  },
  statusCorner: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 5,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
}); 