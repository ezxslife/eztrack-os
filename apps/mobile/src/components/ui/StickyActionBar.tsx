import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";

interface StickyActionBarProps {
  /** Primary (right-side / full-width) button label */
  primaryLabel: string;
  onPrimaryPress: () => void;
  /** Optional secondary (left-side, outlined) button label */
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** Position absolutely at bottom of parent (default true) */
  absolute?: boolean;
  /** Disable the primary button */
  disabled?: boolean;
  /** Optional content rendered above the button row (e.g. a progress bar) */
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Sticky bottom action bar for form screens (Save/Cancel, Submit, etc.).
 *
 * Handles safe-area bottom insets, consistent button sizing,
 * and a clear primary / secondary hierarchy.
 *
 * Ported from EZXS-OS StickyActionBar with EZTrack token integration.
 */
export function StickyActionBar({
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  absolute = true,
  disabled = false,
  children,
  style,
}: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        absolute && styles.absolute,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
          paddingBottom: Math.max(insets.bottom, 16),
        },
        style,
      ]}
    >
      {children}

      <View style={styles.actions}>
        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
          >
            <Text
              style={[styles.secondaryLabel, { color: colors.textPrimary }]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onPrimaryPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            {
              backgroundColor: disabled
                ? colors.interactiveDisabled
                : colors.buttonPrimary,
              opacity: pressed && !disabled ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          accessibilityState={{ disabled }}
        >
          <Text
            style={[styles.primaryLabel, { color: colors.buttonPrimaryText }]}
          >
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: uiTokens.screenGutter,
    paddingTop: 12,
    gap: 12,
  },
  absolute: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    minHeight: uiTokens.actionBarButtonHeight,
    borderRadius: uiTokens.actionBarButtonRadius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    minWidth: uiTokens.actionBarSecondaryMinWidth,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
