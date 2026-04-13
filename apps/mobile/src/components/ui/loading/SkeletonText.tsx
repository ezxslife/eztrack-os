import React from "react";
import { View, type ViewStyle } from "react-native";

import { Skeleton } from "./Skeleton";

interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: number | `${number}%`;
  lineHeight?: number;
  spacing?: number;
  style?: ViewStyle;
}

/**
 * Multi-line text skeleton. Last line is shorter for
 * a natural paragraph feel.
 *
 * Ported from EZXS-OS SkeletonText.
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = "75%",
  lineHeight = 16,
  spacing = 6,
  style,
}: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          borderRadius={4}
          style={i < lines - 1 ? { marginBottom: spacing } : undefined}
        />
      ))}
    </View>
  );
}
