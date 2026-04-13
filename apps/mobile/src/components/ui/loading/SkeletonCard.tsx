import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";

import { Skeleton } from "./Skeleton";

type SkeletonCardVariant = "incident" | "dispatch" | "compact";

interface SkeletonCardProps {
  variant?: SkeletonCardVariant;
  style?: ViewStyle;
}

const DIMENSIONS = {
  /** Full incident card with status strip */
  incident: { imageHeight: 0 },
  /** Dispatch card with priority bar */
  dispatch: { imageHeight: 0 },
  /** Compact card for logs/personnel */
  compact: { imageHeight: 0 },
};

/**
 * Pre-composed card skeleton with title, subtitle, and meta row.
 *
 * Ported from EZXS-OS SkeletonCard, adapted for EZTrack
 * incident/dispatch/compact card layouts.
 */
export function SkeletonCard({
  variant = "incident",
  style,
}: SkeletonCardProps) {
  const dim = DIMENSIONS[variant];

  return (
    <View style={[styles.container, style]}>
      {dim.imageHeight > 0 && (
        <Skeleton height={dim.imageHeight} borderRadius={12} />
      )}
      <View style={styles.content}>
        <Skeleton height={20} width="85%" borderRadius={6} />
        <Skeleton
          height={14}
          width="65%"
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        <View style={styles.metaRow}>
          <Skeleton height={12} width="40%" borderRadius={4} />
          <Skeleton height={12} width="30%" borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  content: {
    padding: 12,
    gap: 0,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
