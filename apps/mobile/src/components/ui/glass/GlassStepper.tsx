/**
 * GlassStepper — Numeric +/- stepper with glass-morphism styling.
 *
 * Three-tier rendering: native GlassView (iOS 26+), BlurView fallback,
 * opaque background. Includes haptic feedback on press and disabled states
 * at min/max bounds.
 *
 * Usage:
 *   <GlassStepper value={count} onValueChange={setCount} min={0} max={10} />
 */
import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors, useIsDark } from '@/theme';
import { glassRecipes } from '@/theme/glass';
import { useSupportsLiquidGlass } from '@/hooks/useSupportsLiquidGlass';
import { useGlassDepth } from './GlassDepthContext';
import { haptics } from '@/lib/haptics';

let GlassView: any = null;
try {
  const glassModule = require('expo-glass-effect');
  GlassView = glassModule.GlassView;
} catch {
  // expo-glass-effect not available
}

interface GlassStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const STEPPER_HEIGHT = 36;
const BUTTON_SIZE = 36;
const VALUE_MIN_WIDTH = 40;
const BORDER_RADIUS = 10;

export function GlassStepper({
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  disabled = false,
}: GlassStepperProps) {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { platformTier } = useSupportsLiquidGlass();
  const glassDepth = useGlassDepth();

  const useGlass = glassDepth === 0;
  const effectiveTier = useGlass ? platformTier : 'opaque';

  const atMin = value <= min;
  const atMax = value >= max;

  const handleDecrement = useCallback(() => {
    if (disabled || atMin) return;
    haptics.press();
    onValueChange(Math.max(min, value - step));
  }, [disabled, atMin, min, value, step, onValueChange]);

  const handleIncrement = useCallback(() => {
    if (disabled || atMax) return;
    haptics.press();
    onValueChange(Math.min(max, value + step));
  }, [disabled, atMax, max, value, step, onValueChange]);

  const containerBase: ViewStyle = {
    height: STEPPER_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  };

  const separator: ViewStyle = {
    width: 1,
    height: STEPPER_HEIGHT,
    backgroundColor: colors.border,
  };

  const content = (
    <>
      <Pressable
        onPress={handleDecrement}
        disabled={disabled || atMin}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        style={[styles.button, (disabled || atMin) && styles.buttonDisabled]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors.textPrimary },
            (disabled || atMin) && styles.textDisabled,
          ]}
        >
          −
        </Text>
      </Pressable>

      <View style={separator} />

      <View style={styles.valueContainer}>
        <Text
          style={[styles.valueText, { color: colors.textPrimary }]}
          accessibilityLabel={`${value}`}
        >
          {value}
        </Text>
      </View>

      <View style={separator} />

      <Pressable
        onPress={handleIncrement}
        disabled={disabled || atMax}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        style={[styles.button, (disabled || atMax) && styles.buttonDisabled]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors.textPrimary },
            (disabled || atMax) && styles.textDisabled,
          ]}
        >
          +
        </Text>
      </Pressable>
    </>
  );

  const wrapper = disabled ? styles.disabled : undefined;

  // ── Tier 1: Native Glass ──
  if (effectiveTier === 'glass' && GlassView) {
    return (
      <View style={wrapper}>
        <GlassView
          glassEffectStyle="regular"
          style={[containerBase, { borderWidth: 1, borderColor: colors.border }]}
        >
          {content}
        </GlassView>
      </View>
    );
  }

  // ── Tier 2: Blur Fallback ──
  if (effectiveTier === 'blur') {
    const recipe = glassRecipes.cta;
    return (
      <View style={wrapper}>
        <View style={[containerBase, { borderWidth: 1, borderColor: colors.border }]}>
          <BlurView
            intensity={recipe.blurIntensity}
            tint={isDark ? recipe.darkTint : recipe.lightTint}
            style={StyleSheet.absoluteFill}
          />
          {content}
        </View>
      </View>
    );
  }

  // ── Tier 3: Opaque ──
  return (
    <View style={wrapper}>
      <View
        style={[
          containerBase,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.04)',
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  textDisabled: {
    opacity: 0.3,
  },
  valueContainer: {
    minWidth: VALUE_MIN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
