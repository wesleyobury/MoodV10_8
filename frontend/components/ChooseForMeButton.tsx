import React, { useEffect, useRef, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';

interface ChooseForMeButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: object;
  variant?: 'workoutType' | 'equipment' | 'muscleGroup';
  noAnimation?: boolean;
  hideOrText?: boolean;
}

const BORDER_RADIUS = 12;

// Background colors matching the respective screens
const COLORS = {
  workoutType: '#1a1a1a',
  equipment: '#111111',
  muscleGroup: '#1a1a1a',
};

export default function ChooseForMeButton({ 
  onPress, 
  disabled = false, 
  style,
  variant = 'workoutType',
  noAnimation = false,
  hideOrText = false
}: ChooseForMeButtonProps) {
  const fadeAnim = useRef(new Animated.Value(variant === 'muscleGroup' || noAnimation ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  const backgroundColor = COLORS[variant];

  // Fade-in on mount - no delay for muscleGroup variant or when noAnimation is true
  useEffect(() => {
    if (variant === 'muscleGroup' || noAnimation) {
      startShimmerAnimation();
      return;
    }
    
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      startShimmerAnimation();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [variant, noAnimation]);

  const startShimmerAnimation = () => {
    shimmerAnim.setValue(0);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      { iterations: -1 }
    ).start();
  };

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  // Shimmer position moves from left to right
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '200%'],
  });

  return (
    <Animated.View 
      style={[
        styles.outerContainer, 
        style,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Divider - can be just a line or "or" with lines */}
      <View style={styles.orDividerContainer}>
        <View style={[styles.orDividerLine, hideOrText && styles.orDividerLineFull]} />
        {!hideOrText && <Text style={styles.orDividerText}>or</Text>}
        {!hideOrText && <View style={styles.orDividerLine} />}
      </View>

      {/* Button wrapper */}
      <View style={styles.buttonWrapper}>
        {/* Subtle border */}
        <View style={[styles.borderGlow, disabled && styles.borderGlowDisabled]} />
        
        {/* Main button content */}
        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor },
            disabled && styles.buttonDisabled
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          {/* Glossy shimmer overlay */}
          {!disabled && (
            <Animated.View 
              style={[
                styles.shimmerContainer,
                {
                  opacity: isPressed ? 0 : 1,
                  transform: [{ translateX: shimmerTranslate }],
                }
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255, 255, 255, 0.03)',
                  'rgba(255, 255, 255, 0.08)',
                  'rgba(255, 255, 255, 0.03)',
                  'transparent',
                ]}
                locations={[0, 0.3, 0.5, 0.7, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}
          
          <View style={styles.content}>
            <Ionicons 
              name="sparkles" 
              size={16} 
              color={disabled ? '#555' : '#FFD700'} 
            />
            <Text style={[styles.text, disabled && styles.textDisabled]}>
              Build for me
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  orDividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
  },
  orDividerLineFull: {
    width: '100%',
  },
  orDividerText: {
    color: 'rgba(150, 150, 150, 0.8)',
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 16,
    textTransform: 'lowercase',
  },
  buttonWrapper: {
    position: 'relative',
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.25)',
    zIndex: 0,
  },
  borderGlowDisabled: {
    borderColor: 'rgba(100, 100, 100, 0.15)',
  },
  button: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    zIndex: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    width: '80%',
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
    zIndex: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  textDisabled: {
    color: '#555',
  },
});
