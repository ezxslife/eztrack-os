import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";

interface DetailRowProps {
  /** Left-side label (e.g. "Status", "Location"). */
  label: string;
  /** Right-side value — string or custom ReactNode. */
  value?: string | ReactNode;
  /** Optional leading icon or badge. */
  leading?: ReactNode;
  /** Render the value in a muted/secondary style. */
  muted?: boolean;
}

/**
 * Structured key-value row for detail pages.
 *
 * Matches EZXS-OS SettingsRow / line-item patterns:
 * label 16px 400 on the left, value 15px 400 right-aligned, max 50% width.
 * paddingVertical 14, paddingHorizontal 16, gap 12.
 */
export function DetailRow({ label, value, leading, muted }: DetailRowProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const isStringValue = typeof value === "string" || value === undefined;

  return (
    <View style={styles.container}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          typography.callout,
          { color: colors.textPrimary },
        ]}
      >
        {label}
      </Text>
      {isStringValue ? (
        <Text
          numberOfLines={2}
          style={[
            styles.value,
            typography.subheadline,
            {
              color: muted ? colors.textTertiary : colors.textSecondary,
            },
          ]}
        >
          {value ?? "—"}
        </Text>
      ) : (
        <View style={styles.valueContainer}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    flex: 1,
    fontWeight: "400",
  },
  leading: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  value: {
    maxWidth: "50%",
    textAlign: "right",
  },
  valueContainer: {
    alignItems: "flex-end",
    maxWidth: "50%",
  },
});
