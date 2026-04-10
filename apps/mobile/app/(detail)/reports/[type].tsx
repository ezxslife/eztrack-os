import { useLocalSearchParams } from "expo-router";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { useReportData } from "@/lib/queries/reports";
import { useThemeColors } from "@/theme";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

export default function ReportDetailScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ type: string }>();
  const reportType = params.type ?? "incident-summary";
  const reportQuery = useReportData(reportType, {});
  const report = reportQuery.data;

  const handleShare = async () => {
    if (!report?.rows.length) {
      Alert.alert("No data", "There are no rows to export for this report.");
      return;
    }

    try {
      await Share.share({
        message: toCsv(report.rows),
        title: reportType,
      });
    } catch (error) {
      Alert.alert(
        "Export failed",
        error instanceof Error ? error.message : "The report could not be shared."
      );
    }
  };

  return (
    <ScreenContainer
      onRefresh={() => {
        void reportQuery.refetch();
      }}
      refreshing={reportQuery.isRefetching}
      subtitle="Real report rows and summary stats backed by the existing reporting queries."
      title={reportType.replace(/-/g, " ")}
    >
      <SectionCard title="Summary">
        <View style={styles.stats}>
          {(report?.stats ?? []).map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              {stat.sub ? <Text style={styles.statSub}>{stat.sub}</Text> : null}
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        footer={
          <Button
            label="Share CSV"
            onPress={() => {
              void handleShare();
            }}
            variant="secondary"
          />
        }
        subtitle={reportQuery.isLoading ? "Loading rows" : `${report?.rows.length ?? 0} rows`}
        title="Rows"
      >
        <View style={styles.rows}>
          {(report?.rows ?? []).length ? (
            report?.rows.map((row, index) => (
              <View
                key={`${index}-${String(row.id ?? row.number ?? "row")}`}
                style={styles.rowCard}
              >
                {Object.entries(row).map(([key, value]) => (
                  <Text key={key} style={styles.rowText}>
                    <Text style={styles.rowLabel}>{key}: </Text>
                    {String(value ?? "-")}
                  </Text>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No rows available for this report.</Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    rowCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    rowLabel: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    rowText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    rows: {
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      minWidth: "47%",
      padding: 14,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    statSub: {
      color: colors.textTertiary,
      fontSize: 12,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
  });
}
