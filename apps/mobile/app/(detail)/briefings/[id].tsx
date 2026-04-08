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
import { formatShortDateTime } from "@/lib/format";
import {
  useBriefingDetail,
  useDeleteBriefingMutation,
} from "@/lib/queries/briefings";
import { useThemeColors } from "@/theme";

export default function BriefingDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const briefingId = params.id ?? "";
  const detailQuery = useBriefingDetail(briefingId);
  const deleteMutation = useDeleteBriefingMutation(briefingId);
  const briefing = detailQuery.data;

  if (!briefing) {
    return (
      <ScreenContainer subtitle="Loading briefing" title="Briefing">
        <SectionCard title="Loading">
          <Text style={styles.copy}>The briefing is still loading.</Text>
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
      subtitle="Operational briefing content, linked context, and editor actions."
      title={briefing.title}
    >
      <SectionCard subtitle={briefing.creator?.fullName ?? "Unknown"} title="Overview">
        <View style={styles.stack}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{briefing.title}</Text>
            <PriorityBadge priority={briefing.priority} />
          </View>
          <Text style={styles.meta}>Published {formatShortDateTime(briefing.createdAt)}</Text>
          <Text style={styles.copy}>{briefing.content}</Text>
          <Text style={styles.meta}>
            Source {briefing.sourceModule ?? "Direct mobile briefing"}
          </Text>
          {briefing.linkUrl ? <Text style={styles.link}>{briefing.linkUrl}</Text> : null}
          <View style={styles.actions}>
            <Button
              label="Edit Briefing"
              onPress={() =>
                router.push({
                  pathname: "/briefings/edit/[id]",
                  params: { id: briefing.id },
                })
              }
              variant="secondary"
            />
            <Button
              label="Delete Briefing"
              loading={deleteMutation.isPending}
              onPress={() => {
                Alert.alert("Delete briefing", "Remove this briefing from active views?", [
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
        </View>
      </SectionCard>

      <SectionCard subtitle="No fake acknowledge or reply buttons are shown until backend support exists." title="Acknowledgments">
        <Text style={styles.meta}>
          Briefing acknowledgments and threaded replies are still managed on web.
          Mobile stays honest here instead of shipping toast-only actions.
        </Text>
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
    link: {
      color: colors.primaryStrong,
      fontSize: 14,
      lineHeight: 20,
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
