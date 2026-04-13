import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

type ExportFormat = "csv" | "pdf" | "excel";
type DateRangePreset = "week" | "month" | "30days" | "custom";

export default function ExportScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>("month");
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    new Set(["incidents", "dispatches"])
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const styles = createStyles(colors, layout, typography);

  const formatOptions: Array<{ id: ExportFormat; label: string; icon: string }> = [
    { id: "csv", label: "CSV", icon: "doc.text.fill" },
    { id: "pdf", label: "PDF", icon: "doc.pdf.fill" },
    { id: "excel", label: "Excel", icon: "doc.fill" },
  ];

  const dateRangeOptions: Array<{ id: DateRangePreset; label: string }> = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "30days", label: "Last 30 Days" },
    { id: "custom", label: "Custom Range" },
  ];

  const scopeOptions = [
    { id: "incidents", label: "Incidents" },
    { id: "dispatches", label: "Dispatches" },
    { id: "daily-log", label: "Daily Log" },
    { id: "personnel", label: "Personnel" },
    { id: "cases", label: "Cases" },
  ];

  const toggleScope = (id: string) => {
    triggerImpactHaptic();
    const newScopes = new Set(selectedScopes);
    if (newScopes.has(id)) {
      newScopes.delete(id);
    } else {
      newScopes.add(id);
    }
    setSelectedScopes(newScopes);
  };

  const handleExport = async () => {
    if (selectedScopes.size === 0) {
      Alert.alert("Please select at least one data type to export");
      return;
    }

    triggerImpactHaptic();
    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setShowSuccess(true);
      Alert.alert(
        "Export Successful",
        `Data exported as ${selectedFormat.toUpperCase()}`
      );
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Export Data",
        }}
      />
      <ScreenContainer nativeHeader>
        {/* Export Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatGrid}>
            {formatOptions.map((format) => (
              <Pressable
                key={format.id}
                style={[
                  styles.formatCard,
                  selectedFormat === format.id && styles.formatCardSelected,
                ]}
                onPress={() => {
                  triggerImpactHaptic();
                  setSelectedFormat(format.id);
                }}
              >
                <AppSymbol
                  iosName={format.icon as any}
                  fallbackName="document"
                  size={28}
                  color={
                    selectedFormat === format.id
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.formatLabel,
                    selectedFormat === format.id &&
                      styles.formatLabelSelected,
                  ]}
                >
                  {format.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRangeGrid}>
            {dateRangeOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.dateRangeButton,
                  selectedDateRange === option.id &&
                    styles.dateRangeButtonSelected,
                ]}
                onPress={() => {
                  triggerImpactHaptic();
                  setSelectedDateRange(option.id);
                }}
              >
                <Text
                  style={[
                    styles.dateRangeButtonText,
                    selectedDateRange === option.id &&
                      styles.dateRangeButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Data Scope Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Scope</Text>
          <View style={styles.scopeList}>
            {scopeOptions.map((scope) => (
              <Pressable
                key={scope.id}
                style={styles.scopeItem}
                onPress={() => toggleScope(scope.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedScopes.has(scope.id) && styles.checkboxChecked,
                  ]}
                >
                  {selectedScopes.has(scope.id) && (
                    <AppSymbol
                      iosName="checkmark"
                      fallbackName="checkmark"
                      size={14}
                      color="#FFFFFF"
                    />
                  )}
                </View>
                <Text style={styles.scopeLabel}>{scope.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.actionContainer}>
          <Button
            label={isExporting ? "Exporting..." : "Export Data"}
            onPress={handleExport}
            disabled={isExporting || selectedScopes.size === 0}
          />
        </View>

        {/* Success State */}
        {showSuccess && (
          <MaterialSurface variant="chrome" style={styles.successMessage}>
            <View style={styles.successContent}>
              <AppSymbol
                iosName="checkmark.circle.fill"
                fallbackName="checkmark-circle"
                size={24}
                color="#34C759"
              />
              <View style={styles.successText}>
                <Text style={styles.successTitle}>Export Complete</Text>
                <Text style={styles.successSubtitle}>
                  File ready to download
                </Text>
              </View>
            </View>
          </MaterialSurface>
        )}
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
    section: {
      gap: 12,
      marginBottom: layout.gridGap,
    },
    sectionTitle: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    formatGrid: {
      flexDirection: "row",
      gap: layout.gridGap,
    },
    formatCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    formatCardSelected: {
      borderColor: colors.primary,
    },
    formatLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    formatLabelSelected: {
      color: colors.primary,
      fontWeight: "700",
    },
    dateRangeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: layout.gridGap,
    },
    dateRangeButton: {
      flex: 1,
      minWidth: layout.isRegularWidth ? "48%" : "100%",
      paddingVertical: 12,
      paddingHorizontal: layout.listItemPadding,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
    },
    dateRangeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateRangeButtonText: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    dateRangeButtonTextSelected: {
      color: "#FFFFFF",
    },
    scopeList: {
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    scopeItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    scopeLabel: {
      ...typography.subheadline,
      color: colors.textPrimary,
      flex: 1,
    },
    actionContainer: {
      marginTop: layout.gridGap,
      marginBottom: layout.gridGap,
    },
    successMessage: {
      marginTop: layout.gridGap,
    },
    successContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    successText: {
      flex: 1,
      gap: 2,
    },
    successTitle: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    successSubtitle: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  });
}
