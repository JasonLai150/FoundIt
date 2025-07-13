import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
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
      height: screenHeight * 0.65, // Increased since buttons are separate
    };
  } else {
    return {
      width: screenWidth * 0.9,
      height: screenHeight * 0.6, // Increased since buttons are separate  
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
    
  const handleSwipeEnd = (translationX: number) => {
    const threshold = CARD_WIDTH * 0.3;
    
    if (translationX > threshold) {
      // Swipe right - like
      animateOut(CARD_WIDTH * 1.5, onSwipeRight);
    } else if (translationX < -threshold) {
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
      ]).start();
  };

  // Pan gesture handlers
  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      handleSwipeEnd(event.nativeEvent.translationX);
    }
  };

  // Pan responder for web
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
      translateY.setValue(gestureState.dy);
      rotate.setValue(gestureState.dx * 0.001);
    },
    onPanResponderRelease: (_, gestureState) => {
      handleSwipeEnd(gestureState.dx);
    },
  });

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
});

export default FlippableSwipeCard; 