import { Alert, StyleSheet, View } from "react-native";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Select } from "@/components/ui/Select";
import { useUIStore } from "@/stores/ui-store";

export default function SecurityScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  const biometricLockEnabled = useUIStore((state: any) => state.biometricLockEnabled);
  const setBiometricLockEnabled = useUIStore(
    (state: any) => state.setBiometricLockEnabled
  );
  const biometricTimeoutSeconds = useUIStore(
    (state: any) => state.biometricTimeoutSeconds
  );
  const setBiometricTimeoutSeconds = useUIStore(
    (state: any) => state.setBiometricTimeoutSeconds
  );

  const timeoutOptions = [
    { label: "1 minute", value: "60" },
    { label: "5 minutes", value: "300" },
    { label: "15 minutes", value: "900" },
    { label: "30 minutes", value: "1800" },
  ];

  const handleSignOutAllDevices = () => {
    Alert.alert(
      "Sign Out of All Devices",
      "This will sign you out on all devices and require you to sign in again. Continue?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: () => {
            // TODO: Call API to sign out from all devices
            Alert.alert(
              "Success",
              "You have been signed out on all devices."
            );
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer
      gutter="none"
      title="Security"
    >
      <View style={styles.section}>
        <SectionHeader title="Biometric Authentication" />
        <GroupedCard>
          <SettingsListRow
            label="Face ID / Touch ID"
            subtitle="Require biometric unlock"
            trailing={
              <Toggle
                value={biometricLockEnabled}
                onValueChange={setBiometricLockEnabled}
              />
            }
          />
        </GroupedCard>
      </View>

      {biometricLockEnabled && (
        <View style={styles.section}>
          <SectionHeader title="Auto-lock Settings" />
          <GroupedCard>
            <SettingsListRow
              label="Auto-lock Timeout"
              subtitle={
                timeoutOptions.find(
                  (opt) => opt.value === biometricTimeoutSeconds.toString()
                )?.label || "5 minutes"
              }
              trailing={
                <Select
                  value={biometricTimeoutSeconds.toString()}
                  options={timeoutOptions}
                  onValueChange={(value: any) => {
                    setBiometricTimeoutSeconds(parseInt(value, 10));
                  }}
                />
              }
            />
          </GroupedCard>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Session Management" />
        <GroupedCard>
          <Button
            label="Sign Out of All Devices"
            variant="secondary"
            onPress={handleSignOutAllDevices}
          />
        </GroupedCard>
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
  });
}
