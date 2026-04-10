import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DispatchStatus } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useAssignDispatchOfficerMutation,
  useClearDispatchMutation,
  useDispatchDetail,
  useDispatchTimeline,
  useOnDutyOfficers,
  useUpdateDispatchStatusMutation,
} from "@/lib/queries/dispatches";
import { useThemeColors } from "@/theme";

const statusActions = [
  DispatchStatus.Pending,
  DispatchStatus.InProgress,
  DispatchStatus.OnScene,
  DispatchStatus.Cleared,
  DispatchStatus.Completed,
] as const;

export default function DispatchDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const dispatchId = params.id ?? "";
  const detailQuery = useDispatchDetail(dispatchId);
  const timelineQuery = useDispatchTimeline(dispatchId);
  const officersQuery = useOnDutyOfficers();
  const assignMutation = useAssignDispatchOfficerMutation();
  const statusMutation = useUpdateDispatchStatusMutation();
  const clearMutation = useClearDispatchMutation();
  const dispatch = detailQuery.data;

  if (!dispatch) {
    return (
      <ScreenContainer subtitle="Loading detail" title="Dispatch">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The dispatch detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={76} style={styles.hero} variant="panel">
          <Text style={styles.heroCode}>{dispatch.dispatchCode}</Text>
          <Text style={styles.heroTitle}>{dispatch.description ?? "No description"}</Text>
          <View style={styles.heroBadges}>
            <PriorityBadge priority={dispatch.priority} />
            <StatusBadge status={dispatch.status} />
          </View>
        </MaterialSurface>
      }
      onRefresh={() => {
        void Promise.all([
          detailQuery.refetch(),
          timelineQuery.refetch(),
          officersQuery.refetch(),
        ]);
      }}
      refreshing={
        detailQuery.isRefetching ||
        timelineQuery.isRefetching ||
        officersQuery.isRefetching
      }
      subtitle="Dispatch detail, assignment, and timeline from the live board contract."
      title={dispatch.recordNumber}
    >
      <SectionCard subtitle={dispatch.location?.name ?? "Unknown"} title="Overview">
        <View style={styles.stack}>
          <Text style={styles.copy}>{dispatch.description ?? "No narrative captured."}</Text>
          <Text style={styles.meta}>
            Assigned {dispatch.assignedStaff?.fullName ?? "Unassigned"}
          </Text>
          <Text style={styles.meta}>
            Reporter {dispatch.reporterName ?? "Unknown"} · {dispatch.reporterPhone ?? "No phone"}
          </Text>
          <Text style={styles.meta}>
            Source {dispatch.callSource ?? "Unknown"} · {dispatch.sublocation ?? "No sublocation"}
          </Text>
          <Text style={styles.meta}>Created {formatShortDateTime(dispatch.createdAt)}</Text>
          <Text style={styles.meta}>Updated {formatRelativeTimestamp(dispatch.updatedAt)}</Text>
          <View style={styles.actions}>
            <Button
              label="Edit Dispatch"
              onPress={() =>
                router.push({
                  pathname: "/dispatch/edit/[id]",
                  params: { id: dispatch.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Escalate to Incident"
              onPress={() =>
                router.push({
                  pathname: "/incidents/new",
                  params: {
                    reportedBy: dispatch.reporterName ?? undefined,
                    synopsis: dispatch.description ?? undefined,
                  },
                })
              }
              variant="secondary"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Real status updates from mobile." title="Status">
        <View style={styles.actions}>
          {statusActions.map((status) => (
            <Button
              key={status}
              label={status.replace(/_/g, " ")}
              loading={
                statusMutation.isPending &&
                statusMutation.variables?.dispatchId === dispatch.id &&
                statusMutation.variables?.nextStatus === status
              }
              onPress={() => {
                void statusMutation.mutateAsync({
                  currentStatus: dispatch.status,
                  dispatchId: dispatch.id,
                  locationName: dispatch.location?.name ?? "Unknown",
                  nextStatus: status,
                  officerName: dispatch.assignedStaff?.fullName ?? null,
                  recordNumber: dispatch.recordNumber,
                });
              }}
              variant={dispatch.status === status ? "primary" : "secondary"}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            label="Clear Dispatch"
            loading={clearMutation.isPending}
            onPress={() => {
              void clearMutation.mutateAsync({
                clearCode: "mobile_resolution",
                dispatchId: dispatch.id,
                reason: "Cleared from mobile dispatch detail",
              });
            }}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          officersQuery.isLoading
            ? "Loading roster"
            : `${(officersQuery.data ?? []).length} assignable units`
        }
        title="Assignment"
      >
        <View style={styles.stack}>
          <FilterChips
            onSelect={(value) => {
              if (value === "Unassigned") {
                void assignMutation.mutateAsync({
                  dispatchId: dispatch.id,
                  nextOfficerId: null,
                  nextOfficerName: null,
                  previousOfficerId: dispatch.assignedStaff?.id ?? null,
                  previousOfficerName: dispatch.assignedStaff?.fullName ?? null,
                  recordNumber: dispatch.recordNumber,
                });
                return;
              }

              const nextOfficer = (officersQuery.data ?? []).find(
                (officer) => officer.name === value
              );

              if (!nextOfficer) {
                return;
              }

              void assignMutation.mutateAsync({
                dispatchId: dispatch.id,
                nextOfficerId: nextOfficer.id,
                nextOfficerName: nextOfficer.name,
                previousOfficerId: dispatch.assignedStaff?.id ?? null,
                previousOfficerName: dispatch.assignedStaff?.fullName ?? null,
                recordNumber: dispatch.recordNumber,
              });
            }}
            options={[
              "Unassigned",
              ...(officersQuery.data ?? []).map((officer) => officer.name),
            ]}
            selected={dispatch.assignedStaff?.fullName ?? "Unassigned"}
          />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          timelineQuery.isLoading
            ? "Loading timeline"
            : `${(timelineQuery.data ?? []).length} entries`
        }
        title="Timeline"
      >
        <View style={styles.stack}>
          {(timelineQuery.data ?? []).length ? (
            timelineQuery.data?.map((entry) => (
              <View key={entry.id} style={styles.timelineRow}>
                <Text style={styles.timelineTitle}>{entry.event.replace(/_/g, " ")}</Text>
                {entry.details ? <Text style={styles.copy}>{entry.details}</Text> : null}
                <Text style={styles.meta}>
                  {entry.actorName ?? "System"} · {formatShortDateTime(entry.timestamp)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No timeline events recorded yet.</Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
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
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    heroCode: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    stack: {
      gap: 12,
    },
    timelineRow: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    timelineTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
