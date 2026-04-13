import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DailyLogStatus } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderEditButton, HeaderMoreButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useDailyLogDetail,
  useDeleteDailyLogMutation,
  useUpdateDailyLogStatusMutation,
} from "@/lib/queries/daily-logs";
import { useThemeColors } from "@/theme";

const statusActions = [
  { label: "Open", value: DailyLogStatus.Open },
  { label: "Pending", value: DailyLogStatus.Pending },
  { label: "High Priority", value: DailyLogStatus.HighPriority },
  { label: "Closed", value: DailyLogStatus.Closed },
] as const;

export default function DailyLogDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const dailyLogId = params.id ?? "";
  const detailQuery = useDailyLogDetail(dailyLogId);
  const updateStatusMutation = useUpdateDailyLogStatusMutation();
  const deleteMutation = useDeleteDailyLogMutation();
  const dailyLog = detailQuery.data;

  const handleDelete = () => {
    Alert.alert(
      "Delete daily log",
      "This entry will be removed from active mobile views.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: () => {
            void deleteMutation.mutateAsync(dailyLogId).then(() => {
              router.back();
            });
          },
        },
      ]
    );
  };

  if (!dailyLog) {
    return (
      <ScreenContainer subtitle="Loading detail" title="Daily Log">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The daily log detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/daily-log/edit/[id]",
                params: { id: dailyLog.id },
              });
            }} />
            <HeaderMoreButton onPress={() => {
              // TODO: wire to action menu
            }} />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
        accessory={
          <MaterialSurface intensity={76} style={styles.hero} variant="panel">
            <Text style={styles.heroTitle}>{dailyLog.topic}</Text>
            <Text style={styles.heroCopy}>{dailyLog.synopsis}</Text>
            <View style={styles.heroBadges}>
              <StatusBadge status={dailyLog.status} />
              <Text style={styles.heroMeta}>{dailyLog.priority.toUpperCase()}</Text>
            </View>
          </MaterialSurface>
        }
      onRefresh={() => {
        void detailQuery.refetch();
      }}
      refreshing={detailQuery.isRefetching}
      subtitle="Field note detail with escalation and dispatch handoff from the same record."
      title={dailyLog.recordNumber}
    >
      <SectionCard subtitle={dailyLog.location} title="Overview">
        <View style={styles.stack}>
          <Text style={styles.copy}>{dailyLog.synopsis}</Text>
          <Text style={styles.meta}>Created by {dailyLog.createdBy ?? "Unknown"}</Text>
          <Text style={styles.meta}>Created {formatShortDateTime(dailyLog.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(dailyLog.updatedAt)}</Text>
          <View style={styles.actions}>
            <Button
              label="Edit Entry"
              onPress={() =>
                router.push({
                  pathname: "/daily-log/edit/[id]",
                  params: { id: dailyLog.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Create Dispatch"
              onPress={() =>
                router.push({
                  pathname: "/dispatch/new",
                  params: {
                    description: dailyLog.synopsis,
                    priority: dailyLog.priority,
                    reporterName: dailyLog.createdBy ?? undefined,
                  },
                })
              }
              variant="secondary"
            />
          </View>
          <View style={styles.actions}>
            <Button
              label="Escalate to Incident"
              onPress={() =>
                router.push({
                  pathname: "/incidents/new",
                  params: {
                    reportedBy: dailyLog.createdBy ?? undefined,
                    synopsis: `${dailyLog.topic}: ${dailyLog.synopsis}`,
                  },
                })
              }
              variant="secondary"
            />
            <Button
              label="Delete"
              loading={deleteMutation.isPending}
              onPress={handleDelete}
              variant="plain"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Real status mutation from mobile detail." title="Status">
        <View style={styles.actions}>
          {statusActions.map((action) => (
            <Button
              key={action.value}
              label={action.label}
              loading={
                updateStatusMutation.isPending &&
                updateStatusMutation.variables?.status === action.value
              }
              onPress={() => {
                void updateStatusMutation.mutateAsync({
                  dailyLogId: dailyLog.id,
                  status: action.value,
                });
              }}
              variant={dailyLog.status === action.value ? "primary" : "secondary"}
            />
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    hero: {
      gap: 8,
    },
    heroBadges: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    heroMeta: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
      letterSpacing: -0.6,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    stack: {
      gap: 12,
    },
  });
}
