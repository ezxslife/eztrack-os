import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCurrency,
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useDeleteWorkOrderMutation,
  useUpdateWorkOrderStatusMutation,
  useWorkOrderDetail,
} from "@/lib/queries/work-orders";
import { useThemeColors } from "@/theme";

const statuses = ["open", "assigned", "in_progress", "completed", "closed"];

export default function WorkOrderDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workOrderId = params.id ?? "";
  const detailQuery = useWorkOrderDetail(workOrderId);
  const statusMutation = useUpdateWorkOrderStatusMutation(workOrderId);
  const deleteMutation = useDeleteWorkOrderMutation(workOrderId);
  const workOrder = detailQuery.data;

  if (!workOrder) {
    return (
      <ScreenContainer subtitle="Loading work order" title="Work Order">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The work order detail is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      onRefresh={() => {
        void detailQuery.refetch();
      }}
      refreshing={detailQuery.isRefetching}
      subtitle="Facilities, safety, and maintenance actions from the live work order table."
      title={workOrder.recordNumber}
    >
      <SectionCard subtitle={workOrder.category} title="Overview">
        <View style={styles.stack}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{workOrder.title}</Text>
            <PriorityBadge priority={workOrder.priority} />
          </View>
          <View style={styles.rowBetween}>
            <StatusBadge status={workOrder.status} />
            <Text style={styles.meta}>
              {workOrder.assignedStaff?.fullName ?? "Unassigned"}
            </Text>
          </View>
          <Text style={styles.copy}>
            {workOrder.description ?? "No work order description recorded."}
          </Text>
          <Text style={styles.meta}>
            Location {workOrder.location?.name ?? "Unknown"} · Due{" "}
            {workOrder.dueDate ? formatShortDateTime(workOrder.dueDate) : "No due date"}
          </Text>
          <Text style={styles.meta}>
            Scheduled{" "}
            {workOrder.scheduledDate
              ? formatShortDateTime(workOrder.scheduledDate)
              : "Not scheduled"}
          </Text>
          <Text style={styles.meta}>
            Estimated cost{" "}
            {workOrder.estimatedCost === null
              ? "Not set"
              : formatCurrency(workOrder.estimatedCost)}
          </Text>
          <Text style={styles.meta}>
            Created {formatShortDateTime(workOrder.createdAt)} · Updated{" "}
            {formatRelativeTimestamp(workOrder.updatedAt)}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Edit Work Order"
              onPress={() =>
                router.push({
                  pathname: "/work-orders/edit/[id]",
                  params: { id: workOrder.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Add Note"
              onPress={() =>
                router.push({
                  pathname: "/work-orders/note/[id]",
                  params: { id: workOrder.id },
                })
              }
              variant="secondary"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Live status transitions from mobile." title="Status">
        <View style={styles.actions}>
          {statuses.map((status) => (
            <Button
              key={status}
              label={status.replace(/_/g, " ")}
              loading={statusMutation.isPending}
              onPress={() => {
                void statusMutation.mutateAsync(status).catch((error) => {
                  Alert.alert(
                    "Status update failed",
                    error instanceof Error
                      ? error.message
                      : "Could not update the work order."
                  );
                });
              }}
              variant={workOrder.status === status ? "primary" : "secondary"}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard subtitle="Record removal is permanent from active operational views." title="Record Control">
        <View style={styles.actions}>
          <Button
            label="Delete Work Order"
            loading={deleteMutation.isPending}
            onPress={() => {
              Alert.alert("Delete work order", "Remove this work order from active views?", [
                { style: "cancel", text: "Cancel" },
                {
                  style: "destructive",
                  text: "Delete",
                  onPress: () => {
                    void deleteMutation.mutateAsync().then(() => {
                      router.back();
                    });
                  },
                },
              ]);
            }}
            variant="plain"
          />
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
      gap: 12,
    },
    copy: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    stack: {
      gap: 12,
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      paddingRight: 12,
    },
  });
}
