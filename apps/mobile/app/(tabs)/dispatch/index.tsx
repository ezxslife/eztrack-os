import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { DispatchStatus } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SearchField } from "@/components/ui/SearchField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { triggerNotificationHaptic } from "@/lib/haptics";
import {
  useAssignDispatchOfficerMutation,
  useDispatches,
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
      dispatch.status.replace("_", " ").toLowerCase() ===
        selectedFilter.toLowerCase()
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
          <FilterChips
            onSelect={setSelectedFilter}
            options={filters}
            selected={selectedFilter}
          />
          <Button
            label="New Dispatch"
            onPress={() => router.push("/dispatch/new")}
            variant="secondary"
          />
        </View>
      }
      gutter="none"
      iosNativeHeader={nativeIOSHeader}
      onRefresh={() => {
        void Promise.all([dispatchesQuery.refetch(), officersQuery.refetch()]);
      }}
      refreshing={dispatchesQuery.isRefetching || officersQuery.isRefetching}
      subtitle="Live calls, unit assignment, and status changes."
      title="Dispatch"
    >
      <View style={styles.section}>
        <SectionHeader title="Live board" />
        <View style={styles.list}>
          {dispatches.length ? (
            dispatches.map((dispatch) => (
              <MaterialSurface
                key={dispatch.id}
                style={styles.card}
                variant="panel"
              >
                <View style={styles.row}>
                  <Text style={styles.title}>{dispatch.recordNumber}</Text>
                  <PriorityBadge priority={dispatch.priority} />
                </View>
                <Text style={styles.location}>{dispatch.location}</Text>
                <Text style={styles.description}>{dispatch.description}</Text>
                <View style={styles.row}>
                  <StatusBadge status={dispatch.status} />
                  <Text style={styles.assignee}>
                    {dispatch.officerName ?? "Unassigned"}
                  </Text>
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
                        updateDispatchStatus.variables?.nextStatus ===
                          action.nextStatus
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
                    variant="subtle"
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
                  </MaterialSurface>
                ) : null}
                <Text style={styles.meta}>
                  {formatRelativeTimestamp(dispatch.createdAt)}
                </Text>
              </MaterialSurface>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyCopy}>
                No dispatches match the current view.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Units on duty" />
        {(officersQuery.data ?? []).length ? (
          <GroupedCard>
            {(officersQuery.data ?? []).map((officer, index) => (
              <View key={officer.id}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={officer.name}
                  subtitle={formatRelativeTimestamp(officer.updatedAt)}
                  trailing={<StatusBadge status={officer.status} />}
                />
              </View>
            ))}
          </GroupedCard>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>No active staff records are available.</Text>
          </View>
        )}
      </View>
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
      paddingHorizontal: layout.horizontalPadding,
    },
    actionButton: {
      minHeight: 40,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
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
      gap: layout.gridGap,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    emptyCopy: {
      ...typography.subheadline,
      color: colors.textTertiary,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
    },
    list: {
      gap: layout.gridGap,
      paddingHorizontal: layout.horizontalPadding,
    },
    location: {
      ...typography.subheadline,
      color: colors.primaryInk,
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
    row: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    searchField: {
      width: "100%",
    },
    section: {
      gap: 8,
    },
    title: {
      ...typography.subheadline,
      color: colors.textPrimary,
      flex: 1,
      fontWeight: "700",
      paddingRight: 12,
    },
  });
}
