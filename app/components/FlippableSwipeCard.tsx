import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { Developer, Skill } from '../models/Developer';

interface FlippableSwipeCardProps {
  developer: Developer;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const getCardDimensions = () => {
  const cardWidth = screenWidth * 0.92; // Slightly more width usage for mobile
  
  // Calculate available height after UI elements
  // SafeAreaView + Header + Search + Content padding + Tab bar ≈ 250-280px
  const uiSpaceEstimate = Platform.OS === 'ios' ? 270 : 250;
  const availableHeight = screenHeight - uiSpaceEstimate;
  
  // Use 88% of available height, with min/max constraints
  const cardHeight = Math.min(
    Math.max(availableHeight * 0.88, 430), // Min 430px
    screenHeight * 0.70 // Max 70% of screen height
  );
  
  return { cardWidth, cardHeight };
};

const { cardWidth: CARD_WIDTH, cardHeight: CARD_HEIGHT } = getCardDimensions();
const SWIPE_THRESHOLD = 120;
const isSmallScreen = screenHeight < 700;

// Generate dynamic gradient colors based on developer role
const getRoleGradient = (role: string): [string, string] => {
  const gradients: Record<string, [string, string]> = {
    'Frontend Developer': ['#667eea', '#764ba2'],
    'Backend Developer': ['#f093fb', '#f5576c'],
    'Full Stack Developer': ['#4facfe', '#00f2fe'],
    'Mobile Developer': ['#43e97b', '#38f9d7'],
    'DevOps Engineer': ['#fa709a', '#fee140'],
    'Data Scientist': ['#a8edea', '#fed6e3'],
    'UI/UX Designer': ['#ffecd2', '#fcb69f'],
    'Software Engineer': ['#667eea', '#764ba2'],
    default: ['#667eea', '#764ba2']
  };
  
  return gradients[role] || gradients.default;
};

const SkillBadge = ({ skill, isTopSkill = false }: { skill: Skill; isTopSkill?: boolean }) => (
  <View style={[styles.skillBadge, isTopSkill && styles.topSkillBadge]}>
    <Text style={[styles.skillText, isTopSkill && styles.topSkillText]}>{skill.name}</Text>
  </View>
);

export default function FlippableSwipeCard({ 
  developer, 
  onSwipeLeft, 
  onSwipeRight 
}: FlippableSwipeCardProps) {
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;

  // Calculate blur opacity based on distance from bottom
  const getBlurOpacity = () => {
    if (contentHeight === 0 || scrollViewHeight === 0) return 1;
    
    const distanceFromBottom = contentHeight - scrollY - scrollViewHeight;
    const fadeThreshold = 100; // Start fading when 100px from bottom
    
    if (distanceFromBottom <= 0) return 0; // At bottom
    if (distanceFromBottom >= fadeThreshold) return 1; // Far from bottom
    
    // Fade out as we approach bottom
    return distanceFromBottom / fadeThreshold;
  };

  const handleSwipeEnd = (translationX: number) => {
    if (translationX > SWIPE_THRESHOLD) {
      // Swipe right - animate to bottom-right
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight * 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateZ, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSwipeRight();
        resetPosition();
      });
    } else if (translationX < -SWIPE_THRESHOLD) {
      // Swipe left - animate to bottom-left
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight * 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateZ, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSwipeLeft();
        resetPosition();
      });
    } else {
      // Return to center
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(rotateZ, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  };

  // Web-compatible PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
        
        // Calculate rotation and vertical movement
        const progress = Math.abs(gestureState.dx) / SWIPE_THRESHOLD;
        const clampedProgress = Math.min(progress, 1);
        const downwardOffset = clampedProgress * 50;
        const rotationValue = (gestureState.dx / SWIPE_THRESHOLD) * 0.3;
        
        translateY.setValue(downwardOffset);
        rotateZ.setValue(rotationValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        handleSwipeEnd(gestureState.dx);
      },
    })
  ).current;

  // Mobile gesture handler
  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      handleSwipeEnd(event.nativeEvent.translationX);
    } else {
      const progress = Math.abs(event.nativeEvent.translationX) / SWIPE_THRESHOLD;
      const clampedProgress = Math.min(progress, 1);
      const downwardOffset = clampedProgress * 50;
      const rotationValue = (event.nativeEvent.translationX / SWIPE_THRESHOLD) * 0.3;
      
      translateY.setValue(downwardOffset);
      rotateZ.setValue(rotationValue);
    }
  };

  const resetPosition = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotateZ.setValue(0);
  };

  // Add animated button press handlers
  const handlePassPress = () => {
    // Animate card to the left like a swipe
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight * 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateZ, {
        toValue: -1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSwipeLeft();
      resetPosition();
    });
  };

  const handleConnectPress = () => {
    // Animate card to the right like a swipe
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight * 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotateZ, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSwipeRight();
      resetPosition();
    });
  };

  const cardAnimatedStyle = {
    transform: [
      { translateX },
      { translateY },
      { 
        rotate: rotateZ.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-15deg', '15deg'],
        })
      },
    ],
  };

  const gradientColors = getRoleGradient(developer.role);

  const renderTradingCard = () => (
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
          {/* Quick Info Cards */}
          <View style={styles.quickInfoContainer}>
            {developer.location && (
              <View style={styles.quickInfoCard}>
                <Ionicons name="location" size={16} color="#007AFF" />
                <Text style={styles.quickInfoText}>{developer.location}</Text>
              </View>
            )}
            {developer.company && (
              <View style={styles.quickInfoCard}>
                <Ionicons name="business" size={16} color="#34C759" />
                <Text style={styles.quickInfoText}>{developer.company}</Text>
              </View>
            )}
          </View>

          {/* Top Skills */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Skills</Text>
            <View style={styles.topSkillsContainer}>
              {developer.skills.slice(0, 3).map((skill, index) => (
                <SkillBadge key={index} skill={skill} isTopSkill={true} />
              ))}
            </View>
          </View>

          {/* About Section */}
          {developer.bio && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{developer.bio}</Text>
            </View>
          )}

          {/* All Skills */}
          {developer.skills.length > 3 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>All Skills ({developer.skills.length})</Text>
              <View style={styles.allSkillsContainer}>
                {developer.skills.map((skill, index) => (
                  <SkillBadge key={index} skill={skill} />
                ))}
              </View>
            </View>
          )}

          {/* Education */}
          {developer.education && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.educationCard}>
                <Ionicons name="school" size={18} color="#666" />
                <Text style={styles.educationText}>{developer.education}</Text>
              </View>
            </View>
          )}

          {/* Social Links */}
          {(developer.github || developer.linkedin || developer.website) && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Connect</Text>
              <View style={styles.socialLinksContainer}>
                {developer.github && (
                  <View style={styles.socialLink}>
                    <Ionicons name="logo-github" size={20} color="#333" />
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </View>
                )}
                {developer.linkedin && (
                  <View style={styles.socialLink}>
                    <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                    <Text style={styles.socialLinkText}>LinkedIn</Text>
                  </View>
                )}
                {developer.website && (
                  <View style={styles.socialLink}>
                    <Ionicons name="globe" size={20} color="#007AFF" />
                    <Text style={styles.socialLinkText}>Website</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Dynamic blur gradient overlay */}
        <View style={[styles.blurContainer, { opacity: getBlurOpacity() }]}>
          <LinearGradient
            colors={[
              'rgba(248, 249, 250, 0)', 
              'rgba(248, 249, 250, 0.3)', 
              'rgba(248, 249, 250, 0.8)', 
              'rgba(248, 249, 250, 1)'
            ]}
            style={styles.blurGradient}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );

  const renderCard = () => (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
        {renderTradingCard()}
      </Animated.View>
      
      {/* Swipe indicators */}
      <View style={styles.swipeIndicators}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handlePassPress} style={[styles.swipeButton, styles.passButton]}>
            <Ionicons name="close" size={20} color="#ff6b6b" />
            <Text style={[styles.swipeButtonText, styles.passButtonText]}>Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConnectPress} style={[styles.swipeButton, styles.connectButton]}>
            <Ionicons name="heart" size={20} color="#51cf66" />
            <Text style={[styles.swipeButtonText, styles.connectButtonText]}>Connect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Use PanGestureHandler for mobile, PanResponder for web
  if (Platform.OS === 'web') {
    return (
      <Animated.View {...panResponder.panHandlers}>
        {renderCard()}
      </Animated.View>
    );
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      {renderCard()}
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
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
    height: '38%', // Reduced from 42% to make top half smaller
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
    marginBottom: 16,
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
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Info Section (Bottom Half)
  infoSection: {
    height: '62%', // Adjusted to match profile section changes
    backgroundColor: '#f8f9fa', // Light gray instead of white
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  quickInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickInfoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
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

  // Education
  educationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  educationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },

  // Social Links
  socialLinksContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
  },
  socialLinkText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
  },

  // Swipe Indicators
  swipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the buttons
    paddingHorizontal: 30,
    marginTop: 16,
    width: '100%',
    gap: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 90,
    gap: 6,
    // Add hover/active states for web
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  swipeButtonInner: {
    alignItems: 'center',
  },
  swipeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  passButton: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  connectButton: {
    borderColor: '#51cf66',
    backgroundColor: '#f0fdf4',
  },
  passButtonText: {
    color: '#ff6b6b',
  },
  connectButtonText: {
    color: '#51cf66',
  },

  // Dynamic Blur
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  blurGradient: {
    flex: 1,
  },
}); 