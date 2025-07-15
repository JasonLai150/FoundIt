import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { Developer } from '../models/Developer';
import ProfileCard from './ProfileCard';

interface FlippableSwipeCardProps {
  developer: Developer;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export interface FlippableSwipeCardRef {
  handlePassPress: () => void;
  handleConnectPress: () => void;
}

const getCardDimensions = () => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;
  
  if (isLandscape) {
    return {
      width: screenWidth * 0.6,
      height: screenHeight * 0.65,
    };
  } else {
    return {
      width: screenWidth * 0.9,
      height: screenHeight * 0.6,
    };
  }
};

const FlippableSwipeCard = forwardRef<FlippableSwipeCardRef, FlippableSwipeCardProps>(({ 
  developer, 
  onSwipeLeft, 
  onSwipeRight 
}, ref) => {
  const dimensions = getCardDimensions();
  const CARD_WIDTH = dimensions.width;
  const CARD_HEIGHT = dimensions.height;
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
    
  const handleSwipeEnd = (translationX: number, velocityX: number) => {
    const threshold = CARD_WIDTH * 0.3;
    const velocityThreshold = 500;
    
    // Consider velocity for more responsive swiping
    const shouldSwipeRight = translationX > threshold || (translationX > 50 && velocityX > velocityThreshold);
    const shouldSwipeLeft = translationX < -threshold || (translationX < -50 && velocityX < -velocityThreshold);
    
    if (shouldSwipeRight) {
      // Swipe right - like
      animateOut(CARD_WIDTH * 1.5, onSwipeRight);
    } else if (shouldSwipeLeft) {
      // Swipe left - pass
      animateOut(-CARD_WIDTH * 1.5, onSwipeLeft);
    } else {
      // Snap back to center
      resetPosition();
    }
  };

  const animateOut = (toValue: number, callback: () => void) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: toValue > 0 ? 0.3 : -0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      resetPosition();
    });
  };

  const resetPosition = () => {
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
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  // Mobile gesture handlers with true real-time card movement
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX: tx, translationY: ty } = event.nativeEvent;
    
    // Always update position for real-time card movement (Tinder-style)
    translateX.setValue(tx);
    translateY.setValue(ty * 0.5); // Reduce vertical movement for better UX
    
    // Apply visual effects based on horizontal movement
    const rotationValue = tx * 0.0008;
    const scaleValue = 1 - Math.abs(tx * 0.0001);
    const opacityValue = 1 - Math.abs(tx * 0.0008); // Fade as card moves away
    
    rotate.setValue(rotationValue);
    scale.setValue(Math.max(0.9, scaleValue));
    opacity.setValue(Math.max(0.3, opacityValue)); // Don't fade completely
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state } = event.nativeEvent;
    
    if (state === State.END) {
      const { translationX: tx, translationY: ty, velocityX, velocityY } = event.nativeEvent;
      
      // Only trigger swipe if horizontal movement dominates
      const horizontalDominance = Math.abs(tx) > Math.abs(ty) * 1.2;
      const hasHorizontalVelocity = Math.abs(velocityX) > Math.abs(velocityY);
      
      if (horizontalDominance || hasHorizontalVelocity) {
        handleSwipeEnd(tx, velocityX);
      } else {
        // Reset position if it was primarily vertical movement
        resetPosition();
      }
    } else if (state === State.CANCELLED || state === State.FAILED) {
      // Reset position if gesture was cancelled or failed
      resetPosition();
    }
  };

  const handlePassPress = () => {
    animateOut(-CARD_WIDTH * 1.5, onSwipeLeft);
  };

  const handleConnectPress = () => {
    animateOut(CARD_WIDTH * 1.5, onSwipeRight);
  };

  // Expose button handlers to parent component
  useImperativeHandle(ref, () => ({
    handlePassPress,
    handleConnectPress,
  }));

  const cardAnimatedStyle = {
    transform: [
      { translateX },
      { translateY },
      { rotate: rotate.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-30deg', '30deg'],
      }) },
      { scale },
    ],
    opacity,
  };

  const styles = StyleSheet.create({
    container: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardWrapper: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
  });

  const renderCard = () => (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
        <ProfileCard developer={developer} />
      </Animated.View>
    </View>
  );

  // Platform-specific implementations
  if (Platform.OS === 'web') {
    // Web: No gestures, button-only experience
    return renderCard();
  }

  // Mobile: Advanced gesture handling with Tinder-style movement
  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      shouldCancelWhenOutside={false}
      enableTrackpadTwoFingerGesture={false}
      activeOffsetX={[-3, 3]}
      activeOffsetY={[-20, 20]}
      failOffsetY={[-30, 30]}
      minPointers={1}
      maxPointers={1}
      avgTouches={false}
    >
      {renderCard()}
    </PanGestureHandler>
  );
});

FlippableSwipeCard.displayName = 'FlippableSwipeCard';

export default FlippableSwipeCard; 