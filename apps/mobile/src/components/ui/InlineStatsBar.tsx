import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useThemeColors } from "@/theme";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { uiTokens } from "@/theme/uiTokens";

export interface StatItem {
  key: string;
  value: string | number;
  label: string;
}

interface InlineStatsBarProps {
  stats: StatItem[];
  /** Optional press handler per stat column (receives stat key) */
  onStatPress?: (key: string) => void;
  style?: ViewStyle;
}

/**
 * Flat, typography-first stats row — value/label columns separated
 * by hairline dividers. Matches iOS 26 / Apple Wallet design.
 *
 * Use for: "24 Open | 3 Critical | 2h MTTR | 98% SLA"
 *
 * Ported from EZXS-OS InlineStatsBar.
 */
export function InlineStatsBar({
  stats,
  onStatPress,
  style,
}: InlineStatsBarProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[styles.row, { backgroundColor: colors.surface }, style]}
    >
      {stats.map((stat, index) => {
        const column = (
          <>
            <Text
              style={[styles.value, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
            <Text
              style={[styles.label, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {stat.label}
            </Text>
          </>
        );

        return (
          <React.Fragment key={stat.key}>
            {index > 0 && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
            {onStatPress ? (
              <Pressable
                style={({ pressed }) => [
                  styles.col,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  triggerSelectionHaptic();
                  onStatPress(stat.key);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${stat.label}: ${stat.value}`}
              >
                {column}
              </Pressable>
            ) : (
              <View
                style={styles.col}
                accessibilityLabel={`${stat.label}: ${stat.value}`}
              >
                {column}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: uiTokens.screenGutter,
    borderRadius: uiTokens.innerRadius,
    overflow: "hidden",
    height: 56,
  },
  col: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.7,
  },
});
