import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Switch,
  Alert,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface ScheduledReport {
  id: string;
  template: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  nextRun: string;
  recipients: string[];
  enabled: boolean;
}

const MOCK_SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: "1",
    template: "Shift Report",
    frequency: "Daily",
    nextRun: "2026-04-12 06:00 AM",
    recipients: ["manager@example.com", "ops-team@example.com"],
    enabled: true,
  },
  {
    id: "2",
    template: "Incident Summary",
    frequency: "Weekly",
    nextRun: "2026-04-14 09:00 AM",
    recipients: ["director@example.com"],
    enabled: true,
  },
  {
    id: "3",
    template: "Monthly Analytics",
    frequency: "Monthly",
    nextRun: "2026-05-01 08:00 AM",
    recipients: ["analytics@example.com", "executives@example.com"],
    enabled: false,
  },
];

function ScheduleCard({
  schedule,
  colors,
  typography,
  layout,
  onToggle,
  onDelete,
}: {
  schedule: ScheduledReport;
  colors: ReturnType<typeof useThemeColors>;
  typography: ReturnType<typeof useThemeTypography>;
  layout: ReturnType<typeof useAdaptiveLayout>;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const styles = createCardStyles(colors, typography, layout);

  return (
    <MaterialSurface variant="chrome" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.template}>{schedule.template}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.frequency}>{schedule.frequency}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.nextRun}>Next: {schedule.nextRun}</Text>
          </View>
        </View>
        <Switch
          value={schedule.enabled}
          onValueChange={(value) => {
            triggerImpactHaptic();
            onToggle(schedule.id, value);
          }}
        />
      </View>

      <View style={styles.recipientsSection}>
        <Text style={styles.recipientsLabel}>Recipients</Text>
        <View style={styles.recipientsList}>
          {schedule.recipients.slice(0, 2).map((email, idx) => (
            <View key={idx} style={styles.recipientBadge}>
              <Text style={styles.recipientText} numberOfLines={1}>
                {email}
              </Text>
            </View>
          ))}
          {schedule.recipients.length > 2 && (
            <View style={styles.recipientBadge}>
              <Text style={styles.recipientText}>
                +{schedule.recipients.length - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => {
          triggerImpactHaptic();
          onDelete(schedule.id);
        }}
      >
        <Text style={styles.deleteLink}>Remove Schedule</Text>
      </Pressable>
    </MaterialSurface>
  );
}

export default function ReportSchedulingScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const [schedules, setSchedules] = useState(MOCK_SCHEDULED_REPORTS);

  const handleToggle = (id: string, enabled: boolean) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === id ? { ...schedule, enabled } : schedule
      )
    );
  };

  const handleDelete = (id: string) => {
    const schedule = schedules.find((s) => s.id === id);
    Alert.alert(
      "Remove Schedule",
      `Remove schedule for ${schedule?.template}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            triggerImpactHaptic();
            setSchedules((prev) => prev.filter((s) => s.id !== id));
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddSchedule = () => {
    Alert.alert("Add Schedule", "Configure a new report schedule", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      { text: "Add", onPress: () => {
        triggerImpactHaptic();
        // TODO: Navigate to schedule creation
      } },
    ]);
  };

  const activeSchedules = schedules.filter((s) => s.enabled).length;

  return (
    <>
      <Stack.Screen options={{ title: "Report Scheduling" }} />
      <ScreenContainer nativeHeader>
        <View style={styles.section}>
          <SectionHeader
            title={`Scheduled Reports (${activeSchedules} active)`}
          />
          <FlatList
            data={schedules}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <ScheduleCard
                schedule={item}
                colors={colors}
                typography={typography}
                layout={layout}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            )}
          />
        </View>

        <View style={styles.footer}>
          <Button
            variant="primary"
            label="Add Schedule"
            onPress={handleAddSchedule}
            icon="add-circle"
          />
        </View>
      </ScreenContainer>
    </>
  );
}

function createCardStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    titleSection: {
      flex: 1,
      gap: 6,
    },
    template: {
      ...typography.subheadline,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    frequency: {
      ...typography.caption1,
      color: colors.primary,
      fontWeight: "600",
    },
    dot: {
      color: colors.textTertiary,
    },
    nextRun: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    recipientsSection: {
      gap: 8,
    },
    recipientsLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "600",
    },
    recipientsList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    recipientBadge: {
      backgroundColor: colors.surfaceTintMedium,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      maxWidth: "48%",
    },
    recipientText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    deleteLink: {
      ...typography.body,
      color: colors.error,
      fontWeight: "500",
    },
  });
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
      flex: 1,
    },
    separator: {
      height: 8,
    },
    footer: {
      paddingHorizontal: layout.horizontalPadding,
      paddingBottom: 24,
      paddingTop: 16,
      gap: 8,
    },
  });
}
