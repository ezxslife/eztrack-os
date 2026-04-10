import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { TextField } from "@/components/ui/TextField";
import { signInWithPassword } from "@/lib/auth";
import { getPreviewMessage } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import { useNetworkStore } from "@/stores/network-store";
import { useOfflineStore } from "@/stores/offline-store";
import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

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

function getPreviewSummary(previewMessage: string | null) {
  if (!previewMessage) {
    return null;
  }

  return "Preview mode is available on this build.";
}

function formatRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function LoginScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authEnabled = useAuthStore((state) => state.authEnabled);
  const authError = useAuthStore((state) => state.error);
  const enterPreviewMode = useAuthStore((state) => state.enterPreviewMode);
  const lastLogoutReason = useAuthStore((state) => state.lastLogoutReason);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const processing = useOfflineStore((state) => state.processing);
  const pendingCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "pending")
        .length
  );
  const deadLetterCount = useOfflineStore(
    (state) =>
      state.pendingActions.filter((action) => action.syncState === "dead_letter")
        .length
  );
  const previewMessage = getPreviewMessage();
  const previewSummary = getPreviewSummary(previewMessage);
  const logoutMessage = getLogoutMessage(lastLogoutReason);
  const hasStatusBanner =
    !isOnline || processing || pendingCount > 0 || deadLetterCount > 0;
  const styles = createStyles({
    bottomInset: Math.max(insets.bottom, 20),
    colors,
    hasStatusBanner,
    horizontalPadding: layout.horizontalPadding,
    typography,
    topInset: Math.max(insets.top, 18),
  });
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setDemoPickerOpen(false);
  };

  const statusMessage = localError || authError || logoutMessage;
  const isErrorState = Boolean(localError || authError);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.primaryOrb} />
        <View style={styles.accentOrb} />
        <View style={styles.backdropBeam} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <MaterialSurface intensity={90} padding={22} style={styles.card} variant="panel">
              <View style={styles.headerRow}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>EZTRACK</Text>
                </View>
                <View style={styles.headerIcon}>
                  <Ionicons
                    color={colors.primaryInk}
                    name="shield-checkmark-outline"
                    size={20}
                  />
                </View>
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Sign in</Text>
                <Text style={styles.subtitle}>
                  Use your EZTrack work account to continue.
                </Text>
              </View>

              {statusMessage ? (
                <View
                  style={[
                    styles.message,
                    isErrorState ? styles.messageError : styles.messageNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isErrorState ? styles.messageErrorText : null,
                    ]}
                  >
                    {statusMessage}
                  </Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Demo login</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDemoPickerOpen((current) => !current)}
                    style={({ pressed }) => [
                      styles.demoPicker,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.demoPickerCopy}>
                      <Text style={styles.demoPickerTitle}>
                        {selectedDemoAccount
                          ? selectedDemoAccount.name
                          : "Select a temporary demo login"}
                      </Text>
                      <Text style={styles.demoPickerSubtitle}>
                        {selectedDemoAccount
                          ? `${selectedDemoAccount.email} | ${formatRoleLabel(selectedDemoAccount.role)}`
                          : "Fills email only"}
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
                              index < DEMO_ACCOUNTS.length - 1
                                ? styles.demoOptionBorder
                                : null,
                              selected ? styles.demoOptionSelected : null,
                              pressed ? styles.pressed : null,
                            ]}
                          >
                            <View style={styles.demoOptionHeader}>
                              <Text style={styles.demoOptionName}>{account.name}</Text>
                              <Text style={styles.demoOptionRole}>
                                {formatRoleLabel(account.role)}
                              </Text>
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
                  onChangeText={handleEmailChange}
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
                <Button
                  disabled={!authEnabled}
                  label="Sign In"
                  loading={submitting}
                  onPress={handleSignIn}
                  style={styles.primaryButton}
                />
              </View>

              <View style={styles.footer}>
                {previewSummary ? (
                  <View style={styles.previewBlock}>
                    <Text style={styles.previewEyebrow}>Preview</Text>
                    <Text style={styles.previewCopy}>{previewSummary}</Text>
                    <Button
                      label="Continue in Preview"
                      onPress={handlePreview}
                      style={styles.previewButton}
                      variant="secondary"
                    />
                  </View>
                ) : null}
                <Text style={styles.helpText}>
                  Need help? Contact your operations admin.
                </Text>
              </View>
            </MaterialSurface>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles({
  bottomInset,
  colors,
  hasStatusBanner,
  horizontalPadding,
  topInset,
  typography,
}: {
  bottomInset: number;
  colors: ReturnType<typeof useThemeColors>;
  hasStatusBanner: boolean;
  horizontalPadding: number;
  topInset: number;
  typography: ReturnType<typeof useThemeTypography>;
}) {
  return StyleSheet.create({
    accentOrb: {
      backgroundColor: colors.warning,
      borderRadius: 999,
      bottom: 72,
      height: 220,
      left: -88,
      opacity: 0.08,
      position: "absolute",
      width: 220,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    backdropBeam: {
      backgroundColor: colors.surfaceOverlay,
      borderRadius: 999,
      height: 420,
      opacity: 0.08,
      position: "absolute",
      right: -64,
      top: 110,
      transform: [{ rotate: "-26deg" }],
      width: 140,
    },
    brandBadge: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    brandBadgeText: {
      color: colors.accentSoft,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    card: {
      gap: 20,
    },
    content: {
      flexGrow: 1,
      paddingBottom: bottomInset + 28,
      paddingHorizontal: horizontalPadding,
      paddingTop: topInset + (hasStatusBanner ? 94 : 44),
    },
    demoMenu: {
      gap: 0,
      marginTop: 6,
    },
    demoOption: {
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    demoOptionBorder: {
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
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
    demoOptionRole: {
      color: colors.primaryInk,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
      lineHeight: 14,
      textTransform: "uppercase",
    },
    demoOptionSelected: {
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
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
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    demoPickerCopy: {
      flex: 1,
      gap: 2,
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
    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      ...typography.caption1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    footer: {
      gap: 12,
    },
    form: {
      gap: 14,
    },
    header: {
      gap: 8,
    },
    headerIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderColor: colors.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    helpText: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 16,
    },
    keyboard: {
      flex: 1,
    },
    message: {
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    messageError: {
      backgroundColor: colors.errorBg,
      borderColor: colors.error,
    },
    messageErrorText: {
      color: colors.error,
    },
    messageNeutral: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
    },
    messageText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    previewBlock: {
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    previewButton: {
      width: "100%",
    },
    previewCopy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    previewEyebrow: {
      color: colors.primaryInk,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    pressed: {
      opacity: 0.82,
    },
    primaryButton: {
      marginTop: 4,
      width: "100%",
    },
    primaryOrb: {
      backgroundColor: colors.primaryStrong,
      borderRadius: 999,
      height: 280,
      opacity: 0.12,
      position: "absolute",
      right: -70,
      top: 36,
      width: 280,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    shell: {
      alignSelf: "center",
      maxWidth: 440,
      width: "100%",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 320,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1.1,
      lineHeight: 38,
    },
  });
}
