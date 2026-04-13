import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { useThemeColors, useIsDark } from "@/theme";
import { uiTokens } from "@/theme/uiTokens";
import { Skeleton } from "./loading/Skeleton";
import { AppSymbol } from "./AppSymbol";

interface StaticMapImageProps {
  latitude: number;
  longitude: number;
  /** Image width in px (used for URL, not layout) */
  width?: number;
  /** Image height in px (used for URL, not layout) */
  height?: number;
  /** Display border radius */
  borderRadius?: number;
  /** Zoom level (1-20) */
  zoom?: number;
  style?: ViewStyle;
}

/**
 * Lightweight map thumbnail using Mapbox Static Images API.
 *
 * Renders as a simple <Image> — no native MapView, no SDK.
 * Shows skeleton while loading, pin icon on error.
 *
 * Requires MAPBOX_ACCESS_TOKEN env var or falls back to placeholder.
 *
 * Ported from EZXS-OS StaticMapImage.
 */
export function StaticMapImage({
  latitude,
  longitude,
  width = 600,
  height = 300,
  borderRadius = uiTokens.innerRadius,
  zoom = 14,
  style,
}: StaticMapImageProps) {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const mapStyle = isDark ? "dark-v11" : "streets-v12";

  // Build Mapbox Static Images URL
  // Falls back to placeholder if no token
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const mapUrl = token
    ? `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/pin-s+1F2937(${longitude},${latitude})/${longitude},${latitude},${zoom},0/${width}x${height}@2x?access_token=${token}`
    : null;

  if (!mapUrl || error) {
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: colors.surfaceContainerLow, borderRadius },
          style,
        ]}
      >
        <AppSymbol
          name="mappin.circle"
          size={32}
          color={colors.textTertiary}
        />
      </View>
    );
  }

  return (
    <View style={[{ borderRadius, overflow: "hidden" }, style]}>
      {loading && (
        <Skeleton
          width="100%"
          height="100%"
          borderRadius={0}
          style={StyleSheet.absoluteFill as any}
        />
      )}
      <Image
        source={{ uri: mapUrl }}
        style={[styles.image, { borderRadius }]}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        accessibilityLabel={`Map showing location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    aspectRatio: 2,
  },
  fallback: {
    width: "100%",
    aspectRatio: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
