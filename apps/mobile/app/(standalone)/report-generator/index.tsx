import { Stack, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { HeaderCancelButton } from "@/navigation/header-buttons";
import { useThemeColors, useThemeTypography, useThemeSpacing } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerSelectionHaptic, triggerNotificationHaptic } from "@/lib/haptics";
import { formatDate } from "@/lib/format";

type ReportType =
  | "incident_summary"
  | "daily_activity"
  | "dispatch_log"
  | "personnel_report"
  | "custom";
type Step = 1 | 2 | 3;

interface ReportConfig {
  type: ReportType | null;
  dateRange: {
    start: Date;
    end: Date;
  };
  location: string | null;
  status: string | null;
  personnel: string | null;
}

const REPORT_TYPES: Array<{
  id: ReportType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "incident_summary",
    label: "Incident Summary",
    description: "Overview of reported incidents",
    icon: "exclamationmark.circle",
  },
  {
    id: "daily_activity",
    label: "Daily Activity",
    description: "All activities for selected date range",
    icon: "calendar.badge.clock",
  },
  {
    id: "dispatch_log",
    label: "Dispatch Log",
    description: "All dispatches and responses",
    icon: "paperplane",
  },
  {
    id: "personnel_report",
    label: "Personnel Report",
    description: "Personnel activity and assignments",
    icon: "person.2",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Configure your own report",
    icon: "slider.horizontal.3",
  },
];

const MOCK_LOCATIONS = [
  { id: "all", label: "All Locations" },
  { id: "zone-a", label: "Zone A - North Campus" },
  { id: "zone-b", label: "Zone B - South Campus" },
  { id: "zone-c", label: "Zone C - West Building" },
];

const MOCK_STATUSES = [
  { id: "all", label: "All Statuses" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

const MOCK_PERSONNEL = [
  { id: "all", label: "All Personnel" },
  { id: "john-smith", label: "John Smith" },
  { id: "sarah-johnson", label: "Sarah Johnson" },
  { id: "mike-brown", label: "Mike Brown" },
];

export default function ReportGeneratorScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<ReportConfig>({
    type: null,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    location: "all",
    status: "all",
    personnel: "all",
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const selectedReportType = useMemo(() => {
    return REPORT_TYPES.find((t) => t.id === config.type);
  }, [config.type]);

  const canProceedToStep2 = config.type !== null;
  const canProceedToStep3 = canProceedToStep2;

  const handleSelectReportType = (type: ReportType) => {
    triggerSelectionHaptic();
    setConfig((prev) => ({ ...prev, type }));
  };

  const handleNextStep = () => {
    triggerSelectionHaptic();
    if (step === 1 && canProceedToStep2) {
      setStep(2);
    } else if (step === 2 && canProceedToStep3) {
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    triggerSelectionHaptic();
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleGenerateReport = () => {
    triggerSelectionHaptic();
    setGenerating(true);

    // TODO: Call API to generate report
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      triggerNotificationHaptic("success");
    }, 2000);
  };

  const handleShare = () => {
    triggerSelectionHaptic();
    // TODO: Wire to share functionality
    Alert.alert("Share Report", "Report sharing not yet implemented");
  };

  const handleSave = () => {
    triggerSelectionHaptic();
    // TODO: Wire to save functionality
    Alert.alert("Save Report", "Report saved to device");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderCancelButton />,
          title: "Generate Report",
          headerRight: () =>
            !generated ? (
              <Pressable
                onPress={step === 3 ? handleGenerateReport : handleNextStep}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3)
                }
              >
                <Text
                  style={[
                    typography.subheading,
                    {
                      color: colors.primary,
                      fontWeight: "600",
                      marginRight: 16,
                    },
                  ]}
                >
                  {step === 3 ? "Generate" : "Next"}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      <ScreenContainer>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: spacing[4], paddingVertical: spacing[4] }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Indicator */}
          {!generated && (
            <View style={{ paddingHorizontal: spacing[4] }}>
              <View style={styles.progressBar}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          step >= i ? colors.primary : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  typography.caption1,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing[2],
                    textAlign: "center",
                  },
                ]}
              >
                Step {step} of 3
              </Text>
            </View>
          )}

          {/* Step 1: Select Report Type */}
          {step === 1 && !generated && (
            <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
              <Text
                style={[
                  typography.title2,
                  { color: colors.text, fontWeight: "600" },
                ]}
              >
                Select Report Type
              </Text>

              {REPORT_TYPES.map((reportType) => (
                <Pressable
                  key={reportType.id}
                  onPress={() => handleSelectReportType(reportType.id)}
                  style={({ pressed }) => [
                    styles.reportTypeCard,
                    {
                      backgroundColor: pressed ? colors.overlay : colors.surface,
                      borderColor:
                        config.type === reportType.id
                          ? colors.primary
                          : colors.border,
                      borderWidth: config.type === reportType.id ? 2 : 1,
                    },
                  ]}
                >
                  <AppSymbol
                    name={reportType.icon}
                    size={24}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.text,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {reportType.label}
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.textTertiary, marginTop: 2 },
                      ]}
                    >
                      {reportType.description}
                    </Text>
                  </View>
                  {config.type === reportType.id && (
                    <AppSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 2: Configure Parameters */}
          {step === 2 && !generated && (
            <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
              <Text
                style={[
                  typography.title2,
                  { color: colors.text, fontWeight: "600" },
                ]}
              >
                Configure Parameters
              </Text>

              {/* Report Type Display */}
              <MaterialSurface variant="panel">
                <View style={{ flexDirection: "row", gap: spacing[3] }}>
                  <AppSymbol
                    name={selectedReportType?.icon || "doc"}
                    size={28}
                    color={colors.primary}
                  />
                  <View>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.text,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {selectedReportType?.label || "Report"}
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.textTertiary, marginTop: 2 },
                      ]}
                    >
                      {selectedReportType?.description}
                    </Text>
                  </View>
                </View>
              </MaterialSurface>

              {/* Date Range */}
              <View>
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: colors.textTertiary,
                      fontWeight: "600",
                      marginBottom: spacing[2],
                    },
                  ]}
                >
                  DATE RANGE
                </Text>
                <MaterialSurface variant="panel">
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text },
                    ]}
                  >
                    {formatDate(config.dateRange.start)} to{" "}
                    {formatDate(config.dateRange.end)}
                  </Text>
                  <Text
                    style={[
                      typography.caption1,
                      {
                        color: colors.textTertiary,
                        marginTop: spacing[1],
                      },
                    ]}
                  >
                    TODO: Wire DateRangePickerSheet
                  </Text>
                </MaterialSurface>
              </View>

              {/* Location Filter */}
              <View>
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: colors.textTertiary,
                      fontWeight: "600",
                      marginBottom: spacing[2],
                    },
                  ]}
                >
                  LOCATION
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectField,
                    {
                      backgroundColor: pressed ? colors.overlay : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>
                    {MOCK_LOCATIONS.find((l) => l.id === config.location)
                      ?.label || "Select location"}
                  </Text>
                </Pressable>
              </View>

              {/* Status Filter */}
              <View>
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: colors.textTertiary,
                      fontWeight: "600",
                      marginBottom: spacing[2],
                    },
                  ]}
                >
                  STATUS
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectField,
                    {
                      backgroundColor: pressed ? colors.overlay : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>
                    {MOCK_STATUSES.find((s) => s.id === config.status)?.label ||
                      "Select status"}
                  </Text>
                </Pressable>
              </View>

              {/* Personnel Filter */}
              <View>
                <Text
                  style={[
                    typography.footnote,
                    {
                      color: colors.textTertiary,
                      fontWeight: "600",
                      marginBottom: spacing[2],
                    },
                  ]}
                >
                  PERSONNEL
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectField,
                    {
                      backgroundColor: pressed ? colors.overlay : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>
                    {MOCK_PERSONNEL.find((p) => p.id === config.personnel)
                      ?.label || "Select personnel"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 3: Preview & Generate */}
          {step === 3 && !generated && (
            <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
              <Text
                style={[
                  typography.title2,
                  { color: colors.text, fontWeight: "600" },
                ]}
              >
                Review & Generate
              </Text>

              <MaterialSurface variant="panel">
                <View style={{ gap: spacing[2] }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={[typography.caption1, { color: colors.textTertiary }]}>
                      Report Type
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.text, fontWeight: "600" },
                      ]}
                    >
                      {selectedReportType?.label}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={[typography.caption1, { color: colors.textTertiary }]}>
                      Date Range
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.text, fontWeight: "600" },
                      ]}
                    >
                      {formatDate(config.dateRange.start)} to{" "}
                      {formatDate(config.dateRange.end)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={[typography.caption1, { color: colors.textTertiary }]}>
                      Location
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.text, fontWeight: "600" },
                      ]}
                    >
                      {MOCK_LOCATIONS.find((l) => l.id === config.location)
                        ?.label || "All"}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={[typography.caption1, { color: colors.textTertiary }]}>
                      Status
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.text, fontWeight: "600" },
                      ]}
                    >
                      {MOCK_STATUSES.find((s) => s.id === config.status)?.label ||
                        "All"}
                    </Text>
                  </View>
                </View>
              </MaterialSurface>

              <Text
                style={[
                  typography.caption1,
                  { color: colors.textTertiary, textAlign: "center" },
                ]}
              >
                Click "Generate Report" to create your report. This may take a
                moment.
              </Text>
            </View>
          )}

          {/* Generated Report State */}
          {generated && (
            <View style={{ paddingHorizontal: spacing[4], gap: spacing[3] }}>
              <View
                style={{
                  alignItems: "center",
                  gap: spacing[3],
                  paddingVertical: spacing[8],
                }}
              >
                <AppSymbol
                  name="checkmark.circle.fill"
                  size={64}
                  color={colors.interactive}
                />
                <Text
                  style={[
                    typography.title1,
                    {
                      color: colors.text,
                      fontWeight: "600",
                      textAlign: "center",
                    },
                  ]}
                >
                  Report Generated
                </Text>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.textTertiary,
                      textAlign: "center",
                    },
                  ]}
                >
                  {selectedReportType?.label || "Report"} is ready for download
                </Text>
              </View>

              <View style={{ gap: spacing[2] }}>
                <Button onPress={handleShare} icon="square.and.arrow.up">
                  Share Report
                </Button>
                <Button
                  variant="secondary"
                  onPress={handleSave}
                  icon="arrow.down.doc"
                >
                  Save to Device
                </Button>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          {!generated && (
            <View
              style={{
                paddingHorizontal: spacing[4],
                paddingBottom: spacing[4],
                gap: spacing[2],
                flexDirection: "row",
              }}
            >
              {step > 1 && (
                <Button
                  variant="tertiary"
                  onPress={handlePreviousStep}
                  style={{ flex: 1 }}
                >
                  Back
                </Button>
              )}
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reportTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  selectField: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
