import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useIsDark } from "@/theme";

interface NativeHeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

interface NativeHeaderActionGroupProps {
  actions: NativeHeaderAction[];
}

/**
 * Compact pill-shaped grouping for 2-3 header-right actions.
 *
 * Creates a single capsule that contains multiple icon buttons,
 * matching the iOS 26 pattern for grouped header actions.
 *
 * Ported from EZXS-OS NativeHeaderActionGroup.
 */
export function NativeHeaderActionGroup({
  actions,
}: NativeHeaderActionGroupProps) {
  const isDark = useIsDark();

  return (
    <View
      style={[
        styles.group,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)",
        },
      ]}
    >
      {actions.map((action) => (
        <Pressable
          key={action.accessibilityLabel}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          {action.icon}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
