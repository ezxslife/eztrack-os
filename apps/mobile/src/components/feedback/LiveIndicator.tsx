/**
 * LiveIndicator: Pulsing dot for real-time connections.
 * Shows connection status with animated pulse effect.
 */

import { useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';

import { useThemeColors, useThemeTypography } from '@/theme';

interface LiveIndicatorProps {
  isLive: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

const PULSE_DURATION = 2000; // 2 second pulse cycle

export function LiveIndicator({ isLive, label, size = 'md' }: LiveIndicatorProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const sizeConfig = {
    sm: { dotSize: 8 },
    md: { dotSize: 12 },
  };

  const config = sizeConfig[size];

  // Animated pulse opacity
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLive, pulseAnim]);

  const dotColor = isLive ? colors.success : colors.textTertiary;
  const labelColor = isLive ? colors.textPrimary : colors.textTertiary;

  return (
    <View style={[styles.container, styles[`container_${size}`]]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: config.dotSize,
            height: config.dotSize,
            borderRadius: config.dotSize / 2,
            backgroundColor: dotColor,
            opacity: isLive ? pulseAnim : 1,
          },
        ]}
      />
      {label && (
        <Text style={[typography.caption1, { color: labelColor, fontWeight: '500' }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  container_sm: {
    gap: 4,
  },
  container_md: {
    gap: 6,
  },
  dot: {
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
});
