import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type TextInputProps,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { GlassSheet } from "@/components/ui/glass/GlassSheet";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
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

const DEMO_PASSWORD_ENV = process.env.EXPO_PUBLIC_DEMO_PASSWORD?.trim() ?? "";
const SHOW_TEST_TOOLS = __DEV__ || Boolean(DEMO_PASSWORD_ENV);

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

  const signInSheetRef = useRef<BottomSheetModal>(null);
  const getStartedSheetRef = useRef<BottomSheetModal>(null);
  const debugSheetRef = useRef<BottomSheetModal>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoutMessage = getLogoutMessage(lastLogoutReason);
  const previewMessage = getPreviewMessage();
  const hasStatusBanner =
    !isOnline || processing || pendingCount > 0 || deadLetterCount > 0;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoPassword, setDemoPassword] = useState(DEMO_PASSWORD_ENV);
  const [debugUnlocked, setDebugUnlocked] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getStartedSnapPoints = useMemo(() => ["42%"], []);
  const signInSnapPoints = useMemo(() => ["62%"], []);
  const debugSnapPoints = useMemo(() => ["64%"], []);

  const styles = createStyles({
    bottomInset: Math.max(insets.bottom, 18),
    colors,
    hasStatusBanner,
    horizontalPadding: layout.horizontalPadding,
    topInset: Math.max(insets.top, 18),
    typography,
  });

  const statusMessage =
    localError ||
    authError ||
    logoutMessage ||
    (!authEnabled ? "Live sign in is unavailable on this build." : null);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.24}
      pressBehavior="close"
    />
  );

  const presentSignInSheet = () => {
    getStartedSheetRef.current?.dismiss();
    debugSheetRef.current?.dismiss();
    setTimeout(() => {
      signInSheetRef.current?.present();
    }, 160);
  };

  const presentGetStartedSheet = () => {
    signInSheetRef.current?.dismiss();
    debugSheetRef.current?.dismiss();
    setTimeout(() => {
      getStartedSheetRef.current?.present();
    }, 160);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setLocalError("Enter both email and password.");
      return;
    }

    if (!authEnabled) {
      setLocalError(
        "Live sign in is not configured on this local build. Add the mobile Supabase env vars to test real auth."
      );
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

  const handleEnterPreview = () => {
    debugSheetRef.current?.dismiss();
    signInSheetRef.current?.dismiss();
    getStartedSheetRef.current?.dismiss();
    enterPreviewMode();
    router.replace("/dashboard");
  };

  const handleSelectDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    if (demoPassword.trim()) {
      setPassword(demoPassword.trim());
    }
    setLocalError(null);
    debugSheetRef.current?.dismiss();
    setTimeout(() => {
      signInSheetRef.current?.present();
    }, 160);
  };

  const handleBrandTap = () => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setDebugUnlocked(true);
      debugSheetRef.current?.present();
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.primaryOrb} />
        <View style={styles.secondaryOrb} />
        <View style={styles.backdropBeam} />
      </View>

      <View style={styles.page}>
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            onPress={handleBrandTap}
            style={({ pressed }) => [
              styles.brandPressable,
              pressed ? styles.brandPressed : null,
            ]}
          >
            <MaterialSurface padding={0} style={styles.brandPill} variant="grouped">
              <Text style={styles.brandText}>EZTRACK</Text>
            </MaterialSurface>
          </Pressable>
          <Text style={styles.heroTitle}>Your events, simplified.</Text>
          <Text style={styles.heroCopy}>
            Access EZTrack with the work account your team issued.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            label="Get Started"
            onPress={presentGetStartedSheet}
            style={styles.footerButton}
          />
          <Button
            label="Sign In"
            onPress={presentSignInSheet}
            style={styles.footerButton}
            variant="secondary"
          />
          <Text style={styles.footerMeta}>Terms of Use · Privacy</Text>
        </View>
      </View>

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.transparentSheetBackground}
        enablePanDownToClose
        handleComponent={() => null}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        ref={getStartedSheetRef}
        snapPoints={getStartedSnapPoints}
      >
        <BottomSheetView style={styles.sheetViewport}>
          <GlassSheet>
            <SheetHeader
              onClose={() => getStartedSheetRef.current?.dismiss()}
              title="Get started"
            />
            <View style={styles.sheetSection}>
              <Text style={styles.sheetBodyCopy}>
                EZTrack accounts are provisioned by your operations admin. If you already have
                credentials, continue to sign in.
              </Text>
              <Button
                label="Continue with Work Account"
                onPress={presentSignInSheet}
                style={styles.sheetButton}
              />
              <Text style={styles.sheetHint}>
                Need access? Contact your operations admin.
              </Text>
            </View>
          </GlassSheet>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.transparentSheetBackground}
        enablePanDownToClose
        handleComponent={() => null}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        ref={signInSheetRef}
        snapPoints={signInSnapPoints}
      >
        <BottomSheetView style={styles.sheetViewport}>
          <GlassSheet>
            <SheetHeader
              onClose={() => signInSheetRef.current?.dismiss()}
              title="Sign in to EZTRACK"
            />
            <View style={styles.sheetSection}>
              <Text style={styles.sheetBodyCopy}>Use your work email and password.</Text>

              {SHOW_TEST_TOOLS ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => debugSheetRef.current?.present()}
                  style={({ pressed }) => [pressed ? styles.linkPressed : null]}
                >
                  <Text style={styles.debugLink}>Use test account</Text>
                </Pressable>
              ) : null}

              {statusMessage ? (
                <View
                  style={[
                    styles.message,
                    localError || authError ? styles.messageError : styles.messageNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      localError || authError ? styles.messageErrorText : null,
                    ]}
                  >
                    {statusMessage}
                  </Text>
                </View>
              ) : null}

              <SheetField
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="name@eztrack.io"
                value={email}
              />
              <SheetField
                autoComplete="password"
                label="Password"
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
                value={password}
              />
              <Button
                label="Sign In"
                loading={submitting}
                onPress={handleSignIn}
                style={styles.sheetButton}
              />
              {debugUnlocked && !SHOW_TEST_TOOLS ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => debugSheetRef.current?.present()}
                  style={({ pressed }) => [pressed ? styles.linkPressed : null]}
                >
                  <Text style={styles.debugLink}>Demo tools</Text>
                </Pressable>
              ) : (
                <Text style={styles.sheetHint}>Need help? Contact your operations admin.</Text>
              )}
            </View>
          </GlassSheet>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.transparentSheetBackground}
        enablePanDownToClose
        handleComponent={() => null}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        ref={debugSheetRef}
        snapPoints={debugSnapPoints}
      >
        <BottomSheetView style={styles.sheetViewport}>
          <GlassSheet>
            <SheetHeader
              onClose={() => debugSheetRef.current?.dismiss()}
              title="Debug tools"
            />
            <View style={styles.sheetSection}>
              <Text style={styles.sheetBodyCopy}>
                Select a demo account to autofill sign-in. If a shared demo password is available,
                it will fill too.
              </Text>
              <SheetField
                autoCapitalize="none"
                autoCorrect={false}
                label="Demo password"
                onChangeText={setDemoPassword}
                placeholder="Shared demo password"
                secureTextEntry
                value={demoPassword}
              />
              <View style={styles.demoList}>
                {DEMO_ACCOUNTS.map((account) => (
                  <Pressable
                    accessibilityRole="button"
                    key={account.email}
                    onPress={() => handleSelectDemoAccount(account)}
                    style={({ pressed }) => [
                      styles.demoRow,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.demoRowBody}>
                      <Text style={styles.demoRowName}>{account.name}</Text>
                      <Text style={styles.demoRowEmail}>{account.email}</Text>
                    </View>
                    <Text style={styles.demoRowRole}>{formatRoleLabel(account.role)}</Text>
                  </Pressable>
                ))}
              </View>
              {previewMessage ? (
                <Button
                  label="Continue in Preview"
                  onPress={handleEnterPreview}
                  style={styles.sheetButton}
                  variant="secondary"
                />
              ) : null}
            </View>
          </GlassSheet>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function SheetField({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [focused, setFocused] = useState(false);
  const styles = StyleSheet.create({
    field: {
      gap: 8,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.input,
      borderColor: focused ? colors.primaryStrong : colors.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      color: colors.textPrimary,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    label: {
      ...typography.subheadline,
      color: focused ? colors.primaryInk : colors.textPrimary,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <BottomSheetTextInput
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.primaryStrong}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

function SheetHeader({
  onClose,
  title,
}: {
  onClose: () => void;
  title: string;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = StyleSheet.create({
    closeButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceOverlay,
      borderColor: colors.borderSubtle,
      borderRadius: 999,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    title: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.4,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        accessibilityLabel="Close sheet"
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeButton,
          pressed ? { opacity: 0.76 } : null,
        ]}
      >
        <Ionicons color={colors.textPrimary} name="close" size={18} />
      </Pressable>
    </View>
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
      right: -84,
      top: 142,
      transform: [{ rotate: "-24deg" }],
      width: 160,
    },
    brandPill: {
      alignItems: "center",
      borderRadius: 999,
      justifyContent: "center",
      minWidth: 132,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    brandPressed: {
      opacity: 0.82,
    },
    brandPressable: {
      alignSelf: "center",
    },
    brandText: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.6,
      textTransform: "uppercase",
    },
    debugLink: {
      color: colors.primaryInk,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    demoList: {
      gap: 10,
    },
    demoRow: {
      alignItems: "center",
      backgroundColor: colors.input,
      borderColor: colors.borderSubtle,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    demoRowBody: {
      flex: 1,
      gap: 3,
      paddingRight: 12,
    },
    demoRowEmail: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    demoRowName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 20,
    },
    demoRowRole: {
      color: colors.primaryInk,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
      lineHeight: 14,
      textTransform: "uppercase",
    },
    footer: {
      gap: 12,
      paddingBottom: bottomInset,
    },
    footerButton: {
      width: "100%",
    },
    footerMeta: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 16,
      textAlign: "center",
    },
    hero: {
      alignItems: "center",
      gap: 16,
      paddingTop: 48,
    },
    heroCopy: {
      ...typography.body,
      color: colors.textSecondary,
      maxWidth: 280,
      textAlign: "center",
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
      lineHeight: 38,
      textAlign: "center",
    },
    linkPressed: {
      opacity: 0.72,
    },
    message: {
      borderRadius: 16,
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
      lineHeight: 18,
    },
    page: {
      flex: 1,
      justifyContent: "space-between",
      paddingBottom: 16,
      paddingHorizontal: horizontalPadding,
      paddingTop: topInset + (hasStatusBanner ? 104 : 56),
    },
    primaryOrb: {
      backgroundColor: colors.primaryStrong,
      borderRadius: 999,
      height: 336,
      opacity: 0.16,
      position: "absolute",
      right: -102,
      top: 20,
      width: 336,
    },
    rowPressed: {
      opacity: 0.82,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    secondaryOrb: {
      backgroundColor: colors.warning,
      borderRadius: 999,
      bottom: 116,
      height: 220,
      left: -112,
      opacity: 0.08,
      position: "absolute",
      width: 220,
    },
    sheetBodyCopy: {
      ...typography.callout,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    sheetButton: {
      width: "100%",
    },
    sheetHint: {
      color: colors.textTertiary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetSection: {
      gap: 16,
    },
    sheetViewport: {
      paddingBottom: bottomInset,
      paddingHorizontal: horizontalPadding,
    },
    transparentSheetBackground: {
      backgroundColor: "transparent",
    },
  });
}
