import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useMemo, useState } from "react";
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
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { formatShortDateTime } from "@/lib/format";
import {
  useAddBriefingReplyMutation,
  useAcknowledgeBriefingMutation,
  useBriefingDetail,
  useDeleteBriefingMutation,
} from "@/lib/queries/briefings";
import { useSessionContext } from "@/hooks/useSessionContext";
import { useToast } from "@/providers/ToastProvider";
import { useThemeColors } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function BriefingDetailScreen() {
  const colors = useThemeColors();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, layout);
  const router = useRouter();
  const { profile } = useSessionContext();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id: string }>();
  const briefingId = params.id ?? "";
  const detailQuery = useBriefingDetail(briefingId);
  const deleteMutation = useDeleteBriefingMutation(briefingId);
  const acknowledgeMutation = useAcknowledgeBriefingMutation(briefingId);
  const replyMutation = useAddBriefingReplyMutation(briefingId);
  const [replyDraft, setReplyDraft] = useState("");
  const briefing = detailQuery.data;
  const hasAcknowledged = useMemo(
    () =>
      briefing?.recipients.acknowledgments.some(
        (entry) => entry.userId === profile?.id
      ) ?? false,
    [briefing?.recipients.acknowledgments, profile?.id]
  );

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
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <NativeHeaderActionGroup>
            <HeaderEditButton onPress={() => {
              router.push({
                pathname: "/(create)/briefings/edit/[id]",
                params: { id: briefing.id },
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
      subtitle="Operational briefing content, acknowledgement state, and reply thread."
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
              label={hasAcknowledged ? "Acknowledged" : "Acknowledge"}
              loading={acknowledgeMutation.isPending}
              onPress={() => {
                if (hasAcknowledged) {
                  return;
                }

                void acknowledgeMutation
                  .mutateAsync()
                  .then(() => {
                    showToast({
                      message: "Your acknowledgement was added to the briefing.",
                      title: "Briefing updated",
                      tone: "success",
                    });
                  })
                  .catch((error) => {
                    Alert.alert(
                      "Acknowledgement failed",
                      error instanceof Error
                        ? error.message
                        : "Could not acknowledge the briefing."
                    );
                  });
              }}
              variant={hasAcknowledged ? "secondary" : "primary"}
            />
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

      <SectionCard
        subtitle={`${briefing.recipients.acknowledgments.length} operators acknowledged`}
        title="Acknowledgments"
      >
        <View style={styles.list}>
          {briefing.recipients.acknowledgments.length ? (
            briefing.recipients.acknowledgments.map((entry) => (
              <View key={entry.userId} style={styles.row}>
                <Text style={styles.rowTitle}>{entry.userName}</Text>
                <Text style={styles.meta}>
                  {formatShortDateTime(entry.acknowledgedAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>
              No one has acknowledged this briefing yet.
            </Text>
          )}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={`${briefing.recipients.replies.length} replies`}
        title="Replies"
      >
        <View style={styles.stack}>
          <TextField
            label="Reply"
            multiline
            onChangeText={setReplyDraft}
            placeholder="Add operational context, follow-up notes, or a handoff comment..."
            value={replyDraft}
          />
          <Button
            label="Send Reply"
            loading={replyMutation.isPending}
            onPress={() => {
              const content = replyDraft.trim();
              if (!content) {
                Alert.alert("Reply required", "Add reply content before sending.");
                return;
              }

              void replyMutation
                .mutateAsync(content)
                .then(() => {
                  setReplyDraft("");
                  showToast({
                    message: "Your reply is now part of the briefing thread.",
                    title: "Reply sent",
                    tone: "success",
                  });
                })
                .catch((error) => {
                  Alert.alert(
                    "Reply failed",
                    error instanceof Error
                      ? error.message
                      : "Could not add the reply."
                  );
                });
            }}
          />
          <View style={styles.list}>
            {briefing.recipients.replies.length ? (
              briefing.recipients.replies.map((reply) => (
                <View key={reply.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{reply.userName}</Text>
                  <Text style={styles.copy}>{reply.content}</Text>
                  <Text style={styles.meta}>
                    {formatShortDateTime(reply.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>No replies have been added yet.</Text>
            )}
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
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
      color: colors.primaryInk,
      fontSize: 14,
      lineHeight: 20,
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      gap: 8,
      padding: layout.listItemPadding,
    },
    rowBetween: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    stack: {
      gap: 12,
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      paddingHorizontal: layout.listItemPadding,
    },
  });
}
