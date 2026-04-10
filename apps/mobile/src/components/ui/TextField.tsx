import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

interface TextFieldProps extends TextInputProps {
  error?: string | null;
  footer?: ReactNode;
  label: string;
}

export function TextField({
  error,
  footer,
  label,
  multiline,
  onBlur,
  onFocus,
  style,
  ...props
}: TextFieldProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);
  const styles = StyleSheet.create({
    error: {
      ...typography.caption1,
      color: colors.error,
      lineHeight: 17,
    },
    field: {
      gap: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderColor: colors.borderSubtle,
      borderRadius: 18,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputFocused: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.primaryStrong,
    },
    inputMultiline: {
      minHeight: 120,
    },
    label: {
      ...typography.caption1,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    labelFocused: {
      color: colors.primaryInk,
    },
  });

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, focused ? styles.labelFocused : null]}>{label}</Text>
      <TextInput
        onBlur={handleBlur}
        onFocus={handleFocus}
        multiline={multiline}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primaryStrong}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          multiline && styles.inputMultiline,
          error ? styles.inputError : null,
          style,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {footer}
    </View>
  );
}
