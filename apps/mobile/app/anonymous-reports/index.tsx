import { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RequireLiveSession } from "@/components/auth/RequireLiveSession";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SectionCard } from "@/components/ui/SectionCard";
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
import { useThemeColors } from "@/theme";

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
  const styles = createStyles(colors);
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
      [
        "super_admin",
        "org_admin",
        "manager",
        "supervisor",
      ].includes(profile?.role ?? ""),
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
        message: "The anonymous report is now in the live queue.",
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
      onRefresh={() => {
        void reportsQuery.refetch();
        if (lookupCode.trim().length >= 6) {
          void lookupQuery.refetch();
        }
      }}
      refreshing={reportsQuery.isRefetching}
      subtitle="Live anonymous submission, tracking-code lookup, and supervisor review."
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
        subtitle="Use the submission code to check the current case status."
        title="Status Lookup"
      >
        <View style={styles.stack}>
          <TextField
            autoCapitalize="characters"
            label="Tracking Code"
            onChangeText={setLookupCode}
            placeholder="ANON-1234ABCD"
            value={lookupCode}
          />
          {lookupCode.trim().length >= 6 ? (
            lookupQuery.data ? (
              <View style={styles.row}>
                <Text style={styles.rowTitle}>
                  {getTrackingCode(lookupQuery.data.id)}
                </Text>
                <Text style={styles.meta}>
                  {lookupQuery.data.status} · {formatShortDateTime(lookupQuery.data.submittedAt)}
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
        </View>
      </SectionCard>

      <SectionCard
        subtitle={
          reportsQuery.isLoading
            ? "Loading submitted reports"
            : `${reports.length} reports visible`
        }
        title="Submitted Reports"
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
