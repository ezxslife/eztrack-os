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
      borderRadius: 999,
      justifyContent: "center",
      minHeight:
        variant === "plain"
          ? layout.compactControlMinHeight
          : layout.controlMinHeight,
      paddingHorizontal: variant === "plain" ? 0 : layout.isRegularWidth ? 20 : 18,
      paddingVertical: variant === "plain" ? 0 : Platform.OS === "ios" ? 10 : 11,
    },
    disabled: {
      opacity: 0.52,
    },
    label: {
      ...typography.subheadline,
      fontWeight: Platform.OS === "ios" ? "600" : "700",
    },
    plain: {
      backgroundColor: "transparent",
    },
    plainLabel: {
      color: colors.primaryInk,
    },
    pressed: {
      opacity: Platform.OS === "ios" ? 0.72 : 0.84,
      transform: Platform.OS === "ios" ? [] : [{ scale: 0.985 }],
    },
    primary: {
      backgroundColor: colors.primaryStrong,
    },
    primaryLabel: {
      color: colors.primaryText,
    },
    secondary: {
      backgroundColor: controls.secondaryButtonFill,
      borderColor: Platform.OS === "ios" ? "transparent" : colors.borderSubtle,
      borderWidth: Platform.OS === "ios" ? 0 : 1,
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
      background: colors.primaryStrong,
      foreground: colors.primaryText,
      spinner: colors.primaryText,
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
