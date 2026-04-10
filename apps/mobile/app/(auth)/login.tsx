import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { signInWithPassword } from "@/lib/auth";
import { getPreviewMessage } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors } from "@/theme";

const DEMO_ACCOUNTS = [
  {
    email: "sarah.kim@eztrack.io",
    name: "Sarah Kim",
    role: "manager",
  },
  {
    email: "james.reid@eztrack.io",
    name: "James Reid",
    role: "dispatcher",
  },
  {
    email: "diana.torres@eztrack.io",
    name: "Diana Torres",
    role: "supervisor",
  },
  {
    email: "tom.walsh@eztrack.io",
    name: "Tom Walsh",
    role: "staff",
  },
  {
    email: "lisa.nguyen@eztrack.io",
    name: "Lisa Nguyen",
    role: "staff",
  },
  {
    email: "raj.patel@eztrack.io",
    name: "Raj Patel",
    role: "staff",
  },
] as const;

function getLogoutMessage(reason: string | null) {
  switch (reason) {
    case "manual_sign_out":
      return "You signed out on this device.";
    case "preview_exit":
      return "Preview mode ended. Sign in to continue with live data.";
    case "session_ended":
      return "Your session ended. Sign in again to continue.";
    case "profile_unavailable":
      return "The linked EZTrack profile could not be loaded. Sign in again after the profile is fixed.";
    case "auth_error":
      return "Authentication needs attention. Sign in again to continue.";
    default:
      return null;
  }
}

function formatRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getPreviewSummary(previewMessage: string | null) {
  if (!previewMessage) {
    return null;
  }

  return "Live auth is not configured on this build yet.";
}

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const authEnabled = useAuthStore((state) => state.authEnabled);
  const authError = useAuthStore((state) => state.error);
  const enterPreviewMode = useAuthStore((state) => state.enterPreviewMode);
  const lastLogoutReason = useAuthStore((state) => state.lastLogoutReason);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const previewMessage = getPreviewMessage();
  const previewSummary = getPreviewSummary(previewMessage);
  const logoutMessage = getLogoutMessage(lastLogoutReason);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoPickerOpen, setDemoPickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const selectedDemoAccount =
    DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail) ?? null;

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setLocalError("Enter both email and password.");
      return;
    }

    setLocalError(null);
    setSubmitting(true);
    setAuthenticating();

    try {
      await signInWithPassword(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setAuthError(message);
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    enterPreviewMode();
    router.replace("/dashboard");
  };

  const handleSelectDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setDemoPickerOpen(false);
    setLocalError(null);
  };

  return (
    <ScreenContainer
      accessory={
        <MaterialSurface intensity={86} style={styles.hero} variant="panel">
          <View pointerEvents="none" style={styles.heroGlowPrimary} />
          <View pointerEvents="none" style={styles.heroGlowAccent} />
          <Text style={styles.eyebrow}>EZTRACK</Text>
          <Text style={styles.heroTitle}>Welcome back.</Text>
          <Text style={styles.heroCopy}>
            Sign in with your EZTrack account or load a demo email for a faster handoff.
          </Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Live session</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Quick fill</Text>
            </View>
          </View>
        </MaterialSurface>
      }
      iosNativeHeader
      title="Welcome back"
    >
      <SectionCard subtitle="Use your EZTrack credentials." title="Sign in">
        <View style={styles.stack}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Demo account</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDemoPickerOpen((current) => !current)}
              style={({ pressed }) => [
                styles.demoPicker,
                pressed ? styles.demoPickerPressed : null,
              ]}
            >
              <View style={styles.demoPickerCopy}>
                <Text style={styles.demoPickerTitle}>
                  {selectedDemoAccount ? selectedDemoAccount.name : "Select a demo login"}
                </Text>
                <Text style={styles.demoPickerSubtitle}>
                  {selectedDemoAccount
                    ? `${selectedDemoAccount.email} | ${formatRoleLabel(selectedDemoAccount.role)}`
                    : "Autofills email only"}
                </Text>
              </View>
              <Ionicons
                color={colors.textSecondary}
                name={demoPickerOpen ? "chevron-up" : "chevron-down"}
                size={18}
              />
            </Pressable>
            {demoPickerOpen ? (
              <MaterialSurface padding={8} style={styles.demoMenu} variant="grouped">
                {DEMO_ACCOUNTS.map((account, index) => {
                  const selected = account.email === selectedDemoAccount?.email;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={account.email}
                      onPress={() => handleSelectDemoAccount(account)}
                      style={({ pressed }) => [
                        styles.demoOption,
                        index < DEMO_ACCOUNTS.length - 1 ? styles.demoOptionBorder : null,
                        selected ? styles.demoOptionSelected : null,
                        pressed ? styles.demoOptionPressed : null,
                      ]}
                    >
                      <View style={styles.demoOptionHeader}>
                        <Text style={styles.demoOptionName}>{account.name}</Text>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>
                            {formatRoleLabel(account.role)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.demoOptionEmail}>{account.email}</Text>
                    </Pressable>
                  );
                })}
              </MaterialSurface>
            ) : null}
          </View>

          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="name@eztrack.io"
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
          {!localError && !authError && logoutMessage ? (
            <Text style={styles.notice}>{logoutMessage}</Text>
          ) : null}
          {localError || authError ? (
            <Text style={styles.error}>{localError || authError}</Text>
          ) : null}
          <Button
            disabled={!authEnabled}
            label="Sign In"
            loading={submitting}
            onPress={handleSignIn}
          />
        </View>
      </SectionCard>

      {previewSummary ? (
        <SectionCard title="Preview mode">
          <View style={styles.stack}>
            <Text style={styles.body}>{previewSummary}</Text>
            <Button
              label="Continue in Preview"
              onPress={handlePreview}
              variant="secondary"
            />
          </View>
        </SectionCard>
      ) : null}
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
    demoMenu: {
      gap: 0,
    },
    demoOption: {
      borderRadius: 16,
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    demoOptionBorder: {
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    demoOptionEmail: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    demoOptionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    demoOptionName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 20,
    },
    demoOptionPressed: {
      opacity: 0.82,
    },
    demoOptionSelected: {
      backgroundColor: colors.primarySoft,
    },
    demoPicker: {
      alignItems: "center",
      backgroundColor: colors.input,
      borderColor: colors.borderSubtle,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    demoPickerCopy: {
      flex: 1,
      gap: 2,
    },
    demoPickerPressed: {
      opacity: 0.82,
    },
    demoPickerSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    demoPickerTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
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
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    },
    hero: {
      gap: 10,
      overflow: "hidden",
      paddingBottom: 18,
      paddingTop: 18,
      position: "relative",
    },
    heroCopy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
      maxWidth: 280,
    },
    heroGlowAccent: {
      backgroundColor: colors.warningBg,
      borderRadius: 999,
      bottom: -58,
      height: 148,
      left: -24,
      opacity: 0.72,
      position: "absolute",
      width: 148,
    },
    heroGlowPrimary: {
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      height: 184,
      opacity: 0.95,
      position: "absolute",
      right: -48,
      top: -40,
      width: 184,
    },
    heroPill: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    heroPills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 4,
    },
    heroPillText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: "700",
      letterSpacing: -0.8,
      lineHeight: 34,
    },
    notice: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    roleBadge: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    roleBadgeText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 13,
      textTransform: "uppercase",
    },
    stack: {
      gap: 12,
    },
  });
}
