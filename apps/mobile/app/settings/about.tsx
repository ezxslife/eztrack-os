import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { SettingsListRow } from "@/components/ui/SettingsListRow";
import { GroupedCard } from "@/components/ui/GroupedCard";
import { GroupedCardDivider } from "@/components/ui/GroupedCardDivider";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function AboutScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);

  // TODO: Get version from app config
  const version = "1.0.0";
  const buildNumber = "2026.04.11";
  const osVersion = `${Platform.OS === "ios" ? "iOS" : "Android"} ${
    Platform.Version || "unknown"
  }`;

  const links = [
    {
      label: "Privacy Policy",
      url: "https://example.com/privacy",
    },
    {
      label: "Terms of Service",
      url: "https://example.com/terms",
    },
    {
      label: "Support",
      url: "https://example.com/support",
    },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // TODO: Show error toast
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "About" }} />
      <ScreenContainer title="About">

        {/* App Logo/Icon */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <AppSymbol size={80} />
          </View>
          <Text style={styles.appName}>EZTrack</Text>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <SectionHeader title="Information" />
          <GroupedCard>
            <SettingsListRow
              label="Version"
              subtitle={version}
            />
            <GroupedCardDivider />
            <SettingsListRow
              label="Build"
              subtitle={buildNumber}
            />
            <GroupedCardDivider />
            <SettingsListRow
              label="Platform"
              subtitle={osVersion}
            />
          </GroupedCard>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <SectionHeader title="Links" />
          <GroupedCard>
            {links.map((link, index) => (
              <View key={link.label}>
                {index > 0 ? <GroupedCardDivider /> : null}
                <SettingsListRow
                  label={link.label}
                  onPress={() => handleOpenLink(link.url)}
                />
              </View>
            ))}
          </GroupedCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with{" "}
            <Text style={styles.footerEmoji}>❤️</Text> by EZTrack Team
          </Text>
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
    appName: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 12,
    },
    footer: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 32,
    },
    footerEmoji: {
      fontSize: 16,
    },
    footerText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
    logoContainer: {
      alignItems: "center",
      backgroundColor: colors.surfaceFrosted,
      borderColor: colors.borderLight,
      borderRadius: 16,
      borderWidth: 1,
      height: 120,
      justifyContent: "center",
      width: 120,
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 24,
    },
    section: {
      gap: 12,
      marginBottom: 24,
    },
  });
}
