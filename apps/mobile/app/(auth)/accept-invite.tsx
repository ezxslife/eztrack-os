import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerImpactHaptic, triggerNotificationHaptic, triggerSelectionHaptic } from "@/lib/haptics";
import * as Haptics from "expo-haptics";
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { orgName, inviterName, inviteCode } = useLocalSearchParams<{
    orgName: string;
    inviterName: string;
    inviteCode: string;
  }>();

  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!inviteCode) {
      triggerNotificationHaptic("error");
      setError("Invalid invite link");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: Implement accept invitation API call
      // const response = await acceptInvite(inviteCode);

      triggerNotificationHaptic("success");
      router.replace("/dashboard");
    } catch (err) {
      triggerNotificationHaptic("error");
      const message = err instanceof Error ? err.message : "Failed to accept invitation";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    triggerSelectionHaptic();
    // TODO: Implement decline invitation API call
    router.replace("/(auth)/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: spacing[4],
      justifyContent: "space-between",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      gap: spacing[4],
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: spacing[2],
    },
    title: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
    orgCard: {
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
    },
    orgName: {
      ...typography.headline,
      color: colors.textPrimary,
      textAlign: "center",
    },
    inviterInfo: {
      ...typography.caption1,
      color: colors.textSecondary,
      textAlign: "center",
    },
    actions: {
      gap: spacing[2],
    },
    button: {
      width: "100%",
    },
  });

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Join Organization",
        }}
      />
      <View style={styles.content}>
        {error && (
          <GlassAlert
            tone="error"
            title="Error"
            message={error}
          />
        )}

        <View>
          <View style={styles.iconContainer}>
            <AppSymbol
              iosName="person.2.fill"
              fallbackName="people"
              size={48}
              color={colors.primaryInk}
            />
          </View>
          <Text style={styles.title}>
            You've been invited
          </Text>
        </View>

        {orgName && (
          <MaterialSurface variant="panel" style={styles.orgCard}>
            <Text style={styles.orgName}>{orgName}</Text>
            {inviterName && (
              <Text style={styles.inviterInfo}>
                Invited by {inviterName}
              </Text>
            )}
          </MaterialSurface>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Accept Invitation"
          onPress={handleAccept}
          loading={loading}
          style={styles.button}
          variant="primary"
        />
        <Button
          label="Decline"
          onPress={handleDecline}
          style={styles.button}
          variant="secondary"
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}
