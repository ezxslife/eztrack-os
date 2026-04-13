import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface ScannedPlate {
  plate: string;
  timestamp: string;
  make?: string;
  model?: string;
  color?: string;
}

const MOCK_RECENT_SCANS: ScannedPlate[] = [
  { plate: "ABC-1234", timestamp: "2026-04-11 14:32:00", make: "Toyota", model: "Camry", color: "Silver" },
  { plate: "XYZ-5678", timestamp: "2026-04-11 13:15:00", make: "Honda", model: "Civic", color: "Blue" },
  { plate: "DEF-9012", timestamp: "2026-04-11 11:48:00", make: "Ford", model: "F-150", color: "Black" },
];

function RecentScanCard({
  scan,
  colors,
  typography,
  layout,
}: {
  scan: ScannedPlate;
  colors: ReturnType<typeof useThemeColors>;
  typography: ReturnType<typeof useThemeTypography>;
  layout: ReturnType<typeof useAdaptiveLayout>;
}) {
  const styles = createScanCardStyles(colors, typography, layout);

  return (
    <Pressable style={styles.card}>
      <View style={styles.plateBanner}>
        <Text style={styles.plate}>{scan.plate}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Make/Model:</Text>
          <Text style={styles.value}>
            {scan.make} {scan.model}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Color:</Text>
          <Text style={styles.value}>{scan.color}</Text>
        </View>
        <Text style={styles.timestamp}>{scan.timestamp}</Text>
      </View>
    </Pressable>
  );
}

export default function PlateScannerScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const [manualPlate, setManualPlate] = useState("");
  const [isScanning] = useState(false);
  const [recentScans, setRecentScans] = useState(MOCK_RECENT_SCANS);

  const handleCameraPress = () => {
    triggerImpactHaptic();
    Alert.alert("Camera Scanner", "Opening camera to scan license plates...");
    // TODO: Open camera
  };

  const handleManualSubmit = () => {
    if (!manualPlate.trim()) {
      Alert.alert("Error", "Please enter a license plate");
      return;
    }
    triggerImpactHaptic();
    const newScan: ScannedPlate = {
      plate: manualPlate.toUpperCase(),
      timestamp: new Date().toLocaleString(),
    };
    setRecentScans((prev) => [newScan, ...prev]);
    setManualPlate("");
    Alert.alert("Success", `Scanned: ${newScan.plate}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Plate Scanner",
        }}
      />
      <ScreenContainer title="Plate Scanner">
        {/* Camera Viewfinder Area */}
        <View style={styles.cameraContainer}>
          {isScanning ? (
            <View style={styles.scanningOverlay}>
              <Text style={styles.scanningText}>Scanning...</Text>
              <View style={styles.spinner} />
            </View>
          ) : (
            <>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instructionText}>
                Align license plate within frame
              </Text>
            </>
          )}
        </View>

        {/* Camera Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            label="Start Camera"
            onPress={handleCameraPress}
            icon="camera"
          />
        </View>

        {/* Manual Entry Section */}
        <MaterialSurface variant="chrome" style={styles.manualSection}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter plate (e.g., ABC-1234)"
              placeholderTextColor={colors.textTertiary}
              value={manualPlate}
              onChangeText={setManualPlate}
              autoCapitalize="characters"
              editable={!isScanning}
            />
            <Button
              variant="primary"
              label="Submit"
              onPress={handleManualSubmit}
              disabled={isScanning}
            />
          </View>
        </MaterialSurface>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <FlatList
              data={recentScans}
              keyExtractor={(item, idx) => `${item.plate}-${idx}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <RecentScanCard
                  scan={item}
                  colors={colors}
                  typography={typography}
                  layout={layout}
                />
              )}
            />
          </View>
        )}
      </ScreenContainer>
    </>
  );
}

function createScanCardStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    card: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    plateBanner: {
      backgroundColor: colors.surfaceTintMedium,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: "center",
    },
    plate: {
      ...typography.headline,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 2,
    },
    info: {
      padding: 12,
      gap: 8,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    label: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
      textAlign: "right",
      flex: 1,
      marginLeft: 12,
    },
    timestamp: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 4,
    },
  });
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    cameraContainer: {
      backgroundColor: colors.surfaceTintMedium,
      marginHorizontal: layout.horizontalPadding,
      borderRadius: 12,
      overflow: "hidden",
      aspectRatio: 4 / 3,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      position: "relative",
    },
    viewfinder: {
      width: "80%",
      height: "60%",
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 12,
      position: "relative",
    },
    corner: {
      position: "absolute",
      width: 40,
      height: 40,
      borderColor: colors.primary,
    },
    topLeft: {
      top: -4,
      left: -4,
      borderTopWidth: 3,
      borderLeftWidth: 3,
    },
    topRight: {
      top: -4,
      right: -4,
      borderTopWidth: 3,
      borderRightWidth: 3,
    },
    bottomLeft: {
      bottom: -4,
      left: -4,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
    },
    bottomRight: {
      bottom: -4,
      right: -4,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    scanningOverlay: {
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    scanningText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: "600",
    },
    spinner: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: colors.border,
      borderTopColor: colors.primary,
    },
    instructionText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 12,
    },
    buttonContainer: {
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: 16,
    },
    manualSection: {
      marginHorizontal: layout.horizontalPadding,
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 16,
      gap: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      ...typography.subheadline,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    inputGroup: {
      gap: 12,
    },
    input: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...typography.body,
      color: colors.textPrimary,
    },
    recentSection: {
      paddingHorizontal: layout.horizontalPadding,
      gap: 8,
      marginBottom: 24,
    },
    recentTitle: {
      ...typography.subheadline,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    separator: {
      height: 8,
    },
  });
}
