import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { AppSymbol } from "../ui/AppSymbol";

interface NotFoundStateProps {
  /** Entity type: "Incident", "Case", "Person", etc. */
  entity?: string;
  message?: string;
  onGoBack?: () => void;
}

/**
 * 404 screen for missing resources.
 *
 * Shows when a specific incident/case/person/record can't be found.
 */
export function NotFoundState({
  entity = "Page",
  message,
  onGoBack,
}: NotFoundStateProps) {
  const colors = useThemeColors();

  const resolvedMessage =
    message ??
    `The ${entity.toLowerCase()} you're looking for doesn't exist or has been removed.`;

  return (
    <View style={styles.container}>
      {/* Icon badge */}
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: colors.backgroundTertiary },
        ]}
      >
        <AppSymbol
          name="magnifyingglass"
          size={uiTokens.emptyIconSize}
          color={colors.textTertiary}
        />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {entity} Not Found
      </Text>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {resolvedMessage}
      </Text>

      {onGoBack ? (
        <Pressable
          onPress={onGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.buttonPrimary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
            Go Back
          </Text>
        </Pressable>
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
  iconBadge: {
    width: uiTokens.emptyIconBadge,
    height: uiTokens.emptyIconBadge,
    borderRadius: uiTokens.sectionRadius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: uiTokens.controlRadius,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
