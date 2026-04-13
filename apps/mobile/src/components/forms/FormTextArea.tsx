import { useState, useCallback } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { useThemeColors, useThemeTypography } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

interface FormTextAreaProps {
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  maxLength?: number;
  minHeight?: number;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

export function FormTextArea({
  disabled = false,
  error,
  hint,
  label,
  maxLength,
  minHeight = 120,
  onChangeText,
  placeholder,
  required = false,
  value,
}: FormTextAreaProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);

  const charCount = value.length;
  const showCharCount = maxLength !== undefined;

  const styles = StyleSheet.create({
    charCounter: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: "right",
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.border,
      borderRadius: uiTokens.controlRadius,
      borderWidth: uiTokens.surfaceBorderWidth,
      color: colors.textPrimary,
      minHeight,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputFocused: {
      backgroundColor: colors.surface,
      borderColor: colors.focusBorder,
    },
    textAreaContainer: {
      gap: 8,
    },
  });

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  return (
    <FormField error={error} hint={hint} label={label} required={required}>
      <View style={styles.textAreaContainer}>
        <TextInput
          editable={!disabled}
          maxLength={maxLength}
          multiline
          onBlur={handleBlur}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primaryStrong}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          textAlignVertical="top"
          value={value}
        />
        {showCharCount && (
          <Text style={styles.charCounter}>
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </FormField>
  );
}
