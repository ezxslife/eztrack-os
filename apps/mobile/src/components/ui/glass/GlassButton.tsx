import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";

interface GlassButtonProps {
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconIosSymbol?: SFSymbol;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  label: string;
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  variant?: "primary" | "secondary" | "destructive";
}

const sizeMap = {
  sm: {
    height: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    radius: 18,
    fontSize: "footnote" as const,
    iconSize: 14,
  },
  md: {
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    radius: 22,
    fontSize: "subheadline" as const,
    iconSize: 16,
  },
  lg: {
    height: 52,
    paddingHorizontal: 28,
    paddingVertical: 12,
    radius: 26,
    fontSize: "headline" as const,
    iconSize: 18,
  },
} as const;

export function GlassButton({
  disabled = false,
  fullWidth = false,
  icon,
  iconIosSymbol,
  iconPosition = "left",
  isLoading = false,
  label,
  onPress,
  size = "md",
  style,
  variant = "primary",
}: GlassButtonProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const metrics = sizeMap[size];

  const variantMap = {
    primary: "cta" as const,
    secondary: "chrome" as const,
    destructive: "cta" as const,
  };

  const styles = StyleSheet.create({
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: metrics.height,
      paddingHorizontal: metrics.paddingHorizontal,
      paddingVertical: metrics.paddingVertical,
    },
    destructiveOverlay: {
      backgroundColor: colors.error,
      borderRadius: metrics.radius,
      minHeight: metrics.height,
      overflow: "hidden",
      paddingHorizontal: metrics.paddingHorizontal,
      paddingVertical: metrics.paddingVertical,
    },
    label: {
      ...typography[metrics.fontSize],
      color:
        variant === "destructive"
          ? "#FFFFFF"
          : variant === "primary"
            ? colors.brandContrastText
            : colors.textPrimary,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
  });

  const handlePress = () => {
    if (isLoading || disabled) {
      return;
    }

    triggerImpactHaptic(
      variant === "primary" || variant === "destructive"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );

    onPress();
  };

  const iconColor =
    variant === "destructive"
      ? "#FFFFFF"
      : variant === "primary"
        ? colors.brandContrastText
        : colors.textPrimary;

  const content = (
    <View style={styles.content}>
      {icon && iconPosition === "left" && !isLoading ? (
        <AppSymbol
          color={iconColor}
          fallbackName={icon}
          iosName={iconIosSymbol}
          size={metrics.iconSize}
          weight="semibold"
        />
      ) : null}
      {isLoading ? (
        <ActivityIndicator color={iconColor} size={metrics.iconSize} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      {icon && iconPosition === "right" && !isLoading ? (
        <AppSymbol
          color={iconColor}
          fallbackName={icon}
          iosName={iconIosSymbol}
          size={metrics.iconSize}
          weight="semibold"
        />
      ) : null}
    </View>
  );

  const button =
    variant === "destructive" ? (
      <View style={styles.destructiveOverlay}>{content}</View>
    ) : (
      <MaterialSurface
        padding={0}
        style={{ borderRadius: metrics.radius }}
        variant={variantMap[variant]}
      >
        {content}
      </MaterialSurface>
    );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={({ pressed }) => [
        pressed && !disabled && styles.pressed,
        fullWidth && { width: "100%" },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {button}
    </Pressable>
  );
}
