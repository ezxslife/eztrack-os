import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useQueryClient } from "@tanstack/react-query";

import { RequireAuth } from "@/components/auth/RouteGate";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
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
import { useThemeColors } from "@/theme";

export default function SyncCenterScreen() {
  return (
    <RequireAuth>
      <SyncCenterContent />
    </RequireAuth>
  );
}

function SyncCenterContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
  const [busyAction, setBusyAction] = useState<null | "clear" | "retry" | "sync">(null);

  const pendingQueue = pendingActions.filter(
    (action) => action.syncState === "pending"
  );
  const reviewQueue = pendingActions.filter(
    (action) => action.syncState === "dead_letter"
  );
  const queryCacheLabel = queryCache.available
    ? queryCache.encrypted
      ? `encrypted (${queryCache.cipherVersion ?? "cipher"})`
      : queryCache.backend
    : queryCache.reason ?? "disabled";

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Reconnect before syncing queued actions.");
      return;
    }

    if (authStatus !== "signed_in" || !profile) {
      Alert.alert("Unavailable", "A signed-in operator profile is required to sync.");
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
      subtitle="Operational sync state, recovery actions, and queue diagnostics for the current device."
      title="Sync Center"
    >
      <MaterialSurface intensity={76} style={styles.hero} variant="panel">
        <Text style={styles.heroEyebrow}>Operational queue</Text>
        <Text style={styles.heroTitle}>
          {pendingQueue.length} pending · {reviewQueue.length} needs review
        </Text>
        <Text style={styles.heroCopy}>
          Auto-replay runs on reconnect. This screen is for forcing sync, recovering dead letters,
          and checking whether storage is running in a healthy mode.
        </Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Network {isOnline ? "online" : "offline"}</Text>
          <Text style={styles.heroMeta}>Storage {storageTier}</Text>
          <Text style={styles.heroMeta}>
            {processing ? "Processing now" : lastProcessedAt ? `Last sync ${formatRelativeTimestamp(lastProcessedAt)}` : "No sync yet"}
          </Text>
        </View>
      </MaterialSurface>

      <SectionCard
        subtitle="Pending actions replay automatically, but operators still need manual controls when a device is under pressure."
        title="Queue controls"
      >
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
      </SectionCard>

      <SectionCard
        subtitle={
          pendingQueue.length
            ? `${pendingQueue.length} actions are waiting to sync.`
            : "No pending sync work on this device."
        }
        title="Pending sync"
      >
        <View style={styles.list}>
          {pendingQueue.length ? (
            pendingQueue.map((action) => (
              <QueueRow
                key={action.id}
                actionId={action.id}
                actionLabel={getOfflineActionTitle(action)}
                description={getOfflineActionDescription(action)}
                error={action.error}
                meta={`Pending sync · ${formatRelativeTimestamp(action.createdAt)} · Attempts ${action.attempts}/3`}
                onRemove={() => removeOfflineAction(action.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyCopy}>Nothing is waiting for sync right now.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          reviewQueue.length
            ? `${reviewQueue.length} actions stopped replaying and need operator review.`
            : "No dead-letter items are waiting for review."
        }
        title="Needs review"
      >
        <View style={styles.list}>
          {reviewQueue.length ? (
            reviewQueue.map((action) => (
              <QueueRow
                key={action.id}
                actionId={action.id}
                actionLabel={getOfflineActionTitle(action)}
                description={getOfflineActionDescription(action)}
                error={action.error}
                meta={`Needs review · ${formatRelativeTimestamp(action.createdAt)} · Attempts ${action.attempts}/3`}
                onRemove={() => removeOfflineAction(action.id)}
                onRetry={() => retryOfflineAction(action.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyCopy}>No failed items currently need recovery.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Diagnostics">
        <View style={styles.list}>
          <DiagnosticRow label="Network" value={isOnline ? "online" : "offline"} />
          <DiagnosticRow label="Storage tier" value={storageTier} />
          <DiagnosticRow label="Query cache" value={queryCacheLabel} />
          <DiagnosticRow
            label="Queue state"
            value={`${pendingQueue.length} pending / ${reviewQueue.length} review`}
          />
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function QueueRow({
  actionId,
  actionLabel,
  description,
  error,
  meta,
  onRemove,
  onRetry,
}: {
  actionId: string;
  actionLabel: string;
  description: string;
  error: null | string;
  meta: string;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    button: {
      minHeight: 36,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 18,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });

  return (
    <View key={actionId} style={styles.row}>
      <Text style={styles.title}>{actionLabel}</Text>
      <Text style={styles.meta}>{description}</Text>
      <Text style={styles.meta}>{meta}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        {onRetry ? (
          <Button
            label="Retry"
            onPress={onRetry}
            style={styles.button}
            variant="secondary"
          />
        ) : null}
        <Button
          label={onRetry ? "Discard" : "Remove"}
          onPress={onRemove}
          style={styles.button}
          variant="plain"
        />
      </View>
    </View>
  );
}

function DiagnosticRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    label: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    value: {
      color: colors.textTertiary,
      fontSize: 13,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    emptyCopy: {
      color: colors.textTertiary,
      fontSize: 14,
      lineHeight: 20,
    },
    hero: {
      gap: 10,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heroEyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    heroMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: "600",
    },
    heroMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
    list: {
      gap: 12,
    },
  });
}
