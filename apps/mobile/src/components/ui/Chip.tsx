import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  type StyleProp,
} from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

interface ChipProps {
  label: string;
  icon?: string;
  variant?: "filled" | "outlined" | "tinted";
  color?: string;
  size?: "sm" | "md";
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  icon,
  variant = "filled",
  color,
  size = "md",
  selected = false,
  onPress,
  onRemove,
  disabled = false,
  style,
}: ChipProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const height = size === "sm" ? 28 : 36;
  const iconSize = size === "sm" ? 14 : 16;
  const horizontalPadding = size === "sm" ? 8 : 12;

  const chipColor = color || colors.primaryInk;

  const styles = StyleSheet.create({
    container: {
      height,
      borderRadius: height / 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: horizontalPadding,
      gap: 6,
    },
    filled: {
      backgroundColor: chipColor,
    },
    filledLabel: {
      color: colors.textInverse,
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    outlinedLabel: {
      color: colors.textPrimary,
    },
    tinted: {
      backgroundColor: `${chipColor}20`,
    },
    tintedLabel: {
      color: chipColor,
    },
    label: {
      ...typography.caption1,
      fontWeight: "600",
    },
    icon: {
      width: iconSize,
      height: iconSize,
    },
    removeButton: {
      marginLeft: 4,
      width: iconSize + 4,
      height: iconSize + 4,
      justifyContent: "center",
      alignItems: "center",
    },
    disabled: {
      opacity: 0.5,
    },
  });

  const handlePress = () => {
    if (disabled || !onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const handleRemove = () => {
    if (disabled || !onRemove) return;
    triggerSelectionHaptic();
    onRemove();
  };

  const variantStyles =
    variant === "outlined"
      ? styles.outlined
      : variant === "tinted"
        ? styles.tinted
        : styles.filled;

  const labelStyle =
    variant === "outlined"
      ? styles.outlinedLabel
      : variant === "tinted"
        ? styles.tintedLabel
        : styles.filledLabel;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    variantStyles,
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      {icon && (
        <AppSymbol
          color={
            variant === "filled"
              ? colors.textInverse
              : variant === "tinted"
                ? chipColor
                : colors.textPrimary
          }
          fallbackName={icon as any}
          size={iconSize}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {onRemove && (
        <Pressable
          onPress={handleRemove}
          disabled={disabled}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <AppSymbol
            color={
              variant === "filled"
                ? colors.textInverse
                : variant === "tinted"
                  ? chipColor
                  : colors.textPrimary
            }
            fallbackName="close"
            size={iconSize}
          />
        </Pressable>
      )}
    </Pressable>
  );
}
