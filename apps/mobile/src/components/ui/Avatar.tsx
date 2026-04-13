import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";

interface AvatarProps {
  imageUrl?: string | null;
  initials?: string;
  isOnline?: boolean;
  label?: string;
  name?: string;
  onPress?: () => void;
  showOnline?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  src?: string | null;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function Avatar({
  imageUrl,
  initials,
  isOnline = false,
  label,
  name,
  onPress,
  showOnline = false,
  size = "md",
  src,
}: AvatarProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const resolvedSize = typeof size === "number" ? size : SIZE_MAP[size];
  const resolvedLabel = label ?? name ?? initials ?? "?";
  const resolvedInitials = initials ?? getInitials(resolvedLabel);
  const resolvedImage = src ?? imageUrl ?? null;
  const onlineIndicatorSize = resolvedSize < 32 ? 6 : resolvedSize < 56 ? 10 : 14;
  const initialsStyle =
    resolvedSize < 32
      ? typography.caption2
      : resolvedSize < 56
        ? typography.footnote
        : typography.title3;

  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.borderLight,
            borderRadius: resolvedSize / 2,
            height: resolvedSize,
            width: resolvedSize,
          },
        ]}
      >
        {resolvedImage ? (
          <Image
            source={{ uri: resolvedImage }}
            style={[
              styles.image,
              {
                borderRadius: resolvedSize / 2,
                height: resolvedSize,
                width: resolvedSize,
              },
            ]}
          />
        ) : (
          <Text
            style={[
              initialsStyle,
              {
                color: colors.textPrimary,
                fontWeight: "700",
              },
            ]}
          >
            {resolvedInitials}
          </Text>
        )}
        {showOnline ? (
          <View
            style={[
              styles.onlineIndicator,
              {
                backgroundColor: isOnline ? colors.success : colors.textTertiary,
                borderColor: colors.background,
                borderRadius: onlineIndicatorSize / 2,
                borderWidth: Math.max(2, onlineIndicatorSize / 3),
                height: onlineIndicatorSize,
                width: onlineIndicatorSize,
              },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  onlineIndicator: {
    bottom: 0,
    position: "absolute",
    right: 0,
  },
});
