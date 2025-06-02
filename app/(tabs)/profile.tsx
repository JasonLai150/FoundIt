import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            console.log('🔄 User confirmed logout');
            try {
              await logout();
              console.log('🔄 Navigating to auth screen...');
              // Use different navigation methods to ensure it works
              router.dismissAll?.(); // Dismiss any modals if present
              router.replace('/(tabs)/../auth' as any); // Explicit path
              console.log('✅ Navigation completed');
            } catch (error) {
              console.error('❌ Navigation error:', error);
              // Fallback: try a different navigation approach
              router.push('/auth' as any);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
          
          <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
          <Text style={styles.email}>{user?.email || 'your.email@example.com'}</Text>
          <Text style={styles.role}>{user?.role || 'Full Stack Developer'}</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bio}>
              {user?.bio || 'Share information about your skills, experience, and what kind of developers you\'re looking to connect with.'}
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {user?.skills && user.skills.length > 0 ? (
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

          {user?.location && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}

          {user?.experience && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Text style={styles.infoText}>{user.experience} years</Text>
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
    padding: 8,
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
}); 