import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { GlassSegmentedControl } from "@/components/ui/glass/GlassSegmentedControl";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function VisitorCheckInScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  const [mode, setMode] = useState<"qr" | "manual">("manual");
  const [visitorName, setVisitorName] = useState("");
  const [company, setCompany] = useState("");
  const [host, setHost] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // TODO: Replace with real check-in hook
  // const checkInMutation = useVisitorCheckIn();

  // Mock host options
  const hostOptions = [
    { id: "1", name: "Martinez, Alex" },
    { id: "2", name: "Chen, Lisa" },
    { id: "3", name: "Rodriguez, Miguel" },
    { id: "4", name: "Smith, James" },
  ];

  const handleQRScan = () => {
    // TODO: Implement camera/QR scan
    Alert.alert("Not Yet Implemented", "QR scan feature coming soon");
  };

  const handleManualCheckIn = () => {
    if (!visitorName.trim()) {
      Alert.alert("Required", "Please enter visitor name");
      return;
    }
    if (!company.trim()) {
      Alert.alert("Required", "Please enter company or organization");
      return;
    }
    if (!host.trim()) {
      Alert.alert("Required", "Please select a host");
      return;
    }

    // TODO: Call checkInMutation
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setVisitorName("");
      setCompany("");
      setHost("");
      setPurpose("");
    }, 2000);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Visitor Check-in" }} />
      <ScreenContainer title="Visitor Check-in">

        {showSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successCheckmark}>
              <Text style={styles.successCheckmarkText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Visitor Checked In</Text>
            <Text style={styles.successSubtitle}>
              Badge information sent to host
            </Text>
          </View>
        ) : (
          <>
            {/* Mode Toggle */}
            <View style={styles.modeToggleSection}>
              <GlassSegmentedControl
                options={[
                  { label: "QR Scan", value: "qr" },
                  { label: "Manual", value: "manual" },
                ]}
                selectedValue={mode}
                onValueChange={(value) => setMode(value as "qr" | "manual")}
              />
            </View>

            {mode === "qr" ? (
              // QR Scan Mode
              <View style={styles.qrSection}>
                <MaterialSurface style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraPlaceholderText}>
                    📷 Camera Placeholder
                  </Text>
                  <Text style={styles.cameraPlaceholderSubtext}>
                    Position QR code in view
                  </Text>
                </MaterialSurface>
                <Button
                  label="Start QR Scan"
                  onPress={handleQRScan}
                />
              </View>
            ) : (
              // Manual Check-in Mode
              <View style={styles.manualSection}>
                <SectionHeader title="Visitor Information" />

                <View style={styles.formSection}>
                  <TextField
                    label="Visitor Name"
                    placeholder="First and last name"
                    value={visitorName}
                    onChangeText={setVisitorName}
                  />

                  <TextField
                    label="Company / Organization"
                    placeholder="Company or organization name"
                    value={company}
                    onChangeText={setCompany}
                  />

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Host Personnel</Text>
                    <View style={styles.hostOptionsContainer}>
                      {hostOptions.map((option) => (
                        <MaterialSurface
                          key={option.id}
                          style={[
                            styles.hostOption,
                            host === option.id && styles.hostOptionSelected,
                          ]}
                          onPress={() => setHost(option.id)}
                        >
                          <Text
                            style={[
                              styles.hostOptionText,
                              host === option.id &&
                                styles.hostOptionTextSelected,
                            ]}
                          >
                            {option.name}
                          </Text>
                        </MaterialSurface>
                      ))}
                    </View>
                  </View>

                  <TextField
                    label="Purpose of Visit"
                    placeholder="Meeting, delivery, meeting, etc."
                    value={purpose}
                    onChangeText={setPurpose}
                  />

                  <Button
                    label="Check In Visitor"
                    onPress={handleManualCheckIn}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    cameraPlaceholder: {
      alignItems: "center",
      height: 300,
      justifyContent: "center",
      marginHorizontal: layout.horizontalPadding,
      marginBottom: 16,
    },
    cameraPlaceholderSubtext: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 8,
    },
    cameraPlaceholderText: {
      ...typography.title3,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    formGroup: {
      gap: 8,
    },
    formLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    formSection: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
    },
    hostOption: {
      alignItems: "center",
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    hostOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    hostOptionText: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    hostOptionTextSelected: {
      color: colors.surfacePrimary,
    },
    hostOptionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    manualSection: {
      gap: 16,
    },
    modeToggleSection: {
      marginHorizontal: layout.horizontalPadding,
      marginBottom: 24,
    },
    qrSection: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
    },
    successCheckmark: {
      alignItems: "center",
      backgroundColor: colors.success,
      borderRadius: 100,
      height: 120,
      justifyContent: "center",
      marginVertical: 32,
      width: 120,
    },
    successCheckmarkText: {
      ...typography.title1,
      color: colors.surfacePrimary,
      fontSize: 60,
      fontWeight: "700",
    },
    successContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    successSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 8,
    },
    successTitle: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 20,
    },
  });
}
