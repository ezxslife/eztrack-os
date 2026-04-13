/**
 * SyncProgressBar: Progress bar shown during offline sync.
 * Displays sync progress as an animated bar at the top of the screen.
 */

import { useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors, useThemeTypography } from '@/theme';

interface SyncProgressBarProps {
  visible: boolean;
  progress: number; // 0 to 1
  label?: string; // e.g., "Syncing 3 of 12..."
}

const ANIMATION_DURATION = 300;

export function SyncProgressBar({ visible, progress, label }: SyncProgressBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const typography = useThemeTypography();

  // Animated values
  const progressAnim = new Animated.Value(progress);
  const opacityAnim = new Animated.Value(visible ? 1 : 0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, progress, progressAnim, opacityAnim]);

  if (!visible) {
    return null;
  }

  const progressPercent = Math.max(0, Math.min(100, progress * 100));

  // Indeterminate animation (0.15 to 0.85 sweep, 2s cycle)
  const isIndeterminate = progress === 0;
  const indeterminateAnim = new Animated.Value(0);

  useEffect(() => {
    if (isIndeterminate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isIndeterminate, indeterminateAnim]);

  const barWidth = isIndeterminate
    ? indeterminateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['15%', '85%'],
      })
    : `${progressPercent}%`;

  const barLeftIndeterminate = isIndeterminate
    ? indeterminateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '85%'],
      })
    : undefined;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          paddingTop: insets.top,
          backgroundColor: colors.backgroundSecondary,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.barContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: colors.primary,
              width: barWidth as any,
              left: barLeftIndeterminate as any,
            },
          ]}
        />
      </View>

      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[typography.caption2, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1051, // Above most UI
  },
  barContainer: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    height: 3,
    width: '0%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
