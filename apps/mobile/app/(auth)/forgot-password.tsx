import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ScrollView } from 'react-native';

import { useThemeColors, useThemeSpacing } from '@/theme';
import { useAdaptiveLayout } from '@/theme/layout';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenTitleStrip } from '@/components/ui/glass/ScreenTitleStrip';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { triggerHaptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendResetLink = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      triggerHaptic('error');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) {
        setError(resetError.message);
        triggerHaptic('error');
        setIsLoading(false);
        return;
      }

      triggerHaptic('success');
      setIsSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link';
      setError(message);
      triggerHaptic('error');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Reset Password',
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: 'dark',
        }}
      />
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontalPadding,
            paddingVertical: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitleStrip
            title="Reset Password"
            subtitle="Enter your email to receive a reset link"
          />

          {!isSuccess ? (
            <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
              <TextField
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(''); // Clear error on input change
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                error={error}
              />

              <Button
                label="Send Reset Link"
                onPress={handleSendResetLink}
                variant="primary"
                loading={isLoading}
              />

              <Button
                label="Back to Login"
                onPress={() => router.back()}
                variant="plain"
              />
            </View>
          ) : (
            <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
              <View
                style={{
                  backgroundColor: colors.successBackground,
                  padding: spacing.md,
                  borderRadius: 8,
                }}
              >
                <Text
                  variant="body"
                  style={{
                    color: colors.successForeground,
                  }}
                >
                  Check your email for a reset link. If you don't see it, check your spam folder.
                </Text>
              </View>

              <Button
                label="Back to Login"
                onPress={() => router.back()}
                variant="primary"
              />
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
