import { Platform, StyleSheet, Switch, Text, View, ViewStyle, type StyleProp } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Toggle({
  value,
  onValueChange,
  label,
  sublabel,
  disabled = false,
  style,
}: ToggleProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    labelContainer: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    sublabel: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    switchContainer: {
      flexShrink: 0,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {(label || sublabel) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      )}

      <View style={styles.switchContainer}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: colors.surfaceContainerHighest,
            true: colors.primaryInk,
          }}
          thumbColor={colors.textInverse}
          ios_backgroundColor={colors.surfaceContainerHighest}
          style={Platform.OS === "android" ? { transform: [{ scale: 0.9 }] } : undefined}
          accessibilityRole="switch"
          accessibilityState={{ checked: value, disabled }}
        />
      </View>
    </View>
  );
}
