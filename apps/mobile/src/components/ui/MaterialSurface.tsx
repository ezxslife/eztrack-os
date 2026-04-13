import { ReactNode } from "react";
import {
  Platform,
  Pressable,
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
import { uiTokens } from "@/theme/uiTokens";

interface MaterialSurfaceProps {
  children: ReactNode;
  intensity?: number;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  variant?: "chrome" | "panel" | "cta" | "grouped" | "sheet" | "subtle";
}

export function MaterialSurface({
  children,
  intensity,
  onPress,
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

  // Radius per variant — aligned with EZXS-OS GroupedCard (12), SectionCard (14–16), Sheet (28)
  const radiusMap: Record<typeof variant, number> = {
    sheet: uiTokens.surfaceRadius,   // 28 — bottom sheets, large overlays
    panel: uiTokens.sectionRadius,   // 16 — SectionCard, hero accessory panels
    chrome: uiTokens.controlRadius,  // 14 — chrome surfaces, controls
    cta: uiTokens.controlRadius,     // 14 — call-to-action surfaces
    grouped: uiTokens.innerRadius,   // 12 — grouped list cards (matches EZXS-OS GroupedCard)
    subtle: uiTokens.innerRadius,    // 12 — subtle/nested surfaces
  };
  const radius = radiusMap[variant];

  const styles = StyleSheet.create({
    base: {
      borderRadius: radius,
      borderWidth: uiTokens.surfaceBorderWidth,
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
      borderRadius: radius,
      borderWidth: uiTokens.surfaceBorderWidth,
    },
    specular: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.glassSpecular,
      borderRadius: radius,
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

  const contentInner = (
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
  const content = onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {contentInner}
    </Pressable>
  ) : (
    contentInner
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
