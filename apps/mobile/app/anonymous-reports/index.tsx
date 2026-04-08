import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { formatShortDateTime } from "@/lib/format";
import {
  useAnonymousReports,
  useSubmitAnonymousReportMutation,
} from "@/lib/queries/anonymous-reports";
import { useThemeColors } from "@/theme";

const CATEGORY_OPTIONS = [
  { label: "Safety Concern", value: "safety_concern" },
  { label: "Misconduct", value: "misconduct" },
  { label: "Theft", value: "theft" },
  { label: "Harassment", value: "harassment" },
  { label: "Drug Activity", value: "drug_activity" },
  { label: "Other", value: "other" },
] as const;

function getTrackingCode(id: string) {
  return `ANON-${id.substring(0, 8).toUpperCase()}`;
}

function AnonymousReportsContent() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const reportsQuery = useAnonymousReports();
  const submitMutation = useSubmitAnonymousReportMutation();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORY_OPTIONS[0].label
  );
  const [reportText, setReportText] = useState("");
  const [trackingCode, setTrackingCode] = useState<null | string>(null);
  const reports = reportsQuery.data ?? [];
  const descriptionError =
    reportText.length > 0 && reportText.trim().length < 20
      ? "Description must be at least 20 characters."
      : null;

  const handleSubmit = async () => {
    const normalized = reportText.trim();
    if (normalized.length < 20) {
      Alert.alert(
        "Description required",
        "Add at least 20 characters before submitting the report."
      );
      return;
    }

    const category =
      CATEGORY_OPTIONS.find((option) => option.label === selectedCategory)?.value ??
      CATEGORY_OPTIONS[0].value;

    try {
      const result = await submitMutation.mutateAsync({
        category,
        reportText: normalized,
      });
      setTrackingCode(getTrackingCode(result.id));
      setReportText("");
    } catch (error) {
      Alert.alert(
        "Submit failed",
        error instanceof Error ? error.message : "Could not submit the anonymous report."
      );
    }
  };

  return (
    <ScreenContainer
      onRefresh={() => {
        void reportsQuery.refetch();
      }}
      refreshing={reportsQuery.isRefetching}
      subtitle="Live anonymous report submission and recent report review."
      title="Anonymous Reports"
    >
      <SectionCard
        subtitle="Send a confidential report straight to the live anonymous reports queue."
        title="Submit Report"
      >
        <View style={styles.stack}>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <FilterChips
              onSelect={setSelectedCategory}
              options={CATEGORY_OPTIONS.map((option) => option.label)}
              selected={selectedCategory}
            />
          </View>
          <TextField
            error={descriptionError}
            label="Description"
            multiline
            onChangeText={setReportText}
            placeholder="Describe what you observed in detail..."
            value={reportText}
          />
          <Button
            label="Submit Report"
            loading={submitMutation.isPending}
            onPress={() => {
              void handleSubmit();
            }}
          />
          {trackingCode ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationTitle}>Report submitted</Text>
              <Text style={styles.confirmationCopy}>
                Tracking code: {trackingCode}
              </Text>
            </View>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          reportsQuery.isLoading
            ? "Loading recent reports"
            : `${reports.length} reports visible`
        }
        title="Recent Reports"
      >
        <View style={styles.list}>
          {reports.length ? (
            reports.map((report) => (
              <View key={report.id} style={styles.row}>
                <Text style={styles.rowTitle}>{getTrackingCode(report.id)}</Text>
                <Text style={styles.meta}>
                  {CATEGORY_OPTIONS.find((option) => option.value === report.category)?.label ??
                    report.category}
                </Text>
                <Text style={styles.copy} numberOfLines={3}>
                  {report.reportText}
                </Text>
                <Text style={styles.meta}>
                  {report.status} · {formatShortDateTime(report.submittedAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.copy}>No anonymous reports are available yet.</Text>
          )}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

export default function AnonymousReportsScreen() {
  return (
    <RequireLiveSession
      detail="Anonymous report submission and queue review stay live-only in this tranche."
      title="Anonymous Reports"
    >
      <AnonymousReportsContent />
    </RequireLiveSession>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    confirmation: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 6,
      padding: 14,
    },
    confirmationCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    confirmationTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
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
      borderRadius: 18,
      gap: 8,
      padding: 14,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    stack: {
      gap: 16,
    },
  });
}
