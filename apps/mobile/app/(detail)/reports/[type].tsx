import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  canonicalizeReportSlug,
  getDefaultReportDateRange,
  getReportDefinition,
} from "@eztrack/shared";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { useProperties } from "@/lib/queries/settings";
import {
  useReportData,
  type ReportQueryParams,
} from "@/lib/queries/reports";
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

function toHtmlTable(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return "<p>No rows available for this report.</p>";
  }

  const headers = Object.keys(rows[0]);
  const head = headers.map((header) => `<th>${header}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${String(row[header] ?? "-")}</td>`)
          .join("")}</tr>`
    )
    .join("");

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

async function shareCsvFile(reportType: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const directory = FileSystem.documentDirectory;

  if (!directory) {
    throw new Error("A writable document directory is unavailable on this device.");
  }

  const uri = `${directory}${reportType}-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}

async function sharePdfFile(
  reportName: string,
  reportType: string,
  rows: Record<string, unknown>[],
  stats: Array<{ label: string; sub?: string; value: string }>,
  params: ReportQueryParams
) {
  const html = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px;">
        <h1>${reportName}</h1>
        <p>Date range: ${params.dateFrom ?? "Any"} to ${params.dateTo ?? "Any"}</p>
        <ul>
          ${stats
            .map(
              (stat) =>
                `<li><strong>${stat.label}:</strong> ${stat.value}${stat.sub ? ` <span>${stat.sub}</span>` : ""}</li>`
            )
            .join("")}
        </ul>
        ${toHtmlTable(rows)}
      </body>
    </html>
  `;

  const pdf = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(pdf.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
}

function ReportsDetailContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{
    dateFrom?: string;
    dateTo?: string;
    type?: string;
  }>();
  const reportType = canonicalizeReportSlug(params.type ?? "incident-summary");
  const definition = getReportDefinition(reportType);
  const propertiesQuery = useProperties();
  const propertyOptions = useMemo(
    () => [
      { label: "All Properties", value: "" },
      ...(propertiesQuery.data ?? []).map((property) => ({
        label: property.name,
        value: property.id,
      })),
    ],
    [propertiesQuery.data]
  );
  const defaultRange = getDefaultReportDateRange(definition?.defaultRangeDays ?? 7);
  const [dateFrom, setDateFrom] = useState(params.dateFrom ?? defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(params.dateTo ?? defaultRange.dateTo);
  const [propertyLabel, setPropertyLabel] = useState(propertyOptions[0]?.label ?? "All Properties");
  const [extraFilterLabel, setExtraFilterLabel] = useState(
    definition?.extraFilter?.options[0]?.label ?? "All"
  );
  const [appliedParams, setAppliedParams] = useState<ReportQueryParams>({
    dateFrom: params.dateFrom ?? defaultRange.dateFrom,
    dateTo: params.dateTo ?? defaultRange.dateTo,
    extraFilterValue: "",
    propertyId: "",
  });
  const [generated, setGenerated] = useState(Boolean(params.dateFrom || params.dateTo));
  const reportQuery = useReportData(reportType, appliedParams, generated);
  const report = reportQuery.data;

  const selectedPropertyValue =
    propertyOptions.find((option) => option.label === propertyLabel)?.value ?? "";
  const selectedExtraFilterValue =
    definition?.extraFilter?.options.find((option) => option.label === extraFilterLabel)
      ?.value ?? "";

  const handleGenerate = () => {
    if (!definition) {
      Alert.alert("Report unavailable", "This report type is not supported.");
      return;
    }

    setAppliedParams({
      dateFrom,
      dateTo,
      extraFilterValue: selectedExtraFilterValue,
      propertyId: selectedPropertyValue,
    });
    setGenerated(true);
  };

  const handleShareCsv = async () => {
    if (!report?.rows.length) {
      Alert.alert("No data", "Generate a report with at least one row before exporting.");
      return;
    }

    try {
      await shareCsvFile(reportType, report.rows);
    } catch (error) {
      Alert.alert(
        "CSV export failed",
        error instanceof Error ? error.message : "Could not create the CSV export."
      );
    }
  };

  const handleSharePdf = async () => {
    if (!report) {
      Alert.alert("Generate first", "Generate the report before creating a PDF.");
      return;
    }

    try {
      await sharePdfFile(
        definition?.name ?? reportType,
        reportType,
        report.rows,
        report.stats,
        appliedParams
      );
    } catch (error) {
      Alert.alert(
        "PDF export failed",
        error instanceof Error ? error.message : "Could not create the PDF export."
      );
    }
  };

  return (
    <ScreenContainer
      onRefresh={() => {
        if (generated) {
          void reportQuery.refetch();
        }
      }}
      refreshing={reportQuery.isRefetching}
      subtitle={definition?.description ?? "Generate and export a live mobile report."}
      title={definition?.name ?? reportType.replace(/-/g, " ")}
    >
      <SectionCard
        subtitle="Choose the live filters first, then generate the result set and export it."
        title="Configuration"
      >
        <View style={styles.stack}>
          <TextField
            label="From"
            onChangeText={setDateFrom}
            placeholder="YYYY-MM-DD"
            value={dateFrom}
          />
          <TextField
            label="To"
            onChangeText={setDateTo}
            placeholder="YYYY-MM-DD"
            value={dateTo}
          />
          {definition?.supportsProperty ? (
            <View style={styles.field}>
              <Text style={styles.label}>Property</Text>
              <FilterChips
                onSelect={setPropertyLabel}
                options={propertyOptions.map((option) => option.label)}
                selected={propertyLabel}
              />
            </View>
          ) : null}
          {definition?.extraFilter ? (
            <View style={styles.field}>
              <Text style={styles.label}>{definition.extraFilter.label}</Text>
              <FilterChips
                onSelect={setExtraFilterLabel}
                options={definition.extraFilter.options.map((option) => option.label)}
                selected={extraFilterLabel}
              />
            </View>
          ) : null}
          <Button
            label="Generate Report"
            loading={reportQuery.isLoading}
            onPress={handleGenerate}
          />
        </View>
      </SectionCard>

      {generated ? (
        <>
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
              <View style={styles.exportActions}>
                <Button
                  label="Share CSV"
                  onPress={() => {
                    void handleShareCsv();
                  }}
                  variant="secondary"
                />
                <Button
                  label="Share PDF"
                  onPress={() => {
                    void handleSharePdf();
                  }}
                  variant="secondary"
                />
              </View>
            }
            subtitle={
              reportQuery.isLoading ? "Loading rows" : `${report?.rows.length ?? 0} rows`
            }
            title="Generated Rows"
          >
            <View style={styles.rows}>
              {(report?.rows ?? []).length ? (
                report?.rows.map((row, index) => (
                  <View
                    key={`${index}-${String(row.id ?? row.number ?? row.caseNumber ?? "row")}`}
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
                <Text style={styles.copy}>No rows matched the selected filters.</Text>
              )}
            </View>
          </SectionCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

export default function ReportDetailScreen() {
  return (
    <RequireLiveSession
      detail="Reports are available when you're signed in with a live account."
      title="Reports"
    >
      <ReportsDetailContent />
    </RequireLiveSession>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    exportActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
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
    stack: {
      gap: 16,
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
