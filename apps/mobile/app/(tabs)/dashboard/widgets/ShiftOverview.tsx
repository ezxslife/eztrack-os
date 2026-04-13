import { StyleSheet, Text, View } from "react-native";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { formatRelativeTimestamp } from "@/lib/format";

interface ShiftOverviewProps {
  shiftName?: string;
  startTime?: Date;
  personnelOnDuty?: number;
  activeIncidents?: number;
  activeDispatches?: number;
}

export function ShiftOverview({
  shiftName = "Morning Shift",
  startTime,
  personnelOnDuty = 0,
  activeIncidents = 0,
  activeDispatches = 0,
}: ShiftOverviewProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  const durationMinutes = startTime
    ? Math.floor((Date.now() - startTime.getTime()) / (1000 * 60))
    : 0;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <MaterialSurface variant="panel" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Shift</Text>
        <Text style={styles.shiftName}>{shiftName}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{personnelOnDuty}</Text>
          <Text style={styles.statLabel}>Personnel On Duty</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{activeIncidents}</Text>
          <Text style={styles.statLabel}>Active Incidents</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{activeDispatches}</Text>
          <Text style={styles.statLabel}>Active Dispatches</Text>
        </View>
      </View>

      {startTime && (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>
            Started {formatRelativeTimestamp(startTime.toISOString())} ({formatDuration(durationMinutes)} elapsed)
          </Text>
        </View>
      )}
    </MaterialSurface>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    container: {
      gap: 12,
      paddingHorizontal: layout.horizontalPadding,
    },
    header: {
      gap: 2,
    },
    title: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    shiftName: {
      ...typography.title3,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    statsContainer: {
      flexDirection: "row",
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 10,
      alignItems: "center",
    },
    statValue: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    statLabel: {
      ...typography.caption2,
      color: colors.textTertiary,
      fontWeight: "500",
      marginTop: 4,
      textAlign: "center",
    },
    footer: {
      borderTopColor: colors.borderLight,
      borderTopWidth: 1,
      paddingTop: 10,
    },
    footerLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "500",
    },
  });
}

export default ShiftOverview;
