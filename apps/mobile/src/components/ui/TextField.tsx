import { useState, type ReactNode } from "react";
import {
  Pressable,
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
import { uiTokens } from "@/theme/uiTokens";
import { AppSymbol } from "@/components/ui/AppSymbol";

interface TextFieldProps extends TextInputProps {
  error?: string | null;
  footer?: ReactNode;
  label: string;
  maxLength?: number;
  prefixIcon?: string;
  secureTextEntry?: boolean;
  showCharCount?: boolean;
  showClear?: boolean;
  suffixIcon?: string;
}

export function TextField({
  error,
  footer,
  label,
  maxLength,
  multiline,
  onBlur,
  onChangeText,
  onFocus,
  prefixIcon,
  secureTextEntry: secureTextEntryProp,
  showCharCount = true,
  showClear = true,
  style,
  suffixIcon,
  value,
  ...props
}: TextFieldProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);
  const [secureText, setSecureText] = useState(secureTextEntryProp ?? false);
  const valueLength = typeof value === "string" ? value.length : 0;

  const styles = StyleSheet.create({
    charCount: {
      ...typography.caption2,
      color: colors.textTertiary,
      marginTop: 4,
      textAlign: "right",
    },
    clearButton: {
      alignItems: "center",
      height: 24,
      justifyContent: "center",
      paddingLeft: 8,
      width: 32,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
      lineHeight: 17,
    },
    field: {
      gap: 8,
    },
    footerContainer: {
      gap: 4,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.border,
      borderRadius: uiTokens.controlRadius,
      borderWidth: 1,
      color: colors.textPrimary,
      flex: 1,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputContainer: {
      alignItems: "center",
      flexDirection: "row",
    },
    inputError: {
      borderColor: colors.error,
    },
    inputFocused: {
      backgroundColor: colors.surface,
      borderColor: colors.focusBorder,
    },
    inputMultiline: {
      minHeight: 120,
    },
    label: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    labelFocused: {
      color: colors.brandText,
    },
    prefixIcon: {
      paddingLeft: 12,
      paddingRight: 4,
    },
    suffixIcon: {
      paddingLeft: 4,
      paddingRight: 12,
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

  const handleClear = () => {
    onChangeText?.("");
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, focused ? styles.labelFocused : null]}>{label}</Text>
      <View style={styles.inputContainer}>
        {prefixIcon ? (
          <View style={styles.prefixIcon}>
            <AppSymbol name={prefixIcon} size={20} color={colors.textTertiary} />
          </View>
        ) : null}
        <TextInput
          maxLength={maxLength}
          multiline={multiline}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureText}
          selectionColor={colors.primaryStrong}
          style={[
            styles.input,
            focused ? styles.inputFocused : null,
            multiline && styles.inputMultiline,
            error ? styles.inputError : null,
            style,
          ]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
          {...props}
        />
        {secureTextEntryProp ? (
          <Pressable
            onPress={() => setSecureText(!secureText)}
            style={styles.suffixIcon}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <AppSymbol
              name={secureText ? "eye" : "eye.slash"}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : null}
        {showClear && valueLength > 0 && !secureTextEntryProp ? (
          <Pressable
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <AppSymbol name="xmark" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : null}
        {suffixIcon && !secureTextEntryProp && !(showClear && valueLength > 0) ? (
          <View style={styles.suffixIcon}>
            <AppSymbol name={suffixIcon} size={20} color={colors.textTertiary} />
          </View>
        ) : null}
      </View>
      <View style={styles.footerContainer}>
        {showCharCount && maxLength ? (
          <Text style={styles.charCount}>
            {valueLength}/{maxLength}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {footer}
      </View>
    </View>
  );
}
