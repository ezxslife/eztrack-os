import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";

import { useThemeColors, useIsDark } from "@/theme";
import { triggerHaptic } from "@/lib/haptics";

export interface UndoToastProps {
  message: string;
  duration?: number; // default 5000ms
  onUndo: () => Promise<void>;
  onDismiss?: () => void;
}

const TICK_INTERVAL = 100;

/**
 * Toast with undo action and countdown progress bar.
 *
 * "Incident marked resolved. Undo (5s)" — auto-dismisses when timer
 * reaches zero, or immediately on undo. Blur-backed for iOS glass feel.
 *
 * Ported from EZXS-OS UndoToast.
 */
export function UndoToast({
  message,
  duration = 5000,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  const colors = useThemeColors();
  const isDark = useIsDark();

  const [elapsed, setElapsed] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const dismissedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = Math.max(0, 1 - elapsed / duration);
  const secondsRemaining = Math.ceil((duration - elapsed) / 1000);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onDismiss?.();
  }, [onDismiss]);

  const handleUndo = useCallback(async () => {
    if (isUndoing || dismissedRef.current) return;
    triggerHaptic("success");
    setIsUndoing(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await onUndo();
    } finally {
      handleDismiss();
    }
  }, [isUndoing, onUndo, handleDismiss]);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + TICK_INTERVAL;
        if (next >= duration) {
          return duration;
        }
        return next;
      });
    }, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration]);

  // Auto-dismiss when timer reaches 0
  useEffect(() => {
    if (elapsed >= duration && !isUndoing) {
      handleDismiss();
    }
  }, [elapsed, duration, isUndoing, handleDismiss]);

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={`${message}. ${secondsRemaining} seconds remaining. Double tap to undo.`}
    >
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        style={styles.blurView}
      >
        <View style={styles.content}>
          <Text
            style={[styles.message, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {message}
          </Text>

          <Pressable
            onPress={handleUndo}
            disabled={isUndoing}
            style={[
              styles.undoButton,
              { backgroundColor: colors.buttonPrimary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Undo"
          >
            {isUndoing ? (
              <ActivityIndicator
                size="small"
                color={colors.buttonPrimaryText}
              />
            ) : (
              <Text
                style={[
                  styles.undoText,
                  { color: colors.buttonPrimaryText },
                ]}
              >
                Undo
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.selectionBorder,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  blurView: {
    overflow: "hidden",
    borderRadius: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  undoButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  undoText: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 3,
    width: "100%",
  },
  progressBar: {
    height: 3,
  },
});
