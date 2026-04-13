import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { useThemeColors, useThemeTypography } from "@/theme";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
  required?: boolean;
}

export function FormField({
  children,
  error,
  hint,
  label,
  required = false,
}: FormFieldProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    container: {
      gap: 8,
    },
    errorContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    errorIcon: {
      flexShrink: 0,
    },
    errorText: {
      ...typography.caption1,
      color: colors.error,
      flex: 1,
      lineHeight: 17,
    },
    footer: {
      gap: 4,
    },
    label: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    labelContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    requiredIndicator: {
      color: colors.error,
      fontSize: typography.subheadline.fontSize,
      fontWeight: "600",
    },
    hintText: {
      ...typography.caption1,
      color: colors.textTertiary,
      lineHeight: 17,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredIndicator}>*</Text>}
      </View>

      {children}

      {(error || hint) && (
        <View style={styles.footer}>
          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <AppSymbol
                  color={colors.error}
                  fallbackName="alert-circle"
                  iosName="exclamationmark.circle.fill"
                  size={14}
                />
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
        </View>
      )}
    </View>
  );
}
