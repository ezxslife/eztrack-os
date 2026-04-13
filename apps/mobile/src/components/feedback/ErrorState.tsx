import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { triggerHaptic } from "@/lib/haptics";
import { AppSymbol } from "../ui/AppSymbol";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** "screen" fills the container, "section" is compact for inline use */
  variant?: "screen" | "section";
  compact?: boolean;
}

/**
 * Error state with icon badge, copy, and retry CTA.
 *
 * Sizing aligned with EZXS-OS: 64px icon badge, 20px title,
 * 24px pill-radius buttons.
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  variant = "screen",
  compact = false,
}: ErrorStateProps) {
  const colors = useThemeColors();

  const handleRetry = () => {
    if (onRetry) {
      triggerHaptic("warning");
      onRetry();
    }
  };

  const containerVariantStyle =
    variant === "section" ? styles.sectionContainer : styles.screenContainer;

  return (
    <View
      style={[
        styles.container,
        containerVariantStyle,
        compact && styles.compactContainer,
      ]}
    >
      {/* Error icon badge */}
      <View
        style={[
          styles.iconBadge,
          compact && styles.compactIconBadge,
          {
            backgroundColor: "rgba(239,68,68,0.14)",
          },
        ]}
      >
        <AppSymbol
          name="exclamationmark.triangle.fill"
          size={compact ? uiTokens.emptyIconSizeCompact : uiTokens.emptyIconSize}
          color={colors.error}
        />
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          compact && styles.compactTitle,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      {/* Message */}
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

      {/* Retry button */}
      {onRetry ? (
        <Pressable
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          style={({ pressed }) => [
            styles.button,
            compact && styles.compactButton,
            {
              backgroundColor: colors.error,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
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
    borderRadius: 16,
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

  // Button
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: uiTokens.controlRadius,
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
