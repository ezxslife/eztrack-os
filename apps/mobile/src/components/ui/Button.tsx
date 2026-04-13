import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import {
  useThemeColors,
  useThemeControls,
  useThemeTypography,
} from "@/theme";
import { useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import { triggerImpactHaptic, triggerSelectionHaptic } from "@/lib/haptics";
import { useAdaptiveLayout } from "@/theme/layout";
import { uiTokens } from "@/theme/uiTokens";
import { AppSymbol } from "@/components/ui/AppSymbol";

interface ButtonProps {
  children?: ReactNode;
  disabled?: boolean;
  icon?: string;
  iconOnly?: boolean;
  label?: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "plain" | "destructive" | "tertiary";
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children,
  disabled = false,
  icon,
  iconOnly = false,
  label,
  loading = false,
  onPress,
  variant = "primary",
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const controls = useThemeControls();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const { supportsGlass } = useSupportsLiquidGlass();
  const resolvedVariant = variant === "tertiary" ? "plain" : variant;
  const resolvedLabel =
    label ?? (typeof children === "string" || typeof children === "number" ? String(children) : "");

  const styles = StyleSheet.create({
    base: {
      alignItems: "center",
      borderRadius: iconOnly ? uiTokens.controlRadius : uiTokens.controlRadius,
      justifyContent: "center",
      minHeight:
        resolvedVariant === "plain"
          ? layout.compactControlMinHeight
          : iconOnly
            ? uiTokens.controlHeightSm
            : Math.max(layout.controlMinHeight + 8, 52),
      paddingHorizontal:
        iconOnly ? 0 : resolvedVariant === "plain" ? 0 : layout.isRegularWidth ? 20 : 18,
      paddingVertical:
        iconOnly ? 0 : resolvedVariant === "plain" ? 0 : Platform.OS === "ios" ? 14 : 12,
      width: iconOnly ? uiTokens.controlHeightSm : "auto",
    },
    disabled: {
      opacity: 0.52,
    },
    destructive: {
      backgroundColor: colors.error,
    },
    destructiveLabel: {
      color: "#FFFFFF",
    },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      ...typography.headline,
      fontWeight: "700",
    },
    plain: {
      backgroundColor: "transparent",
    },
    plainLabel: {
      color: colors.primaryInk,
    },
    pressed: {
      opacity: Platform.OS === "ios" ? 0.78 : 0.84,
      transform: [{ scale: 0.985 }],
    },
    primary: {
      backgroundColor: colors.interactiveSolid,
      ...Platform.select({
        ios: {
          ...(supportsGlass
            ? {}
            : {
                shadowColor: colors.interactiveSolid,
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                shadowOpacity: 0.22,
                shadowRadius: 20,
              }),
        },
        android: {
          elevation: 2,
        },
        default: {},
      }),
    },
    primaryLabel: {
      color: colors.brandContrastText,
    },
    secondary: {
      backgroundColor: controls.secondaryButtonFill,
      borderColor: colors.borderLight,
      borderWidth: 1,
    },
    secondaryLabel: {
      color: Platform.OS === "ios" ? controls.secondaryButtonLabel : colors.textPrimary,
    },
  });

  const palettes = {
    plain: {
      foreground: colors.primaryInk,
      spinner: colors.primaryInk,
    },
    primary: {
      background: colors.interactiveSolid,
      foreground: colors.brandContrastText,
      spinner: colors.brandContrastText,
    },
    secondary: {
      background: controls.secondaryButtonFill,
      foreground:
        Platform.OS === "ios" ? controls.secondaryButtonLabel : colors.textPrimary,
      spinner:
        Platform.OS === "ios" ? controls.secondaryButtonLabel : colors.textPrimary,
    },
    destructive: {
      background: colors.error,
      foreground: "#FFFFFF",
      spinner: "#FFFFFF",
    },
  } as const;

  const handlePress = () => {
    if (disabled || loading) {
      return;
    }

    if (resolvedVariant === "primary" || resolvedVariant === "destructive") {
      triggerImpactHaptic();
    } else {
      triggerSelectionHaptic();
    }

    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        resolvedVariant === "primary"
          ? styles.primary
          : resolvedVariant === "secondary"
            ? styles.secondary
            : resolvedVariant === "destructive"
              ? styles.destructive
              : styles.plain,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={palettes[resolvedVariant].spinner}
          size="small"
        />
      ) : iconOnly && icon ? (
        <View style={styles.iconContainer}>
          <AppSymbol color={palettes[resolvedVariant].foreground} name={icon} size={24} />
        </View>
      ) : (
        <Text
          style={[
            styles.label,
            resolvedVariant === "primary"
              ? styles.primaryLabel
              : resolvedVariant === "secondary"
                ? styles.secondaryLabel
                : resolvedVariant === "destructive"
                  ? styles.destructiveLabel
                  : styles.plainLabel,
            { color: palettes[resolvedVariant].foreground },
          ]}
        >
          {resolvedLabel}
        </Text>
      )}
    </Pressable>
  );
}
