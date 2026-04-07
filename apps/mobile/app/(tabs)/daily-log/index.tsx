import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SearchField } from "@/components/ui/SearchField";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatRelativeTimestamp } from "@/lib/format";
import {
  useCreateDailyLogMutation,
  useDailyLogs,
} from "@/lib/queries/daily-logs";
import { useLocations } from "@/lib/queries/locations";
import { useThemeColors } from "@/theme";

export default function DailyLogScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const logsQuery = useDailyLogs();
  const locationsQuery = useLocations();
  const createLogMutation = useCreateDailyLogMutation();

  const logs = (logsQuery.data ?? []).filter((log) =>
    [log.recordNumber, log.topic, log.synopsis, log.location]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const handleQuickEntry = async () => {
    const fallbackLocation = locationsQuery.data?.[0];

    if (!draft.trim()) {
      Alert.alert("Topic required", "Start the field note before queueing it.");
      return;
    }

    if (!fallbackLocation) {
      Alert.alert("Location required", "Load a location first or use the full create flow.");
      return;
    }

    try {
      await createLogMutation.mutateAsync({
        locationId: fallbackLocation.id,
        priority: "medium",
        synopsis: draft.trim(),
        topic: draft.trim().slice(0, 60) || "Field note",
      });
      setDraft("");
      Alert.alert("Queued", "The entry has been queued. Use the full form when you need location or priority changes.");
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Could not queue the daily log.");
    }
  };

  return (
    <ScreenContainer
      accessory={
        <SearchField
          onChangeText={setQuery}
          placeholder="Search previous log entries or people"
          value={query}
        />
      }
      onRefresh={() => {
        void Promise.all([logsQuery.refetch(), locationsQuery.refetch()]);
      }}
      refreshing={logsQuery.isRefetching || locationsQuery.isRefetching}
      subtitle="This module should feel like the fastest path in the app from thought to saved field note."
      title="Daily Log"
    >
      <MaterialSurface intensity={78} style={styles.hero} variant="panel">
        <Text style={styles.heroTitle}>Quick Entry</Text>
        <Text style={styles.heroCopy}>
          Keep the first gesture short. Everything that slows the operator down belongs deeper in
          the workflow.
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
          <Button label="Queue Entry" loading={createLogMutation.isPending} onPress={handleQuickEntry} />
          <Button label="Full Entry" onPress={() => router.push("/daily-log/new")} variant="secondary" />
        </View>
        <Text style={styles.helper}>
          {locationsQuery.data?.[0]
            ? `Quick entry defaults to ${locationsQuery.data[0].name}.`
            : "Quick entry needs a saved location before it can queue."}
        </Text>
      </MaterialSurface>

      <SectionCard
        subtitle={logsQuery.isLoading ? "Loading operational notes" : `${logs.length} entries visible`}
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
                  {log.recordNumber} · {log.location} · {formatRelativeTimestamp(log.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No daily logs match the current search.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="Foundation state">
        <Text style={styles.copy}>
          The fast path now queues validated entries. The full create flow is still where operators
          choose location and priority explicitly.
        </Text>
        <View style={styles.actions}>
          <Button label="Open Create Flow" onPress={() => router.push("/daily-log/new")} />
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    actions: {
      marginTop: 16,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    helper: {
      color: colors.textTertiary,
      fontSize: 13,
      lineHeight: 18,
    },
    hero: {
      gap: 12,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heroInput: {
      backgroundColor: colors.input,
      borderRadius: 18,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 110,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    item: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    list: {
      gap: 10,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 8,
    },
    priority: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      padding: 14,
    },
    rowHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginBottom: 8,
    },
    topic: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
