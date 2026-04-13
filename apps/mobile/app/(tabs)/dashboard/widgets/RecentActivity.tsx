import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { formatRelativeTimestamp } from "@/lib/format";

export interface ActivityItem {
  id: string;
  type: "incident" | "dispatch" | "log" | "case";
  title: string;
  actor: string;
  timestamp: Date;
}

interface RecentActivityProps {
  items?: ActivityItem[];
  onSeeAll?: () => void;
}

// TODO: Replace with real hook when available
const mockActivityData: ActivityItem[] = [
  {
    id: "1",
    type: "incident",
    title: "Traffic Incident on Main St",
    actor: "Officer Smith",
    timestamp: new Date(Date.now() - 15 * 60000),
  },
  {
    id: "2",
    type: "dispatch",
    title: "Unit 5 dispatched to Broadway",
    actor: "Dispatcher Johnson",
    timestamp: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "3",
    type: "log",
    title: "Shift inspection completed",
    actor: "Officer Brown",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
  },
  {
    id: "4",
    type: "case",
    title: "Case #2024-001 status updated",
    actor: "Detective Lee",
    timestamp: new Date(Date.now() - 4 * 60 * 60000),
  },
  {
    id: "5",
    type: "incident",
    title: "Welfare check completed",
    actor: "Officer Davis",
    timestamp: new Date(Date.now() - 6 * 60 * 60000),
  },
];

export function RecentActivity({
  items = mockActivityData.slice(0, 5),
  onSeeAll,
}: RecentActivityProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const styles = createStyles(colors, typography, layout);

  const getIconAndColor = (
    type: ActivityItem["type"]
  ): { symbol: string; color: string } => {
    const iconMap = {
      incident: {
        symbol: "exclamationmark.triangle.fill",
        color: colors.error,
      },
      dispatch: {
        symbol: "antenna.radiowaves.left.and.right.fill",
        color: colors.info,
      },
      log: { symbol: "note.text.fill", color: colors.success },
      case: { symbol: "briefcase.fill", color: colors.accent },
    };
    return iconMap[type];
  };

  const handleActivityPress = (activity: ActivityItem) => {
    // Route to detail screen based on type
    switch (activity.type) {
      case "incident":
        router.push({ pathname: "/incidents/[id]", params: { id: activity.id } });
        break;
      case "dispatch":
        router.push({ pathname: "/dispatch/[id]", params: { id: activity.id } });
        break;
      case "log":
        router.push({ pathname: "/daily-log/[id]", params: { id: activity.id } });
        break;
      case "case":
        router.push({ pathname: "/cases/[id]", params: { id: activity.id } });
        break;
    }
  };

  return (
    <MaterialSurface variant="panel" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAllLink}>See All</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.activityList}>
        {items.map((activity, index) => {
          const { symbol, color } = getIconAndColor(activity.type);

          return (
            <Pressable
              key={activity.id}
              onPress={() => handleActivityPress(activity)}
              style={({ pressed }) => [
                styles.activityItem,
                index !== items.length - 1 && styles.itemWithBorder,
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: color }]}>
                <AppSymbol
                  iosName={symbol as any}
                  fallbackName="alert"
                  size={16}
                  color={colors.textInverse}
                  weight="semibold"
                />
              </View>

              <View style={styles.contentContainer}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>
                  {activity.actor} · {formatRelativeTimestamp(activity.timestamp.toISOString())}
                </Text>
              </View>

              <AppSymbol
                iosName="chevron.right"
                fallbackName="chevron-forward"
                size={16}
                color={colors.textTertiary}
              />
            </Pressable>
          );
        })}
      </View>
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
      paddingVertical: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomColor: colors.borderLight,
      borderBottomWidth: 1,
    },
    title: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    seeAllLink: {
      ...typography.body,
      color: colors.primaryInk,
      fontWeight: "600",
    },
    activityList: {
      gap: 0,
    },
    activityItem: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingVertical: 12,
    },
    itemWithBorder: {
      borderBottomColor: colors.borderLight,
      borderBottomWidth: 1,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    contentContainer: {
      flex: 1,
      gap: 2,
    },
    activityTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    activityMeta: {
      ...typography.caption2,
      color: colors.textTertiary,
      fontWeight: "400",
    },
  });
}

export default RecentActivity;
