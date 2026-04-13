import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getStatusStyle } from "@/theme/statusColors";
import { uiTokens } from "@/theme/uiTokens";

interface StatusBadgeProps {
  animated?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  status: string;
}

function titleCase(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const sizeConfig = {
  sm: { height: 20, fontSize: 10 },
  md: { height: 24, fontSize: 12 },
  lg: { height: 28, fontSize: 14 },
} as const;

export function StatusBadge({
  animated = false,
  label,
  size = "md",
  status,
}: StatusBadgeProps) {
  const palette = getStatusStyle(status);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (
      !animated ||
      !["active", "in_progress", "live"].includes(status.toLowerCase())
    ) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animated, status, pulseAnim]);

  const sizeStyle = sizeConfig[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          height: sizeStyle.height,
          opacity: pulseAnim,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: palette.text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {label ?? titleCase(status)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: uiTokens.pillRadius,
    borderWidth: uiTokens.surfaceBorderWidth,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontWeight: "700",
  },
});
