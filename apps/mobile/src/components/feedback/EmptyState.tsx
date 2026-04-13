import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { AppSymbol } from "../ui/AppSymbol";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** "screen" fills the container, "section" is compact for inline use */
  variant?: "screen" | "section" | "sheet";
  /** Shrink sizing for tight spaces */
  compact?: boolean;
}

/**
 * Empty-state placeholder with icon badge, copy, and optional CTA buttons.
 *
 * Sizing aligned with EZXS-OS: 64px icon badge, 20px title, 24px pill-radius
 * buttons. Supports compact variant for section-level empty states.
 */
export function EmptyState({
  title,
  subtitle,
  icon = "inbox.circle",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "screen",
  compact = false,
}: EmptyStateProps) {
  const colors = useThemeColors();

  const containerVariantStyle =
    variant === "sheet"
      ? styles.sheetContainer
      : variant === "section"
        ? styles.sectionContainer
        : styles.screenContainer;

  const badgeSize = compact
    ? uiTokens.emptyIconBadgeCompact
    : uiTokens.emptyIconBadge;
  const iconSize = compact
    ? uiTokens.emptyIconSizeCompact
    : uiTokens.emptyIconSize;

  return (
    <View
      style={[
        styles.container,
        containerVariantStyle,
        compact && styles.compactContainer,
      ]}
    >
      {/* Icon badge */}
      <View
        style={[
          styles.iconBadge,
          compact && styles.compactIconBadge,
          { backgroundColor: colors.backgroundTertiary ?? colors.surfaceContainerLow },
        ]}
      >
        <AppSymbol name={icon} size={iconSize} color={colors.textTertiary} />
      </View>

      {/* Copy */}
      <Text
        style={[
          styles.title,
          compact && styles.compactTitle,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.message,
            compact && styles.compactMessage,
            { color: colors.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {/* Actions */}
      {(actionLabel && onAction) ||
      (secondaryActionLabel && onSecondaryAction) ? (
        <View style={styles.actionsRow}>
          {actionLabel && onAction ? (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={({ pressed }) => [
                styles.button,
                compact && styles.compactButton,
                {
                  backgroundColor: colors.buttonPrimary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  compact && styles.compactButtonText,
                  { color: colors.buttonPrimaryText },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}

          {secondaryActionLabel && onSecondaryAction ? (
            <Pressable
              onPress={onSecondaryAction}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                compact && styles.compactButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  compact && styles.compactButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 28,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 48,
  },
  sectionContainer: {
    paddingVertical: 24,
  },
  sheetContainer: {
    paddingVertical: 16,
  },
  compactContainer: {
    paddingHorizontal: 20,
  },

  // Icon badge
  iconBadge: {
    width: uiTokens.emptyIconBadge,
    height: uiTokens.emptyIconBadge,
    borderRadius: uiTokens.sectionRadius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  compactIconBadge: {
    width: uiTokens.emptyIconBadgeCompact,
    height: uiTokens.emptyIconBadgeCompact,
    borderRadius: uiTokens.innerRadius + 4, // 16
    marginBottom: 10,
  },

  // Copy
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 17,
    marginBottom: 6,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 300,
  },
  compactMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: uiTokens.controlRadius,
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  compactButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: uiTokens.controlRadius,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  compactButtonText: {
    fontSize: 14,
  },
});
