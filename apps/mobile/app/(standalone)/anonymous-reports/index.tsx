import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { useSessionContext } from "@/hooks/useSessionContext";
import { formatShortDateTime } from "@/lib/format";
import {
  useAnonymousReportLookup,
  useAnonymousReports,
  useSubmitAnonymousReportMutation,
  useUpdateAnonymousReportStatusMutation,
} from "@/lib/queries/anonymous-reports";
import { useToast } from "@/providers/ToastProvider";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const CATEGORY_OPTIONS = [
  { label: "Safety Concern", value: "safety_concern" },
  { label: "Misconduct", value: "misconduct" },
  { label: "Theft", value: "theft" },
  { label: "Harassment", value: "harassment" },
  { label: "Drug Activity", value: "drug_activity" },
  { label: "Other", value: "other" },
] as const;

const STATUS_OPTIONS = [
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Investigating", value: "investigating" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
] as const;

function getTrackingCode(id: string) {
  return `ANON-${id.substring(0, 8).toUpperCase()}`;
}

function AnonymousReportsContent() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const { showToast } = useToast();
  const { profile } = useSessionContext();
  const reportsQuery = useAnonymousReports();
  const submitMutation = useSubmitAnonymousReportMutation();
  const updateStatusMutation = useUpdateAnonymousReportStatusMutation();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORY_OPTIONS[0].label
  );
  const [reportText, setReportText] = useState("");
  const [trackingCode, setTrackingCode] = useState<null | string>(null);
  const [lookupCode, setLookupCode] = useState("");
  const lookupQuery = useAnonymousReportLookup(lookupCode);
  const reports = reportsQuery.data ?? [];
  const canReviewStatuses = useMemo(
    () =>
      ["super_admin", "org_admin", "manager", "supervisor"].includes(
        profile?.role ?? ""
      ),
    [profile?.role]
  );
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
      showToast({
        message: "The anonymous report has been received.",
        title: "Report submitted",
        tone: "success",
      });
    } catch (error) {
      Alert.alert(
        "Submit failed",
        error instanceof Error ? error.message : "Could not submit the anonymous report."
      );
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      showToast({
        message: `${getTrackingCode(id)} moved to ${status.replace(/_/g, " ")}.`,
        title: "Report updated",
        tone: "success",
      });
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not update report status."
      );
    }
  };

  return (
    <ScreenContainer
      gutter="none"
      onRefresh={() => {
        void reportsQuery.refetch();
        if (lookupCode.trim().length >= 6) {
          void lookupQuery.refetch();
        }
      }}
      refreshing={reportsQuery.isRefetching}
      subtitle="Confidential reporting, tracking, and review."
      title="Anonymous Reports"
    >
      <View style={styles.section}>
        <SectionHeader title="Submit report" />
        <MaterialSurface style={styles.panel} variant="panel">
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
        </MaterialSurface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Status lookup" />
        <MaterialSurface style={styles.panel} variant="panel">
          <TextField
            autoCapitalize="characters"
            label="Tracking Code"
            onChangeText={setLookupCode}
            placeholder="ANON-1234ABCD"
            value={lookupCode}
          />
          {lookupCode.trim().length >= 6 ? (
            lookupQuery.data ? (
              <View style={styles.lookupCard}>
                <Text style={styles.rowTitle}>
                  {getTrackingCode(lookupQuery.data.id)}
                </Text>
                <Text style={styles.meta}>
                  {lookupQuery.data.status} ·{" "}
                  {formatShortDateTime(lookupQuery.data.submittedAt)}
                </Text>
                <Text style={styles.copy}>{lookupQuery.data.reportText}</Text>
                {lookupQuery.data.adminNotes ? (
                  <Text style={styles.meta}>
                    Admin notes: {lookupQuery.data.adminNotes}
                  </Text>
                ) : null}
              </View>
            ) : lookupQuery.isError ? (
              <Text style={styles.meta}>
                {lookupQuery.error instanceof Error
                  ? lookupQuery.error.message
                  : "No report matched that code."}
              </Text>
            ) : (
              <Text style={styles.meta}>Looking up report status…</Text>
            )
          ) : (
            <Text style={styles.meta}>
              Enter a tracking code to look up a previously submitted report.
            </Text>
          )}
        </MaterialSurface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Submitted reports" />
        <View style={styles.list}>
          {reports.length ? (
            reports.map((report) => (
              <MaterialSurface key={report.id} style={styles.reportCard} variant="panel">
                <Text style={styles.rowTitle}>{getTrackingCode(report.id)}</Text>
                <Text style={styles.meta}>
                  {CATEGORY_OPTIONS.find((option) => option.value === report.category)?.label ??
                    report.category}
                </Text>
                <Text style={styles.copy}>{report.reportText}</Text>
                <Text style={styles.meta}>
                  {report.status} · {formatShortDateTime(report.submittedAt)}
                </Text>
                {report.adminNotes ? (
                  <Text style={styles.meta}>Admin notes: {report.adminNotes}</Text>
                ) : null}
                {canReviewStatuses ? (
                  <FilterChips
                    onSelect={(value) => {
                      const status =
                        STATUS_OPTIONS.find((option) => option.label === value)?.value ??
                        report.status;
                      void handleStatusUpdate(report.id, status);
                    }}
                    options={STATUS_OPTIONS.map((option) => option.label)}
                    selected={
                      STATUS_OPTIONS.find((option) => option.value === report.status)?.label ??
                      report.status
                    }
                  />
                ) : null}
              </MaterialSurface>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.copy}>No reports have been submitted yet.</Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

export default function AnonymousReportsScreen() {
  return (
    <RequireLiveSession
      detail="Anonymous reports are available with a live account and current data access."
      title="Anonymous Reports"
    >
      <AnonymousReportsContent />
    </RequireLiveSession>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    confirmation: {
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      gap: 6,
      padding: 14,
    },
    confirmationCopy: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    confirmationTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    copy: {
      ...typography.subheadline,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    emptyState: {
      backgroundColor: colors.surfaceTintSubtle,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },
    field: {
      gap: 8,
    },
    label: {
      ...typography.caption1,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    list: {
      gap: 12,
      paddingHorizontal: layout.horizontalPadding,
    },
    lookupCard: {
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    meta: {
      ...typography.footnote,
      color: colors.textTertiary,
      lineHeight: 18,
    },
    panel: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
    },
    reportCard: {
      gap: 8,
    },
    rowTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    section: {
      gap: 8,
    },
  });
}
