import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

type ActivityType = "incidents" | "dispatches" | "log-entries" | "all";

type Activity = {
  id: string;
  type: "incident" | "dispatch" | "log-entry" | "status-change";
  description: string;
  timestamp: string;
  iconName: string;
};

const mockActivities: Activity[] = [
  {
    id: "A1",
    type: "incident",
    description: "Responded to incident INC-0847",
    timestamp: "12 min ago",
    iconName: "exclamationmark.circle.fill",
  },
  {
    id: "A2",
    type: "dispatch",
    description: "Dispatched to 5th & Main for traffic collision",
    timestamp: "35 min ago",
    iconName: "location.fill",
  },
  {
    id: "A3",
    type: "status-change",
    description: "Status changed to On Scene",
    timestamp: "2 hours ago",
    iconName: "checkmark.circle.fill",
  },
  {
    id: "A4",
    type: "log-entry",
    description: "Daily log entry: Routine patrol downtown",
    timestamp: "3 hours ago",
    iconName: "doc.text.fill",
  },
  {
    id: "A5",
    type: "dispatch",
    description: "Dispatched to Park Ave for welfare check",
    timestamp: "5 hours ago",
    iconName: "location.fill",
  },
  {
    id: "A6",
    type: "incident",
    description: "Reported incident INC-0841",
    timestamp: "6 hours ago",
    iconName: "exclamationmark.circle.fill",
  },
  {
    id: "A7",
    type: "log-entry",
    description: "Daily log entry: Training session completed",
    timestamp: "Yesterday",
    iconName: "doc.text.fill",
  },
  {
    id: "A8",
    type: "status-change",
    description: "Status changed to Available",
    timestamp: "Yesterday",
    iconName: "checkmark.circle.fill",
  },
];

const filterOptions = ["All", "Incidents", "Dispatches", "Log Entries"] as const;

export default function ActivityLogScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const [selectedFilter, setSelectedFilter] = useState<typeof filterOptions[number]>("All");
  const styles = createStyles(colors, layout, typography);

  const filteredActivities = mockActivities.filter((activity) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Incidents") return activity.type === "incident";
    if (selectedFilter === "Dispatches") return activity.type === "dispatch";
    if (selectedFilter === "Log Entries") return activity.type === "log-entry";
    return true;
  });

  const getActivityColor = (type: Activity["type"]): string => {
    switch (type) {
      case "incident":
        return "#FF3B30";
      case "dispatch":
        return "#0084FF";
      case "log-entry":
        return "#34C759";
      case "status-change":
        return "#FF9500";
      default:
        return colors.primary;
    }
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <Pressable
      style={styles.activityCard}
      onPress={() => {
        triggerImpactHaptic();
      }}
    >
      <View style={styles.activityIcon}>
        <AppSymbol
          iosName={item.iconName as any}
          fallbackName="alert-circle"
          size={20}
          color={getActivityColor(item.type)}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTime}>{item.timestamp}</Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Activity Log",
        }}
      />
      <ScreenContainer nativeHeader>
        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <FilterChips
            onSelect={(value) => {
              triggerImpactHaptic();
              setSelectedFilter(value as typeof filterOptions[number]);
            }}
            options={filterOptions as unknown as string[]}
            selected={selectedFilter}
          />
        </View>

        {/* Activity List */}
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <AppSymbol
                iosName="doc.text"
                fallbackName="document"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>No activities</Text>
              <Text style={styles.emptySubtext}>
                Try selecting a different filter
              </Text>
            </View>
          )}
        />
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    filterContainer: {
      marginBottom: layout.gridGap,
    },
    activityCard: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
      paddingVertical: 12,
      paddingHorizontal: layout.listItemPadding,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    activityContent: {
      flex: 1,
      gap: 4,
      paddingTop: 2,
    },
    activityDescription: {
      ...typography.subheadline,
      color: colors.textPrimary,
    },
    activityTime: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    separator: {
      height: 8,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      gap: 12,
    },
    emptyText: {
      ...typography.headline,
      color: colors.textSecondary,
    },
    emptySubtext: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
  });
}
