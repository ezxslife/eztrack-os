import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityProps,
  type PressableProps,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { haptics } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

// ---------------------------------------------------------------------------
// Badge tone resolution — inline since EZTrack has no semantic badge system yet.
// ---------------------------------------------------------------------------

type BadgeTone = "success" | "warning" | "critical" | "neutral";

interface BadgeColors {
  bg: string;
  border: string;
  text: string;
}

function resolveBadgeTone(
  tone: BadgeTone,
  colors: ReturnType<typeof useThemeColors>,
): BadgeColors {
  switch (tone) {
    case "success":
      return { bg: colors.successBg, border: colors.success, text: colors.success };
    case "warning":
      return { bg: colors.warningBg, border: colors.warning, text: colors.warning };
    case "critical":
      return { bg: colors.errorBg, border: colors.error, text: colors.error };
    default:
      return {
        bg: colors.surfaceSecondary,
        border: colors.border,
        text: colors.textSecondary,
      };
  }
}

function formatBadgeValue(value: string | number) {
  if (typeof value === "number" && value > 99) return "99+";
  return String(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SettingsListRowProps extends Pick<AccessibilityProps, "accessibilityHint"> {
  /** Optional leading element (icon, avatar, etc.). */
  leading?: React.ReactNode;
  label: string;
  subtitle?: string;
  /** Trailing indicator — named variants or custom ReactNode. */
  trailing?: "chevron" | "dropdown" | "external" | React.ReactNode;
  /** Text value shown before trailing icon. */
  value?: string;
  /** Pill badge with count and semantic tone. */
  badge?: { value: string | number; tone: BadgeTone };
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
  /** Render label in error/destructive red. */
  destructive?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const TRAILING_ICON_SIZE = 14;

function TrailingIcon({
  variant,
  color,
}: {
  variant: "chevron" | "dropdown" | "external";
  color: string;
}) {
  const name =
    variant === "chevron"
      ? "chevron.right"
      : variant === "dropdown"
        ? "chevron.down"
        : "arrow.up.right";
  return <AppSymbol name={name} size={TRAILING_ICON_SIZE} color={color} />;
}

export function SettingsListRow({
  leading,
  label,
  subtitle,
  trailing,
  value,
  badge,
  onPress,
  disabled = false,
  destructive = false,
  accessibilityLabel: a11yLabel,
  accessibilityHint,
  testID,
}: SettingsListRowProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const hasPress = typeof onPress === "function" && !disabled;
  const badgeTokens = badge ? resolveBadgeTone(badge.tone, colors) : null;

  // Default trailing: auto-show chevron if onPress is provided.
  const resolvedTrailing =
    trailing === undefined ? (onPress ? "chevron" : null) : trailing;

  const resolvedA11yLabel = useMemo(() => {
    if (a11yLabel) return a11yLabel;
    const badgeText = badge ? formatBadgeValue(badge.value) : null;
    return [label, subtitle, value, badgeText].filter(Boolean).join(", ");
  }, [a11yLabel, badge, label, subtitle, value]);

  const isNamedTrailing =
    resolvedTrailing === "chevron" ||
    resolvedTrailing === "dropdown" ||
    resolvedTrailing === "external";

  const trailingNode = isNamedTrailing ? (
    <TrailingIcon
      variant={resolvedTrailing as "chevron" | "dropdown" | "external"}
      color={colors.textTertiary}
    />
  ) : (
    resolvedTrailing
  );

  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            typography.body,
            { color: destructive ? colors.error : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[
              styles.subtitle,
              typography.footnote,
              { color: colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          numberOfLines={1}
          style={[
            styles.trailingValue,
            typography.subheadline,
            { color: colors.textSecondary },
          ]}
        >
          {value}
        </Text>
      ) : null}

      {badge && badgeTokens ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeTokens.bg, borderColor: badgeTokens.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeTokens.text }]}>
            {formatBadgeValue(badge.value)}
          </Text>
        </View>
      ) : null}

      {trailingNode ? <View style={styles.trailing}>{trailingNode}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        testID={testID}
        style={[
          styles.container,
          subtitle ? styles.containerWithSubtitle : styles.containerDefault,
          disabled && styles.disabled,
        ]}
        accessibilityLabel={resolvedA11yLabel}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={resolvedA11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={(event) => {
        if (!hasPress) return;
        haptics.selection();
        onPress(event);
      }}
      style={({ pressed }) => [
        styles.container,
        subtitle ? styles.containerWithSubtitle : styles.containerDefault,
        disabled && styles.disabled,
        pressed && hasPress && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: uiTokens.screenGutter,
  },
  containerDefault: {
    minHeight: uiTokens.controlHeight, // 44
    paddingVertical: 8,
  },
  containerWithSubtitle: {
    minHeight: 58,
    paddingVertical: 10,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  title: {
    fontWeight: "400",
  },
  subtitle: {
    marginTop: 2,
  },
  trailingValue: {
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  trailing: {
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 8,
    borderRadius: uiTokens.pillRadius,
    borderWidth: uiTokens.surfaceBorderWidth,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.48,
  },
});
