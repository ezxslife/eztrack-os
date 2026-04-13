import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface MetricRowProps {
  label: string;
  value: string | number;
  secondaryValue?: string;
  trend?: { direction: "up" | "down" | "flat"; percentage: number };
  icon?: string;
  onPress?: () => void;
}

export function MetricRow({
  label,
  value,
  secondaryValue,
  trend,
  icon,
  onPress,
}: MetricRowProps) {
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
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      gap: spacing[3],
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.backgroundMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    leftSection: {
      flex: 1,
      gap: spacing[0.5],
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
    },
    rightSection: {
      alignItems: "flex-end",
      gap: spacing[0.5],
    },
    valueContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing[1],
    },
    value: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    secondaryValue: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[0.5],
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
      {icon && (
        <View style={styles.iconContainer}>
          <AppSymbol
            iosName={icon as any}
            fallbackName="help"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      )}

      <View style={styles.leftSection}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
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
                size={10}
                color={trendColor}
              />
              <Text style={styles.trendText}>
                {trend.direction === "up" ? "+" : ""}
                {trend.percentage}%
              </Text>
            </View>
          )}
        </View>
        {secondaryValue && <Text style={styles.secondaryValue}>{secondaryValue}</Text>}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressable : {})}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
