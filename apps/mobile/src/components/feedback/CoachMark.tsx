/**
 * CoachMark: First-time feature hint overlay with spotlight effect.
 * Shows contextual help overlays with optional step indicators.
 */

import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, View, Pressable, useWindowDimensions, Text } from 'react-native';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { useThemeColors, useThemeSpacing, useThemeTypography } from '@/theme';

interface CoachMarkProps {
  visible: boolean;
  title: string;
  description: string;
  targetRef?: React.RefObject<any>;
  onDismiss: () => void;
  position?: 'above' | 'below';
  step?: number;
  totalSteps?: number;
}

export function CoachMark({
  visible,
  title,
  description,
  targetRef,
  onDismiss,
  position = 'below',
  step,
  totalSteps,
}: CoachMarkProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const dimensions = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const targetLayout = useRef<any>(null);

  // Measure target position if available
  useEffect(() => {
    if (targetRef?.current && typeof targetRef.current.measure === 'function') {
      targetRef.current.measure((x: number, y: number, w: number, h: number, px: number, py: number) => {
        targetLayout.current = { x: px, y: py, width: w, height: h };
      });
    }
  }, [targetRef, visible]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  const hasTarget = targetLayout.current;
  const target = targetLayout.current;
  const spotlightPadding = 8;

  // Calculate tooltip position
  let tooltipTop = 0;
  let tooltipLeft = 0;
  const tooltipWidth = dimensions.width - spacing[4] * 2;
  const tooltipHeight = 140; // Estimated height

  if (hasTarget) {
    if (position === 'below') {
      tooltipTop = target.y + target.height + spotlightPadding + spacing[2];
    } else {
      tooltipTop = Math.max(spacing[2], target.y - tooltipHeight - spotlightPadding);
    }
    tooltipLeft = spacing[2];
  } else {
    // Center tooltip if no target
    tooltipTop = dimensions.height / 2 - tooltipHeight / 2;
    tooltipLeft = spacing[2];
  }

  const showStepIndicator = step != null && totalSteps != null && totalSteps > 1;

  return (
    <Modal transparent visible={visible} onRequestClose={onDismiss} animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        ]}
      >
        {/* Backdrop close */}
        <Pressable style={styles.backdropButton} onPress={onDismiss} />

        {/* Spotlight cutout */}
        {hasTarget && (
          <View
            style={[
              styles.spotlight,
              {
                top: target.y - spotlightPadding,
                left: target.x - spotlightPadding,
                width: target.width + spotlightPadding * 2,
                height: target.height + spotlightPadding * 2,
                borderRadius: 8,
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
          />
        )}

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltipContainer,
            {
              top: tooltipTop,
              left: tooltipLeft,
              width: tooltipWidth,
              opacity: fadeAnim,
            },
          ]}
        >
          <MaterialSurface variant="chrome" padding={spacing[3]}>
            <View style={styles.content}>
              {/* Header with title and close */}
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    {title}
                  </Text>
                </View>
                <Pressable onPress={onDismiss} style={styles.closeButton} hitSlop={8}>
                  <AppSymbol iosName="xmark" fallbackName="close" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Description */}
              <Text style={[typography.body, { color: colors.textSecondary }, styles.description]}>
                {description}
              </Text>

              {/* Footer with step indicator and button */}
              <View style={styles.footer}>
                {showStepIndicator && (
                  <Text style={[typography.caption1, { color: colors.textTertiary }]}>
                    {step} of {totalSteps}
                  </Text>
                )}
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={onDismiss}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.textInverse, fontWeight: '500' }]}>
                    Got it
                  </Text>
                </Pressable>
              </View>
            </View>
          </MaterialSurface>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdropButton: {
    flex: 1,
  },
  spotlight: {
    position: 'absolute',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1400, // Modal layer
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
});
