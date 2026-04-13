import React, { useEffect } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { GlassAlert } from '@/components/ui/glass/GlassAlert';
import { triggerImpactHaptic } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from '@/theme';

export interface EmergencyAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onAcknowledge: () => void;
}

/**
 * Alert for critical emergency situations.
 * Features:
 * - Red pulsing border animation
 * - Large warning icon
 * - Cannot be dismissed without acknowledging
 * - Continuous strong haptic pattern
 * - Bold red styling
 */
export const EmergencyAlert = ({
  visible,
  title,
  message,
  onAcknowledge,
}: EmergencyAlertProps) => {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();

  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Start shake animation with delay
    const shakeTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 3000);

    // Haptic feedback
    const hapticInterval = setInterval(() => {
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    }, 500);

    return () => {
      clearTimeout(shakeTimer);
      clearInterval(hapticInterval);
    };
  }, [visible, pulseAnim, shakeAnim]);

  if (!visible) return null;

  const borderColorInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.error, colors.warning],
  });

  const opacityInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const shakeTransform = [
    {
      translateX: shakeAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-8, 0, 8],
      }),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    alertContainer: {
      overflow: 'hidden',
      borderRadius: 16,
    },
    pulsingBorder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      borderWidth: 2,
      pointerEvents: 'none',
    },
    alertContent: {
      gap: spacing[2],
    },
    titleContainer: {
      flexDirection: 'row',
      gap: spacing[2],
      alignItems: 'center',
    },
    titleText: {
      ...typography.headline,
      color: colors.error,
      fontWeight: '700',
    },
    messageText: {
      ...typography.body,
      color: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.alertContainer}>
        <Animated.View
          style={[
            styles.pulsingBorder,
            {
              borderColor: borderColorInterpolation,
              opacity: opacityInterpolation,
            },
          ]}
        />
        <Animated.View
          style={[
            {
              transform: shakeTransform,
            },
          ]}
        >
          <View style={styles.alertContent}>
            <View style={styles.titleContainer}>
              <AppSymbol
                iosName="exclamationmark.triangle.fill"
                fallbackName="warning"
                size={48}
                color={colors.error}
              />
              <Text style={styles.titleText}>{title}</Text>
            </View>
            <Text style={styles.messageText}>{message}</Text>
            <View style={{ marginTop: spacing[2] }}>
              <GlassAlert
                tone="error"
                title=""
                message=""
                actions={[
                  {
                    label: 'Acknowledge',
                    onPress: () => {
                      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                      onAcknowledge();
                    },
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};
