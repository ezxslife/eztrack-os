import React, { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useThemeColors, useIsDark } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
}

/**
 * Base skeleton shimmer primitive.
 *
 * 1400ms shimmer loop (Apple-like pacing), dark/light aware.
 * Compose with SkeletonCard, SkeletonRow, SkeletonText for
 * realistic loading placeholders.
 *
 * Ported from EZXS-OS Skeleton.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  animated = true,
  style,
}: SkeletonProps) {
  const colors = useThemeColors();
  const shimmer = useSharedValue(0);
  const isDark = useIsDark();

  useEffect(() => {
    if (!animated) return;
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: uiTokens.skeletonShimmerDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [animated, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animated
      ? interpolate(shimmer.value, [0, 0.5, 1], [0.5, 0.9, 0.5])
      : 0.6,
  }));

  const bgColor = isDark
    ? colors.backgroundSecondary
    : "rgba(0, 0, 0, 0.06)";

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
