import { Pressable, StyleSheet, Text, View, ViewStyle, type StyleProp } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

export interface RadioOption {
  label: string;
  value: string;
  sublabel?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onValueChange: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function RadioGroup({
  options,
  value,
  onValueChange,
  orientation = "vertical",
  disabled = false,
  style,
}: RadioGroupProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    container: {
      flexDirection: orientation === "horizontal" ? "row" : "column",
      gap: orientation === "horizontal" ? 16 : 12,
    },
    option: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    radioCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },
    radioCircleSelected: {
      borderColor: colors.primaryInk,
      backgroundColor: colors.primaryInk,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textInverse,
    },
    radioDisabled: {
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
    labelDisabled: {
      color: colors.textTertiary,
    },
    sublabel: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  });

  const handleSelect = (newValue: string) => {
    if (disabled) return;
    triggerSelectionHaptic();
    onValueChange(newValue);
  };

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            disabled={isDisabled}
            accessibilityRole="radio"
            accessibilityState={{
              checked: isSelected,
              disabled: isDisabled,
            }}
            style={({ pressed }) => [
              styles.option,
              pressed && !isDisabled && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                styles.radioCircle,
                isSelected && styles.radioCircleSelected,
                isDisabled && styles.radioDisabled,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>

            <View style={styles.labelContainer}>
              <Text
                style={[
                  styles.label,
                  isDisabled && styles.labelDisabled,
                ]}
              >
                {option.label}
              </Text>
              {option.sublabel && (
                <Text style={styles.sublabel}>{option.sublabel}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
