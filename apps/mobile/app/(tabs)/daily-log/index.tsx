import { useRouter } from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { HeaderAddButton, HeaderFilterButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { useIOSNativeSearchHeader } from "@/navigation/useIOSNativeSearchHeader";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import { triggerNotificationHaptic } from "@/lib/haptics";
import {
  useCreateDailyLogMutation,
  useDailyLogs,
} from "@/lib/queries/daily-logs";
import type { OfflineUpdateDailyLogAction } from "@/lib/offline/types";
import { useLocations } from "@/lib/queries/locations";
import {
  getDraftKey,
  useDraftStore,
} from "@/stores/draft-store";
import {
  defaultFilterState,
  useFilterStore,
} from "@/stores/filter-store";
import { useOfflineStore } from "@/stores/offline-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const filterModuleKey = "daily-log";
const quickEntryModuleKey = "daily-log-quick-entry";

export default function DailyLogScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const filtersState = useFilterStore(
    (state) => state.filters[filterModuleKey] ?? defaultFilterState
  );
  const quickEntryDraft = useDraftStore(
    (state) =>
      state.drafts[getDraftKey(quickEntryModuleKey)]?.data as
        | { value?: string }
        | undefined
  );
  const setFilter = useFilterStore((state) => state.setFilter);
  const clearModuleDrafts = useDraftStore((state) => state.clearModuleDrafts);
  const saveDraft = useDraftStore((state) => state.saveDraft);
  const [draft, setDraft] = useState(quickEntryDraft?.value ?? "");
  const logsQuery = useDailyLogs();
  const locationsQuery = useLocations();
  const createLogMutation = useCreateDailyLogMutation();
  const pendingActions = useOfflineStore((state) => state.pendingActions);
  const pendingDailyLogUpdateIds = useMemo(
    () =>
      new Set(
        pendingActions
          .filter(
            (action): action is OfflineUpdateDailyLogAction =>
              action.kind === "update-daily-log" &&
              action.syncState === "pending"
          )
          .map((action) => action.payload.dailyLogId)
      ),
    [pendingActions]
  );
  const query = filtersState.search;
  const { nativeIOSHeader } = useIOSNativeSearchHeader({
    placeholder: "Search previous log entries or people",
    query,
    setQuery: (value) => setFilter(filterModuleKey, { search: value }),
    title: "Daily Log",
  });
  const styles = createStyles(colors, layout, typography);

  const logs = (logsQuery.data ?? []).filter((log) =>
    [log.recordNumber, log.topic, log.synopsis, log.location]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!draft.trim()) {
      clearModuleDrafts(quickEntryModuleKey);
      return;
    }

    saveDraft(quickEntryModuleKey, {
      value: draft,
    });
  }, [clearModuleDrafts, draft, saveDraft]);

  const handleQuickEntry = async () => {
    const fallbackLocation = locationsQuery.data?.[0];

    if (!draft.trim()) {
      Alert.alert("Topic required", "Start the field note before queueing it.");
      return;
    }

    if (!fallbackLocation) {
      Alert.alert(
        "Location required",
        "Load a location first or use the full create flow."
      );
      return;
    }

    try {
      const result = await createLogMutation.mutateAsync({
        locationId: fallbackLocation.id,
        locationName: fallbackLocation.name,
        priority: "medium",
        synopsis: draft.trim(),
        topic: draft.trim().slice(0, 60) || "Field note",
      });
      triggerNotificationHaptic("success");
      clearModuleDrafts(quickEntryModuleKey);
      setDraft("");
      Alert.alert(
        result.queued ? "Queued Offline" : "Saved",
        result.queued
          ? "The entry has been stored locally and will sync when the device reconnects."
          : "The entry has been saved. Use the full form when you need location or priority changes."
      );
    } catch (error) {
      triggerNotificationHaptic("error");
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not queue the daily log."
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderAddButton onPress={() => router.push("/daily-log/new")} />
              <HeaderFilterButton onPress={() => {}} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        accessory={
          !nativeIOSHeader ? (
            <SearchField
              onChangeText={(value) => setFilter(filterModuleKey, { search: value })}
              placeholder="Search previous log entries or people"
              style={styles.searchField}
              value={query}
            />
          ) : undefined
        }
        iosNativeHeader={nativeIOSHeader}
        onRefresh={() => {
          void Promise.all([logsQuery.refetch(), locationsQuery.refetch()]);
        }}
        refreshing={logsQuery.isRefetching || locationsQuery.isRefetching}
        title="Daily Log"
      >
        <ScreenTitleStrip title="Daily Log" />
      <MaterialSurface intensity={78} style={styles.hero} variant="panel">
        <Text style={styles.heroTitle}>Quick Entry</Text>
        <Text style={styles.heroCopy}>
          Keep the first gesture short. Everything that slows the operator down
          belongs deeper in the workflow.
        </Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setDraft}
          placeholder="Start the log entry here..."
          placeholderTextColor={colors.textTertiary}
          style={styles.heroInput}
          textAlignVertical="top"
          value={draft}
        />
        <View style={styles.heroActions}>
          <Button
            label="Queue Entry"
            loading={createLogMutation.isPending}
            onPress={handleQuickEntry}
          />
          <Button
            label="Full Entry"
            onPress={() => router.push("/daily-log/new")}
            variant="secondary"
          />
        </View>
        <Text style={styles.helper}>
          {locationsQuery.data?.[0]
            ? `Quick entry defaults to ${locationsQuery.data[0].name}.`
            : "Quick entry needs a saved location before it can queue."}
        </Text>
      </MaterialSurface>

      <SectionCard
        subtitle={
          logsQuery.isLoading
            ? "Loading operational notes"
            : `${logs.length} entries visible`
        }
        title="Recent entries"
      >
        <View style={styles.list}>
          {logs.length ? (
            logs.map((log) => (
              <View key={log.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.topic}>{log.topic}</Text>
                  <Text style={styles.priority}>{log.priority.toUpperCase()}</Text>
                </View>
                <Text style={styles.item}>{log.synopsis}</Text>
                <Text style={styles.meta}>
                  {log.recordNumber} · {log.location} ·{" "}
                  {formatRelativeTimestamp(log.createdAt)}
                </Text>
                {pendingDailyLogUpdateIds.has(log.id) ? (
                  <Text style={styles.pendingMeta}>Queued change pending sync</Text>
                ) : null}
                <View style={styles.rowActions}>
                  <Button
                    label="View"
                    onPress={() =>
                      router.push({
                        pathname: "/daily-log/[id]",
                        params: { id: log.id },
                      })
                    }
                    variant="secondary"
                  />
                  {log.status !== "queued" ? (
                    <Button
                      label="Edit"
                      onPress={() =>
                        router.push({
                          pathname: "/daily-log/edit/[id]",
                          params: { id: log.id },
                        })
                      }
                      variant="secondary"
                    />
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>
              No daily logs match the current search.
            </Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Start a new entry">
        <Text style={styles.copy}>
          Capture activity, handoff notes, and key events for this shift.
        </Text>
        <View style={styles.actions}>
          <Button
            label="New Daily Log"
            onPress={() => router.push("/daily-log/new")}
          />
        </View>
      </SectionCard>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  layout: ReturnType<typeof useAdaptiveLayout>,
  typography: ReturnType<typeof useThemeTypography>
) {
  return StyleSheet.create({
    actions: {
      marginTop: 16,
    },
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    helper: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    hero: {
      gap: layout.gridGap,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    heroCopy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    heroInput: {
      backgroundColor: colors.input,
      borderRadius: 18,
      color: colors.textPrimary,
      ...typography.subheadline,
      minHeight: 110,
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: layout.listItemPadding,
    },
    heroTitle: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    item: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    list: {
      gap: layout.gridGap,
    },
    meta: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 8,
    },
    pendingMeta: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "600",
      marginTop: 8,
    },
    priority: {
      ...typography.caption1,
      color: colors.accentSoft,
      fontWeight: "700",
    },
    rowActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
      marginTop: 12,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      padding: layout.listItemPadding,
    },
    rowHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 8,
    },
    searchField: {
      width: "100%",
    },
    topic: {
      ...typography.subheadline,
      color: colors.textPrimary,
      flex: 1,
      fontWeight: "700",
    },
  });
}
