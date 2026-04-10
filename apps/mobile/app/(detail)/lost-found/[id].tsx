import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatShortDateTime } from "@/lib/format";
import {
  useDeleteFoundItemMutation,
  useFoundItemDetail,
  useUpdateFoundItemStatusMutation,
} from "@/lib/queries/lost-found";
import { useThemeColors } from "@/theme";

export default function LostFoundDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = params.id ?? "";
  const detailQuery = useFoundItemDetail(itemId);
  const statusMutation = useUpdateFoundItemStatusMutation(itemId);
  const deleteMutation = useDeleteFoundItemMutation(itemId);
  const item = detailQuery.data;

  if (!item) {
    return (
      <ScreenContainer subtitle="Loading found item" title="Lost & Found">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The found item is still loading.</Text>
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
      subtitle="Found inventory detail with live claim, return, disposal, and delete actions."
      title={item.recordNumber}
    >
      <SectionCard subtitle={item.category} title="Overview">
        <View style={styles.stack}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{item.recordNumber}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.copy}>{item.description}</Text>
          <Text style={styles.meta}>
            Found {formatShortDateTime(item.foundAt)} by {item.foundBy ?? "Unknown"}
          </Text>
          <Text style={styles.meta}>
            Location {item.foundLocation?.name ?? "Unknown"} · Storage{" "}
            {item.storageLocation ?? "Not set"}
          </Text>
          <Text style={styles.meta}>
            Returned to {item.returnedTo ?? "No claimant"} · Returned at{" "}
            {item.returnedAt ? formatShortDateTime(item.returnedAt) : "Not returned"}
          </Text>
          <Text style={styles.copy}>{item.notes ?? "No notes recorded."}</Text>
          <View style={styles.actions}>
            <Button
              label="Edit Item"
              onPress={() =>
                router.push({
                  pathname: "/lost-found/edit/[id]",
                  params: { id: item.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Claim Item"
              onPress={() =>
                router.push({
                  pathname: "/lost-found/claim/[id]",
                  params: { id: item.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Mark Returned"
              loading={statusMutation.isPending}
              onPress={() => {
                void statusMutation
                  .mutateAsync({ status: "returned" })
                  .catch((error) => {
                    Alert.alert(
                      "Return failed",
                      error instanceof Error ? error.message : "Could not update the item."
                    );
                  });
              }}
              variant="secondary"
            />
            <Button
              label="Dispose"
              loading={statusMutation.isPending}
              onPress={() => {
                void statusMutation
                  .mutateAsync({ status: "disposed" })
                  .catch((error) => {
                    Alert.alert(
                      "Disposal failed",
                      error instanceof Error ? error.message : "Could not update the item."
                    );
                  });
              }}
              variant="plain"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="This removes the item from active found inventory views." title="Record Control">
        <View style={styles.actions}>
          <Button
            label="Delete Item"
            loading={deleteMutation.isPending}
            onPress={() => {
              Alert.alert("Delete item", "Remove this found item from active views?", [
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
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    copy: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
    meta: { color: colors.textTertiary, fontSize: 13, lineHeight: 18 },
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    stack: { gap: 12 },
    title: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  });
}
