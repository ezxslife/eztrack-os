import { type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  View,
} from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useAdaptiveLayout } from "@/theme/layout";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassPillProps {
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
  onPress?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: "filled" | "outline" | "tinted";
}

const sizeMap = {
  sm: { minHeight: 32, paddingHorizontal: 12, paddingVertical: 7, radius: 16 },
  md: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 10, radius: 22 },
  lg: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 12, radius: 26 },
} as const;

export function GlassPill({
  children,
  disabled = false,
  label,
  onPress,
  selected = false,
  size = "md",
  style,
  textStyle,
  variant = "outline",
}: GlassPillProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const baseMetrics = sizeMap[size];
  const metrics = {
    ...baseMetrics,
    minHeight: Math.max(
      baseMetrics.minHeight,
      size === "sm" ? layout.compactControlMinHeight : layout.controlMinHeight
    ),
  };

  const styles = StyleSheet.create({
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: metrics.minHeight,
      maxWidth: "100%",
      paddingHorizontal: metrics.paddingHorizontal,
      paddingVertical: metrics.paddingVertical,
    },
    filled: {
      backgroundColor: selected ? colors.primaryStrong : colors.primary,
      borderColor: "transparent",
      borderRadius: metrics.radius,
    },
    label: {
      ...typography.footnote,
      flexShrink: 1,
      fontWeight: Platform.OS === "ios" ? "600" : "700",
      lineHeight: 18,
      textAlign: "center",
    },
    outlineBorder: {
      borderColor: selected ? colors.primaryStrong : colors.borderSubtle,
      borderRadius: metrics.radius,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.96 }],
    },
    tintedBorder: {
      borderColor: selected ? colors.primaryStrong : colors.focusRing,
      borderRadius: metrics.radius,
    },
  });

  const labelColor =
    variant === "filled"
      ? colors.primaryText
      : selected
        ? colors.primaryStrong
        : colors.textSecondary;

  const handlePress = () => {
    if (!onPress || disabled) {
      return;
    }

    triggerSelectionHaptic();

    onPress();
  };

  const content = (
    <View style={styles.content}>
      {children}
      {label ? <Text style={[styles.label, { color: labelColor }, textStyle]}>{label}</Text> : null}
    </View>
  );

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [pressed && styles.pressed, style]}
    >
      {variant === "filled" ? (
        <View style={styles.filled}>{content}</View>
      ) : (
        <MaterialSurface
          padding={0}
          style={variant === "tinted" ? styles.tintedBorder : styles.outlineBorder}
          variant={variant === "tinted" ? "cta" : "grouped"}
        >
          {content}
        </MaterialSurface>
      )}
    </Pressable>
  );
}
