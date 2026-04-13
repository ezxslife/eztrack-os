import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { type SharedValue } from "react-native-reanimated";

import { BlurView } from "expo-blur";

import { GlassDepthLayer, useGlassDepth } from "@/components/ui/glass/GlassDepthContext";
import { uiTokens } from "@/theme/uiTokens";
import { getGlassView, useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import {
  useGlassTheme,
  useIsDark,
  useThemeColors,
} from "@/theme";
import {
  getGlassFallbackColor,
  getGlassTint,
} from "@/theme/glass";

interface GlassSheetBackgroundProps {
  animatedIndex?: SharedValue<number>;
  animatedPosition?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}

export function GlassSheetBackground({
  style,
}: GlassSheetBackgroundProps) {
  const colors = useThemeColors();
  const glass = useGlassTheme();
  const isDark = useIsDark();
  const { platformTier } = useSupportsLiquidGlass();
  const parentDepth = useGlassDepth();
  const GlassView = getGlassView();

  const blurIntensity = 90;
  const tint = getGlassTint("sheet", isDark);
  const fallbackColor = getGlassFallbackColor("sheet", isDark);
  const borderAlpha = 0.2;
  const effectiveTier = parentDepth > 0 ? "opaque" : platformTier;

  const styles = StyleSheet.create({
    base: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      overflow: "hidden",
    },
    opaque: {
      backgroundColor: fallbackColor,
      borderColor: isDark ? `rgba(255,255,255,${borderAlpha})` : colors.borderSubtle,
      ...Platform.select({
        android: {
          elevation: 6,
        },
        default: {},
      }),
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      borderColor: isDark ? `rgba(255,255,255,${borderAlpha})` : `rgba(255,255,255,${borderAlpha + 0.06})`,
      borderRadius: uiTokens.surfaceRadius,
      borderWidth: 1,
    },
    specular: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.glassSpecular,
      borderRadius: uiTokens.surfaceRadius,
      opacity: isDark ? 0.12 : 0.08,
    },
  });

  const baseStyle = [
    styles.base,
    effectiveTier === "opaque" ? styles.opaque : null,
    style,
  ];

  const content = (
    <>
      <View pointerEvents="none" style={styles.overlay} />
      {(effectiveTier === "glass" || effectiveTier === "blur") ? (
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
