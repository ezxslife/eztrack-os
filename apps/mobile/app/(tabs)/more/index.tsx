import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { NAV_BOTTOM_ITEMS, NAV_ITEMS } from "@eztrack/shared";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { signOutCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/theme";

const primaryTabs = new Set(["Dashboard", "Daily Log", "Dispatch", "Incidents"]);

export default function MoreScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const previewMode = useAuthStore((state) => state.previewMode);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const [submitting, setSubmitting] = useState(false);

  const handleSignOut = async () => {
    setSubmitting(true);

    try {
      if (!previewMode) {
        await signOutCurrentUser();
      }

      setSignedOut(null);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      subtitle="The first mobile tranche stays focused. Everything else is still visible as grouped destinations."
      title="More"
    >
      <MaterialSurface intensity={72} variant="panel">
        <Text style={styles.bannerTitle}>Native-first, module-second</Text>
        <Text style={styles.bannerCopy}>
          Use the system for the shell. Use grouped rows and clear hierarchy for everything that
          hangs off the core tabs.
        </Text>
      </MaterialSurface>

      <SectionCard subtitle={previewMode ? "Preview mode" : "Live session"} title="Operator">
        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.title}>{profile?.full_name ?? "Unknown operator"}</Text>
            <Text style={styles.meta}>{profile?.email ?? "No email"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.title}>Role</Text>
            <Text style={styles.meta}>{profile?.role ?? "unknown"}</Text>
          </View>
          <Button
            label={previewMode ? "Exit Preview" : "Sign Out"}
            loading={submitting}
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard title="Next modules to port">
        <View style={styles.list}>
          {NAV_ITEMS.filter((item) => !primaryTabs.has(item.label)).map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.meta}>{item.href}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Global destinations">
        <View style={styles.list}>
          {NAV_BOTTOM_ITEMS.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.meta}>{item.href}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    bannerCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    bannerTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    list: {
      gap: 12,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: 13,
      marginTop: 4,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
