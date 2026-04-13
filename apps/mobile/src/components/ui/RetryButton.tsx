import React, { useState, useEffect, useCallback } from "react";
import { Pressable, Text, StyleSheet, type ViewStyle } from "react-native";

import { useThemeColors } from "@/theme";
import { triggerHaptic } from "@/lib/haptics";
import { AppSymbol } from "./AppSymbol";

interface RetryButtonProps {
  /** Called when user taps retry */
  onRetry: () => void;
  /** Label text */
  label?: string;
  /** Whether currently retrying */
  loading?: boolean;
  /** Countdown seconds (button disabled during countdown) */
  countdown?: number;
  /** Container style */
  style?: ViewStyle;
}

/**
 * Outlined retry button with countdown timer and loading state.
 *
 * Shows "Try again (3s)" during cooldown, auto-enables when countdown
 * reaches zero. Prevents user spamming failed requests.
 *
 * Ported from EZXS-OS RetryButton.
 */
export function RetryButton({
  onRetry,
  label = "Try again",
  loading = false,
  countdown: initialCountdown,
  style,
}: RetryButtonProps) {
  const colors = useThemeColors();
  const [countdown, setCountdown] = useState(initialCountdown ?? 0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset countdown when prop changes
  useEffect(() => {
    if (initialCountdown !== undefined) {
      setCountdown(initialCountdown);
    }
  }, [initialCountdown]);

  const disabled = loading || countdown > 0;

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerHaptic("light");
    onRetry();
  }, [disabled, onRetry]);

  const displayLabel = countdown > 0 ? `${label} (${countdown}s)` : label;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: disabled
            ? colors.interactiveDisabled
            : colors.selectionBorder,
        },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityState={{ disabled }}
    >
      <AppSymbol
        name="arrow.counterclockwise"
        fallbackName="refresh-ccw"
        size={16}
        color={disabled ? colors.textTertiary : colors.selectionText}
      />
      <Text
        style={[
          styles.label,
          {
            color: disabled ? colors.textTertiary : colors.selectionText,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
