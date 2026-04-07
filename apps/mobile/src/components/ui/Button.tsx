import * as Haptics from "expo-haptics";
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
  useThemeTypography,
} from "@/theme";

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
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    base: {
      alignItems: "center",
      borderRadius: 999,
      justifyContent: "center",
      minHeight: variant === "plain" ? 36 : 44,
      paddingHorizontal: variant === "plain" ? 0 : 18,
      paddingVertical: variant === "plain" ? 0 : 11,
    },
    disabled: {
      opacity: 0.52,
    },
    label: {
      ...typography.subheadline,
      fontWeight: "700",
    },
    plain: {
      backgroundColor: "transparent",
    },
    plainLabel: {
      color: colors.primaryStrong,
    },
    pressed: {
      opacity: 0.84,
      transform: [{ scale: 0.985 }],
    },
    primary: {
      backgroundColor: colors.primaryStrong,
    },
    primaryLabel: {
      color: colors.primaryText,
    },
    secondary: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
    },
    secondaryLabel: {
      color: colors.textPrimary,
    },
  });

  const handlePress = () => {
    if (disabled || loading) {
      return;
    }

    if (Platform.OS !== "web") {
      if (variant === "primary") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        void Haptics.selectionAsync();
      }
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
          color={
            variant === "primary"
              ? colors.primaryText
              : variant === "secondary"
                ? colors.textPrimary
                : colors.primaryStrong
          }
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
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
