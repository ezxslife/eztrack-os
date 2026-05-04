import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { completeProfile } from '@/lib/auth/otp';
import { supabase } from '@/lib/supabase';
import { useThemeColors, useThemeTypography } from '@/theme';
import { BRAND } from '@eztrack/ui';

/**
 * Final step of the phone-OTP / OAuth signup flow. Captures first + last name
 * so dispatch logs, incidents, and post-event reports have a real handler name.
 */
export default function ProfileCompletionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        router.replace('/(auth)/login');
        return;
      }
      setUserId(data.user.id);
      const meta = data.user.user_metadata ?? {};
      setFirstName((meta.first_name as string) ?? (meta.given_name as string) ?? '');
      setLastName((meta.last_name as string) ?? (meta.family_name as string) ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeProfile({
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
      setSubmitting(false);
    }
  };

  if (!userId) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.body}>
          <View
            style={[styles.iconBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Ionicons name="person-outline" size={20} color={BRAND.primary} />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 12 }]}>
            Tell us your name
          </Text>
          <Text
            style={[typography.body, { color: colors.textSecondary, marginTop: 6, marginBottom: 28 }]}
          >
            Used on incidents, dispatch logs, and post-event reports.
          </Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>First name</Text>
              <TextInput
                accessibilityLabel="First name"
                autoCapitalize="words"
                autoComplete="given-name"
                autoFocus
                onChangeText={setFirstName}
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                textContentType="givenName"
                value={firstName}
              />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Last name</Text>
              <TextInput
                accessibilityLabel="Last name"
                autoCapitalize="words"
                autoComplete="family-name"
                onChangeText={setLastName}
                onSubmitEditing={handleSubmit}
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                textContentType="familyName"
                value={lastName}
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.error, { color: '#EF4444' }]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Continue"
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
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
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
  error: { fontSize: 13, marginTop: 12 },
  cta: {
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
