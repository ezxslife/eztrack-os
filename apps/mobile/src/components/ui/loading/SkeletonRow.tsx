import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";

import { Skeleton } from "./Skeleton";

interface SkeletonRowProps {
  hasAvatar?: boolean;
  hasSecondaryText?: boolean;
  style?: ViewStyle;
}

/**
 * List row skeleton with optional avatar, primary/secondary text,
 * and right badge placeholder.
 *
 * Ported from EZXS-OS SkeletonRow.
 */
export function SkeletonRow({
  hasAvatar = true,
  hasSecondaryText = true,
  style,
}: SkeletonRowProps) {
  return (
    <View style={[styles.container, style]}>
      {hasAvatar && <Skeleton width={40} height={40} borderRadius={20} />}
      <View style={styles.textCol}>
        <Skeleton height={16} width="75%" borderRadius={4} />
        {hasSecondaryText && (
          <Skeleton
            height={12}
            width="50%"
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        )}
      </View>
      <Skeleton width={60} height={20} borderRadius={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textCol: {
    flex: 1,
  },
});
