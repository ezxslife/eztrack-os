import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useDeletePatronMutation,
  usePatronDetail,
  useUpdatePatronFlagMutation,
} from "@/lib/queries/patrons";
import { useThemeColors } from "@/theme";

const flags = ["none", "watch", "vip", "warning", "banned"];

export default function PatronDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const patronId = params.id ?? "";
  const detailQuery = usePatronDetail(patronId);
  const flagMutation = useUpdatePatronFlagMutation(patronId);
  const deleteMutation = useDeletePatronMutation(patronId);
  const patron = detailQuery.data;

  if (!patron) {
    return (
      <ScreenContainer subtitle="Loading patron" title="Patron">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The patron record is still loading.</Text>
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
      subtitle="Patron watch state, contact record, and notes."
      title={`${patron.firstName} ${patron.lastName}`}
    >
      <SectionCard subtitle={patron.ticketType ?? "No ticket type"} title="Overview">
        <View style={styles.stack}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>
              {patron.firstName} {patron.lastName}
            </Text>
            <StatusBadge status={patron.flag === "none" ? "archived" : patron.flag} />
          </View>
          <Text style={styles.copy}>{patron.notes ?? "No secure notes recorded."}</Text>
          <Text style={styles.meta}>
            {patron.email ?? "No email"} · {patron.phone ?? "No phone"}
          </Text>
          <Text style={styles.meta}>
            DOB {patron.dob ?? "Unknown"} · ID {patron.idType ?? "Not set"} {patron.idNumber ?? ""}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Edit Patron"
              onPress={() =>
                router.push({
                  pathname: "/patrons/edit/[id]",
                  params: { id: patron.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Ban Patron"
              loading={flagMutation.isPending}
              onPress={() => {
                void flagMutation
                  .mutateAsync({ flag: "banned" })
                  .catch((error) => {
                    Alert.alert(
                      "Flag update failed",
                      error instanceof Error ? error.message : "Could not update the patron."
                    );
                  });
              }}
              variant="plain"
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard subtitle="Real flag mutations from the patron register." title="Flag State">
        <FilterChips
          onSelect={(value) => {
            void flagMutation.mutateAsync({ flag: value }).catch((error) => {
              Alert.alert(
                "Flag update failed",
                error instanceof Error ? error.message : "Could not update the patron flag."
              );
            });
          }}
          options={flags}
          selected={patron.flag}
        />
      </SectionCard>

      <SectionCard subtitle="This removes the patron from active patron views." title="Record Control">
        <View style={styles.actions}>
          <Button
            label="Delete Patron"
            loading={deleteMutation.isPending}
            onPress={() => {
              Alert.alert("Delete patron", "Remove this patron from active views?", [
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
      lineHeight: 18,
    },
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    stack: { gap: 12 },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
  });
}
