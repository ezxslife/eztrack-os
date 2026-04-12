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
import { GlassPill } from "@/components/ui/glass/GlassPill";
import { GlassSheet } from "@/components/ui/glass/GlassSheet";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
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
import {
  DEMO_AUTH_PROFILES,
  getDemoAuthProfileByEmail,
  type DemoAuthProfile,
} from "@eztrack/shared";

const DEMO_PASSWORD_ENV = process.env.EXPO_PUBLIC_DEMO_PASSWORD?.trim() ?? "";
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

export default function LoginScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const { supportsGlass } = useSupportsLiquidGlass();
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
  const demoSheetRef = useRef<BottomSheetModal>(null);

  const logoutMessage = getLogoutMessage(lastLogoutReason);
  const previewMessage = getPreviewMessage();
  const toolsEnabled = __DEV__ || Boolean(DEMO_PASSWORD_ENV) || Boolean(previewMessage);
  const hasStatusBanner =
    !isOnline || processing || pendingCount > 0 || deadLetterCount > 0;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>(DEMO_PASSWORD_ENV);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedDemoProfile = getDemoAuthProfileByEmail(email);

  const getStartedSnapPoints = useMemo(() => ["42%"], []);
  const signInSnapPoints = useMemo(() => ["68%"], []);
  const demoSnapPoints = useMemo(() => ["64%"], []);

  const styles = createStyles({
    bottomInset: Math.max(insets.bottom, 18),
    colors,
    hasStatusBanner,
    horizontalPadding: layout.horizontalPadding,
    supportsGlass,
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
    demoSheetRef.current?.dismiss();
    setTimeout(() => {
      signInSheetRef.current?.present();
    }, 160);
  };

  const presentGetStartedSheet = () => {
    signInSheetRef.current?.dismiss();
    demoSheetRef.current?.dismiss();
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
    demoSheetRef.current?.dismiss();
    signInSheetRef.current?.dismiss();
    getStartedSheetRef.current?.dismiss();
    enterPreviewMode();
    router.replace("/dashboard");
  };

  const handleSelectDemoProfile = (profile: DemoAuthProfile) => {
    const sharedPassword = DEMO_PASSWORD_ENV || password.trim();

    setEmail(profile.email);
    if (sharedPassword) {
      setPassword(sharedPassword);
    }
    setLocalError(null);
    demoSheetRef.current?.dismiss();
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
          <View style={styles.brandPressable}>
            <MaterialSurface padding={0} style={styles.brandPill} variant="grouped">
              <Text style={styles.brandText}>EZTRACK</Text>
            </MaterialSurface>
          </View>
          <View style={styles.heroMark}>
            <View style={styles.heroMarkCore} />
          </View>
          <Text style={styles.heroTitle}>Run the floor.</Text>
          <Text style={styles.heroCopy}>
            Sign in with the account your team uses on shift.
          </Text>
        </View>

        <View style={styles.footer}>
          <GlassPill
            label="Get Started"
            onPress={presentGetStartedSheet}
            size="lg"
            style={styles.footerButton}
            variant="filled"
          />
          <GlassPill
            label="Sign In"
            onPress={presentSignInSheet}
            size="lg"
            style={styles.footerButton}
            variant="tinted"
          />
          <Text style={styles.footerMeta}>Terms of Use · Privacy Policy</Text>
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
                New access is issued by your organization. If you already have credentials, sign in
                now.
              </Text>
              <Button
                label="Continue to Sign In"
                onPress={presentSignInSheet}
                style={styles.sheetButton}
              />
              <Text style={styles.sheetHint}>Need access? Contact your admin.</Text>
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
              <Text style={styles.sheetBodyCopy}>Use your team email and password.</Text>

              {toolsEnabled ? (
                <SheetSelectField
                  description={
                    selectedDemoProfile
                      ? `${selectedDemoProfile.email} · ${selectedDemoProfile.roleLabel}`
                      : "Choose a test profile to fill the sign-in form."
                  }
                  helperText={
                    DEMO_PASSWORD_ENV
                      ? "Shared demo password fills automatically on this build."
                      : "Anything already entered in the password field stays filled."
                  }
                  label="Test profile"
                  onPress={() => demoSheetRef.current?.present()}
                  placeholder="Choose a test profile"
                  value={selectedDemoProfile?.name}
                />
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
                autoComplete="username"
                autoCorrect={false}
                importantForAutofill="yes"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="name@eztrack.io"
                textContentType="username"
                value={email}
              />
              <SheetField
                autoComplete="password"
                importantForAutofill="yes"
                label="Password"
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
                textContentType="password"
                value={password}
              />
              <Button
                label="Sign In"
                loading={submitting}
                onPress={handleSignIn}
                style={styles.sheetButton}
              />
              <Text style={styles.sheetHint}>Need help? Contact your admin.</Text>
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
        ref={demoSheetRef}
        snapPoints={demoSnapPoints}
      >
        <BottomSheetView style={styles.sheetViewport}>
          <GlassSheet>
            <SheetHeader
              onClose={() => demoSheetRef.current?.dismiss()}
              title="Demo access"
            />
            <View style={styles.sheetSection}>
              <Text style={styles.sheetBodyCopy}>
                Pick a test profile to fill the sign-in form. The shared demo password will carry
                over when this build already has it, or when you have already entered it once.
              </Text>
              <View style={styles.demoList}>
                {DEMO_AUTH_PROFILES.map((account) => {
                  const selected = selectedDemoProfile?.email === account.email;

                  return (
                  <Pressable
                    accessibilityRole="button"
                    key={account.email}
                    onPress={() => handleSelectDemoProfile(account)}
                    style={({ pressed }) => [
                      styles.demoRow,
                      selected ? styles.demoRowSelected : null,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    <View style={styles.demoRowBody}>
                      <Text style={styles.demoRowName}>{account.name}</Text>
                      <Text style={styles.demoRowEmail}>{account.email}</Text>
                    </View>
                    <Text
                      style={[
                        styles.demoRowRole,
                        selected ? styles.demoRowRoleSelected : null,
                      ]}
                    >
                      {account.roleLabel}
                    </Text>
                  </Pressable>
                  );
                })}
              </View>
              {toolsEnabled && previewMessage ? (
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
      backgroundColor: colors.surfaceContainerLow,
      borderColor: focused ? colors.focusBorder : colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: colors.textPrimary,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    label: {
      ...typography.subheadline,
      color: focused ? colors.brandText : colors.textPrimary,
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

function SheetSelectField({
  description,
  helperText,
  label,
  onPress,
  placeholder,
  value,
}: {
  description?: string;
  helperText?: string;
  label: string;
  onPress: () => void;
  placeholder: string;
  value?: string;
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = StyleSheet.create({
    content: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    description: {
      ...typography.caption1,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    field: {
      gap: 8,
    },
    helperText: {
      ...typography.caption1,
      color: colors.textTertiary,
      lineHeight: 18,
    },
    label: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    placeholder: {
      color: colors.textTertiary,
    },
    trigger: {
      alignItems: "center",
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    triggerPressed: {
      opacity: 0.8,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.trigger,
          pressed ? styles.triggerPressed : null,
        ]}
      >
        <View style={styles.content}>
          <Text
            numberOfLines={1}
            style={[styles.value, !value ? styles.placeholder : null]}
          >
            {value ?? placeholder}
          </Text>
          {description ? (
            <Text numberOfLines={2} style={styles.description}>
              {description}
            </Text>
          ) : null}
        </View>
        <Ionicons color={colors.textTertiary} name="chevron-down" size={18} />
      </Pressable>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
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
  supportsGlass,
  topInset,
  typography,
}: {
  bottomInset: number;
  colors: ReturnType<typeof useThemeColors>;
  hasStatusBanner: boolean;
  horizontalPadding: number;
  supportsGlass: boolean;
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
      paddingVertical: 10,
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
    heroMark: {
      alignItems: "center",
      borderColor: colors.surfaceTintStrong,
      borderRadius: 40,
      borderWidth: 1,
      height: 80,
      justifyContent: "center",
      width: 80,
    },
    heroMarkCore: {
      backgroundColor: colors.interactiveSolid,
      borderRadius: 15,
      height: 30,
      ...(supportsGlass
        ? {}
        : {
            shadowColor: colors.interactiveSolid,
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.26,
            shadowRadius: 18,
          }),
      width: 30,
    },
    demoList: {
      gap: 10,
    },
    demoRow: {
      alignItems: "center",
      backgroundColor: colors.input,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    demoRowRoleSelected: {
      color: colors.brandText,
    },
    demoRowSelected: {
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.focusBorder,
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
      marginTop: 4,
      textAlign: "center",
    },
    hero: {
      alignItems: "center",
      flex: 1,
      gap: 18,
      justifyContent: "center",
      paddingTop: 12,
    },
    heroCopy: {
      ...typography.body,
      color: colors.textSecondary,
      maxWidth: 284,
      textAlign: "center",
    },
    heroTitle: {
      ...typography.largeTitle,
      color: colors.textPrimary,
      fontWeight: "800",
      letterSpacing: -0.9,
      textAlign: "center",
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
      backgroundColor: colors.surfaceTintMedium,
      borderColor: colors.borderLight,
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
      paddingTop: topInset + (hasStatusBanner ? 104 : 44),
    },
    primaryOrb: {
      backgroundColor: colors.interactive,
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
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetSection: {
      gap: 16,
    },
    sheetViewport: {
      paddingBottom: bottomInset,
    },
    transparentSheetBackground: {
      backgroundColor: "transparent",
    },
  });
}
