import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import { Developer, Education, Skill, WorkExperience } from '../models/Developer';

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
  
  const [flipValue] = useState(new Animated.Value(0));
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Use keys to ensure ScrollViews are completely independent
  const [frontScrollKey] = useState(() => `front-scroll-${Math.random()}`);
  const [backScrollKey] = useState(() => `back-scroll-${Math.random()}`);

  const gradientColors = getRoleGradient(developer.role);

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    
    Animated.timing(flipValue, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  const frontRotateY = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handleSocialLink = (url: string) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(formattedUrl);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      // Handle YYYY-MM format explicitly to avoid month parsing issues
      if (dateString.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1); // month is 0-indexed in Date constructor
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      // For other date formats, try normal parsing
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatDateRange = (startDate: string | undefined, endDate: string | undefined, current: boolean | undefined): string => {
    const start = formatDate(startDate);
    if (current) {
      return start ? `${start} - Present` : 'Present';
    }
    const end = formatDate(endDate);
    if (start && end) {
      return `${start} - ${end}`;
    } else if (start) {
      return start;
    } else if (end) {
      return end;
    }
    return '';
  };

  const SkillBadge = ({ skill, isTopSkill = false }: { skill: Skill; isTopSkill?: boolean }) => (
    <View style={[styles.skillBadge, isTopSkill && styles.topSkillBadge]}>
      <Text style={[styles.skillText, isTopSkill && styles.topSkillText]}>{skill.name}</Text>
    </View>
  );

  const EducationCard = ({ education }: { education: Education }) => (
    <View style={styles.detailCard}>
      <Ionicons name="school" size={16} color="#666" />
      <View style={styles.detailCardContent}>
        <Text style={styles.detailCardTitle}>{education.school_name}</Text>
        {(education.degree || education.major) && (
          <Text style={styles.detailCardSubtitle}>
            {[education.degree, education.major].filter(Boolean).join(' in ')}
          </Text>
        )}
      </View>
    </View>
  );

  const ExperienceCard = ({ experience }: { experience: WorkExperience }) => (
    <View style={styles.detailCard}>
      <Ionicons name="briefcase" size={16} color="#666" />
      <View style={styles.detailCardContent}>
        <Text style={styles.detailCardTitle}>{experience.position}</Text>
        <Text style={styles.detailCardSubtitle}>{experience.company}</Text>
        {(experience.startDate || experience.endDate || experience.current) && (
          <Text style={styles.detailCardDate}>
            {formatDateRange(experience.startDate, experience.endDate, experience.current)}
          </Text>
        )}
        {experience.description && (
          <Text style={styles.detailCardDescription}>{experience.description}</Text>
        )}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    flipContainer: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      position: 'relative',
    },
    cardSide: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    frontSide: {
      transform: [{ rotateY: frontRotateY }],
    },
    backSide: {
      transform: [{ rotateY: backRotateY }],
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
      marginBottom: 0,
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
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
    },
    sectionContainer: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    
    // Skills
    topSkillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    allSkillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
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
      lineHeight: 20,
      color: '#666',
    },
    
    // Tap hint
    tapHint: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
      color: '#999',
      position: 'absolute',
      bottom: 8,
      left: 20,
      right: 20,
    },
    
    // Education
    educationCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    educationDetails: {
      marginLeft: 8,
      flex: 1,
    },
    educationText: {
      fontSize: 12,
      color: '#333',
    },
    educationSchool: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333',
    },
    
    // Work Experience
    workExperienceCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    workExperienceDetails: {
      marginLeft: 8,
      flex: 1,
    },
    workExperienceRole: {
      fontSize: 11,
      color: '#666',
      marginTop: 2,
    },
    workExperienceCompany: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333',
    },
    workExperienceYears: {
      fontSize: 11,
      color: '#666',
      marginTop: 2,
    },

    // Back side specific styles
    backHeader: {
      height: '18%',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    backHeaderText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    backSubText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      marginTop: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // Back side info section
    backInfoSection: {
      height: '82%',
      backgroundColor: '#f8f9fa',
      position: 'relative',
    },
    
    // Social Links
    socialLinksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    socialLink: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    socialLinkText: {
      fontSize: 12,
      color: '#333',
      fontWeight: '500',
      marginLeft: 6,
    },
    backEducationSchool: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333',
    },
    backEducationDegree: {
      fontSize: 12,
      color: '#666',
    },
    backWorkCompany: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#333',
    },
    backWorkRole: {
      fontSize: 11,
      color: '#666',
      marginTop: 2,
    },
    backWorkYears: {
      fontSize: 11,
      color: '#666',
      marginTop: 2,
    },

    // New styles for detail cards
    detailCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 8,
    },
    detailCardContent: {
      marginLeft: 8,
      flex: 1,
    },
    detailCardTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
    },
    detailCardSubtitle: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },
    detailCardDate: {
      fontSize: 11,
      color: '#999',
      marginTop: 4,
      fontStyle: 'italic',
    },
    detailCardDescription: {
      fontSize: 12,
      color: '#666',
      marginTop: 6,
      lineHeight: 16,
    },
  });

  const renderFrontSide = () => (
    <Animated.View style={[styles.cardSide, styles.frontSide]}>
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

      {/* Bottom Half - Non-scrollable Information */}
      <View style={styles.infoSection}>
        <ScrollView 
          key={frontScrollKey}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={Platform.OS === 'android'}
          bounces={Platform.OS === 'ios'}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          maintainVisibleContentPosition={null}
        >
          {/* About Section */}
          {developer.bio && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText} numberOfLines={2} ellipsizeMode="tail">{developer.bio}</Text>
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
          {(developer.educationEntries?.length || developer.education) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Education</Text>
              {developer.educationEntries?.length ? (
                <View style={styles.educationCard}>
                  <Ionicons name="school" size={16} color="#666" />
                  <View style={styles.educationDetails}>
                    <Text style={styles.educationSchool}>
                      {developer.educationEntries[0].school_name}
                    </Text>
                    {(developer.educationEntries[0].degree || developer.educationEntries[0].major) && (
                      <Text style={styles.educationText}>
                        {[developer.educationEntries[0].degree, developer.educationEntries[0].major].filter(Boolean).join(' in ')}
                      </Text>
                    )}
                  </View>
                </View>
              ) : developer.education ? (
                <View style={styles.educationCard}>
                  <Ionicons name="school" size={16} color="#666" />
                  <View style={styles.educationDetails}>
                    {developer.education.includes(',') ? (
                      <>
                        <Text style={styles.educationSchool}>
                          {developer.education.split(',')[1].trim()}
                        </Text>
                        <Text style={styles.educationText}>
                          {developer.education.split(',')[0].trim()}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.educationText}>{developer.education}</Text>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* Work Experience */}
          {(developer.workExperiences?.length || developer.company) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {developer.workExperiences?.length ? (
                <View style={styles.workExperienceCard}>
                  <Ionicons name="briefcase" size={16} color="#666" />
                  <View style={styles.workExperienceDetails}>
                    <Text style={styles.workExperienceCompany}>{developer.workExperiences[0].company}</Text>
                    <Text style={styles.workExperienceRole}>
                      {developer.workExperiences[0].position}
                      {developer.workExperiences[0].startDate && (
                        `, ${formatDateRange(developer.workExperiences[0].startDate, developer.workExperiences[0].endDate, developer.workExperiences[0].current)}`
                      )}
                    </Text>
                  </View>
                </View>
              ) : developer.company ? (
                <View style={styles.workExperienceCard}>
                  <Ionicons name="briefcase" size={16} color="#666" />
                  <View style={styles.workExperienceDetails}>
                    <Text style={styles.workExperienceCompany}>{developer.company}</Text>
                    <Text style={styles.workExperienceRole}>
                      {developer.position || developer.role}
                      {developer.experience && `, ${developer.experience} year${developer.experience !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* Tap hint */}
          <Text style={styles.tapHint}>
            Tap to see more details
          </Text>
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderBackSide = () => (
    <Animated.View style={[styles.cardSide, styles.backSide]}>
      {/* Header with same gradient as front */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backHeader}
      >
        <Text style={styles.backHeaderText}>{developer.name}</Text>
        <Text style={styles.backSubText}>Complete Profile</Text>
      </LinearGradient>

      {/* Detailed Information */}
      <View style={styles.backInfoSection}>
        <ScrollView 
          key={backScrollKey}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={Platform.OS === 'android'}
          bounces={Platform.OS === 'ios'}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          maintainVisibleContentPosition={null}
        >
          {/* About Me Section */}
          {developer.bio && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.bioText}>{developer.bio}</Text>
            </View>
          )}

          {/* All Skills */}
          {developer.skills.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>All Skills ({developer.skills.length})</Text>
              <View style={styles.allSkillsContainer}>
                {developer.skills.map((skill, index) => (
                  <SkillBadge key={index} skill={skill} />
                ))}
              </View>
            </View>
          )}

          {/* Education - Use rich data if available, fallback to simple */}
          {(developer.educationEntries?.length || developer.education) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Education</Text>
              {developer.educationEntries?.length ? (
                developer.educationEntries.map((edu, index) => (
                  <EducationCard key={index} education={edu} />
                ))
              ) : developer.education ? (
                <View style={styles.educationCard}>
                  <Ionicons name="school" size={16} color="#666" />
                  <View style={styles.educationDetails}>
                    {developer.education.includes(',') ? (
                      <>
                        <Text style={styles.educationSchool}>
                          {developer.education.split(',')[1].trim()}
                        </Text>
                        <Text style={styles.educationText}>
                          {developer.education.split(',')[0].trim()}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.educationText}>{developer.education}</Text>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* Work Experience - Use rich data if available, fallback to simple */}
          {(developer.workExperiences?.length || developer.company) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {developer.workExperiences?.length ? (
                developer.workExperiences.map((exp, index) => (
                  <ExperienceCard key={index} experience={exp} />
                ))
              ) : developer.company ? (
                <View style={styles.workExperienceCard}>
                  <Ionicons name="briefcase" size={16} color="#666" />
                  <View style={styles.workExperienceDetails}>
                    <Text style={styles.workExperienceCompany}>{developer.company}</Text>
                    <Text style={styles.workExperienceRole}>
                      {developer.position || developer.role}
                      {developer.experience && `, ${developer.experience} year${developer.experience !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* Social Links */}
          {(developer.github || developer.linkedin || developer.website) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Connect</Text>
              <View style={styles.socialLinksContainer}>
                {developer.github && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink(developer.github!)}
                  >
                    <Ionicons name="logo-github" size={20} color="#333" />
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {developer.linkedin && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink(developer.linkedin!)}
                  >
                    <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                    <Text style={styles.socialLinkText}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {developer.website && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => handleSocialLink(developer.website!)}
                  >
                    <Ionicons name="globe" size={20} color="#007AFF" />
                    <Text style={styles.socialLinkText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Tap hint */}
        <Text style={styles.tapHint}>
          Tap to go back
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        flipCard();
      }
    }}>
      <View style={styles.card}>
        <View style={styles.flipContainer}>
          {renderFrontSide()}
          {renderBackSide()}
        </View>
      </View>
    </TapGestureHandler>
  );
} 