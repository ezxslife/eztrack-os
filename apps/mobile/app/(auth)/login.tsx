import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { signInWithPassword } from "@/lib/auth";
import { getPreviewMessage } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/theme";

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const authEnabled = useAuthStore((state) => state.authEnabled);
  const authError = useAuthStore((state) => state.error);
  const enterPreviewMode = useAuthStore((state) => state.enterPreviewMode);
  const previewMessage = getPreviewMessage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setLocalError("Enter both email and password.");
      return;
    }

    setLocalError(null);
    setSubmitting(true);

    try {
      await signInWithPassword(email, password);
      router.replace("/dashboard");
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    enterPreviewMode();
    router.replace("/dashboard");
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={82} style={styles.hero} variant="panel">
          <Text style={styles.eyebrow}>EZTrack Mobile</Text>
          <Text style={styles.heroTitle}>Command surfaces, not dashboards.</Text>
          <Text style={styles.heroCopy}>
            Keep the shell native, the auth path direct, and the operational data dense enough to
            be useful at a glance.
          </Text>
        </MaterialSurface>
      }
      subtitle="Use the same Supabase credentials as the EZTrack web app."
      title="Sign In"
    >
      <SectionCard subtitle="Authenticated routes now use SecureStore-backed mobile sessions." title="Live session">
        <View style={styles.stack}>
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="officer@venue.com"
            value={email}
          />
          <TextField
            autoComplete="password"
            label="Password"
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            value={password}
          />
          {localError || authError ? <Text style={styles.error}>{localError || authError}</Text> : null}
          <Button disabled={!authEnabled} label="Sign In" loading={submitting} onPress={handleSignIn} />
        </View>
      </SectionCard>

      {previewMessage ? (
        <SectionCard title="Preview mode">
          <View style={styles.stack}>
            <Text style={styles.body}>{previewMessage}</Text>
            <Button label="Continue in Preview" onPress={handlePreview} variant="secondary" />
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Mobile foundation">
        <View style={styles.stack}>
          <Text style={styles.bullet}>Protected route groups for auth, tabs, detail, and create flows.</Text>
          <Text style={styles.bullet}>React Query hooks for dashboard, incidents, dispatch, and daily log modules.</Text>
          <Text style={styles.bullet}>Native iOS tab behavior, blur materials, and haptic-backed controls.</Text>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    body: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    bullet: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      lineHeight: 20,
    },
    eyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    hero: {
      gap: 6,
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    stack: {
      gap: 12,
    },
  });
}
