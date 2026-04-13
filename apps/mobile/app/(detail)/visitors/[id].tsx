import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { HeaderEditButton } from "@/navigation/header-buttons";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatRelativeTimestamp,
  formatShortDateTime,
} from "@/lib/format";
import {
  useDeleteVisitorMutation,
  useUpdateVisitorStatusMutation,
  useVisitorDetail,
} from "@/lib/queries/visitors";
import { useThemeColors } from "@/theme";

export default function VisitorDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const visitorId = params.id ?? "";
  const detailQuery = useVisitorDetail(visitorId);
  const statusMutation = useUpdateVisitorStatusMutation(visitorId);
  const deleteMutation = useDeleteVisitorMutation(visitorId);
  const visitor = detailQuery.data;

  if (!visitor) {
    return (
      <ScreenContainer subtitle="Loading visitor" title="Visitor">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The visitor record is still loading.</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  const handleStatus = async (status: string) => {
    try {
      await statusMutation.mutateAsync(status);
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not update the visitor status."
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/visitors/edit/[id]",
                params: { id: visitor.id },
              });
            }} />
          </NativeHeaderActionGroup>
        ),
      }} />
      <ScreenContainer
        onRefresh={() => {
          void detailQuery.refetch();
        }}
        refreshing={detailQuery.isRefetching}
        subtitle="Visit status, host context, and identity details from the live visitor log."
        title={`${visitor.firstName} ${visitor.lastName}`}
      >
      <SectionCard subtitle={visitor.purpose} title="Overview">
        <View style={styles.stack}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>
              {visitor.firstName} {visitor.lastName}
            </Text>
            <StatusBadge status={visitor.status} />
          </View>
          <Text style={styles.meta}>
            Host {visitor.hostName ?? "Unassigned"} · {visitor.company ?? "No company"}
          </Text>
          <Text style={styles.meta}>
            Scheduled{" "}
            {visitor.expectedDate
              ? `${visitor.expectedDate}${visitor.expectedTime ? ` at ${visitor.expectedTime}` : ""}`
              : "On demand"}
          </Text>
          <Text style={styles.meta}>
            Created {formatShortDateTime(visitor.createdAt)} · Updated{" "}
            {formatRelativeTimestamp(visitor.updatedAt)}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Edit Visit"
              onPress={() =>
                router.push({
                  pathname: "/visitors/edit/[id]",
                  params: { id: visitor.id },
                })
              }
              variant="secondary"
            />
            {visitor.status !== "signed_in" ? (
              <Button
                label="Sign In"
                loading={statusMutation.isPending}
                onPress={() => {
                  void handleStatus("signed_in");
                }}
              />
            ) : null}
            {visitor.status === "signed_in" ? (
              <Button
                label="Sign Out"
                loading={statusMutation.isPending}
                onPress={() => {
                  void handleStatus("signed_out");
                }}
                variant="secondary"
              />
            ) : null}
            {visitor.status !== "cancelled" ? (
              <Button
                label="Cancel Visit"
                loading={statusMutation.isPending}
                onPress={() => {
                  void handleStatus("cancelled");
                }}
                variant="plain"
              />
            ) : null}
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Identity and front-desk intake." title="Identification">
        <View style={styles.stack}>
          <Text style={styles.copy}>
            ID {visitor.idType ?? "Not captured"} · {visitor.idNumber ?? "No number"}
          </Text>
          <Text style={styles.copy}>
            Vehicle {visitor.vehiclePlate ?? "No vehicle recorded"}
          </Text>
          <Text style={styles.copy}>
            NDA {visitor.ndaRequired ? "Required" : "Not required"}
          </Text>
        </View>
      </SectionCard>

      <SectionCard subtitle="Direct contact options for front desk and host." title="Contact">
        <View style={styles.stack}>
          <Text style={styles.copy}>{visitor.email ?? "No email recorded"}</Text>
          <Text style={styles.copy}>{visitor.phone ?? "No phone recorded"}</Text>
          <Text style={styles.copy}>
            Department {visitor.hostDepartment ?? "Not specified"}
          </Text>
        </View>
      </SectionCard>

      <SectionCard subtitle="This removes the visit from active operational views." title="Record Control">
        <View style={styles.actions}>
          <Button
            label="Delete Visitor"
            loading={deleteMutation.isPending}
            onPress={() => {
              Alert.alert("Delete visitor", "Remove this visit from active views?", [
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
    </>
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
      fontSize: 18,
      fontWeight: "700",
    },
  });
}
