import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendPrimaryOTP } from '@/lib/auth/otp';
import { useThemeColors, useThemeTypography } from '@/theme';
import { BRAND } from '@eztrack/ui';

/**
 * Phone OTP entry — mobile.
 *
 * v1: plain text entry; user types full E.164 (e.g. +14155550100).
 * v1.5: replace TextInput with CountryPhoneInput (port from ezxs-os) for the
 * country-picker UX.
 */
export default function PhoneSignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const [phone, setPhone] = useState('+1');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = phone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      setError('Enter your phone with country code (e.g. +14155550100).');
      return;
    }

    setSubmitting(true);
    try {
      await sendPrimaryOTP('phone', trimmed);
      router.push({
        pathname: '/(auth)/phone-verify',
        params: { phone: trimmed },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code.');
      setSubmitting(false);
    }
  };

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
            <Ionicons name="phone-portrait-outline" size={20} color={BRAND.primary} />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 12 }]}>
            Your phone
          </Text>
          <Text
            style={[typography.body, { color: colors.textSecondary, marginTop: 6, marginBottom: 24 }]}
          >
            We&apos;ll text you a 6-digit code. Standard SMS rates apply.
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Phone (with country code)
          </Text>
          <TextInput
            accessibilityLabel="Phone number with country code"
            autoComplete="tel"
            autoFocus
            keyboardType="phone-pad"
            onChangeText={setPhone}
            onSubmitEditing={handleSubmit}
            placeholder="+14155550100"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="send"
            spellCheck={false}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            textContentType="telephoneNumber"
            value={phone}
          />

          {error ? (
            <Text style={[styles.error, { color: '#EF4444' }]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Send verification code"
            accessibilityRole="button"
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: BRAND.primary,
                opacity: submitting ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Send code</Text>
            )}
          </Pressable>

          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            Message frequency: 1 per attempt. Reply STOP to unsubscribe.
          </Text>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '500',
  },
  error: {
    fontSize: 13,
    marginTop: 12,
  },
  cta: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disclaimer: { fontSize: 12, marginTop: 16, lineHeight: 18 },
});
