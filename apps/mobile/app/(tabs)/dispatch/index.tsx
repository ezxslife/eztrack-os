import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DispatchStatus } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { triggerNotificationHaptic } from "@/lib/haptics";
import {
  useDispatches,
  useAssignDispatchOfficerMutation,
  useOnDutyOfficers,
  useUpdateDispatchStatusMutation,
} from "@/lib/queries/dispatches";
import type {
  OfflineAssignDispatchAction,
  OfflineUpdateDispatchStatusAction,
} from "@/lib/offline/types";
import { useOfflineStore } from "@/stores/offline-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const filters = ["All", "Critical", "Scheduled", "On Scene"];

function getDispatchActions(status: string) {
  switch (status) {
    case DispatchStatus.Pending:
    case DispatchStatus.Scheduled:
      return [
        { label: "Start", nextStatus: DispatchStatus.InProgress },
        { label: "On Scene", nextStatus: DispatchStatus.OnScene },
      ];
    case DispatchStatus.InProgress:
    case DispatchStatus.Overdue:
      return [
        { label: "On Scene", nextStatus: DispatchStatus.OnScene },
        { label: "Clear", nextStatus: DispatchStatus.Cleared },
      ];
    case DispatchStatus.OnScene:
      return [
        { label: "Clear", nextStatus: DispatchStatus.Cleared },
        { label: "Complete", nextStatus: DispatchStatus.Completed },
      ];
    case DispatchStatus.Cleared:
      return [{ label: "Complete", nextStatus: DispatchStatus.Completed }];
    default:
      return [];
  }
}

export default function DispatchScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [assignmentTargetId, setAssignmentTargetId] = useState<null | string>(null);
  const dispatchesQuery = useDispatches();
  const officersQuery = useOnDutyOfficers();
  const assignDispatchOfficer = useAssignDispatchOfficerMutation();
  const updateDispatchStatus = useUpdateDispatchStatusMutation();
  const pendingDispatchStatusIds = useOfflineStore((state) =>
    new Set(
      state.pendingActions
        .filter(
          (
            action
          ): action is OfflineUpdateDispatchStatusAction =>
            action.kind === "update-dispatch-status" &&
            action.syncState === "pending"
        )
        .map((action) => action.payload.dispatchId)
    )
  );
  const pendingDispatchAssignmentIds = useOfflineStore((state) =>
    new Set(
      state.pendingActions
        .filter(
          (action): action is OfflineAssignDispatchAction =>
            action.kind === "assign-dispatch" && action.syncState === "pending"
        )
        .map((action) => action.payload.dispatchId)
    )
  );
  const pendingDispatchActionIds = new Set([
    ...pendingDispatchStatusIds,
    ...pendingDispatchAssignmentIds,
  ]);
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search calls, units, and locations",
    query,
    setQuery,
    title: "Dispatch",
  });
  const styles = createStyles(colors, layout, typography);

  const dispatches = (dispatchesQuery.data ?? []).filter((dispatch) => {
    const matchesQuery =
      !query ||
      dispatch.recordNumber.toLowerCase().includes(query.toLowerCase()) ||
      dispatch.location.toLowerCase().includes(query.toLowerCase()) ||
      dispatch.description.toLowerCase().includes(query.toLowerCase());

    if (selectedFilter === "All") {
      return matchesQuery;
    }

    if (selectedFilter === "Critical") {
      return matchesQuery && dispatch.priority === "critical";
    }

    return (
      matchesQuery &&
      dispatch.status.replace("_", " ").toLowerCase() === selectedFilter.toLowerCase()
    );
  });

  const handleStatusUpdate = async (
    dispatch: (typeof dispatches)[number],
    nextStatus: DispatchStatus
  ) => {
    try {
      await updateDispatchStatus.mutateAsync({
        currentStatus: dispatch.status,
        dispatchId: dispatch.id,
        locationName: dispatch.location,
        nextStatus,
        officerName: dispatch.officerName,
        recordNumber: dispatch.recordNumber,
      });
      triggerNotificationHaptic("success");
    } catch (error) {
      triggerNotificationHaptic("error");
      Alert.alert(
        "Update failed",
        error instanceof Error
          ? error.message
          : "The dispatch status could not be updated."
      );
    }
  };

  const handleAssignment = async (
    dispatch: (typeof dispatches)[number],
    nextOfficerId: null | string,
    nextOfficerName?: null | string
  ) => {
    try {
      await assignDispatchOfficer.mutateAsync({
        dispatchId: dispatch.id,
        nextOfficerId,
        nextOfficerName: nextOfficerName ?? null,
        previousOfficerId: dispatch.officerId,
        previousOfficerName: dispatch.officerName,
        recordNumber: dispatch.recordNumber,
      });
      triggerNotificationHaptic("success");
      setAssignmentTargetId(null);
    } catch (error) {
      triggerNotificationHaptic("error");
      Alert.alert(
        "Assignment failed",
        error instanceof Error
          ? error.message
          : "The dispatch assignment could not be updated."
      );
    }
  };

  return (
    <ScreenContainer
      accessory={
        <View style={styles.accessory}>
          {!nativeIOSHeader ? (
            <SearchField
              onChangeText={setQuery}
              placeholder="Search calls, units, and locations"
              style={styles.searchField}
              value={query}
            />
          ) : null}
          <FilterChips onSelect={setSelectedFilter} options={filters} selected={selectedFilter} />
          <Button
            label="New Dispatch"
            onPress={() => router.push("/dispatch/new")}
            variant="secondary"
          />
        </View>
      }
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void Promise.all([dispatchesQuery.refetch(), officersQuery.refetch()]);
      }}
      refreshing={dispatchesQuery.isRefetching || officersQuery.isRefetching}
      subtitle="The dispatch board should feel glanceable first, actionable second."
      title="Dispatch"
    >
      <MaterialSurface intensity={76} style={styles.summary} variant="panel">
        <Text style={styles.summaryEyebrow}>Live Board</Text>
        <Text style={styles.summaryValue}>{dispatches.length} active calls</Text>
        <Text style={styles.summaryCopy}>
          The tab shell is native. The content layer stays dense, calm, and readable under stress.
        </Text>
      </MaterialSurface>

      <SectionCard title="Live board">
        <View style={styles.list}>
          {dispatches.length ? (
            dispatches.map((dispatch) => (
              <Pressable
                key={dispatch.id}
                onPress={() =>
                  router.push({
                    pathname: "/dispatch/[id]",
                    params: { id: dispatch.id },
                  })
                }
                style={styles.card}
              >
                <View style={styles.row}>
                  <Text style={styles.title}>{dispatch.recordNumber}</Text>
                  <PriorityBadge priority={dispatch.priority} />
                </View>
                <Text style={styles.location}>{dispatch.location}</Text>
                <Text style={styles.description}>{dispatch.description}</Text>
                <View style={styles.row}>
                  <StatusBadge status={dispatch.status} />
                  <Text style={styles.assignee}>{dispatch.officerName ?? "Unassigned"}</Text>
                </View>
                {pendingDispatchActionIds.has(dispatch.id) ? (
                  <Text style={styles.pendingMeta}>
                    {pendingDispatchAssignmentIds.has(dispatch.id)
                      ? "Queued assignment pending sync"
                      : "Queued status change pending sync"}
                  </Text>
                ) : null}
                <View style={styles.actionRow}>
                  {getDispatchActions(dispatch.status).map((action) => (
                    <Button
                      key={`${dispatch.id}:${action.nextStatus}`}
                      label={action.label}
                      loading={
                        updateDispatchStatus.isPending &&
                        updateDispatchStatus.variables?.dispatchId === dispatch.id &&
                        updateDispatchStatus.variables?.nextStatus === action.nextStatus
                      }
                      onPress={() => {
                        void handleStatusUpdate(dispatch, action.nextStatus);
                      }}
                      style={styles.actionButton}
                      variant="secondary"
                    />
                  ))}
                  <Button
                    label={
                      assignmentTargetId === dispatch.id
                        ? "Hide Assign"
                        : dispatch.officerName
                          ? "Reassign"
                          : "Assign"
                    }
                    loading={
                      assignDispatchOfficer.isPending &&
                      assignDispatchOfficer.variables?.dispatchId === dispatch.id
                    }
                    onPress={() =>
                      setAssignmentTargetId((current) =>
                        current === dispatch.id ? null : dispatch.id
                      )
                    }
                    style={styles.actionButton}
                    variant="secondary"
                  />
                </View>
                {assignmentTargetId === dispatch.id ? (
                  <MaterialSurface
                    intensity={72}
                    style={styles.assignmentSurface}
                    variant="panel"
                  >
                    <Text style={styles.assignmentTitle}>Assign unit</Text>
                    {(officersQuery.data ?? []).length ? (
                      <FilterChips
                        onSelect={(value) => {
                          if (
                            assignDispatchOfficer.isPending &&
                            assignDispatchOfficer.variables?.dispatchId === dispatch.id
                          ) {
                            return;
                          }

                          if (value === "Unassigned") {
                            void handleAssignment(dispatch, null, null);
                            return;
                          }

                          const officer = (officersQuery.data ?? []).find(
                            (candidate) => candidate.name === value
                          );

                          if (officer) {
                            void handleAssignment(dispatch, officer.id, officer.name);
                          }
                        }}
                        options={[
                          "Unassigned",
                          ...(officersQuery.data ?? []).map((officer) => officer.name),
                        ]}
                        selected={dispatch.officerName ?? "Unassigned"}
                      />
                    ) : (
                      <Text style={styles.assignmentCopy}>
                        No on-duty staff records are available for assignment.
                      </Text>
                    )}
                    <Text style={styles.assignmentCopy}>
                      Assignment uses the on-duty roster already loaded for the board.
                    </Text>
                  </MaterialSurface>
                ) : null}
                <Text style={styles.meta}>{formatRelativeTimestamp(dispatch.createdAt)}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyCopy}>No dispatches match the current view.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={officersQuery.isLoading ? "Loading staff statuses" : `${(officersQuery.data ?? []).length} active staff records`}
        title="Units on duty"
      >
        <View style={styles.list}>
          {(officersQuery.data ?? []).map((officer) => (
            <View key={officer.id} style={styles.officerRow}>
              <View>
                <Text style={styles.title}>{officer.name}</Text>
                <Text style={styles.meta}>{formatRelativeTimestamp(officer.updatedAt)}</Text>
              </View>
              <StatusBadge status={officer.status} />
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    accessory: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    actionButton: {
      minHeight: 40,
    },
    actionRow: {
      flexDirection: "row",
      gap: layout.gridGap,
      flexWrap: "wrap",
    },
    assignee: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    assignmentCopy: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    assignmentSurface: {
      gap: layout.gridGap,
    },
    assignmentTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: layout.gridGap,
      padding: layout.listItemPadding,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    list: {
      gap: layout.gridGap,
    },
    location: {
      ...typography.subheadline,
      color: colors.primaryStrong,
      fontWeight: "600",
    },
    meta: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    pendingMeta: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "600",
    },
    officerRow: {
      alignItems: "flex-start",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: layout.listItemPadding,
    },
    row: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    searchField: {
      width: "100%",
    },
    summary: {
      gap: layout.gridGap,
    },
    summaryCopy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    summaryEyebrow: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    summaryValue: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    title: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
      flex: 1,
      paddingRight: 12,
    },
  });
}
