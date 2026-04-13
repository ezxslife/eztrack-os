import { useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  type StyleProp,
} from "react-native";

import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onToggle,
  label,
  sublabel,
  disabled = false,
  indeterminate = false,
  style,
}: CheckboxProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (checked || indeterminate) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false,
        speed: 20,
        bounciness: 8,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [checked, indeterminate, scaleAnim]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    checkboxBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: checked || indeterminate ? "transparent" : colors.border,
      backgroundColor: checked || indeterminate ? colors.primaryInk : "transparent",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },
    checkboxDisabled: {
      opacity: 0.5,
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
  });

  const handlePress = () => {
    if (disabled) return;
    triggerSelectionHaptic();
    onToggle(!checked);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && { opacity: 0.7 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.checkboxBox,
          disabled && styles.checkboxDisabled,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {checked && (
          <AppSymbol
            color={colors.textInverse}
            fallbackName="checkmark"
            iosName="checkmark"
            size={14}
          />
        )}
        {indeterminate && !checked && (
          <AppSymbol
            color={colors.textInverse}
            fallbackName="remove"
            iosName="minus"
            size={14}
          />
        )}
      </Animated.View>

      {(label || sublabel) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      )}
    </Pressable>
  );
}
