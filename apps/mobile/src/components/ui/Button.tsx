import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import {
  useThemeColors,
  useThemeControls,
  useThemeTypography,
} from "@/theme";
import { triggerImpactHaptic, triggerSelectionHaptic } from "@/lib/haptics";
import { useAdaptiveLayout } from "@/theme/layout";

interface ButtonProps {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "plain";
  style?: StyleProp<ViewStyle>;
}

export function Button({
  disabled = false,
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

  const styles = StyleSheet.create({
    base: {
      alignItems: "center",
      borderRadius: 22,
      justifyContent: "center",
      minHeight:
        variant === "plain"
          ? layout.compactControlMinHeight
          : Math.max(layout.controlMinHeight + 8, 52),
      paddingHorizontal: variant === "plain" ? 0 : layout.isRegularWidth ? 20 : 18,
      paddingVertical: variant === "plain" ? 0 : Platform.OS === "ios" ? 14 : 12,
    },
    disabled: {
      opacity: 0.52,
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
          shadowColor: colors.interactiveSolid,
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.22,
          shadowRadius: 20,
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
  } as const;

  const handlePress = () => {
    if (disabled || loading) {
      return;
    }

    if (variant === "primary") {
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
        variant === "primary"
          ? styles.primary
          : variant === "secondary"
            ? styles.secondary
            : styles.plain,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={palettes[variant].spinner}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary"
              ? styles.primaryLabel
              : variant === "secondary"
                ? styles.secondaryLabel
                : styles.plainLabel,
            { color: palettes[variant].foreground },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
