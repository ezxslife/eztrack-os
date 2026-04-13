import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  Alert,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { Button } from "@/components/ui/Button";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface BadgeOptions {
  includePhoto: boolean;
  includeQR: boolean;
}

export default function BadgePrintScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const [options, setOptions] = useState<BadgeOptions>({
    includePhoto: true,
    includeQR: true,
  });

  // Mock visitor data
  const visitorName = "John Smith";
  const hostName = "Sarah Johnson";
  const company = "ABC Corporation";
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const badgeNumber = "VIS-2026-4324";

  const handlePrint = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Print Badge",
      `Print visitor badge for ${visitorName}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Print",
          onPress: () => {
            triggerImpactHaptic();
            Alert.alert("Success", "Badge sent to printer");
          },
        },
      ]
    );
  };

  const handleShare = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Share Badge",
      `Share badge details for ${visitorName}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Share",
          onPress: () => {
            triggerImpactHaptic();
            Alert.alert("Success", "Badge details shared");
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Visitor Badge" }} />
      <ScreenContainer title="Visitor Badge">
        {/* Badge Preview */}
        <View style={styles.previewSection}>
          <SectionHeader title="Badge Preview" />
          <MaterialSurface variant="chrome" style={styles.badge}>
            {/* Badge Header */}
            <View style={styles.badgeHeader}>
              <Text style={styles.badgeTitle}>VISITOR</Text>
              <Text style={styles.badgeNumber}>{badgeNumber}</Text>
            </View>

            {/* Photo Area */}
            {options.includePhoto && (
              <View style={styles.photoArea}>
                <AppSymbol
                  iosName="person.crop.square.fill"
                  fallbackName="person"
                  size={80}
                  color={colors.textTertiary}
                />
              </View>
            )}

            {/* Visitor Info */}
            <View style={styles.infoSection}>
              <Text style={styles.visitorName}>{visitorName}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Host:</Text>
                <Text style={styles.value}>{hostName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{company}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{time}</Text>
              </View>
            </View>

            {/* QR Code */}
            {options.includeQR && (
              <View style={styles.qrSection}>
                <View style={styles.qrPlaceholder}>
                  <AppSymbol
                    iosName="qrcode"
                    fallbackName="qr-code"
                    size={60}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.qrLabel}>{badgeNumber}</Text>
              </View>
            )}

            {/* Badge Footer */}
            <View style={styles.badgeFooter}>
              <Text style={styles.footerText}>VALID DURING VISIT ONLY</Text>
            </View>
          </MaterialSurface>
        </View>

        {/* Badge Options */}
        <View style={styles.optionsSection}>
          <SectionHeader title="Badge Options" />
          <MaterialSurface variant="chrome" style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Include Visitor Photo</Text>
              <Switch
                value={options.includePhoto}
                onValueChange={(value) => {
                  triggerImpactHaptic();
                  setOptions((prev) => ({ ...prev, includePhoto: value }));
                }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Include QR Code</Text>
              <Switch
                value={options.includeQR}
                onValueChange={(value) => {
                  triggerImpactHaptic();
                  setOptions((prev) => ({ ...prev, includeQR: value }));
                }}
              />
            </View>
          </MaterialSurface>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Button
            variant="primary"
            label="Print Badge"
            icon="printer"
            onPress={handlePrint}
          />
          <Button
            variant="secondary"
            label="Share"
            icon="share"
            onPress={handleShare}
          />
        </View>
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
    previewSection: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: 24,
    },
    badge: {
      overflow: "hidden",
      borderRadius: 12,
    },
    badgeHeader: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badgeTitle: {
      ...typography.subheadline,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    badgeNumber: {
      ...typography.caption1,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    photoArea: {
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: colors.surfaceTintMedium,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      backgroundColor: colors.surface,
    },
    visitorName: {
      ...typography.headline,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    label: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: "600",
      flex: 1,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
      textAlign: "right",
      flex: 1,
    },
    qrSection: {
      alignItems: "center",
      paddingVertical: 12,
      backgroundColor: colors.surfaceTintMedium,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 4,
    },
    qrPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    qrLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    badgeFooter: {
      backgroundColor: colors.surfaceTintMedium,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
    footerText: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    optionsSection: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: 24,
    },
    optionsCard: {
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 12,
    },
    optionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    optionLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    actionSection: {
      paddingHorizontal: layout.horizontalPadding,
      paddingBottom: 24,
      gap: 12,
    },
  });
}
