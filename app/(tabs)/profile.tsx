import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    console.log('🚪 Logout button pressed!');
    
    // For web compatibility, use window.confirm instead of Alert
    const confirmLogout = typeof window !== 'undefined' && window.confirm 
      ? window.confirm('Are you sure you want to logout?')
      : true; // For mobile, just proceed

    if (confirmLogout) {
      console.log('🔄 User confirmed logout');
      performLogout();
    } else {
      console.log('❌ Logout cancelled');
    }
  };

  const performLogout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      await logout();
      console.log('✅ Logout completed - auth state should trigger navigation');
      
      // Add a manual navigation fallback
      setTimeout(() => {
        console.log('🔄 Manual navigation fallback - checking if still on profile...');
        // Force a page reload as fallback
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  // Add loading state check
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
          
          <Text style={styles.name}>{user.name || 'Your Name'}</Text>
          <Text style={styles.email}>{user.email || 'your.email@example.com'}</Text>
          <Text style={styles.role}>{user.role || 'Full Stack Developer'}</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bio}>
              {user.bio || 'Share information about your skills, experience, and what kind of developers you\'re looking to connect with.'}
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillText}>React</Text>
                  </View>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillText}>Node.js</Text>
                  </View>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillText}>TypeScript</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {user.location && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}

          {user.experience !== undefined && user.experience !== null && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Text style={styles.infoText}>{user.experience.toString()} years</Text>
            </View>
          )}
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.5,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 88, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 88, 100, 0.2)',
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
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#333',
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