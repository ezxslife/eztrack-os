import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { triggerImpactHaptic, triggerSelectionHaptic } from "@/lib/haptics";
import * as Haptics from "expo-haptics";
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const RESEND_COOLDOWN = 60;

export default function MagicLinkSentScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();

  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldownTime(RESEND_COOLDOWN);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOpenEmail = async () => {
    triggerSelectionHaptic();
    try {
      await Linking.openURL("mailto:");
    } catch (error) {
      console.error("Failed to open email app:", error);
    }
  };

  const handleResend = async () => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement resend magic link API call
    startCooldown();
  };

  const handleBackToLogin = () => {
    router.replace("/(auth)/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: layout.horizontalPadding,
    },
    content: {
      alignItems: "center",
      gap: spacing[4],
      flex: 1,
      justifyContent: "center",
    },
    icon: {
      width: 64,
      height: 64,
      color: colors.primaryInk,
      marginBottom: spacing[2],
    },
    title: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 280,
    },
    button: {
      width: "100%",
    },
    footer: {
      gap: spacing[2],
      alignItems: "center",
      paddingBottom: spacing[6],
    },
    resendContainer: {
      alignItems: "center",
      gap: spacing[1],
    },
    resendLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    resendButton: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    resendButtonText: {
      ...typography.caption1,
      color: cooldownTime > 0 ? colors.textTertiary : colors.primaryInk,
      fontWeight: "600",
    },
    backButton: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    backButtonText: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.content}>
        <AppSymbol
          iosName="envelope.fill"
          fallbackName="mail"
          size={64}
          color={colors.primaryInk}
        />
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a sign-in link to {email}. Tap the link in the email to sign in.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Open Email App"
          onPress={handleOpenEmail}
          style={styles.button}
          variant="primary"
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendLabel}>Didn't receive it?</Text>
          <Pressable
            onPress={handleResend}
            disabled={cooldownTime > 0}
            style={({ pressed }) => [
              styles.resendButton,
              pressed && !cooldownTime ? { opacity: 0.72 } : null,
            ]}
          >
            <Text style={styles.resendButtonText}>
              {cooldownTime > 0 ? `Resend in ${cooldownTime}s` : "Resend"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleBackToLogin}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? { opacity: 0.72 } : null,
          ]}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
