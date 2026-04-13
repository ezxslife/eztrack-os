import { Alert, StyleSheet, Text, View } from "react-native";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { useState } from "react";

export default function DataStorageScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  // TODO: Replace with real storage calculation hook
  const [cacheSize] = useState(245); // in MB
  const [offlineDataItems] = useState(1024);
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(true);
  const [savePhotosToDevice, setSavePhotosToDevice] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      `This will delete ${cacheSize} MB of cached data. Continue?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: () => {
            // TODO: Call API to clear cache
            Alert.alert("Success", "Cache has been cleared.");
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      "Clear Offline Data",
      `This will delete ${offlineDataItems} items of offline data. You will need to re-sync. Continue?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: () => {
            // TODO: Call API to clear offline data
            Alert.alert("Success", "Offline data has been cleared.");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer
      gutter="none"
      title="Data & Storage"
    >

      <View style={styles.section}>
        <SectionCard title="Cache">
          <GroupedCard>
            <View style={styles.storageRow}>
              <View style={styles.storageInfo}>
                <Text style={styles.storageLabel}>Cache Size</Text>
                <Text style={styles.storageValue}>{cacheSize} MB</Text>
              </View>
            </View>
            <GroupedCardDivider />
            <View style={styles.buttonRow}>
              <Button
                label="Clear Cache"
                variant="secondary"
                onPress={handleClearCache}
              />
            </View>
          </GroupedCard>
        </SectionCard>
      </View>

      <View style={styles.section}>
        <SectionCard title="Offline Data">
          <GroupedCard>
            <View style={styles.storageRow}>
              <View style={styles.storageInfo}>
                <Text style={styles.storageLabel}>Offline Data Items</Text>
                <Text style={styles.storageValue}>{offlineDataItems.toLocaleString()}</Text>
              </View>
            </View>
            <GroupedCardDivider />
            <View style={styles.buttonRow}>
              <Button
                label="Clear Offline Data"
                variant="secondary"
                onPress={handleClearOfflineData}
              />
            </View>
          </GroupedCard>
        </SectionCard>
      </View>

      <View style={styles.section}>
        <SectionCard title="Download Preferences">
          <View style={styles.toggleStack}>
            <Toggle
              label="Auto-download media on Wi-Fi"
              sublabel="Automatically cache photos and videos"
              value={autoDownloadWifi}
              onValueChange={setAutoDownloadWifi}
            />
          </View>
        </SectionCard>
      </View>

      <View style={styles.section}>
        <SectionCard title="Device Storage">
          <View style={styles.toggleStack}>
            <Toggle
              label="Save photos to device"
              sublabel="Store photos in Camera Roll"
              value={savePhotosToDevice}
              onValueChange={setSavePhotosToDevice}
            />
          </View>
        </SectionCard>
      </View>
    </ScreenContainer>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: layout.horizontalPadding,
      marginBottom: 16,
    },
    storageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    storageInfo: {
      gap: 4,
    },
    storageLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    storageValue: {
      ...typography.title2,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    toggleStack: {
      gap: 16,
    },
    buttonRow: {
      paddingVertical: 12,
    },
  });
}
