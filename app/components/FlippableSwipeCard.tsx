import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    Platform,
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
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(flipAnimation, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
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
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: downwardOffset,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(rotateZ, {
          toValue: rotationValue,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const resetPosition = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotateZ.setValue(0);
  };

  const isSmallScreen = screenHeight < 700;

  const frontAnimatedStyle = {
    transform: [
      { 
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }) 
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      { 
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }) 
      },
    ],
  };

  const cardAnimatedStyle = {
    transform: [
      { translateX },
      { translateY },
      { 
        rotate: rotateZ.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-30deg', '0deg', '30deg'],
        }) 
      },
    ],
  };

  const renderFrontCard = () => (
    <Animated.View style={[styles.cardFace, styles.frontCard, frontAnimatedStyle]}>
      <TouchableOpacity onPress={flipCard} style={styles.cardContent} activeOpacity={0.95}>
        <View style={styles.imageContainer}>
          {developer.avatarUrl ? (
            <Image source={{ uri: developer.avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={isSmallScreen ? 60 : 80} color="#999" />
            </View>
          )}
        </View>
        
        <View style={styles.frontInfo}>
          <Text style={[styles.name, isSmallScreen && styles.nameSmall]}>{developer.name}</Text>
          <Text style={[styles.role, isSmallScreen && styles.roleSmall]}>{developer.role}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>{developer.location}</Text>
          </View>
          
          <Text style={styles.experienceText}>{developer.experience} years experience</Text>
          
          <View style={styles.topSkillsContainer}>
            <Text style={[styles.topSkillsTitle, isSmallScreen && styles.topSkillsTitleSmall]}>Top Skills</Text>
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
        
        <View style={styles.flipIndicator}>
          <Ionicons name="refresh-outline" size={18} color="#999" />
          <Text style={styles.flipText}>Tap to see more</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBackCard = () => (
    <Animated.View style={[styles.cardFace, styles.backCard, backAnimatedStyle]}>
      <TouchableOpacity onPress={flipCard} style={styles.cardContent} activeOpacity={0.95}>
        <View style={styles.backHeader}>
          <Text style={[styles.backName, isSmallScreen && styles.backNameSmall]}>{developer.name}</Text>
          <Text style={[styles.backRole, isSmallScreen && styles.backRoleSmall]}>{developer.role}</Text>
        </View>
        
        <View style={styles.detailsContainer}>
          {developer.bio && (
            <>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>About</Text>
              <Text style={[styles.bioText, isSmallScreen && styles.bioTextSmall]}>{developer.bio}</Text>
            </>
          )}
          
          <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>All Skills</Text>
          <View style={styles.allSkillsContainer}>
            {developer.skills.map((skill, index) => (
              <SkillBadge key={index} skill={skill} />
            ))}
          </View>
          
          {(developer.github || developer.linkedin || developer.website) && (
            <View style={styles.socialLinksContainer}>
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
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCard = () => (
    <View style={styles.container}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        {renderFrontCard()}
        {renderBackCard()}
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
    height: CARD_HEIGHT + 80, // Increased space for indicators
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  frontCard: {
    zIndex: 2,
  },
  backCard: {
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    padding: screenHeight < 700 ? 16 : 20, // Responsive padding
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: screenHeight < 700 ? 12 : 16,
  },
  profileImage: {
    width: screenHeight < 700 ? 120 : 150,
    height: screenHeight < 700 ? 120 : 150,
    borderRadius: screenHeight < 700 ? 60 : 75,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: screenHeight < 700 ? 120 : 150,
    height: screenHeight < 700 ? 120 : 150,
    borderRadius: screenHeight < 700 ? 60 : 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frontInfo: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    fontSize: screenHeight < 700 ? 24 : 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  nameSmall: {
    fontSize: 22,
  },
  role: {
    fontSize: screenHeight < 700 ? 16 : 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: screenHeight < 700 ? 8 : 10,
  },
  roleSmall: {
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: screenHeight < 700 ? 16 : 20,
  },
  topSkillsContainer: {
    width: '100%',
    marginTop: screenHeight < 700 ? 12 : 16,
  },
  topSkillsTitle: {
    fontSize: screenHeight < 700 ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  topSkillsTitleSmall: {
    fontSize: 16,
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
  flipIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 12,
  },
  flipText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  backHeader: {
    alignItems: 'center',
    marginBottom: screenHeight < 700 ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backName: {
    fontSize: screenHeight < 700 ? 22 : 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  backNameSmall: {
    fontSize: 20,
  },
  backRole: {
    fontSize: screenHeight < 700 ? 14 : 16,
    color: '#666',
  },
  backRoleSmall: {
    fontSize: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: screenHeight < 700 ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: screenHeight < 700 ? 12 : 14,
  },
  sectionTitleSmall: {
    fontSize: 14,
  },
  bioText: {
    fontSize: screenHeight < 700 ? 14 : 16,
    lineHeight: screenHeight < 700 ? 20 : 22,
    color: '#666',
    marginBottom: 12,
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
  socialLinksContainer: {
    marginTop: screenHeight < 700 ? 12 : 14,
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
    paddingTop: 16,
    width: '100%',
    position: 'absolute',
    bottom: 0,
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