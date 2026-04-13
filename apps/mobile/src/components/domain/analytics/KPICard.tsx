import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { direction: "up" | "down" | "flat"; percentage: number };
  icon?: string;
  color?: string;
  onPress?: () => void;
  compact?: boolean;
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  icon,
  color,
  onPress,
  compact = false,
}: KPICardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const trendColor =
    trend?.direction === "up"
      ? colors.success
      : trend?.direction === "down"
        ? colors.error
        : colors.textTertiary;

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing[2],
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: color ? `${color}20` : `${colors.brandText}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[1],
    },
    value: compact
      ? typography.headline
      : { ...typography.title1, color: colors.textPrimary },
    unit: {
      ...typography.body,
      color: colors.textSecondary,
    },
    title: {
      ...typography.subheadline,
      color: colors.textSecondary,
      marginTop: spacing[1],
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginTop: spacing[1],
    },
    trendText: {
      ...typography.caption1,
      color: trendColor,
      fontWeight: "600",
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && (
          <View style={styles.iconContainer}>
            <AppSymbol
              iosName={icon as any}
              fallbackName="help"
              size={16}
              color={color || colors.brandText}
            />
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>

      {trend && (
        <View style={styles.trendContainer}>
          <AppSymbol
            iosName={
              trend.direction === "up"
                ? "arrow.up"
                : trend.direction === "down"
                  ? "arrow.down"
                  : "minus"
            }
            fallbackName={
              trend.direction === "up"
                ? "arrow-up"
                : trend.direction === "down"
                  ? "arrow-down"
                  : "remove"
            }
            size={12}
            color={trendColor}
          />
          <Text style={styles.trendText}>
            {trend.direction === "up" ? "+" : ""}
            {trend.percentage}%
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressable : {})}
      >
        <MaterialSurface variant="panel" padding={spacing[4]}>
          {content}
        </MaterialSurface>
      </Pressable>
    );
  }

  return (
    <MaterialSurface variant="panel" padding={spacing[4]}>
      {content}
    </MaterialSurface>
  );
}
