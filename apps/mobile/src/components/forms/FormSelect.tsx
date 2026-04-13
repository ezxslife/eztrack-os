import { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { FormField } from "@/components/forms/FormField";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

export interface FormSelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
}

export function FormSelect({
  disabled = false,
  error,
  hint,
  label,
  onValueChange,
  options,
  placeholder = "Select an option",
  required = false,
  value,
}: FormSelectProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;
  const isPlaceholder = !selectedOption;

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
    chevron: {
      flexShrink: 0,
    },
    label: {
      ...typography.body,
      color: isPlaceholder ? colors.textTertiary : colors.textPrimary,
      flex: 1,
    },
    spacer: {
      width: 8,
    },
  });

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;

      triggerSelectionHaptic();

      if (Platform.OS === "ios") {
        const cancelIndex = options.length;
        const selectedIndex = options.findIndex((opt) => opt.value === value);

        ActionSheetIOS.showActionSheetWithOptions(
          {
            cancelButtonIndex: cancelIndex,
            options: [...options.map((opt) => opt.label), "Cancel"],
          },
          (buttonIndex) => {
            if (buttonIndex !== undefined && buttonIndex < options.length) {
              triggerSelectionHaptic();
              onValueChange(options[buttonIndex].value);
            }
          }
        );
      }
    },
    [disabled, options, value, onValueChange]
  );

  const handlePressIn = useCallback(() => {
    setFocused(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <FormField error={error} hint={hint} label={label} required={required}>
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
        <Text style={styles.label}>{displayLabel}</Text>
        <View style={styles.spacer} />
        <View style={styles.chevron}>
          <AppSymbol
            color={colors.textSecondary}
            fallbackName="chevron-down"
            iosName="chevron.down"
            size={16}
          />
        </View>
      </Pressable>
    </FormField>
  );
}
