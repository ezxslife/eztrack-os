import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { ScreenTitleStrip } from "@/components/ui/glass/ScreenTitleStrip";
import { HeaderSearchButton, HeaderFilterButton } from "@/navigation/header-buttons";
import { NativeHeaderActionGroup } from "@/navigation/NativeHeaderActionGroup";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeTimestamp } from "@/lib/format";
import { usePersonnel } from "@/lib/queries/personnel";
import { useThemeColors } from "@/theme";

export default function PersonnelScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const officersQuery = usePersonnel();
  const officers = officersQuery.data ?? [];
  const availableCount = officers.filter((officer) => officer.status === "available").length;
  const committedCount = officers.filter(
    (officer) =>
      officer.status === "dispatched" || officer.status === "on_scene"
  ).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <NativeHeaderActionGroup>
              <HeaderSearchButton onPress={() => {}} />
              <HeaderFilterButton onPress={() => {}} />
            </NativeHeaderActionGroup>
          ),
        }}
      />
      <ScreenContainer
        onRefresh={() => {
          void officersQuery.refetch();
        }}
        refreshing={officersQuery.isRefetching}
        title="Personnel"
      >
        <ScreenTitleStrip title="Personnel" />
      <MaterialSurface intensity={78} style={styles.hero} variant="panel">
        <Text style={styles.eyebrow}>Staffing Board</Text>
        <Text style={styles.value}>{officers.length} active personnel records</Text>
        <Text style={styles.copy}>
          Use this screen as the personnel-facing counterpart to dispatch:
          glanceable status, recent updates, and a clear signal on who is still
          free to respond.
        </Text>
      </MaterialSurface>

      <SectionCard title="Coverage summary">
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Available</Text>
            <Text style={styles.summaryValue}>{availableCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Committed</Text>
            <Text style={styles.summaryValue}>{committedCount}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          officersQuery.isLoading
            ? "Loading live staff statuses"
            : `${officers.length} rows`
        }
        title="Status board"
      >
        <View style={styles.list}>
          {officers.map((officer) => (
            <Pressable
              key={officer.id}
              onPress={() =>
                router.push({
                  pathname: "/personnel/[id]",
                  params: { id: officer.id },
                })
              }
              style={styles.row}
            >
              <View style={styles.rowCopy}>
                <Text style={styles.name}>{officer.name}</Text>
                <Text style={styles.meta}>
                  Updated {formatRelativeTimestamp(officer.lastActive)}
                </Text>
              </View>
              <StatusBadge status={officer.status} />
            </Pressable>
          ))}
        </View>
      </SectionCard>
      </ScreenContainer>
    </>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    eyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    hero: {
      gap: 8,
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 12,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
    },
    rowCopy: {
      gap: 4,
    },
    summaryCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      flex: 1,
      padding: 16,
    },
    summaryGrid: {
      flexDirection: "row",
      gap: 12,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: "700",
      marginTop: 10,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
  });
}
