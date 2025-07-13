import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Developer, Skill } from '../models/Developer';

const getCardDimensions = () => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;
  
  if (isLandscape) {
    return {
      width: screenWidth * 0.6,
      height: screenHeight * 0.65, // Increased to match FlippableSwipeCard
    };
  } else {
    return {
      width: screenWidth * 0.9,
      height: screenHeight * 0.6, // Increased to match FlippableSwipeCard
    };
  }
};

const getRoleGradient = (role: string): [string, string] => {
  const roleKey = role.toLowerCase();
  if (roleKey.includes('frontend') || roleKey.includes('ui') || roleKey.includes('ux')) {
    return ['#667eea', '#764ba2'];
  } else if (roleKey.includes('backend') || roleKey.includes('server') || roleKey.includes('api')) {
    return ['#f093fb', '#f5576c'];
  } else if (roleKey.includes('fullstack') || roleKey.includes('full-stack') || roleKey.includes('full stack')) {
    return ['#4facfe', '#00f2fe'];
  } else if (roleKey.includes('mobile') || roleKey.includes('ios') || roleKey.includes('android')) {
    return ['#43e97b', '#38f9d7'];
  } else if (roleKey.includes('devops') || roleKey.includes('sre') || roleKey.includes('infrastructure')) {
    return ['#fa709a', '#fee140'];
  } else if (roleKey.includes('data') || roleKey.includes('scientist') || roleKey.includes('analyst')) {
    return ['#a8edea', '#fed6e3'];
  } else if (roleKey.includes('security') || roleKey.includes('cyber')) {
    return ['#ff9a9e', '#fecfef'];
  } else {
    return ['#667eea', '#764ba2']; // Default gradient
  }
};

interface ProfileCardProps {
  developer: Developer;
}

export default function ProfileCard({ developer }: ProfileCardProps) {
  const dimensions = getCardDimensions();
  const CARD_WIDTH = dimensions.width;
  const CARD_HEIGHT = dimensions.height;
  
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const gradientColors = getRoleGradient(developer.role);

  const getBlurOpacity = () => {
    const maxScroll = Math.max(0, contentHeight - scrollViewHeight);
    if (maxScroll > 0) {
      // If content is scrollable, show blur with minimum opacity that increases with scroll
      const scrollPercentage = Math.min(scrollY / maxScroll, 1);
      return Math.max(0.6, scrollPercentage * 0.9); // Increased minimum to 0.6 and max to 0.9
    }
    // Always show some blur at the bottom if there's content
    return contentHeight > 0 ? 0.5 : 0; // Increased from 0.3 to 0.5
  };

  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 20,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      overflow: 'hidden',
    },
    
    // Profile Section (Top Half)
    profileSection: {
      height: '38%',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    decorativeElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeCircle1: {
      width: 100,
      height: 100,
      top: -30,
      right: -20,
    },
    decorativeCircle2: {
      width: 60,
      height: 60,
      bottom: 20,
      left: -10,
    },
    decorativeCircle3: {
      width: 40,
      height: 40,
      top: 30,
      left: 20,
    },
    profileImageContainer: {
      position: 'relative',
      marginTop: 10,
      marginBottom: 10,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    placeholderProfileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    profileImageBorder: {
      position: 'absolute',
      top: -8,
      left: -8,
      right: -8,
      bottom: -8,
      borderRadius: 58,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    profileRole: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    profileLocation: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // Info Section (Bottom Half)
    infoSection: {
      height: '62%',
      backgroundColor: '#f8f9fa',
      position: 'relative',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    
    // Skills
    topSkillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillBadge: {
      backgroundColor: '#f0f2f5',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    topSkillBadge: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    skillText: {
      fontSize: 12,
      color: '#333',
      fontWeight: '500',
    },
    topSkillText: {
      color: 'white',
      fontWeight: '600',
    },
    
    // Bio
    bioText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#666',
    },
    
    // Education
    educationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    educationDetails: {
      marginLeft: 8,
    },
    educationText: {
      fontSize: 12,
      color: '#333',
    },
    educationSchool: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    
    // Work Experience
    workExperienceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    workExperienceDetails: {
      marginLeft: 8,
    },
    workExperienceRole: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
    },
    workExperienceCompany: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    workExperienceYears: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
    },
    
    // Blur effect
    blurContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      pointerEvents: 'none',
    },
    blurGradient: {
      flex: 1,
    },
  });

  const SkillBadge = ({ skill, isTopSkill = false }: { skill: Skill; isTopSkill?: boolean }) => (
    <View style={[styles.skillBadge, isTopSkill && styles.topSkillBadge]}>
      <Text style={[styles.skillText, isTopSkill && styles.topSkillText]}>{skill.name}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Top Half - Profile Section with Gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileSection}
      >
        {/* Decorative elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
          <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
          <View style={[styles.decorativeCircle, styles.decorativeCircle3]} />
        </View>

        {/* Profile Picture */}
        <View style={styles.profileImageContainer}>
          {developer.avatarUrl ? (
            <Image source={{ uri: developer.avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderProfileImage}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          <View style={styles.profileImageBorder} />
        </View>

        {/* Name and Role */}
        <Text style={styles.profileName}>{developer.name}</Text>
        <Text style={styles.profileRole}>{developer.role}</Text>
        {/* Location */}
        {developer.location && (
          <Text style={styles.profileLocation}>{developer.location}</Text>
        )}
      </LinearGradient>

      {/* Bottom Half - Scrollable Information */}
      <View style={styles.infoSection}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => setScrollY(nativeEvent.contentOffset.y)}
          onContentSizeChange={(w, h) => setContentHeight(h)}
          onLayout={({ nativeEvent }) => setScrollViewHeight(nativeEvent.layout.height)}
        >
          {/* About Section */}
          {developer.bio && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{developer.bio}</Text>
            </View>
          )}

          {/* Top Skills */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Skills</Text>
            <View style={styles.topSkillsContainer}>
              {developer.skills.slice(0, 3).map((skill, index) => (
                <SkillBadge key={index} skill={skill} isTopSkill={true} />
              ))}
            </View>
          </View>

          {/* Education */}
          {developer.education && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.educationCard}>
                <Ionicons name="school" size={18} color="#666" />
                <View style={styles.educationDetails}>
                  {developer.education.includes(',') ? (
                    <>
                      <Text style={styles.educationText}>
                        {developer.education.split(',')[0].trim()}
                      </Text>
                      <Text style={styles.educationSchool}>
                        {developer.education.split(',')[1].trim()}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.educationText}>{developer.education}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Work Experience */}
          {developer.company && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Work Experience</Text>
              <View style={styles.workExperienceCard}>
                <Ionicons name="briefcase" size={18} color="#666" />
                <View style={styles.workExperienceDetails}>
                  <Text style={styles.workExperienceRole}>{developer.role}</Text>
                  <Text style={styles.workExperienceCompany}>{developer.company}</Text>
                  {developer.experience && (
                    <Text style={styles.workExperienceYears}>
                      {developer.experience} year{developer.experience !== 1 ? 's' : ''} experience
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Dynamic blur gradient overlay */}
        <View style={[styles.blurContainer, { opacity: getBlurOpacity() }]}>
          <LinearGradient
            colors={[
              'rgba(248, 249, 250, 0)', 
              'rgba(248, 249, 250, 0.5)', 
              'rgba(248, 249, 250, 0.9)', 
              'rgba(248, 249, 250, 1)'
            ]}
            style={styles.blurGradient}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
} 