import { ReactNode } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { BlurView } from "expo-blur";

import { GlassDepthLayer, useGlassDepth } from "@/components/ui/glass/GlassDepthContext";
import { getGlassView, useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import {
  useGlassTheme,
  useIsDark,
  useThemeColors,
  useThemeControls,
} from "@/theme";
import {
  getGlassFallbackColor,
  getGlassTint,
  type GlassRecipeName,
} from "@/theme/glass";

interface MaterialSurfaceProps {
  children: ReactNode;
  intensity?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  variant?: "chrome" | "panel" | "cta" | "grouped" | "sheet" | "subtle";
}

export function MaterialSurface({
  children,
  intensity,
  padding = 14,
  style,
  variant = "chrome",
}: MaterialSurfaceProps) {
  const colors = useThemeColors();
  const controls = useThemeControls();
  const glass = useGlassTheme();
  const isDark = useIsDark();
  const parentDepth = useGlassDepth();
  const { platformTier } = useSupportsLiquidGlass();
  const GlassView = getGlassView();

  const recipeMap: Record<typeof variant, GlassRecipeName> = {
    chrome: "card",
    panel: "panel",
    cta: "cta",
    grouped: "subtle",
    sheet: "sheet",
    subtle: "subtle",
  };

  const recipe = recipeMap[variant];
  const blurIntensity = intensity ?? (variant === "sheet" ? 90 : glass.blurIntensity);
  const tint = getGlassTint(recipe, isDark);
  const fallbackColor = getGlassFallbackColor(recipe, isDark);
  const borderAlpha =
    variant === "panel"
      ? 0.18
      : variant === "cta"
        ? 0.18
        : variant === "grouped"
          ? 0.1
        : variant === "sheet"
          ? 0.2
          : 0.12;
  const effectiveTier =
    variant === "grouped" || parentDepth > 0 ? "opaque" : platformTier;

  const styles = StyleSheet.create({
    base: {
      borderRadius: variant === "sheet" ? 28 : variant === "grouped" ? 20 : 24,
      borderWidth: 1,
      overflow: "hidden",
      padding,
    },
    grouped: {
      backgroundColor: controls.groupedSurface,
      borderColor: controls.groupedBorder,
      ...Platform.select({
        android: {
          elevation: 0,
        },
        default: {},
      }),
    },
    opaque: {
      backgroundColor: fallbackColor,
      borderColor: isDark ? `rgba(255,255,255,${borderAlpha})` : colors.borderSubtle,
      ...Platform.select({
        android: {
          elevation: variant === "sheet" ? 6 : 2,
        },
        default: {},
      }),
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      borderColor: isDark ? `rgba(255,255,255,${borderAlpha})` : `rgba(255,255,255,${borderAlpha + 0.06})`,
      borderRadius: variant === "sheet" ? 28 : variant === "grouped" ? 20 : 24,
      borderWidth: 1,
    },
    specular: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.glassSpecular,
      borderRadius: variant === "sheet" ? 28 : variant === "grouped" ? 20 : 24,
      opacity: isDark ? 0.12 : 0.08,
    },
  });

  const baseStyle = [
    styles.base,
    variant === "grouped"
      ? styles.grouped
      : effectiveTier === "opaque"
        ? styles.opaque
        : null,
    style,
  ];

  const content = (
    <>
      {children}
      <View pointerEvents="none" style={styles.overlay} />
      {(effectiveTier === "glass" || effectiveTier === "blur") &&
      variant !== "sheet" &&
      variant !== "grouped" ? (
        <View pointerEvents="none" style={styles.specular} />
      ) : null}
    </>
  );

  if (effectiveTier === "glass" && GlassView) {
    return (
      <GlassDepthLayer>
        <GlassView glassEffect={glass.glassEffect} style={baseStyle}>
          {content}
        </GlassView>
      </GlassDepthLayer>
    );
  }

  if (effectiveTier === "blur" && Platform.OS === "ios") {
    return (
      <GlassDepthLayer>
        <BlurView intensity={blurIntensity} tint={tint} style={baseStyle}>
          {content}
        </BlurView>
      </GlassDepthLayer>
    );
  }

  return (
    <GlassDepthLayer>
      <View style={baseStyle}>{content}</View>
    </GlassDepthLayer>
  );
}
