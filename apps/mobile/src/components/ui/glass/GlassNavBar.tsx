import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassNavBarProps {
  left?: ReactNode;
  right?: ReactNode;
  title: string;
}

export function GlassNavBar({
  left,
  right,
  title,
}: GlassNavBarProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const styles = StyleSheet.create({
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      minHeight: 52,
    },
    side: {
      minWidth: 44,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      flex: 1,
      textAlign: "center",
    },
  });

  return (
    <MaterialSurface variant="chrome">
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.side}>{right}</View>
      </View>
    </MaterialSurface>
  );
}
