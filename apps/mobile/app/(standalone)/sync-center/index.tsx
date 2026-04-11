import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";

import { RequireAuth } from "@/components/auth/RouteGate";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  getOfflineActionDescription,
  getOfflineActionTitle,
} from "@/lib/offline/queue";
import { syncOfflineQueueNow } from "@/lib/offline/sync";
import { useToast } from "@/providers/ToastProvider";
import { useAuthStore } from "@/stores/auth-store";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useStorageHealthStore } from "@/stores/storage-health-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function SyncCenterScreen() {
  return (
    <RequireAuth>
      <SyncCenterContent />
    </RequireAuth>
  );
}

function SyncCenterContent() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const profile = useAuthStore((state) => state.profile);
  const authStatus = useAuthStore((state) => state.status);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const processing = useOfflineStore((state) => state.processing);
  const lastProcessedAt = useOfflineStore((state) => state.lastProcessedAt);
  const clearDeadLetters = useOfflineStore((state) => state.clearDeadLetters);
  const removeOfflineAction = useOfflineStore((state) => state.removeAction);
  const retryOfflineAction = useOfflineStore((state) => state.retryAction);
  const queryCache = useStorageHealthStore((state) => state.queryCache);
  const storageTier = useStorageHealthStore((state) => state.tier);
  const [busyAction, setBusyAction] = useState<null | "clear" | "retry" | "sync">(
    null
  );

  const pendingQueue = pendingActions.filter(
    (action) => action.syncState === "pending"
  );
  const reviewQueue = pendingActions.filter(
    (action) => action.syncState === "dead_letter"
  );
  const queryCacheLabel = queryCache.available
    ? queryCache.encrypted
      ? `Encrypted (${queryCache.cipherVersion ?? "cipher"})`
      : queryCache.backend
    : queryCache.reason ?? "Disabled";

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Reconnect before syncing queued actions.");
      return;
    }

    if (authStatus !== "signed_in" || !profile) {
      Alert.alert(
        "Unavailable",
        "A signed-in operator profile is required to sync."
      );
      return;
    }

    setBusyAction("sync");

    try {
      const result = await syncOfflineQueueNow(queryClient, {
        id: profile.id,
        orgId: profile.org_id,
        propertyId: profile.property_id,
      });

      showToast({
        message: `${result.processedCount} synced, ${result.deadLetterCount} moved to review.`,
        title: "Queue processed",
        tone: result.deadLetterCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Queued actions could not be processed.",
        title: "Sync failed",
        tone: "error",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRetryFailed = () => {
    setBusyAction("retry");
    reviewQueue.forEach((action) => {
      retryOfflineAction(action.id);
    });
    setBusyAction(null);

    showToast({
      message: reviewQueue.length
        ? `${reviewQueue.length} items were moved back into the pending queue.`
        : "There were no failed actions to retry.",
      title: "Retry queued",
      tone: reviewQueue.length ? "success" : "info",
    });
  };

  const handleClearFailed = () => {
    setBusyAction("clear");
    clearDeadLetters();
    setBusyAction(null);
    showToast({
      message: "Dead-letter queue entries were removed.",
      title: "Failed actions cleared",
      tone: "success",
    });
  };

  return (
    <ScreenContainer
      gutter="none"
      subtitle="Queued changes, retries, and sync health for this device."
      title="Sync Center"
    >
      <View style={styles.section}>
        <SectionHeader title="Queue health" />
        <GroupedCard>
          <SettingsListRow
            label="Pending sync"
            subtitle="Actions waiting to replay to the server."
            value={`${pendingQueue.length}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Needs review"
            subtitle="Failed items that stopped replaying."
            value={`${reviewQueue.length}`}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Network"
            value={isOnline ? "Online" : "Offline"}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Last sync"
            value={
              processing
                ? "Processing now"
                : lastProcessedAt
                  ? formatRelativeTimestamp(lastProcessedAt)
                  : "No sync yet"
            }
          />
        </GroupedCard>

        <View style={styles.actions}>
          <Button
            disabled={!isOnline || processing || pendingQueue.length === 0}
            label="Sync Now"
            loading={busyAction === "sync"}
            onPress={() => {
              void handleSyncNow();
            }}
            variant="secondary"
          />
          <Button
            disabled={reviewQueue.length === 0}
            label="Retry Failed"
            loading={busyAction === "retry"}
            onPress={handleRetryFailed}
            variant="secondary"
          />
          <Button
            disabled={reviewQueue.length === 0}
            label="Clear Failed"
            loading={busyAction === "clear"}
            onPress={handleClearFailed}
            variant="secondary"
          />
        </View>
      </View>

      <QueueSection
        emptyCopy="Nothing is waiting for sync right now."
        items={pendingQueue.map((action) => ({
          actionId: action.id,
          actionLabel: getOfflineActionTitle(action),
          description: getOfflineActionDescription(action),
          error: action.error,
          meta: `Pending sync · ${formatRelativeTimestamp(action.createdAt)} · Attempts ${action.attempts}/3`,
          onRemove: () => removeOfflineAction(action.id),
        }))}
        title="Pending sync"
      />

      <QueueSection
        emptyCopy="No failed items currently need recovery."
        items={reviewQueue.map((action) => ({
          actionId: action.id,
          actionLabel: getOfflineActionTitle(action),
          description: getOfflineActionDescription(action),
          error: action.error,
          meta: `Needs review · ${formatRelativeTimestamp(action.createdAt)} · Attempts ${action.attempts}/3`,
          onRemove: () => removeOfflineAction(action.id),
          onRetry: () => retryOfflineAction(action.id),
        }))}
        title="Needs review"
      />

      <View style={styles.section}>
        <SectionHeader title="Diagnostics" />
        <GroupedCard>
          <SettingsListRow
            label="Storage tier"
            value={storageTier}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Query cache"
            value={queryCacheLabel}
          />
          <GroupedCardDivider />
          <SettingsListRow
            label="Queue state"
            value={`${pendingQueue.length} pending / ${reviewQueue.length} review`}
          />
        </GroupedCard>
      </View>
    </ScreenContainer>
  );
}

function QueueSection({
  emptyCopy,
  items,
  title,
}: {
  emptyCopy: string;
  items: Array<{
    actionId: string;
    actionLabel: string;
    description: string;
    error: null | string;
    meta: string;
    onRemove: () => void;
    onRetry?: () => void;
  }>;
  title: string;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <View style={styles.queueList}>
        {items.length ? (
          items.map((item) => <QueueRow key={item.actionId} {...item} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy}>{emptyCopy}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function QueueRow({
  actionLabel,
  description,
  error,
  meta,
  onRemove,
  onRetry,
}: {
  actionLabel: string;
  description: string;
  error: null | string;
  meta: string;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  return (
    <MaterialSurface style={styles.queueCard} variant="panel">
      <Text style={styles.queueTitle}>{actionLabel}</Text>
      <Text style={styles.queueMeta}>{description}</Text>
      <Text style={styles.queueMeta}>{meta}</Text>
      {error ? <Text style={styles.queueError}>{error}</Text> : null}
      <View style={styles.queueActions}>
        {onRetry ? (
          <Button
            label="Retry"
            onPress={onRetry}
            style={styles.queueButton}
            variant="secondary"
          />
        ) : null}
        <Button
          label={onRetry ? "Discard" : "Remove"}
          onPress={onRemove}
          style={styles.queueButton}
          variant="plain"
        />
      </View>
    </MaterialSurface>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      paddingHorizontal: layout.horizontalPadding,
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
    queueActions: {
      flexDirection: "row",
      gap: 12,
    },
    queueButton: {
      minHeight: 36,
    },
    queueCard: {
      gap: 6,
    },
    queueError: {
      ...typography.footnote,
      color: colors.error,
      lineHeight: 18,
    },
    queueList: {
      gap: 12,
      paddingHorizontal: layout.horizontalPadding,
    },
    queueMeta: {
      ...typography.footnote,
      color: colors.textTertiary,
      lineHeight: 18,
    },
    queueTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    section: {
      gap: 8,
    },
  });
}
