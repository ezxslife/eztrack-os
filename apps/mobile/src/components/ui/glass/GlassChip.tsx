import React, { useCallback } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { useThemeColors, useIsDark } from "@/theme";
import { glassRecipes } from "@/theme/glass";
import { useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useGlassDepth } from "./GlassDepthContext";

// Conditionally import GlassView
let GlassView: any = null;
try {
  const glassModule = require("expo-glass-effect");
  GlassView = glassModule.GlassView;
} catch {
  // expo-glass-effect not available
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Filter chip with 3-tier glass rendering (glass > blur > opaque).
 *
 * Selected = tinted overlay fill, Unselected = outline.
 * Spring scale animation + haptic feedback on press.
 *
 * Ported from EZXS-OS GlassChip.
 */
export function GlassChip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
}: GlassChipProps) {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { platformTier } = useSupportsLiquidGlass();
  const reduceMotion = useReducedMotion();
  const glassDepth = useGlassDepth();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (reduceMotion) {
      scale.value = 0.95;
    } else {
      scale.value = withSpring(0.95);
    }
  }, [reduceMotion, scale]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1);
    }
  }, [reduceMotion, scale]);

  const handlePress = useCallback(() => {
    triggerSelectionHaptic();
    onPress?.();
  }, [onPress]);

  // Glass only at depth 0
  const useGlass = glassDepth === 0;
  const effectiveTier = useGlass ? platformTier : "opaque";

  // Sizing
  const containerBaseStyle: ViewStyle = {
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignSelf: "flex-start",
  };

  const innerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 34,
    gap: 6,
  };

  const labelColor = colors.textPrimary;

  const outlineBorderColor = isDark
    ? "rgba(255, 255, 255, 0.35)"
    : "rgba(15, 23, 42, 0.30)";

  const tintedOverlayColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(15, 23, 42, 0.06)";

  const getOpaqueContainerStyle = (): ViewStyle => {
    if (selected) {
      return {
        backgroundColor: tintedOverlayColor,
        borderWidth: 1,
        borderColor: outlineBorderColor,
      };
    }
    return {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: outlineBorderColor,
    };
  };

  const content = (
    <>
      {icon}
      <Text style={{ fontSize: 13, fontWeight: "600", color: labelColor }}>
        {label}
      </Text>
    </>
  );

  const renderContainer = (children: React.ReactNode) => {
    // Glass tier
    if (effectiveTier === "glass" && GlassView) {
      if (selected) {
        return (
          <GlassView
            glassEffectStyle="regular"
            style={[
              containerBaseStyle,
              { borderWidth: 1, borderColor: outlineBorderColor },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: tintedOverlayColor },
              ]}
            />
            <View style={innerStyle}>{children}</View>
          </GlassView>
        );
      }
      return (
        <GlassView
          glassEffectStyle="regular"
          style={[
            containerBaseStyle,
            { borderWidth: 1.5, borderColor: outlineBorderColor },
          ]}
        >
          <View style={innerStyle}>{children}</View>
        </GlassView>
      );
    }

    // Blur tier
    if (effectiveTier === "blur") {
      const recipe = glassRecipes.cta;

      return (
        <View
          style={[
            containerBaseStyle,
            {
              borderWidth: selected ? 1 : 1.5,
              borderColor: outlineBorderColor,
            },
          ]}
        >
          <BlurView
            intensity={recipe.blurIntensity}
            tint={isDark ? recipe.darkTint : recipe.lightTint}
            style={StyleSheet.absoluteFill}
          />
          {selected && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: tintedOverlayColor },
              ]}
            />
          )}
          <View style={innerStyle}>{children}</View>
        </View>
      );
    }

    // Opaque fallback
    return (
      <View style={[containerBaseStyle, getOpaqueContainerStyle()]}>
        <View style={innerStyle}>{children}</View>
      </View>
    );
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[animatedStyle, disabled && styles.disabled]}
    >
      {renderContainer(content)}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
});
