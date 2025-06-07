import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

// Better mobile responsiveness - account for safe areas and navigation
const getCardDimensions = () => {
  const isSmallScreen = screenHeight < 700; // iPhone SE, etc.
  const isVerySmallScreen = screenHeight < 600;
  
  const cardWidth = Math.min(screenWidth - 32, 400); // Max width with padding
  
  let cardHeight;
  if (isVerySmallScreen) {
    cardHeight = screenHeight * 0.55; // Smaller for very small screens
  } else if (isSmallScreen) {
    cardHeight = screenHeight * 0.6; // Smaller for small screens
  } else {
    cardHeight = screenHeight * 0.65; // Standard for larger screens
  }
  
  // Ensure minimum usable height
  cardHeight = Math.max(cardHeight, 480);
  
  return { cardWidth, cardHeight };
};

const { cardWidth: CARD_WIDTH, cardHeight: CARD_HEIGHT } = getCardDimensions();
const SWIPE_THRESHOLD = 120;
const isSmallScreen = screenHeight < 700;

const SkillBadge = ({ skill }: { skill: Skill }) => (
  <View style={styles.skillBadge}>
    <Text style={styles.skillText}>{skill.name}</Text>
    <Text style={styles.skillLevel}>{skill.level}</Text>
  </View>
);

export default function FlippableSwipeCard({ 
  developer, 
  onSwipeLeft, 
  onSwipeRight 
}: FlippableSwipeCardProps) {
  const [scrollY, setScrollY] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const scrollIndicatorOpacity = useRef(new Animated.Value(1)).current;

  // Hide scroll indicator when scrolled
  useEffect(() => {
    Animated.timing(scrollIndicatorOpacity, {
      toValue: scrollY > 50 ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [scrollY]);

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
        
        // Calculate fixed motion path
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
      // During dragging, create fixed motion path based on X translation only
      const progress = Math.abs(event.nativeEvent.translationX) / SWIPE_THRESHOLD;
      const clampedProgress = Math.min(progress, 1);
      
      // Fixed downward motion that increases with horizontal movement
      const downwardOffset = clampedProgress * 50;
      
      // Fixed rotation based on direction and progress
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

  const renderScrollableCard = () => (
    <View style={styles.card}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          setScrollY(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        {/* Initial view content - Tinder-style layout */}
        <View style={styles.initialView}>
          {/* Large hero image */}
          <View style={styles.heroImageContainer}>
            {developer.avatarUrl ? (
              <Image source={{ uri: developer.avatarUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.placeholderHeroImage}>
                <Ionicons name="person" size={isSmallScreen ? 80 : 100} color="#999" />
              </View>
            )}
            
            {/* Gradient overlay for text readability */}
            <View style={styles.imageOverlay} />
            
            {/* Text overlay on image */}
            <View style={styles.imageTextOverlay}>
              <Text style={[styles.heroName, isSmallScreen && styles.heroNameSmall]}>{developer.name}</Text>
              <Text style={[styles.heroAge, isSmallScreen && styles.heroAgeSmall]}>
                {developer.experience} years experience
              </Text>
            </View>
          </View>
          
          {/* Compact info section */}
          <View style={styles.compactInfo}>
            <Text style={[styles.role, isSmallScreen && styles.roleSmall]}>{developer.role}</Text>
            
            <View style={styles.infoDetails}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>{developer.location}</Text>
              </View>
              
              {developer.company && (
                <View style={styles.companyContainer}>
                  <Ionicons name="business-outline" size={16} color="#666" />
                  <Text style={styles.companyText}>{developer.company}</Text>
                </View>
              )}
              
              {developer.education && (
                <View style={styles.educationContainer}>
                  <Ionicons name="school-outline" size={16} color="#666" />
                  <Text style={styles.educationText}>{developer.education}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.topSkillsContainer}>
              <View style={styles.topSkillsList}>
                {developer.skills.slice(0, 3).map((skill, index) => (
                  <View key={index} style={styles.topSkillBadge}>
                    <Text style={styles.topSkillText}>{skill.name}</Text>
                  </View>
                ))}
                {developer.skills.length > 3 && (
                  <View style={styles.moreSkillsBadge}>
                    <Text style={styles.moreSkillsText}>+{developer.skills.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Scroll indicator */}
        <Animated.View 
          style={[
            styles.scrollIndicator, 
            { opacity: scrollIndicatorOpacity }
          ]}
        >
          <Ionicons name="chevron-down" size={20} color="#007AFF" />
          <Text style={styles.scrollText}>Scroll to view more</Text>
        </Animated.View>

        {/* Detailed content */}
        <View style={styles.detailsSection}>
          {developer.bio && (
            <View style={styles.detailBlock}>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>About</Text>
              <Text style={[styles.bioText, isSmallScreen && styles.bioTextSmall]}>{developer.bio}</Text>
            </View>
          )}
          
          <View style={styles.detailBlock}>
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>All Skills</Text>
            <View style={styles.allSkillsContainer}>
              {developer.skills.map((skill, index) => (
                <SkillBadge key={index} skill={skill} />
              ))}
            </View>
          </View>
          
          {(developer.github || developer.linkedin || developer.website) && (
            <View style={styles.detailBlock}>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Connect</Text>
              <View style={styles.socialLinks}>
                {developer.github && (
                  <View style={styles.socialLink}>
                    <Ionicons name="logo-github" size={16} color="#333" />
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </View>
                )}
                {developer.linkedin && (
                  <View style={styles.socialLink}>
                    <Ionicons name="logo-linkedin" size={16} color="#0077B5" />
                    <Text style={styles.socialLinkText}>LinkedIn</Text>
                  </View>
                )}
                {developer.website && (
                  <View style={styles.socialLink}>
                    <Ionicons name="globe-outline" size={16} color="#333" />
                    <Text style={styles.socialLinkText}>Website</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderCard = () => (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
        {renderScrollableCard()}
      </Animated.View>
      
      {/* Swipe indicators - positioned better for mobile */}
      <View style={styles.swipeIndicators}>
        <View style={styles.swipeHint}>
          <Ionicons name="arrow-back" size={isSmallScreen ? 20 : 24} color="#ff4d4d" />
          <Text style={[styles.swipeHintText, isSmallScreen && styles.swipeHintTextSmall]}>Not Interested</Text>
        </View>
        <View style={styles.swipeHint}>
          <Text style={[styles.swipeHintText, isSmallScreen && styles.swipeHintTextSmall]}>Interested</Text>
          <Ionicons name="arrow-forward" size={isSmallScreen ? 20 : 24} color="#4dd964" />
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
    height: CARD_HEIGHT + 60, // Reduced from 120 to eliminate whitespace
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
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  initialView: {
    height: CARD_HEIGHT - 40, // Leave space for scroll indicator
    padding: 0, // Remove padding to let image extend to edges
    flexDirection: 'column',
  },
  heroImageContainer: {
    position: 'relative',
    width: '100%',
    height: '55%', // Reduced from 70% to give more space to skills
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderHeroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'flex-start',
  },
  heroName: {
    fontSize: screenHeight < 700 ? 28 : 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroNameSmall: {
    fontSize: 26,
  },
  heroAge: {
    fontSize: screenHeight < 700 ? 16 : 18,
    color: 'white',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroAgeSmall: {
    fontSize: 14,
  },
  compactInfo: {
    flex: 1,
    padding: screenHeight < 700 ? 16 : 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  role: {
    fontSize: screenHeight < 700 ? 18 : 20,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: screenHeight < 700 ? 8 : 10,
  },
  roleSmall: {
    fontSize: 16,
  },
  infoDetails: {
    alignItems: 'center',
    marginBottom: screenHeight < 700 ? 12 : 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  educationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  educationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  topSkillsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
  },
  topSkillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  topSkillBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  topSkillText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  moreSkillsBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  moreSkillsText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: -20,
  },
  scrollText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  detailsSection: {
    padding: screenHeight < 700 ? 16 : 20,
    paddingTop: 0,
  },
  detailBlock: {
    marginBottom: screenHeight < 700 ? 20 : 24,
  },
  sectionTitle: {
    fontSize: screenHeight < 700 ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 14,
  },
  bioText: {
    fontSize: screenHeight < 700 ? 14 : 16,
    lineHeight: screenHeight < 700 ? 20 : 22,
    color: '#666',
  },
  bioTextSmall: {
    fontSize: 12,
    lineHeight: 18,
  },
  allSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#f0f0f0',
    padding: screenHeight < 700 ? 8 : 10,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: screenHeight < 700 ? 12 : 14,
    fontWeight: 'bold',
    color: '#333',
  },
  skillLevel: {
    fontSize: screenHeight < 700 ? 10 : 12,
    color: '#666',
    marginTop: 2,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  socialLinkText: {
    fontSize: screenHeight < 700 ? 12 : 14,
    color: '#333',
    marginLeft: 4,
  },
  swipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
    position: 'absolute',
    bottom: -20,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: screenHeight < 700 ? 12 : 14,
    color: '#999',
    marginHorizontal: 6,
  },
  swipeHintTextSmall: {
    fontSize: 11,
  },
}); 