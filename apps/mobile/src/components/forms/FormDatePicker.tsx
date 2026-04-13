import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { FormField } from "@/components/forms/FormField";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

interface FormDatePickerProps {
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  maximumDate?: Date;
  minimumDate?: Date;
  mode?: "date" | "datetime" | "time";
  onChange: (date: Date) => void;
  required?: boolean;
  value?: Date;
}

export function FormDatePicker({
  disabled = false,
  error,
  hint,
  label,
  maximumDate,
  minimumDate,
  mode = "date",
  onChange,
  required = false,
  value,
}: FormDatePickerProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = useCallback((date: Date): string => {
    if (mode === "time") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    if (mode === "datetime") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    // date mode
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [mode]);

  const displayLabel = value ? formatDate(value) : "Select a date";

  const styles = StyleSheet.create({
    button: {
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.border,
      borderRadius: uiTokens.controlRadius,
      borderWidth: uiTokens.surfaceBorderWidth,
      flexDirection: "row",
      minHeight: uiTokens.controlHeightLg,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonError: {
      borderColor: colors.error,
    },
    buttonFocused: {
      backgroundColor: colors.surface,
      borderColor: colors.focusBorder,
    },
    calendarIcon: {
      flexShrink: 0,
    },
    label: {
      ...typography.body,
      color: value ? colors.textPrimary : colors.textTertiary,
      flex: 1,
      marginLeft: 12,
    },
    pickerContainer: {
      position: "relative" as const,
    },
  });

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerSelectionHaptic();
    setShowPicker(true);
  }, [disabled]);

  const handlePressIn = useCallback(() => {
    setFocused(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <FormField error={error} hint={hint} label={label} required={required}>
      <View style={styles.pickerContainer}>
        <Pressable
          disabled={disabled}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.button,
            focused && styles.buttonFocused,
            error && styles.buttonError,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.buttonFocused,
          ]}
        >
          <View style={styles.calendarIcon}>
            <AppSymbol
              color={colors.textSecondary}
              fallbackName="calendar"
              iosName="calendar"
              size={16}
            />
          </View>
          <Text style={styles.label}>{displayLabel}</Text>
        </Pressable>

        {showPicker && (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Pressable
              onPress={() => {
                triggerSelectionHaptic();
                onChange(value || new Date());
                setShowPicker(false);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: uiTokens.innerRadius,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.buttonPrimaryText,
                  textAlign: "center",
                  ...typography.body,
                  fontWeight: "600",
                }}
              >
                Done
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => [
                {
                  borderRadius: uiTokens.innerRadius,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.primary,
                  textAlign: "center",
                  ...typography.body,
                  fontWeight: "500",
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </FormField>
  );
}
