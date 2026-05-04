import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OTPInput, ResendTimer } from '@/components/auth/OTPInput';
import { sendPrimaryOTP, verifyPrimaryOTP } from '@/lib/auth/otp';
import { useThemeColors, useThemeTypography } from '@/theme';
import { BRAND } from '@eztrack/ui';

const RESEND_SECONDS = 30;

/**
 * 6-digit OTP entry — mobile.
 *
 * After verify:
 *   - new user → /(auth)/profile-completion
 *   - returning user → tabs (handled by RouteGate which detects auth state)
 */
export default function PhoneVerifyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = (params.phone ?? '') as string;

  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!phone) {
      router.replace('/(auth)/phone-signin');
    }
  }, [phone, router]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleComplete = async (code: string) => {
    setError('');
    setVerifying(true);
    try {
      const result = await verifyPrimaryOTP('phone', phone, code);
      if (result.isNewUser) {
        router.replace('/(auth)/profile-completion');
      } else {
        // Authenticated; the RouteGate / RequireGuest wrapper detects the
        // session and redirects to (tabs). Pushing to / triggers expo-router
        // to re-evaluate the gate.
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await sendPrimaryOTP('phone', phone);
      setTimer(RESEND_SECONDS);
      setResetKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const masked = phone.length >= 7 ? `${phone.slice(0, 4)} ••• ${phone.slice(-4)}` : phone;

  if (!phone) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View
            style={[styles.iconBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={BRAND.primary} />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 12 }]}>
            Enter your code
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 6, marginBottom: 28 }]}>
            We sent a 6-digit code to{' '}
            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{masked}</Text>.
          </Text>

          <OTPInput
            error={error}
            isVerifying={verifying}
            onComplete={handleComplete}
            resetKey={resetKey}
          />

          <ResendTimer
            isResending={resending}
            onResend={handleResend}
            timer={timer}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
