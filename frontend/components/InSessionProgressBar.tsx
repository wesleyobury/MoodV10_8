import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { getEquipmentIcon, getDescriptionSnippet } from '../utils/inSessionProgress';

export interface InSessionExercise {
  workoutName?: string;
  name?: string;
  equipment?: string;
  description?: string;
  workoutType?: string;
}

interface InSessionProgressBarProps {
  exercises: InSessionExercise[];
  currentIndex: number;
  workoutTitle?: string;
}

const ITEM_WIDTH = 76;
const ITEM_GAP = 12;
const SCROLL_PADDING = 16;

export default function InSessionProgressBar({
  exercises,
  currentIndex,
  workoutTitle,
}: InSessionProgressBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll: try to pin active to position 2 of 4; clamp at edges.
  useEffect(() => {
    if (!scrollRef.current) return;
    const itemAdvance = ITEM_WIDTH + ITEM_GAP;
    // Pin to position-2 of 4 (i.e. index-1 from left) when possible.
    const targetOffset = Math.max(0, (currentIndex - 1) * itemAdvance);
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetOffset, animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [currentIndex]);

  // Animate expand/collapse
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  // Swipe-down / swipe-up gesture handler on the chevron strip.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 12) setExpanded(true);
        else if (g.dy < -12) setExpanded(false);
      },
    })
  ).current;

  const currentExercise = exercises[currentIndex];
  const descriptionSnippet = useMemo(
    () => getDescriptionSnippet(currentExercise?.description),
    [currentExercise]
  );

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <View
      style={styles.container}
      testID="in-session-progress-bar"
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        testID="in-session-progress-scroll"
      >
        {exercises.map((ex, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          const isUpcoming = idx > currentIndex;
          const iconName = getEquipmentIcon(ex.equipment);
          const label = ex.equipment || ex.workoutName || ex.name || `Step ${idx + 1}`;

          return (
            <View
              key={`${label}-${idx}`}
              style={styles.stepItem}
              testID={`in-session-step-${idx}`}
            >
              {isActive ? (
                <View style={styles.circleWrap}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.circleActive}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={iconName} size={14} color="#0c0c0c" />
                  </LinearGradient>
                </View>
              ) : isCompleted ? (
                <View style={styles.circleWrap}>
                  <View style={styles.circleCompleted}>
                    <Ionicons name="checkmark" size={14} color="#0c0c0c" />
                  </View>
                </View>
              ) : (
                <View style={styles.circleWrap}>
                  <View style={styles.circleUpcoming}>
                    <Ionicons name={iconName} size={14} color="rgba(255, 215, 0, 0.7)" />
                  </View>
                </View>
              )}
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isUpcoming && styles.stepLabelUpcoming,
                ]}
                numberOfLines={2}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Chevron / swipe affordance */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded((v) => !v)}
        style={styles.chevronStrip}
        testID="in-session-progress-chevron"
        {...panResponder.panHandlers}
      >
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(255, 215, 0, 0.7)"
        />
      </TouchableOpacity>

      {/* Expandable detail panel */}
      <Animated.View
        style={[styles.detailPanel, { maxHeight: expandedHeight }]}
        testID="in-session-progress-detail"
      >
        <View style={styles.detailInner}>
          {currentExercise?.equipment ? (
            <Text style={styles.detailEquipment} numberOfLines={1}>
              {currentExercise.equipment}
            </Text>
          ) : null}
          {workoutTitle || currentExercise?.workoutType ? (
            <Text style={styles.detailTitle} numberOfLines={1}>
              {workoutTitle || currentExercise?.workoutType}
            </Text>
          ) : null}
          {descriptionSnippet ? (
            <Text style={styles.detailDescription} numberOfLines={3}>
              {descriptionSnippet}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: SCROLL_PADDING,
    gap: ITEM_GAP,
    alignItems: 'flex-start',
  },
  stepItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  circleWrap: {
    marginBottom: 4,
  },
  circleActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.55)',
  },
  circleUpcoming: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    backgroundColor: 'transparent',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 13,
  },
  stepLabelActive: {
    color: '#FFD700',
    fontWeight: '700',
  },
  stepLabelUpcoming: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  chevronStrip: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  detailPanel: {
    overflow: 'hidden',
  },
  detailInner: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 4,
  },
  detailEquipment: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
  },
  detailDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 18,
  },
});
