import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { AppSymbol } from "../ui/AppSymbol";

interface SuccessStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

/**
 * Success feedback screen — for completed actions like
 * "Incident resolved", "Dispatch completed", "Shift closed".
 *
 * Mirrors EmptyState/ErrorState sizing with green success tone.
 */
export function SuccessState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: SuccessStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Success icon badge */}
      <View
        style={[
          styles.iconBadge,
          compact && styles.compactIconBadge,
          { backgroundColor: "rgba(16,185,129,0.14)" },
        ]}
      >
        <AppSymbol
          name="checkmark.circle.fill"
          size={compact ? uiTokens.emptyIconSizeCompact : uiTokens.emptyIconSize}
          color={colors.success}
        />
      </View>

      <Text
        style={[
          styles.title,
          compact && styles.compactTitle,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      {message ? (
        <Text
          style={[
            styles.message,
            compact && styles.compactMessage,
            { color: colors.textSecondary },
          ]}
        >
          {message}
        </Text>
      ) : null}

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
                  backgroundColor: colors.success,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.buttonText}>{actionLabel}</Text>
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
                style={[styles.buttonText, { color: colors.textPrimary }]}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  compactContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
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
    borderRadius: 16,
    marginBottom: 10,
  },
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
    color: "#FFFFFF",
  },
});
